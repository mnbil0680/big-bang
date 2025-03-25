const mongoose = require("mongoose");
const Client = require("./schema/clientSchema");
const Product = require("./schema/productSchema");
const Currency = require("./schema/currencySchema");
const Rule = require("./schema/rulesSchema");
const Show = require("./schema/showSchema");

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

module.exports = Database;
