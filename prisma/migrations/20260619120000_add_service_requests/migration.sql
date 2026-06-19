-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUBMITTED', 'IN_PROGRESS', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestTaskStatus" AS ENUM ('BACKLOG', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RequestPaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_VERIFICATION', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "RequestActivityAction" AS ENUM ('SUBMITTED', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_REJECTED', 'REQUEST_APPROVED', 'REQUEST_REJECTED');

-- CreateTable
CREATE TABLE "service_requests" (
    "id" BIGSERIAL NOT NULL,
    "citizen_id" BIGINT NOT NULL,
    "service_id" BIGINT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "payment_status" "RequestPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "current_task_id" BIGINT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_tasks" (
    "id" BIGSERIAL NOT NULL,
    "request_id" BIGINT NOT NULL,
    "service_task_id" BIGINT NOT NULL,
    "section_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "task_order" INTEGER NOT NULL,
    "estimated_time_hours" INTEGER NOT NULL,
    "assigned_employee_id" BIGINT,
    "status" "RequestTaskStatus" NOT NULL DEFAULT 'BACKLOG',
    "assigned_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_activities" (
    "id" BIGSERIAL NOT NULL,
    "request_id" BIGINT NOT NULL,
    "task_id" BIGINT,
    "actor_id" BIGINT NOT NULL,
    "action" "RequestActivityAction" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_requests_citizen_id_idx" ON "service_requests"("citizen_id");

-- CreateIndex
CREATE INDEX "service_requests_service_id_idx" ON "service_requests"("service_id");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE INDEX "request_tasks_section_id_status_idx" ON "request_tasks"("section_id", "status");

-- CreateIndex
CREATE INDEX "request_tasks_assigned_employee_id_idx" ON "request_tasks"("assigned_employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "request_tasks_request_id_task_order_key" ON "request_tasks"("request_id", "task_order");

-- CreateIndex
CREATE INDEX "request_activities_request_id_idx" ON "request_activities"("request_id");

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_tasks" ADD CONSTRAINT "request_tasks_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_tasks" ADD CONSTRAINT "request_tasks_service_task_id_fkey" FOREIGN KEY ("service_task_id") REFERENCES "service_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_tasks" ADD CONSTRAINT "request_tasks_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_tasks" ADD CONSTRAINT "request_tasks_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_activities" ADD CONSTRAINT "request_activities_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_activities" ADD CONSTRAINT "request_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
