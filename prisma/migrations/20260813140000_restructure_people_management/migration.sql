-- CreateTable AccountPerson
CREATE TABLE "account_people" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_people_pkey" PRIMARY KEY ("id")
);

-- Clear existing people (user requested this)
DELETE FROM "line_assignments";
DELETE FROM "people";

-- AlterTable people: add accountPersonId column
ALTER TABLE "people" ADD COLUMN "accountPersonId" TEXT NOT NULL DEFAULT '';

-- AddIndex for account_people
CREATE UNIQUE INDEX "account_people_userId_name_key" ON "account_people"("userId", "name");
CREATE INDEX "account_people_userId_idx" ON "account_people"("userId");

-- AddIndex for people (new unique constraint)
CREATE UNIQUE INDEX "people_receiptId_accountPersonId_key" ON "people"("receiptId", "accountPersonId");
CREATE INDEX "people_accountPersonId_idx" ON "people"("accountPersonId");

-- Add foreign key from people to account_people
ALTER TABLE "people" ADD CONSTRAINT "people_accountPersonId_fkey" FOREIGN KEY ("accountPersonId") REFERENCES "account_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key from account_people to users
ALTER TABLE "account_people" ADD CONSTRAINT "account_people_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the old index on people(receiptId)
DROP INDEX IF EXISTS "people_receiptId_idx";
