import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: "" },
  workStatus: {
    type: String,
    enum: ["todo", "in_progress", "done", "deferred"],
    default: "todo",
  },
  color: { type: String, default: "#64748b" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Project", projectSchema);
