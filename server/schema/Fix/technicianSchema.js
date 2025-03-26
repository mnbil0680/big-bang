const mongoose = require('mongoose');

// Technician Schema
const technicianSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    specialization: [String],
    isAvailable: {
        type: Boolean,
        default: true
    },
    assignments: [{
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        date: Date,
        status: String
    }]
}, {
    timestamps: true
});

const Technician = mongoose.model('Technician', technicianSchema);

module.exports = Technician;