-- ====================================================================================
-- VELO PLATFORM MASTER INITIALIZATION SCHEMA
-- Strict Multi-Tenant Architecture (Row-Level Security)
-- ====================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------------
-- 1. MASTER MULTI-TENANCY CORE
-- ------------------------------------------------------------------------------------
CREATE TABLE tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    activation_status VARCHAR(50) DEFAULT 'REGISTRATION',
    preferred_language VARCHAR(10) DEFAULT 'en',
    vat_registered BOOLEAN NOT NULL DEFAULT FALSE,
    vat_number VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Global System Configuration (Managed exclusively by Back-Office Control Tower)
CREATE TABLE global_fee_settings (
    id SERIAL PRIMARY KEY,
    creator_fee_mode VARCHAR(20) NOT NULL DEFAULT 'FLAT', -- 'FLAT', 'PERCENTAGE', 'HYBRID'
    creator_flat_value DECIMAL(10,2) DEFAULT 1.00,
    creator_percentage_value NUMERIC(5,2) DEFAULT 0.00,
    fulfiller_fee_mode VARCHAR(20) NOT NULL, -- 'FLAT', 'PERCENTAGE', 'HYBRID'
    fulfiller_flat_value NUMERIC(10,2) DEFAULT 0.00,
    fulfiller_percentage_value NUMERIC(5,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chauffeur_shifts (
    id SERIAL PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES drivers(id),
    tenant_id VARCHAR(50) REFERENCES tenants(id),
    shift_type VARCHAR(20) NOT NULL, -- 'EARLY', 'LATE', 'NIGHT', 'STANDBY'
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_knowledge_base (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(100) NOT NULL,
    markdown_content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Basic indexes for scheduling
CREATE INDEX idx_chauffeur_shifts_tenant ON chauffeur_shifts(tenant_id);
CREATE INDEX idx_chauffeur_shifts_driver ON chauffeur_shifts(driver_id);
CREATE INDEX idx_chauffeur_shifts_vehicle ON chauffeur_shifts(vehicle_id);

-- Seed initial VELO default flat-fee model
INSERT INTO global_fee_settings (creator_fee_mode, creator_flat_value, fulfiller_fee_mode, fulfiller_flat_value) 
VALUES ('FLAT', 1.00, 'FLAT', 1.00);

-- Master Operational Physics Configuration
CREATE TABLE global_system_settings (
    id SERIAL PRIMARY KEY,
    b2b_negotiation_timeout_mins INT NOT NULL DEFAULT 10,
    nearby_driver_radius_meters INT NOT NULL DEFAULT 5000,
    marketplace_base_fare_pence INT NOT NULL DEFAULT 500,
    marketplace_per_mile_pence INT NOT NULL DEFAULT 250,
    marketplace_per_minute_pence INT NOT NULL DEFAULT 50,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial VELO system baselines
INSERT INTO global_system_settings (b2b_negotiation_timeout_mins, nearby_driver_radius_meters, marketplace_base_fare_pence, marketplace_per_mile_pence, marketplace_per_minute_pence)
VALUES (10, 5000, 500, 250, 50);

-- Fleet & Maintenance Asset Tables
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    plate_number VARCHAR(50) NOT NULL,
    phv_expiry DATE NOT NULL,
    insurance_expiry DATE NOT NULL,
    current_odometer INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_fleet_settings (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    require_odometer_preflight BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE odometer_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reading INT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'START_SHIFT', 'END_SHIFT'
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicle_issues (
    id SERIAL PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'FIXED'
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE vehicle_fixed_finances (
    vehicle_id UUID PRIMARY KEY REFERENCES vehicles(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    monthly_finance_cost INT NOT NULL DEFAULT 0, -- Stored in pence
    monthly_insurance_cost INT NOT NULL DEFAULT 0, -- Stored in pence
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE booking_expenses (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(100) NOT NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    expense_type VARCHAR(50) NOT NULL, -- 'TOLL', 'AIRPORT_FEE', 'PARKING', 'CUSTOM'
    amount_pence INT NOT NULL,
    custom_label TEXT,
    receipt_url VARCHAR(512) DEFAULT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fleet_general_expenses (
    id SERIAL PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    expense_type VARCHAR(50) NOT NULL, -- 'FUEL', 'CARWASH', 'CUSTOM'
    amount_pence INT NOT NULL,
    description TEXT,
    receipt_url VARCHAR(512) DEFAULT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: RLS Policies below rely on session context variables set by middleware:
-- e.g., current_setting('app.current_tenant_id')

-- ------------------------------------------------------------------------------------
-- 2. DRIVERS & REMUNERATION ARCHITECTURE
-- ------------------------------------------------------------------------------------
CREATE TYPE remuneration_type AS ENUM ('COMMISSION', 'SALARIED');

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    pay_structure remuneration_type NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON drivers
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE TABLE driver_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(6,2),
    overtime_hours DECIMAL(6,2)
);

ALTER TABLE driver_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON driver_shifts
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE TABLE driver_tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    booking_id UUID NOT NULL,
    tip_amount DECIMAL(10,2) NOT NULL CHECK (tip_amount >= 0),
    cleared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE driver_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON driver_tips
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ------------------------------------------------------------------------------------
-- 3. VELO EXCLUSIVE FINANCIAL MODEL: NETWORK CLEARING LEDGER
-- ------------------------------------------------------------------------------------
CREATE TABLE b2b_network_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    originating_tenant_id UUID NOT NULL REFERENCES tenants(id),
    fulfilling_tenant_id UUID NOT NULL REFERENCES tenants(id),
    wholesale_fare DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE b2b_network_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY b2b_tenant_isolation_policy ON b2b_network_transactions
    USING (
        originating_tenant_id = current_setting('app.current_tenant_id')::UUID 
        OR 
        fulfilling_tenant_id = current_setting('app.current_tenant_id')::UUID
    );

-- Absolute Network Clearing Ledger: Tracks the exact £1.00 extractions from traded jobs
CREATE TABLE network_clearing_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    originating_tenant_id UUID NOT NULL REFERENCES tenants(id),
    fulfilling_tenant_id UUID NOT NULL REFERENCES tenants(id),
    creator_fee_net DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    creator_fee_vat DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    creator_fee_gross DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fulfiller_fee_net DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fulfiller_fee_vat DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fulfiller_fee_gross DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE network_clearing_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY b2b_ledger_isolation_policy ON network_clearing_ledger
    USING (
        originating_tenant_id = current_setting('app.current_tenant_id')::UUID 
        OR 
        fulfilling_tenant_id = current_setting('app.current_tenant_id')::UUID
    );

-- Tax Insulated Invoice Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    booking_id UUID NOT NULL,
    customer_retail_fare DECIMAL(10,2) NOT NULL, 
    driver_net_payout DECIMAL(10,2) NOT NULL,
    driver_vat_liability DECIMAL(10,2) NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON invoices
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ------------------------------------------------------------------------------------
-- 4. ESCROW & DISPUTE TRACKING MATRIX
-- ------------------------------------------------------------------------------------
CREATE TYPE escrow_state AS ENUM ('HELD', 'RELEASED', 'DISPUTED', 'FROZEN');

CREATE TABLE escrow_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    held_amount DECIMAL(10,2) NOT NULL,
    state escrow_state NOT NULL DEFAULT 'HELD',
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE escrow_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON escrow_vault
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE OR REPLACE FUNCTION prevent_frozen_payout()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.state = 'FROZEN' AND NEW.state = 'RELEASED' THEN
        RAISE EXCEPTION 'CRITICAL: Escrow record is FROZEN. Manual arbitration override required to release funds.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_frozen_escrow
    BEFORE UPDATE ON escrow_vault
    FOR EACH ROW
    EXECUTE FUNCTION prevent_frozen_payout();

-- ------------------------------------------------------------------------------------
-- 4.5 B2B OPEN POOL ENGINE
-- ------------------------------------------------------------------------------------
CREATE TYPE pool_job_state AS ENUM ('OPEN', 'NEGOTIATION', 'ALLOCATED', 'COMPLETED');

CREATE TABLE b2b_pool_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    originating_tenant_id UUID NOT NULL REFERENCES tenants(id),
    countering_tenant_id UUID REFERENCES tenants(id), 
    pickup_location VARCHAR(255) NOT NULL,
    pickup_geom GEOMETRY(Point, 4326) NOT NULL,
    dropoff_location VARCHAR(255) NOT NULL,
    dropoff_geom GEOMETRY(Point, 4326) NOT NULL,
    base_wholesale_fare DECIMAL(10,2) NOT NULL,
    current_wholesale_fare DECIMAL(10,2) NOT NULL, 
    state pool_job_state NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE b2b_pool_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY pool_job_visibility_policy ON b2b_pool_jobs
    USING (
        originating_tenant_id = current_setting('app.current_tenant_id')::UUID 
        OR 
        (state = 'OPEN' AND originating_tenant_id != current_setting('app.current_tenant_id')::UUID)
    );

-- ------------------------------------------------------------------------------------
-- 5. SPATIAL GEOMETRY (DRIVER LOCATIONS & DISTANCE MATRIX)
-- ------------------------------------------------------------------------------------
CREATE TABLE driver_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    vehicle_tier VARCHAR(50) NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    current_location GEOMETRY(Point, 4326),
    bearing DECIMAL(5,2),
    speed DECIMAL(5,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON driver_locations
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE INDEX idx_driver_locations_geom ON driver_locations USING GIST (current_location);
CREATE INDEX idx_pool_jobs_pickup_geom ON b2b_pool_jobs USING GIST (pickup_geom);
CREATE INDEX idx_pool_jobs_dropoff_geom ON b2b_pool_jobs USING GIST (dropoff_geom);
