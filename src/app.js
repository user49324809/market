import express from 'express';
import { pool } from './db.js';

const app = express();
app.use(express.json());
app.get('/api/villagers', async(req, res) => {
    try{
        const result = await pool.query(
            'SELECT id, name FROM villagers ORDER BY id'
        );
        res.json(result.rows);
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Database error'});
    }
});

app.get('/api/market/listings', async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            ml.id,
            v.name AS seller,
            p.name AS product,
            p.unit,
            ml.quantity_available::double precision AS quantity,
            ml.unit_price::double precision AS "unitPrice",
            ml.status,
            w.name AS warehouse
        FROM market_listings ml
        JOIN villagers v
            ON v.id = ml.seller_villager_id
        JOIN products p
            ON p.id = ml.product_id
        JOIN warehouses w
            ON w.id = ml.warehouse_id
        ORDER BY ml.id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/orders', async (req, res) => {
    const { listingId, buyerVillagerId, quantity } = req.body;

    const numericQuantity = Number(quantity);

    if (
        !Number.isInteger(Number(listingId)) ||
        !Number.isInteger(Number(buyerVillagerId)) ||
        !Number.isFinite(numericQuantity) ||
        numericQuantity <= 0
    ) {
        return res.status(400).json({
            error: 'Invalid order data',
        });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO orders (
                listing_id,
                buyer_villager_id,
                quantity,
                total_amount,
                status
            )
            SELECT
                ml.id,
                $2,
                $3,
                ml.unit_price * $3,
                'pending'
            FROM market_listings ml
            WHERE ml.id = $1
                AND ml.status = 'active'
                AND ml.quantity_available >= $3
                AND ml.seller_villager_id <> $2
            RETURNING
                id,
                listing_id AS "listingId",
                buyer_villager_id AS "buyerVillagerId",
                quantity::double precision AS quantity,
                total_amount::double precision AS "totalAmount",
                status,
                created_at AS "createdAt"
            `,
            [listingId, buyerVillagerId, numericQuantity]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({
                error: 'Listing unavailable or quantity is invalid',
            });
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Buyer does not exist',
            });
        }

        res.status(500).json({
            error: 'Database error',
        });
    }
});

app.post('/api/orders/:id/pay', async (req, res) => {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({
            error: 'Invalid order id',
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `
            SELECT
                o.id,
                o.status AS order_status,
                o.buyer_villager_id,
                o.quantity,
                o.total_amount,

                ml.id AS listing_id,
                ml.seller_villager_id,
                ml.warehouse_id AS seller_warehouse_id,
                ml.product_id,
                ml.quantity_available,
                ml.status AS listing_status
            FROM orders o
            JOIN market_listings ml
                ON ml.id = o.listing_id
            WHERE o.id = $1
            FOR UPDATE OF o, ml
            `,
            [orderId]
        );

        if (orderResult.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Order not found',
            });
        }

        const order = orderResult.rows[0];

        if (order.order_status !== 'pending') {
            await client.query('ROLLBACK');

            return res.status(400).json({
                error: 'Order is not pending',
            });
        }

        if (order.listing_status !== 'active') {
            await client.query('ROLLBACK');

            return res.status(400).json({
                error: 'Listing is not active',
            });
        }

        if (
            Number(order.quantity_available) <
            Number(order.quantity)
        ) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                error: 'Not enough quantity in listing',
            });
        }

        const buyerResult = await client.query(
            `
            SELECT id, status
            FROM villagers
            WHERE id = $1
            FOR UPDATE
            `,
            [order.buyer_villager_id]
        );

        if (
            buyerResult.rowCount === 0 ||
            buyerResult.rows[0].status !== 'active'
        ) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                error: 'Buyer is unavailable',
            });
        }

        await client.query(
            `
            SELECT id
            FROM warehouses
            WHERE id = $1
            FOR UPDATE
            `,
            [order.seller_warehouse_id]
        );

        const stockResult = await client.query(
            `
            SELECT COALESCE(SUM(quantity_delta), 0) AS stock
            FROM stock_movements
            WHERE warehouse_id = $1
                AND product_id = $2
            `,
            [
                order.seller_warehouse_id,
                order.product_id,
            ]
        );

        if (
            Number(stockResult.rows[0].stock) <
            Number(order.quantity)
        ) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                error: 'Seller does not have enough stock',
            });
        }
        const buyerWarehouseResult = await client.query(
            `
            SELECT id
            FROM warehouses
            WHERE owner_villager_id = $1
                AND status = 'active'
            ORDER BY id
            LIMIT 1
            FOR UPDATE
            `,
            [order.buyer_villager_id]
        );

        if (buyerWarehouseResult.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                error: 'Buyer has no active warehouse',
            });
        }

        const buyerWarehouseId =
            buyerWarehouseResult.rows[0].id;
        const balanceResult = await client.query(
            `
            SELECT
                COALESCE(SUM(amount_delta), 0) AS balance
            FROM money_movements
            WHERE villager_id = $1
            `,
            [order.buyer_villager_id]
        );

        const balance = Number(
            balanceResult.rows[0].balance
        );

        const amount = Number(order.total_amount);

        if (balance < amount) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                error: 'Insufficient funds',
            });
        }

        const paymentResult = await client.query(
            `
            INSERT INTO payments (
                order_id,
                payer_villager_id,
                payee_villager_id,
                amount,
                status,
                completed_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                'completed',
                NOW()
            )
            RETURNING id
            `,
            [
                order.id,
                order.buyer_villager_id,
                order.seller_villager_id,
                order.total_amount,
            ]
        );

        const paymentId = paymentResult.rows[0].id;
        await client.query(
            `
            INSERT INTO money_movements (
                villager_id,
                payment_id,
                amount_delta,
                movement_type
            )
            VALUES
                ($1, $3, -$4::numeric, 'purchase'),
                ($2, $3, $4::numeric, 'sale')
            `,
            [
                order.buyer_villager_id,
                order.seller_villager_id,
                paymentId,
                order.total_amount,
            ]
        );

        await client.query(
            `
            INSERT INTO stock_movements (
                warehouse_id,
                product_id,
                villager_id,
                quantity_delta,
                movement_type,
                source_type,
                source_id
            )
            VALUES
                (
                    $1,
                    $3,
                    $4,
                    -$5::numeric,
                    'sale',
                    'order',
                    $6
                ),
                (
                    $2,
                    $3,
                    $7,
                    $5::numeric,
                    'purchase',
                    'order',
                    $6
                )
            `,
            [
                order.seller_warehouse_id,
                buyerWarehouseId,
                order.product_id,
                order.seller_villager_id,
                order.quantity,
                order.id,
                order.buyer_villager_id,
            ]
        );

        const listingResult = await client.query(
            `
            UPDATE market_listings
            SET
                quantity_available =
                    quantity_available - $2::numeric,

                status = CASE
                    WHEN quantity_available - $2::numeric = 0
                        THEN 'sold_out'
                    ELSE 'active'
                END
            WHERE id = $1
            RETURNING
                quantity_available::double precision
                    AS "remainingQuantity",
                status
            `,
            [
                order.listing_id,
                order.quantity,
            ]
        );

        await client.query(
            `
            UPDATE orders
            SET status = 'paid'
            WHERE id = $1
            `,
            [order.id]
        );

        await client.query('COMMIT');

        res.json({
            orderId: order.id,
            paymentId,
            status: 'paid',
            amount,
            remainingQuantity:
                listingResult.rows[0].remainingQuantity,
        });

    } catch (error) {
        await client.query('ROLLBACK');

        console.error(error);

        res.status(500).json({
            error: 'Payment transaction failed',
        });
    } finally {
        client.release();
    }
});

app.get('/api/villagers/:id/balance', async (req, res) => {
    const villagerId = Number(req.params.id);

    if (!Number.isInteger(villagerId) || villagerId <= 0) {
        return res.status(400).json({
            error: 'Invalid villager id',
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT
                v.id,
                v.name,
                COALESCE(
                    SUM(mm.amount_delta),
                    0
                )::double precision AS balance
            FROM villagers v
            LEFT JOIN money_movements mm
                ON mm.villager_id = v.id
            WHERE v.id = $1
            GROUP BY v.id, v.name
            `,
            [villagerId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Villager not found',
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Database error',
        });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server started');
})