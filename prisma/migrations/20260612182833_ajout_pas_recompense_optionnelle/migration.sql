-- Migration: ajout_pas_recompense_optionnelle
-- Ajoute le champ `pas` (increment par transaction, defaut 1)
-- Rend `recompense` optionnel (nullable)

ALTER TABLE "Programme" ADD COLUMN "pas" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Programme" ALTER COLUMN "recompense" DROP NOT NULL;
