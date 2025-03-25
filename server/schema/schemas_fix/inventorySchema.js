const mongoose = require('mongoose');

// Inventory Schema
const inventorySchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    category: String,
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: String,
    price: {
        type: Number,
        required: true,
        min: 0
    },
    movements: [{
        date: Date,
        type: {
            type: String,
            enum: ['in', 'out']
        },
        quantity: Number,
        userId: String,
        notes: String
    }]
}, {
    timestamps: true
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;