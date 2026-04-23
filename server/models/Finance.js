import mongoose from "mongoose";

const financeSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
  date: { type: String, trim: true, default: "" },
  note: { type: String, trim: true, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Finance", financeSchema);
