-- AddForeignKey
ALTER TABLE "rider_order_history" ADD CONSTRAINT "rider_order_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
