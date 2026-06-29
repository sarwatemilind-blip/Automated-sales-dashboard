-- ============================================================
-- 001_create_enums.sql
-- ============================================================
CREATE TYPE user_role AS ENUM ('be', 'asm', 'rsm', 'zsm', 'vp', 'admin');
CREATE TYPE designation AS ENUM ('BE', 'ASM', 'RSM', 'DYRSM', 'ZSM', 'VP', 'ADMIN');
CREATE TYPE brand_category AS ENUM ('Pillar', 'Others');
CREATE TYPE upload_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================================
-- 002_create_master_tables.sql
-- ============================================================

-- Geography
CREATE TABLE zones (
  zone_code   VARCHAR(20) PRIMARY KEY,
  zone_name   VARCHAR(100) NOT NULL
);

CREATE TABLE regions (
  region_code VARCHAR(20) PRIMARY KEY,
  region_name VARCHAR(100) NOT NULL,
  zone_code   VARCHAR(20) NOT NULL REFERENCES zones(zone_code)
);

CREATE TABLE states (
  state_code  VARCHAR(20) PRIMARY KEY,
  state_name  VARCHAR(100) NOT NULL,
  zone_code   VARCHAR(20) NOT NULL REFERENCES zones(zone_code)
);

CREATE TABLE hqs (
  hq_code     VARCHAR(20) PRIMARY KEY,
  hq_name     VARCHAR(100) NOT NULL,
  region_code VARCHAR(20) REFERENCES regions(region_code),
  state_code  VARCHAR(20) REFERENCES states(state_code)
);

-- Employees
CREATE TABLE employees (
  emp_id          VARCHAR(20) PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  designation     designation NOT NULL,
  primary_hq_code VARCHAR(20) REFERENCES hqs(hq_code),
  manager_emp_id  VARCHAR(20) REFERENCES employees(emp_id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maps up to 3 BEs per HQ
CREATE TABLE employee_hq_map (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id    VARCHAR(20) NOT NULL REFERENCES employees(emp_id),
  hq_code   VARCHAR(20) NOT NULL REFERENCES hqs(hq_code),
  slot      SMALLINT NOT NULL CHECK (slot IN (1, 2, 3)),
  UNIQUE(hq_code, slot)
);

-- Distribution
CREATE TABLE cfas (
  cfa_code VARCHAR(10) PRIMARY KEY,
  cfa_name VARCHAR(200) NOT NULL,
  city     VARCHAR(100)
);

CREATE TABLE stockists (
  stockist_code   VARCHAR(20) PRIMARY KEY,
  stockist_name   VARCHAR(200) NOT NULL,
  gst_no          VARCHAR(20),
  place_of_supply VARCHAR(100),
  hq_code         VARCHAR(20) NOT NULL REFERENCES hqs(hq_code),
  cfa_code        VARCHAR(10) NOT NULL REFERENCES cfas(cfa_code)
);

-- Products
CREATE TABLE products (
  product_code  VARCHAR(20) PRIMARY KEY,
  product_name  VARCHAR(200) NOT NULL,
  brand_cat     brand_category NOT NULL DEFAULT 'Others',
  is_pillar     BOOLEAN NOT NULL GENERATED ALWAYS AS (brand_cat = 'Pillar') STORED
);

-- Alias / secondary billing codes that map to a canonical product
CREATE TABLE product_code_map (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_code            VARCHAR(20) NOT NULL UNIQUE,
  canonical_product_code VARCHAR(20) NOT NULL REFERENCES products(product_code)
);

-- ============================================================
-- 003_create_sales_tables.sql
-- ============================================================

CREATE TABLE upload_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  fiscal_year     SMALLINT NOT NULL,
  uploaded_by     VARCHAR(20) REFERENCES employees(emp_id),
  status          upload_status NOT NULL DEFAULT 'pending',
  rows_processed  INT DEFAULT 0,
  error_log       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Raw bill-level sales (inserted from monthly dump)
CREATE TABLE sales_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfa_code        VARCHAR(10) NOT NULL REFERENCES cfas(cfa_code),
  stockist_code   VARCHAR(20) NOT NULL REFERENCES stockists(stockist_code),
  product_code    VARCHAR(20) NOT NULL REFERENCES products(product_code),
  hq_code         VARCHAR(20) NOT NULL REFERENCES hqs(hq_code),
  emp_id          VARCHAR(20) REFERENCES employees(emp_id),
  bill_date       DATE NOT NULL,
  fiscal_year     SMALLINT NOT NULL,
  month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  quantity        INT NOT NULL DEFAULT 0,
  free_qty        INT NOT NULL DEFAULT 0,
  sale_rate       NUMERIC(12,4) NOT NULL DEFAULT 0,
  amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  upload_batch_id UUID REFERENCES upload_batches(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-aggregated for fast dashboard reads; refreshed after each upload
CREATE TABLE monthly_sales_summary (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hq_code      VARCHAR(20) NOT NULL REFERENCES hqs(hq_code),
  emp_id       VARCHAR(20) REFERENCES employees(emp_id),
  product_code VARCHAR(20) NOT NULL REFERENCES products(product_code),
  fiscal_year  SMALLINT NOT NULL,
  month        SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_units  INT NOT NULL DEFAULT 0,
  total_value  NUMERIC(16,2) NOT NULL DEFAULT 0,
  ly_units     INT NOT NULL DEFAULT 0,      -- previous year same month
  ly_value     NUMERIC(16,2) NOT NULL DEFAULT 0,
  UNIQUE(hq_code, emp_id, product_code, fiscal_year, month)
);

-- HQ-level targets (product + month granularity, from master file)
CREATE TABLE targets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hq_code      VARCHAR(20) NOT NULL REFERENCES hqs(hq_code),
  emp_id       VARCHAR(20) REFERENCES employees(emp_id),  -- NULL = HQ-level
  product_code VARCHAR(20) NOT NULL REFERENCES products(product_code),
  fiscal_year  SMALLINT NOT NULL,
  month        SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  value_target NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit_target  INT NOT NULL DEFAULT 0,
  no_of_bes    SMALLINT NOT NULL DEFAULT 1,
  UNIQUE(hq_code, emp_id, product_code, fiscal_year, month)
);

-- ============================================================
-- 004_create_stock_tables.sql
-- ============================================================

CREATE TABLE monthly_stock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stockist_code   VARCHAR(20) NOT NULL REFERENCES stockists(stockist_code),
  emp_id          VARCHAR(20) NOT NULL REFERENCES employees(emp_id),
  hq_code         VARCHAR(20) NOT NULL REFERENCES hqs(hq_code),
  product_code    VARCHAR(20) NOT NULL REFERENCES products(product_code),
  fiscal_year     SMALLINT NOT NULL,
  month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),

  -- Auto-populated from previous month closing
  opening_qty     INT NOT NULL DEFAULT 0,
  opening_value   NUMERIC(14,2) NOT NULL DEFAULT 0,

  -- Populated from stockist sales dump upload
  primary_qty     INT NOT NULL DEFAULT 0,
  primary_value   NUMERIC(14,2) NOT NULL DEFAULT 0,
  sale_rate       NUMERIC(12,4) NOT NULL DEFAULT 0,

  -- Entered ONLY by BE (all other fields are read-only for BE)
  secondary_qty   INT NOT NULL DEFAULT 0,
  secondary_value NUMERIC(14,2) NOT NULL DEFAULT 0,

  -- System-calculated
  closing_qty     INT GENERATED ALWAYS AS (opening_qty + primary_qty - secondary_qty) STORED,
  closing_value   NUMERIC(14,2) NOT NULL DEFAULT 0, -- updated by trigger: closing_qty × sale_rate

  be_submitted    BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(stockist_code, product_code, fiscal_year, month)
);

