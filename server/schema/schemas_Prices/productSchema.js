const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: [true, "رمز المنتج مطلوب"],
      trim: true,
      uppercase: true,
      minlength: [3, "يجب أن يكون رمز المنتج على الأقل 3 أحرف"],
      maxlength: [20, "لا يمكن أن يتجاوز رمز المنتج 20 حرفًا"],
    },
    productTitle: {
      type: String,
      required: [true, "عنوان المنتج مطلوب"],
      trim: true,
      minlength: [3, "يجب أن يكون عنوان المنتج على الأقل 3 أحرف"],
      maxlength: [100, "لا يمكن أن يتجاوز عنوان المنتج 100 حرف"],
    },
    productDescription: {
      type: String,
      trim: true,
      maxlength: [500, "لا يمكن أن يتجاوز وصف المنتج 500 حرف"],
      default: "",
    },
    productPrice: {
      type: Number,
      required: [true, "سعر المنتج مطلوب"],
      min: [0.01, "يجب أن يكون سعر المنتج أكبر من 0"],
    },
  },
  { timestamps: true }
);

// فهرس لتحسين الاستعلامات المتكررة
productSchema.index({ productCode: 1 });

module.exports = mongoose.model("Product", productSchema);
