const mongoose = require("mongoose");

// Order Schema (for both maintenance and installation)
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    type: {
      type: String,
      enum: ["صيانة", "تركيب"],
      required: true,
    },
    status: {
      type: String,
      enum: ["جديد", "قيد المعالجة", "مكتمل", "ملغي"],
      default: "جديد",
    },
    description: String,
    scheduledDate: Date,
    completionDate: Date,
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["معلق", "جزئى", "مكتمل"],
      default: "معلق",
    },
    notes: String,
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Add index for better query performance
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: 1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
