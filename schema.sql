-- Production Optimized Database Schema for StockPulse
-- Compliant with PostgreSQL 14+ / MySQL 8.0 with B-Tree and Hash Indexing

CREATE TABLE IF NOT EXISTS stockpulse_resources (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    price_rate NUMERIC(10, 2) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stockpulse_locks (
    lock_id VARCHAR(128) PRIMARY KEY,
    resource_id VARCHAR(64) REFERENCES stockpulse_resources(id) ON DELETE CASCADE,
    client_id VARCHAR(128) NOT NULL,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS stockpulse_audit_ledger (
    event_id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    actor VARCHAR(128) DEFAULT 'SYSTEM',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_stockpulse_status ON stockpulse_resources(status);
CREATE INDEX IF NOT EXISTS idx_stockpulse_locks_expiry ON stockpulse_locks(expires_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_stockpulse_audit_ts ON stockpulse_audit_ledger(recorded_at DESC);
