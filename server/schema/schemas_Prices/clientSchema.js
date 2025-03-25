const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "الاسم مطلوب"],
      trim: true,
      minlength: [2, "يجب أن يكون الاسم على الأقل مكونًا من حرفين"],
      maxlength: [100, "لا يمكن أن يتجاوز الاسم 100 حرف"],
    },
    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      trim: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "يرجى إدخال عنوان بريد إلكتروني صالح"],
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
    },
    phone: {
      type: String,
      required: [true, "رقم الهاتف مطلوب"],
      trim: true,
      match: [
        /^\+?\d{10,15}$/,
        "يجب أن يحتوي رقم الهاتف على 10 إلى 15 رقمًا (مع إمكانية وجود + في البداية)",
      ],
    },
    taxNumber: {
      type: String,
      trim: true,
      sparse: true,
      match: [
        /^\d{15}$/,
        "يجب أن يكون الرقم الضريبي مكونًا من 15 رقمًا بالضبط",
      ],
    },
  },
  { timestamps: true }
);

// فهرس لتحسين الاستعلامات المتكررة
clientSchema.index({ email: 3 });

module.exports = mongoose.model("Client", clientSchema);
