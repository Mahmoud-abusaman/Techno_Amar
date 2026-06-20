-- Add selfie field to citizen profiles
ALTER TABLE "citizen_profiles" ADD COLUMN "id_selfie" TEXT;

-- Damage assessment supporting images
CREATE TABLE "damage_assessment_documents" (
    "id" BIGSERIAL NOT NULL,
    "assessment_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "file_path" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "damage_assessment_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "damage_assessment_documents_assessment_id_idx" ON "damage_assessment_documents"("assessment_id");

ALTER TABLE "damage_assessment_documents" ADD CONSTRAINT "damage_assessment_documents_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "damage_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
