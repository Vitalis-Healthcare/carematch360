-- ============================================================
-- CareMatch360 — Patch 006a: Add new credential enum values
-- Run THIS FIRST, then run patch_006b after it completes
-- ============================================================

ALTER TYPE credential_type ADD VALUE IF NOT EXISTS 'UA';
ALTER TYPE credential_type ADD VALUE IF NOT EXISTS 'GNA';
ALTER TYPE credential_type ADD VALUE IF NOT EXISTS 'CMT';

-- Verify — you should see all 9 values before running 006b
SELECT enumlabel AS credential_type
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'credential_type'
ORDER BY enumsortorder;
