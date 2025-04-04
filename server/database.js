const mongoose = require("mongoose");

// Bonds
const Voucher = require("./schema/Bonds/voucher");
const Settings = require("./schema/Bonds/settings");

// Fix
const Customer = require("./schema/Fix/customerSchema");
const Inventory = require("./schema/Fix/inventorySchema");
const Order = require("./schema/Fix/orderSchema");
const Technician = require("./schema/Fix/technicianSchema");
const MaintenanceRequest = require("./schema/Fix/maintenanceRequestSchema");

// Price
const Client = require("./schema/Price/clientSchema");
const Product = require("./schema/Price/productSchema");
const Currency = require("./schema/Price/currencySchema");
const Rule = require("./schema/Price/rulesSchema");
const Show = require("./schema/Price/showSchema");

class Database {
  // In the Database class constructor
  constructor() {
    // Fix URL configuration
    this.Url =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bondsSystem";
    this.connectionConfig = {
      serverSelectionTimeoutMS: 5000,
    };
  }

  // In the connect method
  connect() {
    mongoose
      .connect(this.Url, {})
      .then(() => {
        console.log("Database Connected Successfully");
      })
      .catch((err) => {
        console.log("Error in Database Connection", err);
      });
  }

  addVoucher(voucher) {
    return new Promise((resolve, reject) => {
      Voucher["createdDate"] = new Date();
      Voucher["updatedDate"] = new Date();
      console.log(voucher);
      let newVoucher = new Voucher(voucher); // Create a new note object
      newVoucher
        .save()
        .then((doc) => {
          resolve(doc);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getVouchers() {
    return new Promise((resolve, reject) => {
      Voucher.find()
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getVoucherById(id) {
    return new Promise((resolve, reject) => {
      Voucher.findById(id)
        .then((data) => {
          if (!data) {
            console.log(`Voucher not found: ${id}`);
            reject(`Voucher not found: ${id}`);
          }
          console.log("Voucher retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  updateVoucher(voucher) {
    return new Promise((resolve, reject) => {
      voucher["updatedDate"] = new Date();
      Voucher.findByIdAndUpdate(voucher["_id"], voucher, { new: true })
        .then((data) => {
          console.log("Voucher updated successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getVouchersByStatus(status) {
    return new Promise((resolve, reject) => {
      Voucher.find({ status })
        .then((data) => {
          console.log(`Vouchers found with status ${status}:`, data);
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getVoucherByCode(code) {
    return new Promise((resolve, reject) => {
      Voucher.findOne({ voucherNumber: code })
        .then((data) => {
          if (!data) {
            console.log(`Voucher not found with code: ${code}`);
            reject(`Voucher not found with code: ${code}`);
          }
          console.log("Voucher retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  deleteVoucher(id) {
    return new Promise((resolve, reject) => {
      Voucher.findByIdAndDelete(id)
        .then((data) => {
          if (!data) {
            console.log(`Voucher not found: ${id}`);
            reject(`Voucher not found: ${id}`);
          }
          console.log("Voucher deleted successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  searchVouchers(query) {
    return new Promise((resolve, reject) => {
      Voucher.find({
        $or: [
          { voucherNumber: { $regex: query, $options: "i" } },
          { entity: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      })
        .then((data) => {
          console.log(`Found ${data.length} vouchers matching query: ${query}`);
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getVouchersByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start) || isNaN(end)) {
        reject("Invalid date format");
        return;
      }

      if (start > end) {
        reject("Start date must be before end date");
        return;
      }

      Voucher.find({
        date: { $gte: start, $lte: end },
      })
        .sort({ date: -1 })
        .then((data) => {
          console.log(
            `Found ${data.length} vouchers between ${
              start.toISOString().split("T")[0]
            } and ${end.toISOString().split("T")[0]}`
          );
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  ///////////////////////////////////

  getSettings() {
    return new Promise((resolve, reject) => {
      Settings.findOne()
        .then((data) => {
          if (!data) {
            console.log("Settings not found");
            reject("Settings not found");
          }
          resolve(data);
        })
        .catch((err) => {
          console.error("Error retrieving settings:", err);
          reject(err);
        });
    });
  }

  updateSettings(settingsData) {
    return new Promise((resolve, reject) => {
      if (!settingsData || Object.keys(settingsData).length === 0) {
        reject("Settings data is required");
        return;
      }

      Settings.findOneAndUpdate(
        {},
        { $set: settingsData },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      )
        .then((data) => {
          console.log("Settings updated successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error updating settings:", err);
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
        .then((data) => {
          console.log("Settings reset to defaults successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error resetting settings:", err);
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
      newCustomer
        .save()
        .then((data) => {
          console.log("Customer added successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error adding customer:", err);
          reject(err);
        });
    });
  }

  getCustomers() {
    return new Promise((resolve, reject) => {
      Customer.find()
        .then((data) => {
          console.log(`Found ${data.length} customers`);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting customers:", err);
          reject(err);
        });
    });
  }

  getCustomerById(id) {
    return new Promise((resolve, reject) => {
      Customer.findById(id)
        .then((data) => {
          if (!data) {
            console.log(`Customer not found: ${id}`);
            reject(`Customer not found: ${id}`);
          }
          console.log("Customer retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting customer:", err);
          reject(err);
        });
    });
  }

  updateCustomer(customer) {
    return new Promise((resolve, reject) => {
      customer["updatedDate"] = new Date();
      Customer.findByIdAndUpdate(customer["_id"], customer, { new: true })
        .then((data) => {
          if (!data) {
            reject(`Customer not found: ${customer["_id"]}`);
          }
          resolve(data);
        })
        .catch((err) => {
          console.error("Error updating customer:", err);
          reject(err);
        });
    });
  }

  deleteCustomer(id) {
    return new Promise((resolve, reject) => {
      Customer.findByIdAndDelete(id)
        .then((data) => {
          if (!data) {
            console.log(`Customer not found: ${id}`);
            reject(`Customer not found: ${id}`);
          }
          console.log("Customer deleted successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error deleting customer:", err);
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
      newInventoryItem
        .save()
        .then((data) => {
          console.log("Inventory item added successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error adding inventory item:", err);
          reject(err);
        });
    });
  }

  getInventoryItems() {
    return new Promise((resolve, reject) => {
      Inventory.find()
        .then((data) => {
          console.log(`Found ${data.length} inventory items`);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting inventory items:", err);
          reject(err);
        });
    });
  }

  getInventoryItemById(id) {
    return new Promise((resolve, reject) => {
      Inventory.findById(id)
        .then((data) => {
          if (!data) {
            console.log(`Inventory item not found: ${id}`);
            reject(`Inventory item not found: ${id}`);
          }
          console.log("Inventory item retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting inventory item:", err);
          reject(err);
        });
    });
  }

  updateInventoryItem(item) {
    return new Promise((resolve, reject) => {
      item["updatedDate"] = new Date();
      Inventory.findByIdAndUpdate(item["_id"], item, { new: true })
        .then((data) => {
          if (!data) {
            console.log(`Inventory item not found: ${item["_id"]}`);
            reject(`Inventory item not found: ${item["_id"]}`);
          }
          console.log("Inventory item updated successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error updating inventory item:", err);
          reject(err);
        });
    });
  }

  deleteInventoryItem(id) {
    return new Promise((resolve, reject) => {
      Inventory.findByIdAndDelete(id)
        .then((data) => {
          if (!data) {
            console.log(`Inventory item not found: ${id}`);
            reject(`Inventory item not found: ${id}`);
          }
          console.log("Inventory item deleted successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error deleting inventory item:", err);
          reject(err);
        });
    });
  }

  createOrder(orderData) {
    return new Promise(async (resolve, reject) => {
      try {
        // Basic validation
        if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
          return reject("Valid order data with items array is required");
        }

        // Validate required fields
        if (!orderData.orderId || !orderData.customerId || !orderData.type) {
          return reject("orderId, customerId, and type are required fields");
        }

        // Validate items array is not empty
        if (orderData.items.length === 0) {
          return reject("Order must contain at least one item");
        }

        // Validate items structure
        for (const item of orderData.items) {
          if (!item.itemId || !item.quantity || !item.price) {
            return reject("Each item must have itemId, quantity, and price");
          }
          if (item.quantity <= 0 || item.price < 0) {
            return reject(
              "Item quantity must be positive and price must be non-negative"
            );
          }
        }

        // Add timestamps
        orderData.createdDate = new Date();
        orderData.updatedDate = new Date();

        // Validate customer exists
        const customer = await Customer.findById(orderData.customerId);
        if (!customer) {
          return reject(`Customer ${orderData.customerId} not found`);
        }

        // Validate and check inventory
        for (const item of orderData.items) {
          const inventory = await Inventory.findById(item.itemId);
          if (!inventory) {
            return reject(`Inventory item ${item.itemId} not found`);
          }
          if (inventory.quantity < item.quantity) {
            return reject(
              `Insufficient quantity for item ${item.itemId}. Available: ${inventory.quantity}, Requested: ${item.quantity}`
            );
          }
        }

        // Create and save the order
        const newOrder = new Order(orderData);
        const savedOrder = await newOrder.save();

        // Update inventory quantities
        for (const item of orderData.items) {
          await Inventory.findByIdAndUpdate(item.itemId, {
            $inc: { quantity: -item.quantity },
          });
        }

        console.log("Order created successfully:", savedOrder);
        resolve(savedOrder);
      } catch (error) {
        console.error("Error creating order:", error);
        reject(error.message || "Error creating order");
      }
    });
  }

  getOrders() {
    return new Promise((resolve, reject) => {
      Order.find()
        .populate("customerId")
        .populate("technician")
        .populate("items.itemId")
        .then((data) => {
          console.log(`Found ${data.length} orders`);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting orders:", err);
          reject(err);
        });
    });
  }

  getOrderById(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Order ID is required");
        return;
      }

      Order.findById(id)
        .populate("customerId")
        .populate("technician")
        .populate("items.itemId")
        .then((data) => {
          if (!data) {
            console.log(`Order not found: ${id}`);
            reject(`Order not found: ${id}`);
          }
          console.log("Order retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting order:", err);
          reject(err);
        });
    });
  }

  updateOrder(order) {
    return new Promise((resolve, reject) => {
      if (!order || !order._id) {
        reject("Order ID is required");
        return;
      }

      order["updatedDate"] = new Date();

      // First find the original order
      Order.findById(order._id)
        .then((originalOrder) => {
          if (!originalOrder) {
            throw new Error(`Order not found: ${order._id}`);
          }

          // Process inventory updates for changed items
          const inventoryPromises = order.items.map((newItem) => {
            const oldItem = originalOrder.items.find(
              (i) => i.itemId.toString() === newItem.itemId.toString()
            );
            const quantityDiff = oldItem
              ? newItem.quantity - oldItem.quantity
              : newItem.quantity;

            return Inventory.findById(newItem.itemId).then((inventory) => {
              if (!inventory) {
                throw new Error(`Inventory item ${newItem.itemId} not found`);
              }
              inventory.quantity -= quantityDiff;
              if (inventory.quantity < 0) {
                throw new Error(
                  `Insufficient quantity for item ${newItem.itemId}`
                );
              }
              return inventory.save();
            });
          });

          return Promise.all(inventoryPromises).then(() => {
            return Order.findByIdAndUpdate(order._id, order, { new: true });
          });
        })
        .then((updatedOrder) => {
          console.log("Order updated successfully:", updatedOrder);
          resolve(updatedOrder);
        })
        .catch((err) => {
          console.error("Error updating order:", err);
          reject(err);
        });
    });
  }

  deleteOrder(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Order ID is required");
        return;
      }

      Order.findByIdAndDelete(id)
        .then((deletedOrder) => {
          if (!deletedOrder) {
            throw new Error("Order not found");
          }
          console.log("Order deleted successfully:", deletedOrder);
          resolve(deletedOrder);
        })
        .catch((err) => {
          console.error("Error deleting order:", err);
          reject(err);
        });
    });
  }

  ////////////////////////////////////////////////////////

  addTechnician(technicianData) {
    return new Promise((resolve, reject) => {
      technicianData["createdDate"] = new Date();
      technicianData["updatedDate"] = new Date();
      let newTechnician = new Technician(technicianData);
      newTechnician
        .save()
        .then((data) => {
          console.log("Technician added successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error adding technician:", err);
          reject(err);
        });
    });
  }

  getTechnicians() {
    return new Promise((resolve, reject) => {
      Technician.find()
        .then((data) => {
          console.log(`Found ${data.length} technicians`);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting technicians:", err);
          reject(err);
        });
    });
  }

  getTechnicianById(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Technician ID is required");
        return;
      }

      Technician.findById(id)
        .then((data) => {
          if (!data) {
            console.log(`Technician not found: ${id}`);
            reject(`Technician not found: ${id}`);
          }
          console.log("Technician retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting technician:", err);
          reject(err);
        });
    });
  }

  updateTechnician(technician) {
    return new Promise((resolve, reject) => {
      if (!technician || !technician._id) {
        reject("Technician ID is required");
        return;
      }

      technician["updatedDate"] = new Date();

      Technician.findByIdAndUpdate(technician["_id"], technician, { new: true })
        .then((data) => {
          if (!data) {
            console.log(`Technician not found: ${technician["_id"]}`);
            reject(`Technician not found: ${technician["_id"]}`);
          }
          console.log("Technician updated successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error updating technician:", err);
          reject(err);
        });
    });
  }

  deleteTechnician(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Technician ID is required");
        return;
      }

      Technician.findByIdAndDelete(id)
        .then((data) => {
          if (!data) {
            console.log(`Technician not found: ${id}`);
            reject(`Technician not found: ${id}`);
          }
          console.log("Technician deleted successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error deleting technician:", err);
          reject(err);
        });
    });
  }

  /////////////////////////////

  addClient(client) {
    return new Promise((resolve, reject) => {
      client["createdDate"] = new Date();
      client["updatedDate"] = new Date();

      let newClient = new Client(client);
      newClient
        .save()
        .then((data) => {
          console.log("Client added successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error adding client:", err);
          reject(err);
        });
    });
  }

  getClients() {
    return new Promise((resolve, reject) => {
      Client.find()
        .then((data) => {
          console.log(`Found ${data.length} clients`);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting clients:", err);
          reject(err);
        });
    });
  }

  getClientByID(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Client ID is required");
        return;
      }

      Client.findById(id)
        .then((data) => {
          if (!data) {
            console.log(`Client not found: ${id}`);
            reject(`Client not found: ${id}`);
          }
          console.log("Client retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting client:", err);
          reject(err);
        });
    });
  }

  updateClient(client) {
    return new Promise((resolve, reject) => {
      if (!client || !client._id) {
        reject("Client ID is required");
        return;
      }

      client["updatedDate"] = new Date();

      Client.findByIdAndUpdate(client._id, client, { new: true })
        .then((data) => {
          if (!data) {
            console.log(`Client not found: ${client._id}`);
            reject(`Client not found: ${client._id}`);
          }
          console.log("Client updated successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error updating client:", err);
          reject(err);
        });
    });
  }

  deleteClientById(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Client ID is required");
        return;
      }

      Client.findByIdAndDelete(id)
        .then((data) => {
          if (!data) {
            console.log(`Client not found: ${id}`);
            reject(`Client not found: ${id}`);
          }
          console.log("Client deleted successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error deleting client:", err);
          reject(err);
        });
    });
  }

  getClientsByEmail(email) {
    return new Promise((resolve, reject) => {
      if (!email) {
        resolve([]);
        return;
      }

      const query = { email: { $regex: new RegExp(email, "i") } };

      Client.find(query)
        .then((data) => {
          console.log(`Found ${data.length} clients matching email: ${email}`);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error searching clients by email:", err);
          reject(err);
        });
    });
  }

  ////////////////////////////////
  addProduct(product) {
    return new Promise((resolve, reject) => {
      if (!product) {
        reject("Product data is required");
        return;
      }

      product.createdDate = new Date();
      product.updatedDate = new Date();

      const newProduct = new Product(product);
      newProduct
        .save()
        .then((data) => {
          console.log("Product added successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error adding product:", err);
          reject(err);
        });
    });
  }

  getProducts() {
    return new Promise((resolve, reject) => {
      Product.find()
        .then((data) => {
          console.log(`Found ${data.length} products`);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting products:", err);
          reject(err);
        });
    });
  }

  getProductByID(id) {
    return new Promise((resolve, reject) => {
      Product.findById(id)
        .then((data) => {
          if (!data) {
            console.log(`Product not found: ${id}`);
            reject(`Product not found: ${id}`);
          }
          console.log("Product retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting product:", err);
          reject(err);
        });
    });
  }

  updateProduct(product) {
    return new Promise((resolve, reject) => {
      if (!product || !product._id) {
        reject("Product ID is required for update");
        return;
      }

      product.updatedDate = new Date();
      Product.findByIdAndUpdate(product._id, product, {
        new: true,
        runValidators: true,
      })
        .then((data) => {
          if (!data) {
            console.log(`Product not found: ${product._id}`);
            reject(`Product not found: ${product._id}`);
          }
          console.log("Product updated successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error updating product:", err);
          reject(err);
        });
    });
  }

  deleteProductById(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Product ID is required");
        return;
      }

      Product.findByIdAndDelete(id)
        .then((data) => {
          if (!data) {
            console.log(`Product not found: ${id}`);
            reject(`Product not found: ${id}`);
          }
          console.log("Product deleted successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error deleting product:", err);
          reject(err);
        });
    });
  }

  ////////////////////////////////////////

  addCurrency(currency) {
    return new Promise((resolve, reject) => {
      if (!currency) {
        reject("Currency data is required");
        return;
      }

      const newCurrency = new Currency(currency);
      newCurrency
        .save()
        .then((data) => {
          console.log("Currency added successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error adding currency:", err);
          reject(err);
        });
    });
  }

  getCurrencies() {
    return new Promise((resolve, reject) => {
      Currency.find()
        .then((data) => {
          console.log("Currencies retrieved successfully:", data.length);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting currencies:", err);
          reject(err);
        });
    });
  }

  getCurrencyByID(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Currency ID is required");
        return;
      }

      Currency.findById(id)
        .then((data) => {
          if (!data) {
            console.log(`Currency not found: ${id}`);
            reject(`Currency not found: ${id}`);
          }
          console.log("Currency retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting currency:", err);
          reject(err);
        });
    });
  }

  updateCurrency(currency) {
    return new Promise((resolve, reject) => {
      if (!currency || !currency._id) {
        reject("Currency ID is required");
        return;
      }

      currency.updatedDate = new Date();
      Currency.findByIdAndUpdate(currency._id, currency, {
        new: true,
        runValidators: true,
      })
        .then((data) => {
          if (!data) {
            console.log(`Currency not found: ${currency._id}`);
            reject(`Currency not found: ${currency._id}`);
          }
          console.log("Currency updated successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error updating currency:", err);
          reject(err);
        });
    });
  }

  deleteCurrencyById(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Currency ID is required");
        return;
      }

      Currency.findByIdAndDelete(id)
        .then((data) => {
          if (!data) {
            console.log(`Currency not found: ${id}`);
            reject(`Currency not found: ${id}`);
          }
          console.log("Currency deleted successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error deleting currency:", err);
          reject(err);
        });
    });
  }
  ///////////////////////////////////////////
  addRule(rule) {
    return new Promise((resolve, reject) => {
      if (!rule) {
        reject("Rule data is required");
        return;
      }

      rule.createdDate = new Date();
      rule.updatedDate = new Date();

      const newRule = new Rule(rule);
      newRule
        .save()
        .then((data) => {
          console.log("Rule added successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error adding rule:", err);
          reject(err);
        });
    });
  }

  getRules() {
    return new Promise((resolve, reject) => {
      Rule.find()
        .then((data) => {
          console.log(`Found ${data.length} rules`);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting rules:", err);
          reject(err);
        });
    });
  }

  getRuleByID(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Rule ID is required");
        return;
      }

      Rule.findById(id)
        .then((data) => {
          if (!data) {
            console.log(`Rule not found: ${id}`);
            reject(`Rule not found: ${id}`);
          }
          console.log("Rule retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting rule:", err);
          reject(err);
        });
    });
  }

  updateRule(rule) {
    return new Promise((resolve, reject) => {
      if (!rule || !rule._id) {
        reject("Rule ID is required");
        return;
      }

      rule.updatedDate = new Date();

      Rule.findByIdAndUpdate(rule._id, rule, { new: true })
        .then((data) => {
          if (!data) {
            console.log(`Rule not found: ${rule._id}`);
            reject(`Rule not found: ${rule._id}`);
          }
          console.log("Rule updated successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error updating rule:", err);
          reject(err);
        });
    });
  }

  deleteRuleById(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Rule ID is required");
        return;
      }

      Rule.findByIdAndDelete(id)
        .then((data) => {
          if (!data) {
            console.log(`Rule not found: ${id}`);
            reject(`Rule not found: ${id}`);
          }
          console.log("Rule deleted successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error deleting rule:", err);
          reject(err);
        });
    });
  }
  /////////////////////////////////////////////
  addShow(show) {
    return new Promise((resolve, reject) => {
      if (!show) {
        reject("Show data is required");
        return;
      }

      show.createdDate = new Date();
      show.updatedDate = new Date();

      const newShow = new Show(show);
      newShow
        .save()
        .then((data) => {
          console.log("Show added successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error adding show:", err);
          reject(err);
        });
    });
  }

  getShows() {
    return new Promise((resolve, reject) => {
      Show.find()
        .populate("clientId")
        .populate("products")
        .populate("rules")
        .then((data) => {
          console.log(`Found ${data.length} shows`);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error fetching shows:", err);
          reject(err);
        });
    });
  }

  getShowByID(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Show ID is required");
        return;
      }

      Show.findById(id)
        .populate("clientId")
        .populate("products")
        .populate("rules")
        .then((data) => {
          if (!data) {
            console.log(`Show not found: ${id}`);
            reject(`Show not found: ${id}`);
          }
          console.log("Show retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting show:", err);
          reject(err);
        });
    });
  }

  updateShow(show) {
    return new Promise((resolve, reject) => {
      if (!show || !show._id) {
        reject("Show ID is required");
        return;
      }

      show.updatedDate = new Date();

      Show.findByIdAndUpdate(show._id, show, { new: true })
        .populate("clientId")
        .populate("products")
        .populate("rules")
        .then((data) => {
          if (!data) {
            console.log(`Show not found: ${show._id}`);
            reject(`Show not found: ${show._id}`);
          }
          console.log("Show updated successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error updating show:", err);
          reject(err);
        });
    });
  }

  deleteShowById(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Show ID is required");
        return;
      }

      Show.findByIdAndDelete(id)
        .then((data) => {
          if (!data) {
            console.log(`Show not found: ${id}`);
            reject(`Show not found: ${id}`);
          }
          console.log("Show deleted successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error deleting show:", err);
          reject(err);
        });
    });
  }
  //////////////////////////////////////////////
  // Add these functions to your Database class

  addMaintenanceRequest(requestData) {
    return new Promise((resolve, reject) => {
      if (!requestData) {
        reject("Maintenance request data is required");
        return;
      }
      console.log("Adding maintenance request:", requestData);
      requestData.createdDate = new Date();
      requestData.updatedDate = new Date();

      const newRequest = new MaintenanceRequest(requestData);
      newRequest
        .save()
        .then((data) => {
          console.log("Maintenance request added successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error adding maintenance request:", err);
          reject(err);
        });
    });
  }

  getMaintenanceRequests() {
    return new Promise((resolve, reject) => {
      MaintenanceRequest.find()
        .populate("customerId")
        .populate("technicianId")
        .populate("partsUsed.partId")
        .then((data) => {
          console.log(`Found ${data.length} maintenance requests`);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting maintenance requests:", err);
          reject(err);
        });
    });
  }

  getMaintenanceRequestById(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Maintenance request ID is required");
        return;
      }

      MaintenanceRequest.findById(id)
        .populate("customerId")
        .populate("technicianId")
        .populate("partsUsed.partId")
        .then((data) => {
          if (!data) {
            console.log(`Maintenance request not found: ${id}`);
            reject(`Maintenance request not found: ${id}`);
          }
          console.log("Maintenance request retrieved successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting maintenance request:", err);
          reject(err);
        });
    });
  }

  updateMaintenanceRequest(request) {
    return new Promise((resolve, reject) => {
      if (!request || !request._id) {
        reject("Maintenance request ID is required");
        return;
      }

      request.updatedDate = new Date();

      MaintenanceRequest.findByIdAndUpdate(request._id, request, {
        new: true,
        runValidators: true,
      })
        .populate("customerId")
        .populate("technicianId")
        .populate("partsUsed.partId")
        .then((data) => {
          if (!data) {
            console.log(`Maintenance request not found: ${request._id}`);
            reject(`Maintenance request not found: ${request._id}`);
          }
          console.log("Maintenance request updated successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error updating maintenance request:", err);
          reject(err);
        });
    });
  }

  deleteMaintenanceRequest(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Maintenance request ID is required");
        return;
      }

      MaintenanceRequest.findByIdAndDelete(id)
        .then((data) => {
          if (!data) {
            console.log(`Maintenance request not found: ${id}`);
            reject(`Maintenance request not found: ${id}`);
          }
          console.log("Maintenance request deleted successfully:", data);
          resolve(data);
        })
        .catch((err) => {
          console.error("Error deleting maintenance request:", err);
          reject(err);
        });
    });
  }

