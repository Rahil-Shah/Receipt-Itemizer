-- Let the account owner appear as a participant in their own receipt splits, so
-- only their share of a shared bill counts toward their budget.
ALTER TABLE "account_people" ADD COLUMN "isSelf" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "account_people_userId_isSelf_idx" ON "account_people"("userId", "isSelf");
