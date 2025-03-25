require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const Database = require('./Database');
const db = new Database();

app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));

// GET all vouchers
app.get('/vouchers', async (req, res) => {
    try {
        const result = await db.getVouchers();
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET single voucher by ID
app.get('/vouchers/:id', async (req, res) => {
    try {
        const result = await db.getVouchers(req.params.id);
        if (result.success && result.data) {
            res.json(result.data);
        } else {
            res.status(404).json({ error: 'Voucher not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST new voucher
app.post('/vouchers', async (req, res) => {
    try {
        const result = await db.addVoucher(req.body);
        if (result.success) {
            res.status(201).json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update voucher
app.put('/vouchers/:id', async (req, res) => {
    try {
        const result = await db.updateVoucher(req.params.id, req.body);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE voucher
app.delete('/vouchers/:id', async (req, res) => {
    try {
        const result = await db.deleteVoucher(req.params.id);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Search vouchers
app.get('/vouchers/search/:query', async (req, res) => {
    try {
        const result = await db.searchVouchers(req.params.query);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET vouchers by date range
app.get('/vouchers/date-range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const result = await db.getVouchersByDateRange(startDate, endDate);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

///////////////////////////////////////////////////////////////

// GET settings
app.get('/settings', async (req, res) => {
    try {
        const result = await db.getSettings();
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST settings
app.post('/settings', async (req, res) => {
    try {
        const result = await db.updateSettings(req.body);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT settings - alternative endpoint for updating settings
app.put('/settings', async (req, res) => {
    try {
        const result = await db.updateSettings(req.body);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset settings to defaults
app.post('/settings/reset', async (req, res) => {
    try {
        const result = await db.resetSettings();
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server has started on port ${port}...`);
    db.connect();
}); // Start the server on port 3000