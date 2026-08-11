-- Record which institution a connection belongs to.
--
-- Plaid mints a brand-new Item (and therefore brand-new account and
-- transaction ids) every time a user goes through Link, so itemId cannot tell
-- a re-link of an existing bank apart from a genuinely new bank. institutionId
-- is stable across re-links, which is what /api/plaid/exchange needs in order
-- to replace the previous connection rather than import a second copy of every
-- transaction.

-- AlterTable
ALTER TABLE "bank_connections" ADD COLUMN "institutionId" TEXT;

-- CreateIndex
CREATE INDEX "bank_connections_userId_institutionId_idx" ON "bank_connections"("userId", "institutionId");
