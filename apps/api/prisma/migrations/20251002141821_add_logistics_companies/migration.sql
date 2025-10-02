-- CreateEnum
CREATE TYPE "public"."LogisticsCompanyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."EarningType" AS ENUM ('DELIVERY_FEE', 'BONUS', 'TIP', 'PENALTY');

-- CreateEnum
CREATE TYPE "public"."OrderHistoryStatus" AS ENUM ('COMPLETED', 'CANCELLED', 'REASSIGNED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."riders" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "currentOrderId" TEXT;

-- CreateTable
CREATE TABLE "public"."logistics_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "status" "public"."LogisticsCompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logistics_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rider_earnings" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "public"."EarningType" NOT NULL DEFAULT 'DELIVERY_FEE',
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rider_order_history" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "public"."OrderHistoryStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "rider_order_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "logistics_companies_name_key" ON "public"."logistics_companies"("name");

-- AddForeignKey
ALTER TABLE "public"."riders" ADD CONSTRAINT "riders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."logistics_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rider_earnings" ADD CONSTRAINT "rider_earnings_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "public"."riders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
