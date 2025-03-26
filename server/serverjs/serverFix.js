//////////////////////////////////////////////////////////////////////////
// Order Routes


app.post('/orders', async (req, res) => {
    try {
        // Input validation
        if (!req.body || !req.body.items || !Array.isArray(req.body.items)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order data. Items array is required'
            });
        }

        // Validate items array
        if (req.body.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Order must contain at least one item'
            });
        }

        let result;
        try {
            // Try with transaction first
            result = await db.createOrderWithTransaction(req.body);
        } catch (transactionError) {
            if (transactionError.message.includes('Transaction')) {
                // Fallback to non-transaction operation
                result = await db.createOrder(req.body);
            } else {
                throw transactionError;
            }
        }
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        return res.status(201).json({
            success: true,
            data: result.data,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error creating order. Please try again later.'
        });
    }
});

app.get('/orders', async (req, res) => {
    try {
        // Sanitize query parameters
        const filter = req.query || {};
        
        // Get orders with optional cache
        const result = await db.getOrders(filter, true);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            count: result.data.length,
            message: 'Orders retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({
            success: false,
            error: 'Error retrieving orders. Please try again later.'
        });
    }
});

app.get('/orders/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
        }

        const result = await db.getOrderById(req.params.id);
        
        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: result.error || 'Order not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: 'Order retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching order:', error);
        return res.status(500).json({
            success: false,
            error: 'Error retrieving order. Please try again later.'
        });
    }
});

app.put('/orders/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Update data is required'
            });
        }

        const result = await db.updateOrder(req.params.id, req.body);
        
        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: result.error || 'Order not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: 'Order updated successfully'
        });

    } catch (error) {
        console.error('Error updating order:', error);
        return res.status(500).json({
            success: false,
            error: 'Error updating order. Please try again later.'
        });
    }
});

app.delete('/orders/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
        }

        const result = await db.deleteOrder(req.params.id);
        
        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: result.error || 'Order not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Order deleted successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Error deleting order:', error);
        return res.status(500).json({
            success: false,
            error: 'Error deleting order. Please try again later.'
        });
    }
});

//////////////////////////////////////////////////////////

// Technician Routes
app.post('/technicians', async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Technician data is required'
            });
        }

        // Use non-transaction operation directly
        const result = await db.addTechnician(req.body);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        return res.status(201).json({
            success: true,
            data: result.data,
            message: 'Technician created successfully'
        });

    } catch (error) {
        console.error('Error creating technician:', error);
        return res.status(500).json({
            success: false,
            error: 'Error creating technician. Please try again later.'
        });
    }
});

app.get('/technicians', async (req, res) => {
    try {
        const filter = req.query || {};
        const result = await db.getTechnicians(filter);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            count: result.data.length,
            message: 'Technicians retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching technicians:', error);
        return res.status(500).json({
            success: false,
            error: 'Error retrieving technicians. Please try again later.'
        });
    }
});

app.get('/technicians/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                error: 'Technician ID is required'
            });
        }

        const result = await db.getTechnicianById(req.params.id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: result.error || 'Technician not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: 'Technician retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching technician:', error);
        return res.status(500).json({
            success: false,
            error: 'Error retrieving technician. Please try again later.'
        });
    }
});

app.put('/technicians/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                error: 'Technician ID is required'
            });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Update data is required'
            });
        }

        const result = await db.updateTechnician(req.params.id, req.body);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: result.error || 'Technician not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            message: 'Technician updated successfully'
        });

    } catch (error) {
        console.error('Error updating technician:', error);
        return res.status(500).json({
            success: false,
            error: 'Error updating technician. Please try again later.'
        });
    }
});

app.delete('/technicians/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                error: 'Technician ID is required'
            });
        }

        const result = await db.deleteTechnician(req.params.id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: result.error || 'Technician not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Technician deleted successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Error deleting technician:', error);
        return res.status(500).json({
            success: false,
            error: 'Error deleting technician. Please try again later.'
        });
    }
});

