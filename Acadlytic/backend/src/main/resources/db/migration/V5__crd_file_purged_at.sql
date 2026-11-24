ALTER TABLE college_registration_documents
    ADD COLUMN file_purged_at TIMESTAMP NULL;

CREATE INDEX idx_crd_file_purged_at
    ON college_registration_documents (file_purged_at);
