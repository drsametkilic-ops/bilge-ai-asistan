import express from "express";
import mongoose from "mongoose";
import Idea from "../models/Idea.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { title, description, priority, projectId, color } = req.body;
    if (title == null || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title (string) gerekli" });
    }
    const row = await Idea.create({
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      priority: priority != null ? priority : "medium",
      projectId: projectId === null || projectId === "" ? null : String(projectId),
      color: typeof color === "string" ? color : "",
    });
    return res.status(201).json(row);
  } catch (err) {
    console.error("POST /api/ideas:", err);
    return res.status(500).json({ error: "Fikir oluşturulamadı" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const rows = await Idea.find().sort({ createdAt: -1 }).lean();
    return res.json(rows);
  } catch (err) {
    console.error("GET /api/ideas:", err);
    return res.status(500).json({ error: "Liste alınamadı" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Geçersiz kimlik" });
    }
    const { title, description, priority, projectId, color } = req.body;
    const updates = {};
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "title boş olamaz" });
      }
      updates.title = title.trim();
    }
    if (description !== undefined) {
      updates.description = typeof description === "string" ? description.trim() : "";
    }
    if (priority !== undefined) {
      if (!["low", "medium", "high"].includes(priority)) {
        return res.status(400).json({ error: "priority geçersiz" });
      }
      updates.priority = priority;
    }
    if (projectId !== undefined) {
      updates.projectId = projectId === null || projectId === "" ? null : String(projectId);
    }
    if (color !== undefined && typeof color === "string") {
      updates.color = color;
    }
    const row = await Idea.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ error: "Bulunamadı" });
    return res.json(row);
  } catch (err) {
    console.error("PUT /api/ideas/:id:", err);
    return res.status(500).json({ error: "Güncellenemedi" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Geçersiz kimlik" });
    }
    const deleted = await Idea.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Bulunamadı" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/ideas/:id:", err);
    return res.status(500).json({ error: "Silinemedi" });
  }
});

export default router;
