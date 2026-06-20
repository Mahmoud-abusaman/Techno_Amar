-- CreateEnum
CREATE TYPE "DocumentRequirementType" AS ENUM ('MANDATORY', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "RequestDocumentCategory" AS ENUM ('CITIZEN_UPLOADED', 'INTERNAL', 'RESULT');

-- CreateTable
CREATE TABLE "required_documents" (
    "id" BIGSERIAL NOT NULL,
    "service_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DocumentRequirementType" NOT NULL DEFAULT 'MANDATORY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "required_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_documents" (
    "id" BIGSERIAL NOT NULL,
    "request_id" BIGINT NOT NULL,
    "required_document_id" BIGINT,
    "task_id" BIGINT,
    "name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "file_path" TEXT,
    "category" "RequestDocumentCategory" NOT NULL DEFAULT 'CITIZEN_UPLOADED',
    "uploaded_by" BIGINT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "required_documents_service_id_name_key" ON "required_documents"("service_id", "name");

-- CreateIndex
CREATE INDEX "request_documents_request_id_idx" ON "request_documents"("request_id");

-- AddForeignKey
ALTER TABLE "required_documents" ADD CONSTRAINT "required_documents_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_documents" ADD CONSTRAINT "request_documents_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_documents" ADD CONSTRAINT "request_documents_required_document_id_fkey" FOREIGN KEY ("required_document_id") REFERENCES "required_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_documents" ADD CONSTRAINT "request_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
