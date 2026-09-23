CREATE TABLE market_listings (
    id BIGSERIAL PRIMARY KEY,

    seller_villager_id INTEGER NOT NULL
        REFERENCES villagers(id),

    warehouse_id INTEGER NOT NULL
        REFERENCES warehouses(id),

    product_id INTEGER NOT NULL
        REFERENCES products(id),

    quantity_available NUMERIC(14,3) NOT NULL
        CHECK (quantity_available >= 0),

    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price > 0),

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'sold_out', 'cancelled')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );


    CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,

    listing_id BIGINT NOT NULL
        REFERENCES market_listings(id),

    buyer_villager_id INTEGER NOT NULL
        REFERENCES villagers(id),

    quantity NUMERIC(14,3) NOT NULL
        CHECK (quantity > 0),

    total_amount NUMERIC(12,2) NOT NULL
        CHECK (total_amount >= 0),

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );


    CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL UNIQUE
        REFERENCES orders(id),

    payer_villager_id INTEGER NOT NULL
        REFERENCES villagers(id),

    payee_villager_id INTEGER NOT NULL
        REFERENCES villagers(id),

    amount NUMERIC(12,2) NOT NULL
        CHECK (amount > 0),

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
    );


    CREATE TABLE money_movements (
    id BIGSERIAL PRIMARY KEY,

    villager_id INTEGER NOT NULL
        REFERENCES villagers(id),

    payment_id BIGINT REFERENCES payments(id),

    amount_delta NUMERIC(12,2) NOT NULL
        CHECK (amount_delta <> 0),

    movement_type TEXT NOT NULL
        CHECK (
        movement_type IN (
            'purchase',
            'sale',
            'refund',
            'adjustment'
        )
        ),

    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);