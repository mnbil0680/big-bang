const mongoose = require('mongoose');
const Voucher = require('./schemas/voucher');
const Settings = require('./schemas/settings');

class Database {
    constructor() {
        this.url = 'mongodb://localhost:27017/bondsSystem';
    }

    connect() {
        mongoose.connect(this.url, {})
        .then(() => {
            console.log('Connected to MongoDB successfully');
        })
        .catch((err) => {
            console.error('Error connecting to MongoDB:', err);
        });
    }

    // Create new voucher
    async addVoucher(voucherData) {
        try {
            const voucher = new Voucher(voucherData);
            const savedVoucher = await voucher.save();
            return { success: true, data: savedVoucher };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get all vouchers or a specific voucher
    async getVouchers(id = null) {
        try {
            if (id) {
                const voucher = await Voucher.findById(id);
                return { success: true, data: voucher };
            } else {
                const vouchers = await Voucher.find().sort({ date: -1 });
                return { success: true, data: vouchers };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Update voucher
    async updateVoucher(id, updateData) {
        try {
            const voucher = await Voucher.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            return { success: true, data: voucher };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Delete voucher
    async deleteVoucher(id) {
        try {
            await Voucher.findByIdAndDelete(id);
            return { success: true, message: 'Voucher deleted successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Search vouchers
    async searchVouchers(query) {
        try {
            const vouchers = await Voucher.find({
                $or: [
                    { voucherNumber: { $regex: query, $options: 'i' } },
                    { entity: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            });
            return { success: true, data: vouchers };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get vouchers by date range
    async getVouchersByDateRange(startDate, endDate) {
        try {
            const vouchers = await Voucher.find({
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ date: -1 });
            return { success: true, data: vouchers };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get settings
    async getSettings() {
        try {
            const settings = await Settings.getSettings();
            return { success: true, data: settings };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Update settings
    async updateSettings(settingsData) {
        try {
            let settings = await Settings.findOne();
            
            if (!settings) {
                // Create settings if they don't exist
                settings = new Settings(settingsData);
            } else {
                // Update existing settings
                Object.keys(settingsData).forEach(key => {
                    settings[key] = settingsData[key];
                });
            }
            
            await settings.save();
            return { success: true, data: settings };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Reset settings to defaults
    async resetSettings() {
        try {
            let settings = await Settings.findOne();
            
            if (settings) {
                await Settings.deleteOne({});
            }
            
            // Create new settings with defaults
            settings = await Settings.getSettings();
            return { success: true, data: settings };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = Database;