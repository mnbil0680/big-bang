const mongoose = require("mongoose");

const currencySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Currency code is required"],
      trim: true,
      unique: true,
      uppercase: true,
      minlength: [3, "Currency code must be exactly 3 characters"],
      maxlength: [3, "Currency code must be exactly 3 characters"],
      match: [
        /^[A-Z]{3}$/,
        "Currency code must be a 3-letter ISO 4217 code (e.g., SAR)",
      ],
    },
    name: {
      type: String,
      required: [true, "Currency name is required"],
      trim: true,
      maxlength: [50, "Currency name cannot exceed 50 characters"],
    },
    symbol: {
      type: String,
      required: [true, "Currency symbol is required"],
      trim: true,
      maxlength: [5, "Currency symbol must not exceed 5 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    decimalPlaces: {
      type: Number,
      default: 2,
      min: [0, "Decimal places cannot be negative"],
      max: [4, "Decimal places cannot exceed 4"],
    },
    baseCurrency: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{3}$/, "Base currency must be a 3-letter ISO 4217 code"],
      default: "USD",
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, "Country name cannot exceed 100 characters"],
      match: [
        /^[A-Za-z\u0621-\u064A\s]+$/,
        "Country must contain only letters and spaces (Arabic or English)",
      ],
    },
  },
  { timestamps: true }
);

currencySchema.virtual("formattedExample").get(function () {
  const amount = (1234.56).toFixed(this.decimalPlaces);
  return `${this.symbol} ${amount}`;
});

currencySchema.index({ code: 1 });

module.exports = mongoose.model("Currency", currencySchema);
