const mongoose = require('mongoose');

// Bonds
const Voucher = require('./schema/Bonds/voucher');
const Settings = require('./schema/Bonds/settings');

// Fix
const Customer = require('./schema/Fix/customerSchema');
const Inventory = require('./schema/Fix/inventorySchema');
// const Order = require('./models/orderSchema');
// const Technician = require('./models/technicianSchema');

// // Price
// const Client = require("./schema/clientSchema");
// const Product = require("./schema/productSchema");
// const Currency = require("./schema/currencySchema");
// const Rule = require("./schema/rulesSchema");
// const Show = require("./schema/showSchema");


class Database {
// In the Database class constructor
constructor() {
  // Fix URL configuration
  this.Url = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bondsSystem';
  this.connectionConfig = {
      serverSelectionTimeoutMS: 5000
  };
}

// In the connect method
connect() {
    mongoose.connect(this.Url, {}).then(() => {
        console.log("Database Connected Successfully");
    }).catch((err) => {
        console.log("Error in Database Connection", err);
    });
}

addVoucher(voucher) {
    return new Promise((resolve, reject) => {
        Voucher["createdDate"] = new Date();
        Voucher["updatedDate"] = new Date();
        let newVoucher = new Voucher(voucher); // Create a new note object
        newVoucher.save().then(doc => {
            resolve(doc);
        }).catch(err => {
            reject(err);
        });
    });
}

getVouchers() {
    return new Promise((resolve, reject) => {
        Voucher.find().then(data => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
}

getVoucherById(id) {
    return new Promise((resolve, reject) => {
        Voucher.findById(id).then(data => {
            if (!data) {
                console.log(`Voucher not found: ${id}`);
                reject(`Voucher not found: ${id}`);
            }
            console.log("Voucher retrieved successfully:", data);
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
}

updateVoucher(voucher) {
    return new Promise((resolve, reject) => {
        voucher["updatedDate"] = new Date();
        Voucher.findByIdAndUpdate(voucher["_id"], voucher, { new: true })
            .then(data => {
                console.log("Voucher updated successfully:", data);
                resolve(data);
            }).catch(err => {
                reject(err);
            });
    });
}

getVouchersByStatus(status) {
    return new Promise((resolve, reject) => {
        Voucher.find({ status })
            .then(data => {
                console.log(`Vouchers found with status ${status}:`, data);
                resolve(data);
            }).catch(err => {
                reject(err);
            });
    });
}

getVoucherByCode(code) {
    return new Promise((resolve, reject) => {
        Voucher.findOne({ voucherNumber: code })
            .then(data => {
                if (!data) {
                    console.log(`Voucher not found with code: ${code}`);
                    reject(`Voucher not found with code: ${code}`);
                }
                console.log("Voucher retrieved successfully:", data);
                resolve(data);
            }).catch(err => {
                reject(err);
            });
    });
}

deleteVoucher(id) {
    return new Promise((resolve, reject) => {
        Voucher.findByIdAndDelete(id)
            .then(data => {
                if (!data) {
                    console.log(`Voucher not found: ${id}`);
                    reject(`Voucher not found: ${id}`);
                }
                console.log("Voucher deleted successfully:", data);
                resolve(data);
            }).catch(err => {
                reject(err);
            });
    });
}

searchVouchers(query) {
    return new Promise((resolve, reject) => {
        Voucher.find({
            $or: [
                { voucherNumber: { $regex: query, $options: 'i' } },
                { entity: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        })
        .then(data => {
            console.log(`Found ${data.length} vouchers matching query: ${query}`);
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
}
  
getVouchersByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start) || isNaN(end)) {
            reject('Invalid date format');
            return;
        }

        if (start > end) {
            reject('Start date must be before end date');
            return;
        }

        Voucher.find({
            date: { $gte: start, $lte: end }
        })
        .sort({ date: -1 })
        .then(data => {
            console.log(`Found ${data.length} vouchers between ${start.toISOString().split('T')[0]} and ${end.toISOString().split('T')[0]}`);
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
}
///////////////////////////////////

getSettings() {
    return new Promise((resolve, reject) => {
        Settings.findOne()
            .then(data => {
                if (!data) {
                    console.log('Settings not found');
                    reject('Settings not found');
                }
                console.log('Settings retrieved successfully:', data);
                resolve(data);
            })
            .catch(err => {
                console.error('Error retrieving settings:', err);
                reject(err);
            });
    });
}

updateSettings(settingsData) {
    return new Promise((resolve, reject) => {
        if (!settingsData || Object.keys(settingsData).length === 0) {
            reject('Settings data is required');
            return;
        }

        Settings.findOneAndUpdate(
            {},
            { $set: settingsData },
            { 
                upsert: true,
                new: true,
                runValidators: true
            }
        )
        .then(data => {
            console.log('Settings updated successfully:', data);
            resolve(data);
        })
        .catch(err => {
            console.error('Error updating settings:', err);
            reject(err);
        });
    });
}

resetSettings() {
    return new Promise((resolve, reject) => {
        Settings.deleteMany({})
            .then(() => {
                return Settings.create(Settings.generateDefaults());
            })
            .then(data => {
                console.log('Settings reset to defaults successfully:', data);
                resolve(data);
            })
            .catch(err => {
                console.error('Error resetting settings:', err);
                reject(err);
            });
    });
}

///////////////////////////////////////

addCustomer(customerData) {
    return new Promise((resolve, reject) => {
        customerData["createdDate"] = new Date();
        customerData["updatedDate"] = new Date();
        let newCustomer = new Customer(customerData);
        newCustomer.save()
            .then(data => {
                console.log("Customer added successfully:", data);
                resolve(data);
            })
            .catch(err => {
                console.error("Error adding customer:", err);
                reject(err);
            });
    });
}

getCustomers() {
    return new Promise((resolve, reject) => {
        Customer.find()
            .then(data => {
                console.log(`Found ${data.length} customers`);
                resolve(data);
            })
            .catch(err => {
                console.error('Error getting customers:', err);
                reject(err);
            });
    });
}

getCustomerById(id) {
    return new Promise((resolve, reject) => {
        Customer.findById(id)
            .then(data => {
                if (!data) {
                    console.log(`Customer not found: ${id}`);
                    reject(`Customer not found: ${id}`);
                }
                console.log("Customer retrieved successfully:", data);
                resolve(data);
            })
            .catch(err => {
                console.error('Error getting customer:', err);
                reject(err);
            });
    });
}

updateCustomer(customer) {
    return new Promise((resolve, reject) => {
        customer["updatedDate"] = new Date();
        Customer.findByIdAndUpdate(customer["_id"], customer, { new: true })
            .then(data => {
                if (!data) {
                    console.log(`Customer not found: ${customer["_id"]}`);
                    reject(`Customer not found: ${customer["_id"]}`);
                }
                console.log("Customer updated successfully:", data);
                resolve(data);
            })
            .catch(err => {
                console.error('Error updating customer:', err);
                reject(err);
            });
    });
}

deleteCustomer(id) {
    return new Promise((resolve, reject) => {
        Customer.findByIdAndDelete(id)
            .then(data => {
                if (!data) {
                    console.log(`Customer not found: ${id}`);
                    reject(`Customer not found: ${id}`);
                }
                console.log("Customer deleted successfully:", data);
                resolve(data);
            })
            .catch(err => {
                console.error('Error deleting customer:', err);
                reject(err);
            });
    });
}
////////////////////////////////////

addInventoryItem(itemData) {
    return new Promise((resolve, reject) => {
        itemData["createdDate"] = new Date();
        itemData["updatedDate"] = new Date();
        let newInventoryItem = new Inventory(itemData);
        newInventoryItem.save()
            .then(data => {
                console.log("Inventory item added successfully:", data);
                resolve(data);
            })
            .catch(err => {
                console.error("Error adding inventory item:", err);
                reject(err);
            });
    });
}

getInventoryItems() {
    return new Promise((resolve, reject) => {
        Inventory.find()
            .then(data => {
                console.log(`Found ${data.length} inventory items`);
                resolve(data);
            })
            .catch(err => {
                console.error('Error getting inventory items:', err);
                reject(err);
            });
    });
}

getInventoryItemById(id) {
    return new Promise((resolve, reject) => {
        Inventory.findById(id)
            .then(data => {
                if (!data) {
                    console.log(`Inventory item not found: ${id}`);
                    reject(`Inventory item not found: ${id}`);
                }
                console.log("Inventory item retrieved successfully:", data);
                resolve(data);
            })
            .catch(err => {
                console.error('Error getting inventory item:', err);
                reject(err);
            });
    });
}

updateInventoryItem(item) {
    return new Promise((resolve, reject) => {
        item["updatedDate"] = new Date();
        Inventory.findByIdAndUpdate(item["_id"], item, { new: true })
            .then(data => {
                if (!data) {
                    console.log(`Inventory item not found: ${item["_id"]}`);
                    reject(`Inventory item not found: ${item["_id"]}`);
                }
                console.log("Inventory item updated successfully:", data);
                resolve(data);
            })
            .catch(err => {
                console.error('Error updating inventory item:', err);
                reject(err);
            });
    });
}

deleteInventoryItem(id) {
    return new Promise((resolve, reject) => {
        Inventory.findByIdAndDelete(id)
            .then(data => {
                if (!data) {
                    console.log(`Inventory item not found: ${id}`);
                    reject(`Inventory item not found: ${id}`);
                }
                console.log("Inventory item deleted successfully:", data);
                resolve(data);
            })
            .catch(err => {
                console.error('Error deleting inventory item:', err);
                reject(err);
            });
    });
}
  
}

module.exports = Database;



  