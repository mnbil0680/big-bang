const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true,
        enum: ['قبض', 'صرف'],
        trim: true
    },
    voucherNumber: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    date: { 
        type: Date, 
        required: true,
        default: Date.now 
    },
    entity: { 
        type: String, 
        required: true,
        trim: true
    },
    amount: { 
        type: Number, 
        required: true,
        min: 0
    },
    amountInWords: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String,
        trim: true
    },
    paymentMethod: { 
        type: String,
        enum: ['نقداً', 'شيك', 'تحويل بنكي', 'بطاقة ائتمان'],
        required: true,
        trim: true
    },
    checkNumber: { 
        type: String,
        trim: true,
        required: function() { return this.paymentMethod === 'شيك'; }
    },
    checkDate: { 
        type: Date,
        required: function() { return this.paymentMethod === 'شيك'; }
    },
    bank: { 
        type: String,
        trim: true,
        required: function() { 
            return ['شيك', 'تحويل بنكي'].includes(this.paymentMethod); 
        }
    },
    transferNumber: { 
        type: String,
        trim: true,
        required: function() { return this.paymentMethod === 'تحويل بنكي'; }
    }
}, {
    timestamps: true,
    collection: 'bonds_vouchers'
});





module.exports =  mongoose.model('Voucher', voucherSchema);