  // Additional useful functions

  getMaintenanceRequestsByStatus(status) {
    return new Promise((resolve, reject) => {
      MaintenanceRequest.find({ status })
        .populate("customerId")
        .populate("technicianId")
        .populate("partsUsed.partId")
        .then((data) => {
          console.log(
            `Found ${data.length} maintenance requests with status: ${status}`
          );
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting maintenance requests by status:", err);
          reject(err);
        });
    });
  }

  getMaintenanceRequestsByTechnician(technicianId) {
    return new Promise((resolve, reject) => {
      MaintenanceRequest.find({ technicianId })
        .populate("customerId")
        .populate("technicianId")
        .populate("partsUsed.partId")
        .then((data) => {
          console.log(
            `Found ${data.length} maintenance requests for technician: ${technicianId}`
          );
          resolve(data);
        })
        .catch((err) => {
          console.error(
            "Error getting maintenance requests by technician:",
            err
          );
          reject(err);
        });
    });
  }

  getMaintenanceRequestsByCustomer(customerId) {
    return new Promise((resolve, reject) => {
      MaintenanceRequest.find({ customerId })
        .populate("customerId")
        .populate("technicianId")
        .populate("partsUsed.partId")
        .then((data) => {
          console.log(
            `Found ${data.length} maintenance requests for customer: ${customerId}`
          );
          resolve(data);
        })
        .catch((err) => {
          console.error("Error getting maintenance requests by customer:", err);
          reject(err);
        });
    });
  }
}

module.exports = Database;
