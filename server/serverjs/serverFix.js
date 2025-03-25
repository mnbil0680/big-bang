require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('./database');
const db = new Database();

const app = express();


// Middleware
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));

// Notifications endpoint
app.get('/notifications', async (req, res) => {
    try {
        // Simulated notifications data
        const notifications = [
            {
                id: 1,
                message: 'طلب صيانة جديد',
                type: 'primary',
                icon: 'bi-tools',
                date: new Date()
            },
            {
                id: 2,
                message: 'تم إكمال طلب التركيب',
                type: 'success',
                icon: 'bi-check-circle',
                date: new Date()
            }
        ];
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
};

///////////////////////////////////////////////////////////////////////
// Customer Routes //
////////////////////

app.post('/customers', async (req, res) => {
    try {
        const result = await db.addCustomer(req.body);
        if (result.success) {
            res.status(201).json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/customers', (req, res) => {
    db.getCustomers().then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send(err);
    });
});

app.get('/customers/:id', async (req, res) => {
    try {
        const customer = await db.getCustomerById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/customers/:id', async (req, res) => {
    try {
        const updatedCustomer = await db.updateCustomer(req.params.id, req.body);
        if (!updatedCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/customers/:id', async (req, res) => {
    try {
        const deletedCustomer = await db.deleteCustomer(req.params.id);
        if (!deletedCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

//////////////////////////////////////////////////////////////////////////////////
// Inventory Routes

app.post('/inventory', async (req, res) => {
    try {
        const result = await db.addInventoryItem(req.body);
        if (result.success) {
            res.status(201).json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});


app.get('/inventory', (req, res) => {
    db.getInventoryItems().then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send(err);
    });
});

app.get('/inventory/:id', async (req, res) => {
    try {
        const item = await db.getInventoryItemById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/inventory/:id', async (req, res) => {
    try {
        const updatedItem = await db.updateInventoryItem(req.params.id, req.body);
        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/inventory/:id', async (req, res) => {
    try {
        const deletedItem = await db.deleteInventoryItem(req.params.id);
        if (!deletedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

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

// Apply error handler
app.use(errorHandler);

// Start server


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server has started on port ${port}...`);
    db.connect();
}); // Start the server on port 3000