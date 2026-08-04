CREATE TYPE "DocumentPermissionLevel" AS ENUM ('OWNER', 'EDITOR', 'COMMENTER', 'VIEWER');

CREATE TABLE "document_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "permission" "DocumentPermissionLevel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "document_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_permissions_document_id_user_id_key" ON "document_permissions"("document_id", "user_id");
CREATE INDEX "document_permissions_document_id_idx" ON "document_permissions"("document_id");
CREATE INDEX "document_permissions_user_id_idx" ON "document_permissions"("user_id");
CREATE INDEX "document_permissions_permission_idx" ON "document_permissions"("permission");

ALTER TABLE "document_permissions"
  ADD CONSTRAINT "document_permissions_document_id_documents_id_fk"
  FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_permissions"
  ADD CONSTRAINT "document_permissions_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_permissions"
  ADD CONSTRAINT "document_permissions_created_by_id_users_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;