-- CreateEnum
CREATE TYPE "public"."AddOnCategory" AS ENUM ('EXTRA', 'SIZE', 'SIDE', 'CUSTOMIZATION');

-- AlterTable
ALTER TABLE "public"."menu_items" ADD COLUMN     "preparationTime" INTEGER NOT NULL DEFAULT 15;

-- CreateTable
CREATE TABLE "public"."menu_add_ons" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "category" "public"."AddOnCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_add_ons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_item_add_ons" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_add_ons_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."menu_add_ons" ADD CONSTRAINT "menu_add_ons_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_add_ons" ADD CONSTRAINT "order_item_add_ons_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_add_ons" ADD CONSTRAINT "order_item_add_ons_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "public"."menu_add_ons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
