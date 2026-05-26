-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "size" INTEGER NOT NULL,
    "bedType" TEXT NOT NULL,
    "viewType" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "airbnbUrl" TEXT NOT NULL DEFAULT 'https://airbnb.com',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);
