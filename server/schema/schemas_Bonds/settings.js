const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        default: 'شركة نموذجية'
    },
    companyLogo: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: 'المدينة - الشارع - رقم المبنى'
    },
    phone: {
        type: String,
        default: '966555555555+'
    },
    email: {
        type: String,
        default: 'info@example.com'
    },
    currency: {
        type: String,
        default: 'ريال'
    },
    receiptPrefix: {
        type: String,
        default: 'REC-'
    },
    paymentPrefix: {
        type: String,
        default: 'PAY-'
    },
    receiverSignature: {
        type: String,
        default: ''
    },
    accountantSignature: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// There should only be one settings document
settingsSchema.statics.getSettings = async function() {
    const settings = await this.findOne();
    if (settings) {
        return settings;
    }
    return this.create({});
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;