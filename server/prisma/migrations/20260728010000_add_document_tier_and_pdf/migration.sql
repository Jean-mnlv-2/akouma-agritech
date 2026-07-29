-- Content tiering for the Agriconsulting RAG documents (Standard vs Premium),
-- plus the original uploaded PDF reference when a document was created from
-- a PDF upload instead of typed text.
ALTER TABLE "Document" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "Document" ADD COLUMN "pdfUrl" TEXT;
