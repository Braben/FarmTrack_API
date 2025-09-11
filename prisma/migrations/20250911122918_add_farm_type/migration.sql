/*
  Warnings:

  - You are about to drop the column `name` on the `Farm` table. All the data in the column will be lost.
  - Added the required column `farmName` to the `Farm` table without a default value. This is not possible if the table is not empty.
  - Added the required column `farmType` to the `Farm` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Farm" DROP COLUMN "name",
ADD COLUMN     "farmName" TEXT NOT NULL,
ADD COLUMN     "farmType" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
