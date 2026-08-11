// Bank (Plaid) routes. Everything here is read-only and user-scoped: each
// endpoint requires authentication and only ever touches the current user's
// own connections, accounts, and transactions.

import {
  plaidConfig,
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  syncTransactions,
  removeItem
} from "./plaid.mjs";
import { encryptSecret, decryptSecret } from "./crypto.mjs";

export function createBank(prisma) {
  // Revoke access tokens for connections we have already deleted locally.
  // Always best-effort: the rows are gone either way, and a stale Item left at
  // Plaid is harmless, so a failure here must never fail the caller's request.
  async function releaseItems(connections) {
    for (const connection of connections ?? []) {
      try {
        await removeItem(
          decryptSecret({
            ciphertext: connection.encryptedToken,
            iv: connection.tokenIv,
            authTag: connection.tokenAuthTag
          })
        );
      } catch (error) {
        console.warn("Could not release Plaid item:", error?.message ?? error);
      }
    }
  }

  // Persist (or refresh) the accounts Plaid returns for a connection.
  //
  // plaidAccountId is globally unique, so a naive upsert-by-id would let one
  // user reassign a row that already belongs to another user. This can happen
  // in Plaid's sandbox, where linking the same test bank returns stable ids.
  // Guard against it: never touch a row owned by a different user.
  //
  // `client` is either the shared Prisma client or a transaction handle, so the
  // caller decides whether these writes join a surrounding transaction.
  async function storeAccounts(client, connectionId, userId, accounts) {
    for (const account of accounts ?? []) {
      if (!account?.account_id) continue;
      const existing = await client.bankAccount.findUnique({
        where: { plaidAccountId: account.account_id },
        include: { connection: { select: { userId: true } } }
      });
      if (existing && existing.connection?.userId !== userId) {
        console.warn("Skipping bank account owned by another user:", account.account_id);
        continue;
      }
      const fields = {
        name: account.name ?? null,
        type: account.subtype ?? account.type ?? null,
        lastFour: account.mask ?? null
      };
      await client.bankAccount.upsert({
        where: { plaidAccountId: account.account_id },
        update: { connectionId, ...fields },
        create: { connectionId, plaidAccountId: account.account_id, ...fields }
      });
    }
  }

  // Pull every page of /transactions/sync for one connection, upserting the
  // added/modified batches and deleting the removed ones. Returns the number of
  // rows written and the cursor to persist for next time.
  async function syncConnection(connection, userId) {
    // Map Plaid account ids to our own account row ids for this connection.
    const accountRowByPlaidId = new Map(
      connection.accounts.map((account) => [account.plaidAccountId, account.id])
    );

    const token = decryptSecret({
      ciphertext: connection.encryptedToken,
      iv: connection.tokenIv,
      authTag: connection.tokenAuthTag
    });

    let cursor = connection.transactionCursor ?? null;
    let imported = 0;
    let hasMore = true;

    while (hasMore) {
      let page;
      try {
        page = await syncTransactions(token, cursor);
      } catch (error) {
        // Right after linking (especially in production), Plaid may still be
        // pulling the Item's initial transactions. That's expected, not a
        // failure: report it as pending so the next sync picks the data up.
        if (error?.plaidErrorCode === "PRODUCT_NOT_READY") {
          return { imported, cursor, pending: true };
        }
        throw error;
      }
      cursor = page?.next_cursor ?? cursor;
      hasMore = Boolean(page?.has_more);

      for (const txn of [...(page?.added ?? []), ...(page?.modified ?? [])]) {
        if (!txn?.transaction_id) continue;
        const accountId = accountRowByPlaidId.get(txn.account_id);
        if (!accountId) continue;

        // plaidTxnId is globally unique; the same cross-user guard as for
        // accounts prevents reassigning a transaction owned by someone else.
        const existing = await prisma.bankTransaction.findUnique({
          where: { plaidTxnId: txn.transaction_id },
          include: { account: { include: { connection: { select: { userId: true } } } } }
        });
        if (existing && existing.account?.connection?.userId !== userId) {
          continue;
        }

        const data = {
          accountId,
          date: new Date(txn.date),
          description: txn.name ?? null,
          // Plaid reports outflows as positive; the rest of the app expects
          // outflows to be negative (spending), so normalize the sign here.
          amount: typeof txn.amount === "number" ? -txn.amount : 0,
          category: txn.personal_finance_category?.primary ?? txn.category?.[0] ?? null
        };
        await prisma.bankTransaction.upsert({
          where: { plaidTxnId: txn.transaction_id },
          update: data,
          create: { plaidTxnId: txn.transaction_id, ...data }
        });
        imported += 1;
      }

      for (const removed of page?.removed ?? []) {
        if (!removed?.transaction_id) continue;
        await prisma.bankTransaction.deleteMany({
          where: {
            plaidTxnId: removed.transaction_id,
            account: { connection: { userId } }
          }
        });
      }
    }

    return { imported, cursor, pending: false };
  }

  function register(app, requireAuth) {
    // Mint a short-lived Plaid Link token for the browser. Scoped to auth so
    // only a logged-in user can start a link, and to their own user id.
    app.get("/api/plaid/link-token", requireAuth, async (req, res) => {
      const { configured } = plaidConfig();
      if (!configured) {
        return res.status(400).json({ error: "Plaid is not configured on the server." });
      }
      try {
        const result = await createLinkToken(req.userId);
        res.json({ linkToken: result?.link_token ?? "" });
      } catch (error) {
        console.error("Plaid link token failed:", error);
        res.status(502).json({ error: "Could not start a bank connection." });
      }
    });

    // Exchange the public token from Plaid Link for a permanent access token,
    // verify it by fetching accounts, then store it encrypted. Tokens are never
    // returned to the browser.
    app.post("/api/plaid/exchange", requireAuth, async (req, res) => {
      const publicToken = String(req.body?.publicToken ?? "").trim();
      if (!publicToken) {
        return res.status(400).json({ error: "publicToken is required." });
      }
      const metadata = req.body?.metadata ?? {};
      const institutionName = metadata?.institution?.name ?? null;
      const institutionId = metadata?.institution?.institution_id ?? null;

      try {
        const exchange = await exchangePublicToken(publicToken);
        const accessToken = exchange?.access_token;
        if (!accessToken) {
          throw new Error("Plaid did not return an access token.");
        }
        const itemId = exchange?.item_id ?? null;
        // Fetching accounts both validates the token and gives us rows to store.
        const accountsResponse = await getAccounts(accessToken);
        const accounts = accountsResponse?.accounts ?? [];

        const encrypted = encryptSecret(accessToken);

        // Going through Link again for a bank the user already has is a
        // re-link, not a second bank — but Plaid hands back a new Item whose
        // account and transaction ids share nothing with the old one, so
        // storing it alongside the old connection imports a duplicate copy of
        // every transaction. Replace instead: drop the superseded connections
        // (cascading their accounts and transactions) in the same transaction
        // that creates the new one, so the user is never left with two copies
        // or with none.
        const supersededFilters = [];
        if (itemId) supersededFilters.push({ itemId });
        if (institutionId) supersededFilters.push({ institutionId });

        const { connection, superseded } = await prisma.$transaction(async (tx) => {
          let stale = [];
          if (supersededFilters.length > 0) {
            stale = await tx.bankConnection.findMany({
              where: { userId: req.userId, OR: supersededFilters },
              select: { id: true, encryptedToken: true, tokenIv: true, tokenAuthTag: true }
            });
            if (stale.length > 0) {
              await tx.bankConnection.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
            }
          }

          const created = await tx.bankConnection.create({
            data: {
              userId: req.userId,
              provider: "plaid",
              institutionName,
              institutionId,
              itemId,
              encryptedToken: encrypted.ciphertext,
              tokenIv: encrypted.iv,
              tokenAuthTag: encrypted.authTag
            }
          });
          await storeAccounts(tx, created.id, req.userId, accounts);
          return { connection: created, superseded: stale };
        });

        // The superseded Items are no longer referenced by anything we store,
        // so release them at Plaid too. Best-effort: the local replacement has
        // already committed, and a leftover Item costs the user nothing.
        await releaseItems(superseded);

        res.status(201).json({
          id: connection.id,
          institutionName,
          accounts: accounts.length,
          // Lets the client explain that an existing link was refreshed rather
          // than a second one added.
          replaced: superseded.length > 0
        });
      } catch (error) {
        console.error("Plaid exchange failed:", error);
        res.status(502).json({ error: "Could not connect the bank account." });
      }
    });

    // Pull transactions for all of the user's connections via cursor-based
    // sync, upserting them (deduped by Plaid's transaction id). Read-only.
    app.post("/api/plaid/sync", requireAuth, async (req, res) => {
      try {
        const connections = await prisma.bankConnection.findMany({
          where: { userId: req.userId },
          include: { accounts: true }
        });

        let imported = 0;
        let pending = false;
        for (const connection of connections) {
          const result = await syncConnection(connection, req.userId);
          imported += result.imported;
          if (result.pending) pending = true;
          if (result.cursor && result.cursor !== connection.transactionCursor) {
            await prisma.bankConnection.update({
              where: { id: connection.id },
              data: { transactionCursor: result.cursor }
            });
          }
        }
        // `pending` means at least one bank is still preparing data; the client
        // can tell the user to retry shortly rather than showing an error.
        res.json({ imported, pending });
      } catch (error) {
        console.error("Plaid sync failed:", error);
        res.status(502).json({ error: "Could not sync transactions." });
      }
    });

    // Return the user's stored transactions (sanitized — no tokens/ids leaked).
    app.get("/api/transactions", requireAuth, async (req, res) => {
      try {
        const transactions = await prisma.bankTransaction.findMany({
          where: { account: { connection: { userId: req.userId } } },
          orderBy: { date: "desc" },
          include: { account: { select: { name: true, lastFour: true } } }
        });
        res.json(
          transactions.map((txn) => ({
            id: txn.id,
            date: txn.date,
            description: txn.description,
            amount: Number(txn.amount),
            category: txn.category,
            account: txn.account?.name ?? null
          }))
        );
      } catch (error) {
        console.error("Failed to list transactions:", error);
        res.status(500).json({ error: "Could not load transactions." });
      }
    });
  }

  return { register };
}