-- Trigger to auto-calculate closing_value and set updated_at
CREATE OR REPLACE FUNCTION calc_closing_value()
RETURNS TRIGGER AS $$
BEGIN
  NEW.closing_value := (NEW.opening_qty + NEW.primary_qty - NEW.secondary_qty) * NEW.sale_rate;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_closing_value
BEFORE INSERT OR UPDATE ON monthly_stock
FOR EACH ROW EXECUTE FUNCTION calc_closing_value();

-- ============================================================
-- 005_create_forecast_tables.sql
-- ============================================================

CREATE TABLE system_forecast (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stockist_code       VARCHAR(20) NOT NULL REFERENCES stockists(stockist_code),
  product_code        VARCHAR(20) NOT NULL REFERENCES products(product_code),
  fiscal_year         SMALLINT NOT NULL,
  month               SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  m1_sale             NUMERIC(12,2) NOT NULL DEFAULT 0,  -- 3 months ago
  m2_sale             NUMERIC(12,2) NOT NULL DEFAULT 0,  -- 2 months ago
  m3_sale             NUMERIC(12,2) NOT NULL DEFAULT 0,  -- last month
  system_forecast_qty NUMERIC(12,2) GENERATED ALWAYS AS ((m1_sale + m2_sale + m3_sale) / 3.0) STORED,
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stockist_code, product_code, fiscal_year, month)
);

CREATE TABLE manager_forecast (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stockist_code         VARCHAR(20) NOT NULL REFERENCES stockists(stockist_code),
  product_code          VARCHAR(20) NOT NULL REFERENCES products(product_code),
  fiscal_year           SMALLINT NOT NULL,
  month                 SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  manager_forecast_qty  NUMERIC(12,2) NOT NULL,
  entered_by            VARCHAR(20) NOT NULL REFERENCES employees(emp_id),
  entered_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stockist_code, product_code, fiscal_year, month)
);

-- ============================================================
-- 006_create_auth_users_extension.sql
-- ============================================================

CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  emp_id        VARCHAR(20) NOT NULL REFERENCES employees(emp_id),
  role          user_role NOT NULL DEFAULT 'be',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 007_row_level_security.sql
-- ============================================================

ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees             ENABLE ROW LEVEL SECURITY;
ALTER TABLE hqs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stockists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_sales_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_stock         ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_forecast       ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_forecast      ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: get current user's emp_id
CREATE OR REPLACE FUNCTION current_emp_id()
RETURNS VARCHAR AS $$
  SELECT emp_id FROM user_profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: get all emp_ids in current user's hierarchy (self + all reportees recursively)
CREATE OR REPLACE FUNCTION visible_emp_ids()
RETURNS TABLE(emp_id VARCHAR) AS $$
  WITH RECURSIVE tree AS (
    SELECT e.emp_id FROM employees e WHERE e.emp_id = current_emp_id()
    UNION ALL
    SELECT e.emp_id FROM employees e
    INNER JOIN tree t ON e.manager_emp_id = t.emp_id
  )
  SELECT emp_id FROM tree;
$$ LANGUAGE sql SECURITY DEFINER;

-- ADMIN: sees everything
CREATE POLICY admin_all ON sales_transactions
  FOR ALL TO authenticated
  USING (current_user_role() = 'admin');

CREATE POLICY admin_all_stock ON monthly_stock
  FOR ALL TO authenticated
  USING (current_user_role() = 'admin');

CREATE POLICY admin_all_summary ON monthly_sales_summary
  FOR ALL TO authenticated
  USING (current_user_role() = 'admin');

CREATE POLICY admin_all_targets ON targets
  FOR ALL TO authenticated
  USING (current_user_role() = 'admin');

-- MANAGER (and above, excluding admin): sees own hierarchy
CREATE POLICY manager_hierarchy_sales ON sales_transactions
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('asm','rsm','zsm','vp') AND
    emp_id IN (SELECT emp_id FROM visible_emp_ids())
  );

CREATE POLICY manager_hierarchy_stock ON monthly_stock
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('asm','rsm','zsm','vp') AND
    emp_id IN (SELECT emp_id FROM visible_emp_ids())
  );

CREATE POLICY manager_hierarchy_summary ON monthly_sales_summary
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('asm','rsm','zsm','vp') AND
    emp_id IN (SELECT emp_id FROM visible_emp_ids())
  );

-- BE: sees only own records
CREATE POLICY be_own_sales ON sales_transactions
  FOR SELECT TO authenticated
  USING (current_user_role() = 'be' AND emp_id = current_emp_id());

CREATE POLICY be_own_stock ON monthly_stock
  FOR SELECT TO authenticated
  USING (current_user_role() = 'be' AND emp_id = current_emp_id());

-- BE can only UPDATE secondary_qty on their own stock entries (not yet submitted)
CREATE POLICY be_update_secondary ON monthly_stock
  FOR UPDATE TO authenticated
  USING (
    current_user_role() = 'be' AND
    emp_id = current_emp_id() AND
    be_submitted = FALSE
  )
  WITH CHECK (emp_id = current_emp_id());

-- Manager can override forecasts for their team
CREATE POLICY manager_forecast_write ON manager_forecast
  FOR ALL TO authenticated
  USING (
    current_user_role() IN ('asm','rsm','zsm','vp','admin') AND
    entered_by IN (SELECT emp_id FROM visible_emp_ids())
  );

-- ============================================================
-- 008_indexes.sql
-- ============================================================

-- Sales transactions (most queried)
CREATE INDEX idx_sales_hq_month ON sales_transactions(hq_code, fiscal_year, month);
CREATE INDEX idx_sales_emp_month ON sales_transactions(emp_id, fiscal_year, month);
CREATE INDEX idx_sales_product_month ON sales_transactions(product_code, fiscal_year, month);
CREATE INDEX idx_sales_stockist ON sales_transactions(stockist_code);
CREATE INDEX idx_sales_batch ON sales_transactions(upload_batch_id);

-- Monthly summary (dashboard fast-path)
CREATE INDEX idx_summary_hq ON monthly_sales_summary(hq_code, fiscal_year, month);
CREATE INDEX idx_summary_emp ON monthly_sales_summary(emp_id, fiscal_year, month);
CREATE INDEX idx_summary_product ON monthly_sales_summary(product_code, fiscal_year, month);

-- Targets
CREATE INDEX idx_targets_hq ON targets(hq_code, fiscal_year, month);
CREATE INDEX idx_targets_emp ON targets(emp_id, fiscal_year, month);

-- Stock
CREATE INDEX idx_stock_emp_month ON monthly_stock(emp_id, fiscal_year, month);
CREATE INDEX idx_stock_stockist ON monthly_stock(stockist_code, product_code, fiscal_year, month);

-- Hierarchy traversal
CREATE INDEX idx_emp_manager ON employees(manager_emp_id);
CREATE INDEX idx_emp_hq ON employees(primary_hq_code);
