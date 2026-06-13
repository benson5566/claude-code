-- ============================================================
-- 保養品資料圖書庫 Database Schema
-- ============================================================

-- 成分 (Ingredients)
CREATE TABLE IF NOT EXISTS ingredients (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    inci_name   VARCHAR(200),
    alias       TEXT[],
    category    VARCHAR(100),                          -- 類別: 保濕劑/乳化劑/防腐劑/功效成分...
    description TEXT,
    benefits    TEXT[],
    concerns    TEXT[],
    ph_min      NUMERIC(4,2),
    ph_max      NUMERIC(4,2),
    max_safe_concentration NUMERIC(6,3),              -- 最大安全濃度 (%)
    eu_regulated BOOLEAN DEFAULT FALSE,
    comedogenic_rating SMALLINT CHECK (comedogenic_rating BETWEEN 0 AND 5),
    irritation_risk VARCHAR(20) CHECK (irritation_risk IN ('low','moderate','high')),
    origin      VARCHAR(50),                          -- 來源: 天然/合成/半合成
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 膚質 (Skin Types)
CREATE TABLE IF NOT EXISTS skin_types (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,         -- 乾性/油性/混合性/敏感性/正常
    description TEXT,
    characteristics TEXT[],
    common_concerns TEXT[]
);

-- 保養方式 (Care Methods)
CREATE TABLE IF NOT EXISTS care_methods (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    category    VARCHAR(100),                         -- 清潔/化妝水/精華/乳液/防曬...
    description TEXT,
    steps       JSONB,                                -- [{step:1, action:"...", duration:"..."}]
    frequency   VARCHAR(100),                         -- 每日/每週/每月
    time_of_day VARCHAR(50) CHECK (time_of_day IN ('morning','evening','both','anytime')),
    target_concerns TEXT[],
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 研究 (Research Papers)
CREATE TABLE IF NOT EXISTS research (
    id              SERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    authors         TEXT[],
    journal         VARCHAR(300),
    publication_date DATE,
    doi             VARCHAR(200),
    url             TEXT,
    abstract        TEXT,
    key_findings    TEXT[],
    study_type      VARCHAR(100),                     -- 臨床試驗/體外實驗/動物實驗/回顧研究
    evidence_level  SMALLINT CHECK (evidence_level BETWEEN 1 AND 5),  -- 1=最弱 5=最強
    tags            TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 環境影響 (Environmental Impact)
CREATE TABLE IF NOT EXISTS environmental_profiles (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(200) NOT NULL UNIQUE,
    biodegradability    VARCHAR(50) CHECK (biodegradability IN ('readily','inherently','poorly','not')),
    ecotoxicity_risk    VARCHAR(20) CHECK (ecotoxicity_risk IN ('low','moderate','high','unknown')),
    packaging_type      VARCHAR(100),
    packaging_material  TEXT[],
    is_cruelty_free     BOOLEAN,
    is_vegan            BOOLEAN,
    is_reef_safe        BOOLEAN,
    certifications      TEXT[],
    carbon_footprint    VARCHAR(100),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 品牌 (Brands)
CREATE TABLE IF NOT EXISTS brands (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    country     VARCHAR(100),
    website     TEXT,
    cruelty_free BOOLEAN,
    vegan       BOOLEAN,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 產品 (Products) — 核心表
CREATE TABLE IF NOT EXISTS products (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(300) NOT NULL,
    brand_id            INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    product_type        VARCHAR(100),                 -- 洗面乳/化妝水/精華液/乳液/面霜/防曬...
    description         TEXT,
    texture             VARCHAR(100),                 -- 乳霜/凝膠/精華液/油/泡沫...
    volume_ml           NUMERIC(8,2),
    price_twd           INTEGER,
    price_usd           NUMERIC(8,2),
    shelf_life_months   SMALLINT,
    pao_months          SMALLINT,                     -- 開封後使用期限 (Period After Opening)
    spf                 SMALLINT,
    pa_rating           VARCHAR(10),
    barcode             VARCHAR(50),
    image_url           TEXT,
    purchase_url        TEXT,
    is_discontinued     BOOLEAN DEFAULT FALSE,
    env_profile_id      INTEGER REFERENCES environmental_profiles(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 產品成分關聯 (Product ↔ Ingredients)
CREATE TABLE IF NOT EXISTS product_ingredients (
    product_id      INTEGER REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id   INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    position        SMALLINT,                         -- 成分表排列順序
    role            VARCHAR(100),                     -- 功效成分/基質/防腐劑/香料...
    concentration   NUMERIC(6,3),                     -- 已知濃度 (%)
    PRIMARY KEY (product_id, ingredient_id)
);

-- 產品適合膚質關聯 (Product ↔ Skin Types)
CREATE TABLE IF NOT EXISTS product_skin_types (
    product_id      INTEGER REFERENCES products(id) ON DELETE CASCADE,
    skin_type_id    INTEGER REFERENCES skin_types(id) ON DELETE CASCADE,
    suitability     VARCHAR(20) CHECK (suitability IN ('excellent','good','neutral','poor','avoid')),
    notes           TEXT,
    PRIMARY KEY (product_id, skin_type_id)
);

-- 產品保養方式關聯 (Product ↔ Care Methods)
CREATE TABLE IF NOT EXISTS product_care_methods (
    product_id      INTEGER REFERENCES products(id) ON DELETE CASCADE,
    method_id       INTEGER REFERENCES care_methods(id) ON DELETE CASCADE,
    sequence        SMALLINT,
    notes           TEXT,
    PRIMARY KEY (product_id, method_id)
);

-- 成分研究關聯 (Ingredients ↔ Research)
CREATE TABLE IF NOT EXISTS ingredient_research (
    ingredient_id   INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    research_id     INTEGER REFERENCES research(id) ON DELETE CASCADE,
    relevance_notes TEXT,
    PRIMARY KEY (ingredient_id, research_id)
);

-- 使用者評論 (Reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER REFERENCES products(id) ON DELETE CASCADE,
    skin_type_id    INTEGER REFERENCES skin_types(id) ON DELETE SET NULL,
    rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
    title           VARCHAR(300),
    content         TEXT,
    pros            TEXT[],
    cons            TEXT[],
    repurchase      BOOLEAN,
    reviewer_name   VARCHAR(100),
    verified        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_ingredients_inci ON ingredients(inci_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_research_date ON research(publication_date);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient ON product_ingredients(ingredient_id);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
