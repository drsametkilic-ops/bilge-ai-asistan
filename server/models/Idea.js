import mongoose from "mongoose";

const ideaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: "" },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  projectId: { type: String, default: null },
  color: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Idea", ideaSchema);
