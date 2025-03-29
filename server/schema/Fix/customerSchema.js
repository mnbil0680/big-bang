const mongoose = require("mongoose");

// Customer Schema
const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      match: /^966\d{9}$/, // Saudi Arabia phone format
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    address: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["individual", "company"],
      required: true,
      default: "individual",
    },
    companyDetails: {
      registrationNumber: String,
      taxNumber: String,
      industry: String,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order", // Reference to the Order collection
      },
    ],
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
customerSchema.index({ name: "text" });
customerSchema.index({ "companyDetails.registrationNumber": 1 });

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
