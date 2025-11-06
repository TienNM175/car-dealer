BEGIN;

-- Define cutoff timestamp for new duplicate records (seed run on 2025-11-06)
-- Adjust if needed.
DO $$
DECLARE
  cutoff TIMESTAMP := '2025-11-06T16:49:00Z';
BEGIN
  -- Remove records created after cutoff from tables referencing vehicles first
  DELETE FROM vehicle_export_documents WHERE created_at > cutoff;
  DELETE FROM contracts WHERE created_at > cutoff;
  DELETE FROM quotations WHERE created_at > cutoff;
  DELETE FROM test_drives WHERE created_at > cutoff;
  DELETE FROM dealer_orders WHERE created_at > cutoff;
  DELETE FROM vehicle_units WHERE created_at > cutoff;
  DELETE FROM vehicle_images WHERE created_at > cutoff;
  DELETE FROM inventories WHERE created_at > cutoff;
  DELETE FROM evm_inventories WHERE created_at > cutoff;

  -- Finally remove the duplicate vehicle records themselves
  DELETE FROM vehicles WHERE created_at > cutoff;
END $$;

COMMIT;

