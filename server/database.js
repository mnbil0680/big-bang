const mongoose = require("mongoose");
require("dotenv").config();
// Bonds
const Voucher = require("./schema/Bonds/voucher");
const Settings = require("./schema/Bonds/settings");

// Fix
const Customer = require("./schema/Fix/customerSchema");
const Inventory = require("./schema/Fix/inventorySchema");
const Order = require("./schema/Fix/orderSchema");
const Technician = require("./schema/Fix/technicianSchema");

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
          console.log(data);
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
        if (!orderData || !Array.isArray(orderData.items)) {
          return reject("Valid order data with items array is required");
        }

        // Required fields
        if (!orderData.orderId || !orderData.customerId || !orderData.type) {
          return reject("orderId, customerId, and type are required fields");
        }

        if (
          !orderData.priority ||
          !orderData.deviceType ||
          orderData.totalPrice === undefined
        ) {
          return reject(
            "priority, deviceType, and totalPrice are required fields"
          );
        }

        const allowedPriorities = ["عالية", "متوسطة", "منخفضة"];
        if (!allowedPriorities.includes(orderData.priority)) {
          return reject(
            `priority must be one of: ${allowedPriorities.join(", ")}`
          );
        }

        if (orderData.totalPrice < 0)
          return reject("totalPrice must be non-negative");
        if (
          orderData.estimatedCost !== undefined &&
          orderData.estimatedCost < 0
        ) {
          return reject("estimatedCost must be non-negative if provided");
        }

        if (orderData.items.length === 0) {
          return reject("Order must contain at least one item");
        }

        for (const item of orderData.items) {
          if (
            !item.itemId ||
            item.quantity === undefined ||
            item.price === undefined
          ) {
            return reject("Each item must have itemId, quantity, and price");
          }
          if (item.quantity <= 0 || item.price < 0) {
            return reject(
              "Item quantity must be positive and price must be non-negative"
            );
          }
        }

        // Validate customer
        const customer = await Customer.findById(orderData.customerId);
        if (!customer) {
          return reject(`Customer ${orderData.customerId} not found`);
        }

        // Validate technicians array
        if (
          !Array.isArray(orderData.technicians) ||
          orderData.technicians.length === 0
        ) {
          return reject("At least one technician is required");
        }

        for (const techId of orderData.technicians) {
          const tech = await Technician.findById(techId);
          if (!tech) return reject(`Technician ${techId} not found`);
        }

        // Validate inventory
        for (const item of orderData.items) {
          const inventory = await Inventory.findById(item.itemId);
          if (!inventory)
            return reject(`Inventory item ${item.itemId} not found`);
          if (inventory.quantity < item.quantity) {
            return reject(`Insufficient quantity for item ${item.itemId}`);
          }
        }

        // Save order
        const newOrder = new Order(orderData);
        const savedOrder = await newOrder.save();

        // Update inventory quantities
        for (const item of orderData.items) {
          await Inventory.findByIdAndUpdate(item.itemId, {
            $inc: { quantity: -item.quantity },
          });
        }

        // Update technician assignments
        const techAssignmentPromises = orderData.technicians.map((techId) => {
          return Technician.findByIdAndUpdate(techId, {
            $push: {
              assignments: {
                orderId: savedOrder._id,
                date: new Date(),
                status: savedOrder.status,
              },
            },
          });
        });

        await Promise.all(techAssignmentPromises);

        // Update customer's orders array
        await Customer.findByIdAndUpdate(orderData.customerId, {
          $push: { orders: savedOrder._id },
        });

        Order.findById(savedOrder._id)
          .populate("customerId")
          .populate("technicians")
          .populate("items.itemId")
          .then((populatedOrder) => {
            console.log("Order created successfully:", populatedOrder);
            resolve(populatedOrder);
          })
          .catch((err) => {
            reject(err);
          });
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
        .populate("technicians")
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
      if (!id) return reject("Order ID is required");

      Order.findById(id)
        .populate("customerId")
        .populate("technicians")
        .populate("items.itemId")
        .then((data) => {
          if (!data) return reject(`Order not found: ${id}`);
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
    return new Promise(async (resolve, reject) => {
      try {
        // Validate order ID
        if (!order || !order._id) {
          return reject("Order ID is required");
        }

        // Ensure the order ID is a valid ObjectId
        if (!mongoose.isValidObjectId(order._id)) {
          return reject(`Invalid Order ID: ${order._id}`);
        }

        // Set updatedAt timestamp (optional, as Mongoose timestamps handle this automatically)
        order.updatedAt = new Date();

        // Find the original order
        const originalOrder = await Order.findById(order._id);
        if (!originalOrder) {
          throw new Error(`Order not found: ${order._id}`);
        }

        // Handle inventory adjustments based on status changes
        if (order.status === "ملغي" && originalOrder.status !== "ملغي") {
          // Return all items to inventory if the order is canceled
          for (const item of originalOrder.items) {
            await Inventory.findByIdAndUpdate(item.itemId, {
              $inc: { quantity: item.quantity },
            });
          }
        } else if (order.status !== "ملغي") {
          // Update inventory based on quantity differences
          const inventoryPromises = order.items.map(async (newItem) => {
            // Find matching item in the original order
            const oldItem = originalOrder.items.find(
              (i) => i.itemId.toString() === newItem.itemId.toString()
            );

            // Calculate quantity difference
            const quantityDiff = oldItem
              ? newItem.quantity - oldItem.quantity
              : newItem.quantity;

            if (quantityDiff !== 0) {
              const inventory = await Inventory.findById(newItem.itemId);
              if (!inventory) {
                throw new Error(`Inventory item ${newItem.itemId} not found`);
              }

              // Check if there is enough quantity in inventory
              if (inventory.quantity < Math.abs(quantityDiff)) {
                throw new Error(
                  `Insufficient quantity for item ${newItem.itemId}`
                );
              }

              // Update inventory
              await Inventory.findByIdAndUpdate(newItem.itemId, {
                $inc: { quantity: -quantityDiff },
              });
            }
          });

          // Wait for all inventory updates to complete
          await Promise.all(inventoryPromises);
        }

        // Handle technician assignments
        const isCompletedOrRejected = ["مكتمل", "ملغي"].includes(order.status);
        const originalTechIds = originalOrder.technicians.map((tech) =>
          tech.toString()
        );
        const newTechIds = order.technicians.map((tech) => tech.toString());

        // Remove assignments for technicians no longer on the order or if the order is completed/rejected
        if (isCompletedOrRejected || originalTechIds.length > 0) {
          const techsToRemove = isCompletedOrRejected
            ? originalTechIds
            : originalTechIds.filter((id) => !newTechIds.includes(id));

          for (const techId of techsToRemove) {
            // Validate technician ID
            if (!mongoose.isValidObjectId(techId)) {
              throw new Error(`Invalid Technician ID: ${techId}`);
            }

            await Technician.findByIdAndUpdate(techId, {
              $pull: { assignments: { orderId: order._id } },
            });
          }
        }

        // Add assignments for new technicians if the order is not completed/rejected
        if (!isCompletedOrRejected) {
          const techsToAdd = newTechIds.filter(
            (id) => !originalTechIds.includes(id)
          );

          for (const techId of techsToAdd) {
            // Validate technician ID
            if (!mongoose.isValidObjectId(techId)) {
              throw new Error(`Invalid Technician ID: ${techId}`);
            }

            await Technician.findByIdAndUpdate(techId, {
              $push: {
                assignments: {
                  orderId: order._id,
                  date: new Date(),
                  status: order.status,
                },
              },
            });
          }

          // Update status for existing technicians
          const techsToUpdate = newTechIds.filter((id) =>
            originalTechIds.includes(id)
          );

          for (const techId of techsToUpdate) {
            // Validate technician ID
            if (!mongoose.isValidObjectId(techId)) {
              throw new Error(`Invalid Technician ID: ${techId}`);
            }

            await Technician.findOneAndUpdate(
              {
                _id: techId,
                "assignments.orderId": order._id,
              },
              {
                $set: { "assignments.$.status": order.status },
              }
            );
          }
        }

        // Save the updated order
        const updatedOrder = await Order.findByIdAndUpdate(order._id, order, {
          new: true,
        })
          .populate("customerId")
          .populate("technicians")
          .populate("items.itemId");

        console.log("Order updated successfully:", updatedOrder);
        resolve(updatedOrder);
      } catch (err) {
        console.error("Error updating order:", err);
        reject(err);
      }
    });
  }

  deleteOrder(id) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!id) return reject("Order ID is required");

        const order = await Order.findById(id);
        if (!order) throw new Error("Order not found");

        // If status is not "مكتمل" (completed) or "ملغي" (canceled), return items to inventory
        if (!["مكتمل", "ملغي"].includes(order.status)) {
          // Return items to inventory
          for (const item of order.items) {
            await Inventory.findByIdAndUpdate(item.itemId, {
              $inc: { quantity: item.quantity },
            });
          }

          // Remove from technician assignments
          for (const techId of order.technicians) {
            await Technician.findByIdAndUpdate(techId, {
              $pull: { assignments: { orderId: order._id } },
            });
          }
        }

        // Remove from customer's orders array
        await Customer.findByIdAndUpdate(order.customerId, {
          $pull: { orders: order._id },
        });

        // Delete the order
        const deletedOrder = await Order.findByIdAndDelete(id);
        console.log("Order deleted successfully:", deletedOrder);
        resolve(deletedOrder);
      } catch (err) {
        console.error("Error deleting order:", err);
        reject(err);
      }
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
        .populate("assignments.orderId")
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
        .populate("assignments.orderId")
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
        .populate("assignments.orderId")
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
        .populate("assignments.orderId")
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
}

module.exports = Database;
