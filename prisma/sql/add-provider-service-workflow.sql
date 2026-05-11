-- Add ProviderServiceWorkflow join table
-- Links ProviderServiceConfig rows to the WorkflowTemplates a provider has chosen
-- to offer for that service. Safe to run multiple times (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS "ProviderServiceWorkflow" (
    "id"                      TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "providerServiceConfigId" TEXT        NOT NULL,
    "workflowTemplateId"      TEXT        NOT NULL,
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderServiceWorkflow_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "ProviderServiceWorkflow_providerServiceConfigId_fkey"
        FOREIGN KEY ("providerServiceConfigId")
        REFERENCES "ProviderServiceConfig"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT "ProviderServiceWorkflow_workflowTemplateId_fkey"
        FOREIGN KEY ("workflowTemplateId")
        REFERENCES "WorkflowTemplate"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT "ProviderServiceWorkflow_providerServiceConfigId_workflowTemplateId_key"
        UNIQUE ("providerServiceConfigId", "workflowTemplateId")
);

CREATE INDEX IF NOT EXISTS "ProviderServiceWorkflow_providerServiceConfigId_idx"
    ON "ProviderServiceWorkflow"("providerServiceConfigId");

CREATE INDEX IF NOT EXISTS "ProviderServiceWorkflow_workflowTemplateId_idx"
    ON "ProviderServiceWorkflow"("workflowTemplateId");
