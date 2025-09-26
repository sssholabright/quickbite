-- AlterTable
ALTER TABLE "public"."admins" ADD COLUMN     "pushToken" TEXT;

-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "pushToken" TEXT;

-- AlterTable
ALTER TABLE "public"."riders" ADD COLUMN     "pushToken" TEXT;

-- AlterTable
ALTER TABLE "public"."vendors" ADD COLUMN     "pushToken" TEXT;
