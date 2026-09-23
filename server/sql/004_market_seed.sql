BEGIN;

INSERT INTO market_listings (
    seller_villager_id,
    warehouse_id,
    product_id,
    quantity_available,
    unit_price
)
SELECT
    v.id,
    w.id,
    p.id,
    20,
    300
FROM villagers v
JOIN warehouses w
    ON w.owner_villager_id = v.id
JOIN products p
    ON p.code = 'honey'
WHERE v.name = 'Петров';

COMMIT;