-- CreateEnum
CREATE TYPE "public"."VendorStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED', 'BLOCKED');

-- AlterTable
ALTER TABLE "public"."vendors" ADD COLUMN     "avgPrepTime" DOUBLE PRECISION,
ADD COLUMN     "cancelledOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "closingTime" TEXT,
ADD COLUMN     "completedOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "openingTime" TEXT,
ADD COLUMN     "operatingDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" "public"."VendorStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalOrders" INTEGER NOT NULL DEFAULT 0;
