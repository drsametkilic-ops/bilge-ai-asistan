import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "title zorunludur"],
    trim: true,
  },
  date: {
    type: String,
    trim: true,
    default: "",
  },
  time: {
    type: String,
    trim: true,
    default: "",
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  completed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Task", taskSchema);
