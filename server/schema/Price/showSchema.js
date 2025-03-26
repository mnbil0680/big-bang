const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "معرّف العميل مطلوب"],
    },
    rules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rule",
      },
    ],
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    title: {
      type: String,
      required: [true, "عنوان العرض مطلوب"],
      trim: true,
      maxlength: [50, "لا يمكن أن يتجاوز عنوان العرض 50 حرفًا"],
    },
    status: {
      type: String,
      enum: ["draft", "active", "expired", "completed"],
      default: "draft",
    },
  },
  { timestamps: true }
);

// تحقق من أن العميل موجود
showSchema.path("clientId").validate(async function (value) {
  const client = await mongoose.model("Client").findById(value);
  return !!client;
}, "العميل غير موجود");

// تحقق من أن هناك على الأقل قاعدة واحدة
showSchema.path("rules").validate(function (value) {
  return value.length > 0;
}, "يجب إضافة قاعدة واحدة على الأقل");

// تحقق من أن هناك على الأقل منتج واحد
showSchema.path("products").validate(function (value) {
  return value.length > 0;
}, "يجب إضافة منتج واحد على الأقل");

// فهرس لتحسين الاستعلامات المتكررة
showSchema.index({ clientId: 1, status: 1 });

module.exports = mongoose.model("Show", showSchema);
