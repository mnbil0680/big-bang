const mongoose = require('mongoose');
const Customer = require('./models/customerSchema');
const Inventory = require('./models/inventorySchema');
const Order = require('./models/orderSchema');
const Technician = require('./models/technicianSchema');
const NodeCache = require('node-cache');

class Database {
    constructor() {
        this.isConnected = false;
        this.cache = new NodeCache({ stdTTL: 300 }); // Cache with 5 minutes TTL
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    async connect(uri = 'mongodb://localhost:27017/management_system', poolSize = 10) {
        try {
            await mongoose.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: poolSize,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000
            });
            
            // Create indexes for better query performance
            await Customer.createIndexes();
            await Inventory.createIndexes();
            await Order.createIndexes();
            await Technician.createIndexes();
            this.isConnected = true;
            console.log('Connected to MongoDB successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    async addCustomer(customerData) {
        try {
            const customer = new Customer(customerData);
            const savedCustomer = await customer.save();
            return { success: true, data: savedCustomer };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getCustomers(filter = {}, useCache = true) {
        try {
            const cacheKey = `customers:${JSON.stringify(filter)}`;
            
            if (useCache) {
                const cachedData = this.cache.get(cacheKey);
                if (cachedData) return cachedData;
            }
            
            const customers = await Customer.find(filter);            
            if (useCache) this.cache.set(cacheKey, customers);
            return customers;
        } catch (error) {
            console.error('Error getting customers:', error);
            throw error;
        }
    }

    async getCustomerById(id) {
        try {
            return await Customer.findById(id);
        } catch (error) {
            console.error('Error getting customer:', error);
            throw error;
        }
    }

    async updateCustomer(id, updateData) {
        try {
            return await Customer.findByIdAndUpdate(id, updateData, { new: true });
        } catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    }

    async deleteCustomer(id) {
        try {
            return await Customer.findByIdAndDelete(id);
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw error;
        }
    }

    //////////////////////////////////////////////////////////////////////////
    // Inventory CRUD Operations
    async addInventoryItem(itemData) {
        try {
            // Check if item with same itemId already exists
            if (itemData.itemId) {
                const existingItem = await Inventory.findOne({ itemId: itemData.itemId });
                if (existingItem) {
                    return { 
                        success: false, 
                        error: `Item with ID ${itemData.itemId} already exists` 
                    };
                }
            }

            // Validate required fields
            if (!itemData.name || !itemData.quantity) {
                return { success: false, error: 'Name and quantity are required' };
            }

            // Create new inventory item
            const inventoryItem = new Inventory(itemData);
            const savedItem = await inventoryItem.save();
            
            // Clear related cache
            this.cache.del('inventory:all');
            
            return { 
                success: true, 
                data: savedItem 
            };
        } catch (error) {
            console.error('Error adding inventory item:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async getInventoryItems(filter = {}) {
        try {
            return await Inventory.find(filter);
        } catch (error) {
            console.error('Error getting inventory items:', error);
            throw error;
        }
    }

    async getInventoryItemById(id) {
        try {
            return await Inventory.findById(id);
        } catch (error) {
            console.error('Error getting inventory item:', error);
            throw error;
        }
    }

    async updateInventoryItem(id, updateData) {
        try {
            return await Inventory.findByIdAndUpdate(id, updateData, { new: true });
        } catch (error) {
            console.error('Error updating inventory item:', error);
            throw error;
        }
    }

    async deleteInventoryItem(id) {
        try {
            return await Inventory.findByIdAndDelete(id);
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            throw error;
        }
    }

    /////////////////////////////////////////////////////////////////////////////
    // Order CRUD Operations
    async createOrder(orderData) {
        try {
            // Create the order first
            const order = new Order(orderData);
            const savedOrder = await order.save();
            
            // Update inventory quantities one by one
            for (const item of orderData.items) {
                const inventory = await Inventory.findById(item.itemId);
                if (!inventory) {
                    throw new Error(`Inventory item ${item.itemId} not found`);
                }
                
                if (inventory.quantity < item.quantity) {
                    throw new Error(`Insufficient quantity for item ${item.itemId}`);
                }

                inventory.quantity -= item.quantity;
                await inventory.save();
            }

            // Clear cache
            this.cache.del('orders:{}');
            
            return { 
                success: true, 
                data: savedOrder 
            };
        } catch (error) {
            console.error('Error creating order:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async getOrders(filter = {}, useCache = true) {
        try {
            const safeFilter = filter || {};
            const cacheKey = `orders:${JSON.stringify(safeFilter)}`;
            
            if (useCache) {
                const cachedData = this.cache.get(cacheKey);
                if (cachedData) {
                    return { 
                        success: true, 
                        data: cachedData,
                        count: cachedData.length,
                        message: "Orders retrieved from cache"
                    };
                }
            }
            
            const orders = await Order.find(safeFilter)
                .populate({
                    path: 'customerId',
                    select: 'name email phone'
                })
                .populate({
                    path: 'technician',
                    select: 'name specialization phone'
                })
                .populate({
                    path: 'items.itemId',
                    select: 'name category price'
                })
                .lean()
                .exec();
            
            if (useCache) {
                this.cache.set(cacheKey, orders);
            }
            
            return { 
                success: true, 
                data: orders,
                count: orders.length,
                message: "Orders retrieved successfully"
            };
        } catch (error) {
            console.error('Error getting orders:', error);
            return { 
                success: false, 
                error: error.message,
                message: "Failed to retrieve orders"
            };
        }
    }

    async getOrderById(id) {
        try {
            if (!id) {
                return { success: false, error: 'Order ID is required' };
            }

            const cacheKey = `order:${id}`;
            const cachedData = this.cache.get(cacheKey);
            if (cachedData) {
                return { success: true, data: cachedData };
            }

            const order = await Order.findById(id)
                .populate('customerId')
                .populate('technician')
                .lean()
                .exec();

            if (!order) {
                return { success: false, error: 'Order not found' };
            }

            this.cache.set(cacheKey, order);
            return { success: true, data: order };
        } catch (error) {
            console.error('Error getting order:', error);
            return { success: false, error: error.message };
        }
    }

    async updateOrder(id, updateData) {
        if (!id) {
            return { success: false, error: 'Order ID is required' };
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            return { success: false, error: 'Update data is required' };
        }

        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            
            const order = await Order.findById(id).session(session);
            if (!order) {
                return { success: false, error: 'Order not found' };
            }
            
            if (updateData.items) {
                for (const item of updateData.items) {
                    const inventory = await Inventory.findById(item.itemId).session(session);
                    if (!inventory) {
                        throw new Error(`Inventory item ${item.itemId} not found`);
                    }
                    
                    const oldItem = order.items.find(i => i.itemId.toString() === item.itemId.toString());
                    const quantityDiff = oldItem ? item.quantity - oldItem.quantity : item.quantity;
                    
                    inventory.quantity -= quantityDiff;
                    if (inventory.quantity < 0) {
                        throw new Error(`Insufficient inventory for item ${item.itemId}`);
                    }
                    
                    await inventory.save({ session });
                }
            }
            
            const updatedOrder = await Order.findByIdAndUpdate(
                id, 
                updateData, 
                { 
                    new: true, 
                    runValidators: true,
                    lean: true,
                    session 
                }
            ).exec();

            await session.commitTransaction();

            // Clear related caches
            this.cache.del(`order:${id}`);
            this.cache.del('orders:{}');
            
            return { success: true, data: updatedOrder };
        } catch (error) {
            await session.abortTransaction();
            console.error('Error updating order:', error);
            return { success: false, error: error.message };
        } finally {
            session.endSession();
        }
    }

    async deleteOrder(id) {
        try {
            if (!id) {
                return { success: false, error: 'Order ID is required' };
            }

            const deletedOrder = await Order.findByIdAndDelete(id).lean().exec();

            if (!deletedOrder) {
                return { success: false, error: 'Order not found' };
            }

            // Clear related caches
            this.cache.del(`order:${id}`);
            this.cache.del('orders:{}');

            return { success: true, data: deletedOrder };
        } catch (error) {
            console.error('Error deleting order:', error);
            return { success: false, error: error.message };
        }
    }
    ////////////////////////////////////////////////////////

    async addTechnicianWithTransaction(technicianData) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const technician = new Technician(technicianData);
            const savedTechnician = await technician.save({ session });
            await session.commitTransaction();
            return { success: true, data: savedTechnician };
        } catch (error) {
            await session.abortTransaction();
            return { success: false, error: error.message };
        } finally {
            session.endSession();
        }
    }

    async addTechnician(technicianData) {
        try {
            const technician = new Technician(technicianData);
            const savedTechnician = await technician.save();
            return { success: true, data: savedTechnician };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getTechnicians(filter = {}, useCache = true) {
        try {
            // Handle null/undefined filter
            const safeFilter = filter || {};
            
            // Generate consistent cache key
            const cacheKey = `technicians:${JSON.stringify(safeFilter)}`;
            
            // Check cache first
            if (useCache) {
                const cachedData = this.cache.get(cacheKey);
                if (cachedData) {
                    return { success: true, data: cachedData };
                }
            }
            
            // Fetch from database with lean() for better performance
            const technicians = await Technician.find(safeFilter)
                .lean()
                .exec();
            
            // Update cache if enabled
            if (useCache) {
                this.cache.set(cacheKey, technicians);
            }
            
            return { success: true, data: technicians };
        } catch (error) {
            console.error('Error getting technicians:', error);
            return { success: false, error: error.message };
        }
    }

    async getTechnicianById(id) {
        try {
            if (!id) {
                return { success: false, error: 'Technician ID is required' };
            }

            // Check cache first
            const cacheKey = `technician:${id}`;
            const cachedData = this.cache.get(cacheKey);
            if (cachedData) {
                return { success: true, data: cachedData };
            }

            // Fetch from database with lean() for better performance
            const technician = await Technician.findById(id)
                .lean()
                .exec();

            if (!technician) {
                return { success: false, error: 'Technician not found' };
            }

            // Cache the result
            this.cache.set(cacheKey, technician);

            return { success: true, data: technician };
        } catch (error) {
            console.error('Error getting technician:', error);
            return { success: false, error: error.message };
        }
    }

    async updateTechnician(id, updateData) {
        try {
            if (!id) {
                return { success: false, error: 'Technician ID is required' };
            }

            if (!updateData || Object.keys(updateData).length === 0) {
                return { success: false, error: 'Update data is required' };
            }

            const updatedTechnician = await Technician.findByIdAndUpdate(
                id,
                updateData,
                { 
                    new: true,
                    runValidators: true,
                    lean: true
                }
            ).exec();

            if (!updatedTechnician) {
                return { success: false, error: 'Technician not found' };
            }

            // Update cache
            const cacheKey = `technician:${id}`;
            this.cache.set(cacheKey, updatedTechnician);
            this.cache.del('technicians:{}'); // Clear list cache

            return { success: true, data: updatedTechnician };
        } catch (error) {
            console.error('Error updating technician:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteTechnician(id) {
        try {
            if (!id) {
                return { success: false, error: 'Technician ID is required' };
            }

            const deletedTechnician = await Technician.findByIdAndDelete(id).lean().exec();

            if (!deletedTechnician) {
                return { success: false, error: 'Technician not found' };
            }

            // Clear related caches
            this.cache.del(`technician:${id}`);
            this.cache.del('technicians:{}');

            return { success: true, data: deletedTechnician };
        } catch (error) {
            console.error('Error deleting technician:', error);
            return { success: false, error: error.message };
        }
    }

    ///////////////////////////////////////////////////////////////

    // Bulk Operations
    async bulkCreateCustomers(customersData) {
        try {
            if (!Array.isArray(customersData) || customersData.length === 0) {
                return { success: false, error: 'Valid customers data array is required' };
            }

            // Validate required fields for each customer
            const invalidCustomers = customersData.filter(customer => 
                !customer.name || !customer.email || !customer.phone
            );
            
            if (invalidCustomers.length > 0) {
                return { 
                    success: false, 
                    error: 'All customers must have name, email, and phone' 
                };
            }

            const savedCustomers = await Customer.insertMany(customersData, { 
                lean: true,
                ordered: false // Continue inserting even if some documents fail
            });

            // Clear related cache
            this.cache.del('customers:{}');
            
            return { 
                success: true, 
                data: savedCustomers,
                count: savedCustomers.length 
            };
        } catch (error) {
            console.error('Error bulk creating customers:', error);
            return { success: false, error: error.message };
        }
    }

    async bulkUpdateInventory(updates) {
        if (!Array.isArray(updates) || updates.length === 0) {
            return { success: false, error: 'Valid updates array is required' };
        }

        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            
            // Validate all updates first
            for (const update of updates) {
                if (!update.id || !update.data) {
                    throw new Error('Each update must have id and data');
                }
                
                const inventory = await Inventory.findById(update.id).session(session);
                if (!inventory) {
                    throw new Error(`Inventory item ${update.id} not found`);
                }
            }
            
            const operations = updates.map(update => ({
                updateOne: {
                    filter: { _id: update.id },
                    update: { $set: update.data },
                    upsert: false
                }
            }));
            
            const result = await Inventory.bulkWrite(operations, { 
                session,
                ordered: true // Stop on first error
            });
            
            await session.commitTransaction();

            // Clear related cache
            this.cache.del('inventory:all');
            
            return { 
                success: true, 
                data: result,
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            };
        } catch (error) {
            await session.abortTransaction();
            console.error('Error bulk updating inventory:', error);
            return { success: false, error: error.message };
        } finally {
            session.endSession();
        }
    }

    // Retry Mechanism
    async withRetry(operation) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (attempt < this.retryAttempts) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                }
            }
        }
        
        throw lastError;
    }

    // Cache Management
    clearCache() {
        this.cache.flushAll();
    }

    // Utility Methods
    async disconnect() {
        try {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('Disconnected from MongoDB');
        } catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
}

module.exports = Database;