BEGIN;

INSERT INTO villagers (name)
VALUES
    ('Глаша'),
    ('Зина'),
    ('Даша'),
    ('Петров');

INSERT INTO products (name, code, unit)
VALUES
    ('Свёкла', 'beets', 'kg'),
    ('Груши', 'pears', 'pcs'),
    ('Картофель', 'potatoes', 'kg'),
    ('Яблоки', 'apples', 'pcs'),
    ('Орехи', 'nuts', 'g'),
    ('Мёд', 'honey', 'jar');

INSERT INTO warehouses (name, owner_villager_id)
SELECT 'Склад Глаши', id
FROM villagers
WHERE name = 'Глаша';

INSERT INTO warehouses (name, owner_villager_id)
SELECT 'Склад Зины', id
FROM villagers
WHERE name = 'Зина';

INSERT INTO warehouses (name, owner_villager_id)
SELECT 'Склад Даши', id
FROM villagers
WHERE name = 'Даша';

INSERT INTO warehouses (name, owner_villager_id)
SELECT 'Склад Петрова', id
FROM villagers
WHERE name = 'Петров';

INSERT INTO stock_movements (
    warehouse_id,
    product_id,
    villager_id,
    quantity_delta,
    movement_type
)
SELECT
    w.id,
    p.id,
    v.id,
    seed.quantity,
    'initial_stock'
FROM (
    VALUES
        ('Глаша', 'beets', 500),
        ('Глаша', 'pears', 40),
        ('Зина', 'potatoes', 800),
        ('Зина', 'apples', 70),
        ('Даша', 'nuts', 2000),
        ('Петров', 'honey', 50)
) AS seed(villager_name, product_code, quantity)
JOIN villagers v
    ON v.name = seed.villager_name
JOIN warehouses w
    ON w.owner_villager_id = v.id
JOIN products p
    ON p.code = seed.product_code;

COMMIT;