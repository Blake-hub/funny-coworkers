-- Before RECEIVED, the application type is not yet confirmed.
-- Drop the DEFAULT and NOT NULL so submissions start with a blank type.
ALTER TABLE patent_application
    ALTER COLUMN application_type DROP DEFAULT,
    ALTER COLUMN application_type DROP NOT NULL;

-- Fill all existing SUBMITTED rows with NULL (they were unconfirmed).
UPDATE patent_application
   SET application_type = NULL
 WHERE status = 'SUBMITTED' AND application_type = 'STANDARD';

-- RECEIVED/PAID/ACCEPTED/etc. rows keep the value they already have —
-- those applications have already been processed by the admin.
