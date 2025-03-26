class Database {
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



class Database {
    constructor() {
      this.Url = process.env.MONGO_URI || "mongodb://localhost:27017/Future"; // Use environment variable for MongoDB URL
    }
  
    async connect() {
      try {
        await mongoose.connect(this.Url);
        console.log("Database Connected Successfully");
        // Seed currencies after successful connection
        await this.seedCurrencies();
      } catch (err) {
        console.error("Error in Database Connection:", err);
        throw err; // Re-throw to let the server handle the failure
      }
    }
  
    // Client Methods
    async addClient(client) {
      try {
        const newClient = new Client(client);
        const doc = await newClient.save();
        return doc;
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to add client"));
      }
    }
  
    async getClients() {
      try {
        const data = await Client.find();
        return data;
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to fetch clients"));
      }
    }
  
    async getClientByID(id) {
      try {
        const data = await Client.findById(id);
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to fetch client"));
      }
    }
  
    async updateClient(client) {
      try {
        client.updatedDate = new Date();
        const data = await Client.findByIdAndUpdate(client._id, client, {
          new: true,
        });
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to update client"));
      }
    }
  
    async deleteClientById(id) {
      try {
        const data = await Client.findByIdAndDelete(id);
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to delete client"));
      }
    }
  
    async getClientsByEmail(email) {
      try {
        const query = { email: { $regex: new RegExp(email, "i") } };
        const data = await Client.find(query);
        return data; // Returns empty array if not found
      } catch (err) {
        throw new Error(
          this.extractErrorMessage(err, "Failed to fetch clients by email")
        );
      }
    }
  
    // Product Methods
    async addProduct(product) {
      try {
        const newProduct = new Product(product);
        const doc = await newProduct.save();
        return doc;
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to add product"));
      }
    }
  
    async getProducts() {
      try {
        const data = await Product.find();
        return data;
      } catch (err) {
        throw new Error(
          this.extractErrorMessage(err, "Failed to fetch products")
        );
      }
    }
  
    async getProductByID(id) {
      try {
        const data = await Product.findById(id);
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to fetch product"));
      }
    }
  
    async updateProduct(product) {
      try {
        product.updatedDate = new Date();
        const data = await Product.findByIdAndUpdate(product._id, product, {
          new: true,
        });
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(
          this.extractErrorMessage(err, "Failed to update product")
        );
      }
    }
  
    async deleteProductById(id) {
      try {
        const data = await Product.findByIdAndDelete(id);
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(
          this.extractErrorMessage(err, "Failed to delete product")
        );
      }
    }
  
    // Currency Methods
    async addCurrency(currency) {
      try {
        const newCurrency = new Currency(currency);
        const doc = await newCurrency.save();
        return doc;
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to add currency"));
      }
    }
  
    async getCurrencies() {
      try {
        const data = await Currency.find();
        return data;
      } catch (err) {
        throw new Error(
          this.extractErrorMessage(err, "Failed to fetch currencies")
        );
      }
    }
  
    async getCurrencyByID(id) {
      try {
        const data = await Currency.findById(id);
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(
          this.extractErrorMessage(err, "Failed to fetch currency")
        );
      }
    }
  
    async updateCurrency(currency) {
      try {
        currency.updatedDate = new Date();
        const data = await Currency.findByIdAndUpdate(currency._id, currency, {
          new: true,
        });
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(
          this.extractErrorMessage(err, "Failed to update currency")
        );
      }
    }
  
    async deleteCurrencyById(id) {
      try {
        const data = await Currency.findByIdAndDelete(id);
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(
          this.extractErrorMessage(err, "Failed to delete currency")
        );
      }
    }
  
    // Rule Methods
    async addRule(rule) {
      try {
        const newRule = new Rule(rule);
        const doc = await newRule.save();
        return doc;
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to add rule"));
      }
    }
  
    async getRules() {
      try {
        const data = await Rule.find();
        return data;
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to fetch rules"));
      }
    }
  
    async getRuleByID(id) {
      try {
        const data = await Rule.findById(id);
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to fetch rule"));
      }
    }
  
    async updateRule(rule) {
      try {
        rule.updatedDate = new Date();
        const data = await Rule.findByIdAndUpdate(rule._id, rule, { new: true });
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to update rule"));
      }
    }
  
    async deleteRuleById(id) {
      try {
        const data = await Rule.findByIdAndDelete(id);
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to delete rule"));
      }
    }
  
    // Show Methods
    async addShow(show) {
      try {
        const newShow = new Show(show);
        const doc = await newShow.save();
        return doc;
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to add show"));
      }
    }
  
    async getShows() {
      try {
        const data = await Show.find()
          .populate("clientId")
          .populate("products")
          .populate("rules");
        return data;
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to fetch shows"));
      }
    }
  
    async getShowByID(id) {
      try {
        const data = await Show.findById(id)
          .populate("clientId")
          .populate("products")
          .populate("rules");
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to fetch show"));
      }
    }
  
    async updateShow(show) {
      try {
        show.updatedDate = new Date();
        const data = await Show.findByIdAndUpdate(show._id, show, { new: true })
          .populate("clientId")
          .populate("products")
          .populate("rules");
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to update show"));
      }
    }
  
    async deleteShowById(id) {
      try {
        const data = await Show.findByIdAndDelete(id);
        return data; // Returns null if not found
      } catch (err) {
        throw new Error(this.extractErrorMessage(err, "Failed to delete show"));
      }
    }
  
    // Helper method to extract user-friendly error messages
    extractErrorMessage(err, defaultMessage) {
      if (err.name === "ValidationError") {
        return Object.values(err.errors)
          .map((e) => e.message)
          .join("; ");
      }
      return err.message || defaultMessage;
    }
  
    // Seed 10 popular currencies
    async seedCurrencies() {
      try {
        const popularCurrencies = [
          {
            code: "USD",
            name: "دولار أمريكي",
            symbol: "$",
            decimalPlaces: 2,
            country: "الولايات المتحدة",
          },
          {
            code: "EUR",
            name: "يورو",
            symbol: "€",
            decimalPlaces: 2,
            country: "المنطقة اليورو",
          },
          {
            code: "SAR",
            name: "ريال سعودي",
            symbol: "ر.س",
            decimalPlaces: 2,
            country: "المملكة العربية السعودية",
          },
          {
            code: "AED",
            name: "درهم إماراتي",
            symbol: "د.إ",
            decimalPlaces: 2,
            country: "الإمارات العربية المتحدة",
          },
          {
            code: "GBP",
            name: "جنيه إسترليني",
            symbol: "£",
            decimalPlaces: 2,
            country: "المملكة المتحدة",
          },
          {
            code: "JPY",
            name: "ين ياباني",
            symbol: "¥",
            decimalPlaces: 0,
            country: "اليابان",
          },
          {
            code: "CAD",
            name: "دولار كندي",
            symbol: "CAD$",
            decimalPlaces: 2,
            country: "كندا",
          },
          {
            code: "AUD",
            name: "دولار أسترالي",
            symbol: "A$",
            decimalPlaces: 2,
            country: "أستراليا",
          },
          {
            code: "CHF",
            name: "فرنك سويسري",
            symbol: "Fr.",
            decimalPlaces: 2,
            country: "سويسرا",
          },
          {
            code: "CNY",
            name: "يوان صيني",
            symbol: "¥",
            decimalPlaces: 2,
            country: "الصين",
          },
        ];
  
        // Check existing currencies by code
        const existingCodes = (await Currency.find({}, "code")).map(
          (c) => c.code
        );
  
        // Filter out currencies that already exist
        const currenciesToAdd = popularCurrencies.filter(
          (c) => !existingCodes.includes(c.code)
        );
  
        if (currenciesToAdd.length > 0) {
          await Currency.insertMany(currenciesToAdd);
          console.log(
            `Seeded ${currenciesToAdd.length} new currencies: ${currenciesToAdd
              .map((c) => c.code)
              .join(", ")}`
          );
        } else {
          console.log("All popular currencies are already seeded.");
        }
      } catch (err) {
        console.error("Error seeding currencies:", err.message);
        throw err; // Re-throw to let the server handle the failure
      }
    }
  }