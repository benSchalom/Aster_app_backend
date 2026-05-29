-- CreateEnum
CREATE TYPE "TypeProgramme" AS ENUM ('points', 'gratuite', 'abonnement_seances', 'abonnement_temps');

-- CreateEnum
CREATE TYPE "TypeTransaction" AS ENUM ('gain', 'consommation', 'recompense');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('en_attente', 'confirmee', 'refusee');

-- CreateTable
CREATE TABLE "Commercant" (
    "id" TEXT NOT NULL,
    "nomCommerce" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "emailVerifie" BOOLEAN NOT NULL DEFAULT false,
    "logo" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commercant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "commercantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeProgramme" NOT NULL,
    "valeur" INTEGER NOT NULL,
    "recompense" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carte" (
    "id" TEXT NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "commercantId" TEXT NOT NULL,
    "clientNom" TEXT NOT NULL,
    "clientTelephone" TEXT NOT NULL,
    "etat" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Carte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "carteId" TEXT NOT NULL,
    "type" "TypeTransaction" NOT NULL,
    "montant" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demande" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "clientNom" TEXT NOT NULL,
    "clientTelephone" TEXT NOT NULL,
    "statut" "StatutDemande" NOT NULL DEFAULT 'en_attente',
    "carteId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Demande_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commercant_email_key" ON "Commercant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Carte_numeroSerie_key" ON "Carte"("numeroSerie");

-- CreateIndex
CREATE UNIQUE INDEX "Demande_carteId_key" ON "Demande"("carteId");

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_commercantId_fkey" FOREIGN KEY ("commercantId") REFERENCES "Commercant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carte" ADD CONSTRAINT "Carte_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carte" ADD CONSTRAINT "Carte_commercantId_fkey" FOREIGN KEY ("commercantId") REFERENCES "Commercant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_carteId_fkey" FOREIGN KEY ("carteId") REFERENCES "Carte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demande" ADD CONSTRAINT "Demande_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demande" ADD CONSTRAINT "Demande_carteId_fkey" FOREIGN KEY ("carteId") REFERENCES "Carte"("id") ON DELETE SET NULL ON UPDATE CASCADE;
