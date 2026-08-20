-- Mark bank transactions as food so they count toward education expenses.
ALTER TABLE "bank_transactions" ADD COLUMN "isFood" BOOLEAN NOT NULL DEFAULT false;
