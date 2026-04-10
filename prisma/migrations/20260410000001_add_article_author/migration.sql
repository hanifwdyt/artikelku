-- AlterTable: add author fields to Article
ALTER TABLE "Article" ADD COLUMN "author" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Article" ADD COLUMN "authorEmail" TEXT NOT NULL DEFAULT '';
