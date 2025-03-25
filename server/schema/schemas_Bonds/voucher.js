const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    type: { type: String, required: true },
    voucherNumber: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    entity: { type: String, required: true },
    amount: { type: String, required: true },
    amountInWords: { type: String, required: true },
    description: { type: String },
    paymentMethod: { type: String },
    checkNumber: { type: String },
    checkDate: { type: String },
    bank: { type: String },
    transferNumber: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('Voucher', voucherSchema);