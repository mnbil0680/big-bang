const mongoose = require("mongoose");

// Helper to get tomorrow's date
const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

// Order Schema (for both maintenance and installation)
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ["عالية", "متوسطة", "منخفضة"],
    },
    deviceType: {
      type: String,
      required: true,
      trim: true,
    },
    estimatedCost: {
      type: Number,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
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
    scheduledDate: {
      type: Date,
      default: getTomorrow,
    },
    completionDate: {
      type: Date,
      default: null,
    },

    technicians: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Technician",
        required: true,
      },
    ],

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

// Indexes for performance
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: 1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
