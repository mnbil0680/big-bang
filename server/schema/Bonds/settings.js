const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        default: 'شركة نموذجية',
        required: true,
        trim: true
    },
    companyLogo: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: 'المدينة - الشارع - رقم المبنى',
        trim: true
    },
    phone: {
        type: String,
        default: '966555555555+',
        match: [/^\+?([0-9]{1,4})?[-. ]?([0-9]{10})$/, 'Please enter a valid phone number']
    },
    email: {
        type: String,
        default: 'info@example.com',
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        lowercase: true,
        trim: true
    },
    currency: {
        type: String,
        default: 'ريال سعودي',
        enum: ['ريال سعودي', 'درهم إماراتي', 'دينار كويتي', 'دولار أمريكي', 'يورو']
    },
    receiptPrefix: {
        type: String,
        default: 'REC-',
        uppercase: true,
        trim: true
    },
    paymentPrefix: {
        type: String,
        default: 'PAY-',
        uppercase: true,
        trim: true
    },
    receiverSignature: {
        type: String,
        default: ''
    },
    accountantSignature: {
        type: String,
        default: ''
    },
    taxRate: {
        type: Number,
        default: 15,
        min: 0,
        max: 100
    },
    fiscalYearStart: {
        type: Date,
        default: new Date(new Date().getFullYear(), 0, 1) // January 1st of current year
    }
}, { 
    timestamps: true,
    collection: 'bonds_settings' 
});

// Static method to ensure single settings document
settingsSchema.statics.getSettings = async function() {
    const settings = await this.findOne();
    if (settings) {
        return settings;
    }
    return this.create({});
};

// Instance method to format phone number
settingsSchema.methods.formatPhone = function() {
    return this.phone.replace(/[^\d+]/g, '');
};

// Add to static methods
settingsSchema.statics.generateDefaults = function() {
    const currentYear = new Date().getFullYear();
    
    return {
        companyName: 'شركة نموذجية',
        companyLogo: '',
        address: 'المدينة - الشارع - رقم المبنى',
        phone: '966555555555+',
        email: 'info@example.com',
        currency: 'ريال سعودي',
        receiptPrefix: 'REC-',
        paymentPrefix: 'PAY-',
        receiverSignature: '',
        accountantSignature: '',
        taxRate: 15,
        fiscalYearStart: new Date(currentYear, 0, 1), // January 1st
        __v: 0
    };
};
const Settings = mongoose.model('BondsSettings', settingsSchema);
module.exports = Settings;