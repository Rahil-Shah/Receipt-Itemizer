-- Index the foreign keys the receipt queries actually filter and cascade on.
--
-- Prisma does not create indexes for foreign keys on Postgres, and none of
-- these models declared one. So GET /api/receipts sequentially scanned the
-- whole receipts table on every call, and deleting a receipt forced a full
-- scan of receipt_lines and people, each of which forced another full scan of
-- line_assignments -- the largest table, at up to 5000 rows per receipt.
--
-- The unique constraint on (lineId, personId) matches what the client already
-- enforces (toggling an assignment off rather than adding a second one) and
-- stops a crafted payload from inflating one person's share with duplicates.

-- CreateIndex
CREATE INDEX "receipts_userId_idx" ON "receipts"("userId");

-- CreateIndex
CREATE INDEX "receipt_lines_receiptId_idx" ON "receipt_lines"("receiptId");

-- CreateIndex
CREATE INDEX "people_receiptId_idx" ON "people"("receiptId");

-- CreateIndex
CREATE INDEX "line_assignments_lineId_idx" ON "line_assignments"("lineId");

-- CreateIndex
CREATE INDEX "line_assignments_personId_idx" ON "line_assignments"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "line_assignments_lineId_personId_key" ON "line_assignments"("lineId", "personId");
