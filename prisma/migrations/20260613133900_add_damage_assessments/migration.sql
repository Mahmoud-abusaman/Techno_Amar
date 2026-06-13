-- CreateEnum
CREATE TYPE "DamageSeverity" AS ENUM ('MINOR', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "DamageAssessmentStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED');

-- CreateTable
CREATE TABLE "damage_assessments" (
    "id" BIGSERIAL NOT NULL,
    "citizen_id" BIGINT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "damage_severity" "DamageSeverity" NOT NULL,
    "status" "DamageAssessmentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "damage_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "damage_assessments_citizen_id_key" ON "damage_assessments"("citizen_id");

-- AddForeignKey
ALTER TABLE "damage_assessments" ADD CONSTRAINT "damage_assessments_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
