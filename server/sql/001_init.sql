BEGIN;

CREATE TABLE villagers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    owner_villager_id INTEGER
        REFERENCES villagers(id),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_villager_id, name)
);

CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL
        REFERENCES warehouses(id),
    product_id INTEGER NOT NULL
        REFERENCES products(id),
    villager_id INTEGER
        REFERENCES villagers(id),
    quantity_delta NUMERIC(14,3) NOT NULL
        CHECK (quantity_delta <> 0),
    movement_type TEXT NOT NULL
        CHECK (
            movement_type IN (
                'initial_stock',
                'purchase',
                'sale',
                'transfer_in',
                'transfer_out',
                'adjustment'
            )
        ),
    source_type TEXT,
    source_id BIGINT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (source_type IS NULL AND source_id IS NULL)
        OR (source_type IS NOT NULL AND source_id IS NOT NULL)
    )
);

CREATE INDEX idx_stock_movements_warehouse_product
    ON stock_movements (warehouse_id, product_id);

CREATE INDEX idx_stock_movements_occurred_at
    ON stock_movements (occurred_at);

CREATE INDEX idx_stock_movements_villager
    ON stock_movements (villager_id);

COMMIT;
