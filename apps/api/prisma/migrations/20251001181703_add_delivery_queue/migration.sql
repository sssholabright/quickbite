-- CreateEnum
CREATE TYPE "public"."DeliveryQueueStatus" AS ENUM ('QUEUED', 'BROADCASTING', 'ASSIGNED', 'TIMEOUT', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "public"."delivery_queue" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "public"."DeliveryQueueStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_queue_orderId_key" ON "public"."delivery_queue"("orderId");

-- AddForeignKey
ALTER TABLE "public"."delivery_queue" ADD CONSTRAINT "delivery_queue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
