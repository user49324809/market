BEGIN;

ALTER TABLE money_movements
DROP CONSTRAINT money_movements_movement_type_check;

ALTER TABLE money_movements
ADD CONSTRAINT money_movements_movement_type_check
CHECK (
    movement_type IN (
        'opening_balance',
        'purchase',
        'sale',
        'refund',
        'adjustment'
    )
);

INSERT INTO money_movements (
    villager_id,
    amount_delta,
    movement_type
)
SELECT
    v.id,
    seed.amount,
    'opening_balance'
FROM (
    VALUES
        ('Глаша', 5000.00),
        ('Зина', 4200.00),
        ('Даша', 3500.00),
        ('Петров', 6000.00)
) AS seed(villager_name, amount)
JOIN villagers v
    ON v.name = seed.villager_name;

COMMIT;