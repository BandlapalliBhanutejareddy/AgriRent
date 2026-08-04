/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `status` on the `Booking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `title` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Equipment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `imageUrl` on table `Equipment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_ownerId_fkey";

-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "ownerId",
DROP COLUMN "totalPrice",
DROP COLUMN "updatedAt",
DROP COLUMN "status",
ADD COLUMN     "status" "BookingStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Equipment" DROP COLUMN "isAvailable",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "imageUrl" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "location",
DROP COLUMN "updatedAt",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "profileImage" TEXT,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
