CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "document_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_description" TEXT,
    "is_restored" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_versions_document_id_version_number_key" ON "document_versions"("document_id", "version_number");
CREATE INDEX "document_versions_document_id_created_at_idx" ON "document_versions"("document_id", "created_at");
CREATE INDEX "document_versions_created_by_id_idx" ON "document_versions"("created_by_id");

ALTER TABLE "document_versions"
  ADD CONSTRAINT "document_versions_document_id_documents_id_fk"
  FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_versions"
  ADD CONSTRAINT "document_versions_created_by_id_users_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;