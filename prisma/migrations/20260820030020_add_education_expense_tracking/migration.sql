/*
  Warnings:

  - You are about to drop the column `name` on the `people` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[linkedReceiptId]` on the table `bank_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bank_transactions" ADD COLUMN     "linkedReceiptId" TEXT;

-- AlterTable
ALTER TABLE "people" DROP COLUMN "name",
ALTER COLUMN "accountPersonId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "receipt_lines" ADD COLUMN     "isFood" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "rent_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "propertyName" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "photoData" TEXT,
    "photoMimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rent_entries_userId_year_month_idx" ON "rent_entries"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "rent_entries_userId_year_month_key" ON "rent_entries"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_linkedReceiptId_key" ON "bank_transactions"("linkedReceiptId");

-- CreateIndex
CREATE INDEX "people_receiptId_idx" ON "people"("receiptId");

-- CreateIndex
CREATE INDEX "receipt_lines_receiptId_isFood_idx" ON "receipt_lines"("receiptId", "isFood");

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_linkedReceiptId_fkey" FOREIGN KEY ("linkedReceiptId") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_entries" ADD CONSTRAINT "rent_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
