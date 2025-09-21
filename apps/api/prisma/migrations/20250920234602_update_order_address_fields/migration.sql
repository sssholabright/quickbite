/*
  Warnings:

  - You are about to drop the column `deliveryLat` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryLng` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedTime` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickupLat` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickupLng` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `orders` table. All the data in the column will be lost.
  - Added the required column `serviceFee` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `deliveryAddress` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "deliveryLat",
DROP COLUMN "deliveryLng",
DROP COLUMN "estimatedTime",
DROP COLUMN "notes",
DROP COLUMN "pickupLat",
DROP COLUMN "pickupLng",
DROP COLUMN "totalAmount",
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "estimatedDeliveryTime" TIMESTAMP(3),
ADD COLUMN     "serviceFee" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "specialInstructions" TEXT,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION,
DROP COLUMN "deliveryAddress",
ADD COLUMN     "deliveryAddress" JSONB NOT NULL;
