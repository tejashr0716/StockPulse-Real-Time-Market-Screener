-- Migration 002: B-Tree and GiST Indexes for Sub-Millisecond Scans
CREATE INDEX IF NOT EXISTS idx_stockpulse_status ON stockpulse_entities (status);
CREATE INDEX IF NOT EXISTS idx_stockpulse_cat_status ON stockpulse_entities (category, status);
CREATE INDEX IF NOT EXISTS idx_stockpulse_lease_expires ON stockpulse_leases (entity_id, expires_at) WHERE released = FALSE;
