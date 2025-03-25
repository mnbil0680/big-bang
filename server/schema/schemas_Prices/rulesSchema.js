const mongoose = require("mongoose");

const rulesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "العنوان مطلوب"],
      trim: true,
      maxlength: [50, "لا يمكن أن يتجاوز العنوان 50 حرفًا"],
    },
    description: {
      type: String,
      required: [true, "الوصف مطلوب"],
      trim: true,
      maxlength: [500, "لا يمكن أن يتجاوز الوصف 500 حرف"],
    },
    category: {
      type: String,
      enum: [
        "payment",
        "delivery",
        "warranty",
        "cancellation",
        "general",
        "custom",
      ],
      default: "general",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
      min: [0, "لا يمكن أن تكون الأولوية رقمًا سالبًا"],
    },
  },
  { timestamps: true }
);

rulesSchema.index({ title: 1, category: 1 });

module.exports = mongoose.model("Rule", rulesSchema);
