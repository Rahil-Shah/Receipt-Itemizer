-- Records that a rent entry was created from a bank transaction, so the
-- budgeting view can keep showing that row as rent after a reload and offer to
-- remove it again. Unique: a transaction can back at most one rent entry.
ALTER TABLE "rent_entries" ADD COLUMN "bankTransactionId" TEXT;

CREATE UNIQUE INDEX "rent_entries_bankTransactionId_key" ON "rent_entries"("bankTransactionId");
