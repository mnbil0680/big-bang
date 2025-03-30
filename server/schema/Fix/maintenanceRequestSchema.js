const mongoose = require("mongoose");

const maintenanceRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    required: true,
    unique: true,
    // Format: MR001, MR002, etc.
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  deviceType: {
    type: String,
    required: true,
    trim: true,
  },
  priority: {
    type: String,
    required: true,
    enum: ["عالية", "متوسطة", "منخفضة"],
  },
  status: {
    type: String,
    required: true,
    enum: ["جديد", "قيد المعالجة", "مكتمل", "ملغي"],
    default: "جديد",
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Technician",
  },
  description: {
    type: String,
    trim: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  updatedDate: {
    type: Date,
    default: Date.now,
  },
  // Additional useful fields
  estimatedCost: {
    type: Number,
    min: 0,
  },
  completionDate: {
    type: Date,
  },
  partsUsed: [
    {
      partId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
      },
      quantity: {
        type: Number,
        min: 1,
      },
    },
  ],
  notes: [
    {
      content: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Auto-update the updatedDate on save
maintenanceRequestSchema.pre("save", function (next) {
  this.updatedDate = new Date();
  next();
});

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
