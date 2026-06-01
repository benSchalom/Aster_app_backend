-- CreateTable
CREATE TABLE "Archive" (
    "id" TEXT NOT NULL,
    "commercantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nomCommerce" TEXT NOT NULL,
    "dateSuppression" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motif" TEXT NOT NULL,

    CONSTRAINT "Archive_pkey" PRIMARY KEY ("id")
);
