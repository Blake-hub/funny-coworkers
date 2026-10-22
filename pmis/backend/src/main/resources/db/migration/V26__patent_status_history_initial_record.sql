-- Allow the initial submission record to carry from_status = NULL
-- (there is no predecessor state when a patent is first created).
ALTER TABLE patent_status_history ALTER COLUMN from_status DROP NOT NULL;
