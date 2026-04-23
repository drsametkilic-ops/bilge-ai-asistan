import express from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, description, workStatus, color } = req.body;
    if (name == null || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name (string) gerekli" });
    }
    const row = await Project.create({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      workStatus: workStatus != null ? workStatus : "todo",
      color: typeof color === "string" && color ? color : "#64748b",
    });
    return res.status(201).json(row);
  } catch (err) {
    console.error("POST /api/projects:", err);
    return res.status(500).json({ error: "Proje oluşturulamadı" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const rows = await Project.find().sort({ createdAt: -1 }).lean();
    return res.json(rows);
  } catch (err) {
    console.error("GET /api/projects:", err);
    return res.status(500).json({ error: "Liste alınamadı" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Geçersiz kimlik" });
    }
    const { name, description, workStatus, color } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "name boş olamaz" });
      }
      updates.name = name.trim();
    }
    if (description !== undefined) {
      updates.description = typeof description === "string" ? description.trim() : "";
    }
    if (workStatus !== undefined) {
      const ws = ["todo", "in_progress", "done", "deferred"];
      if (!ws.includes(workStatus)) {
        return res.status(400).json({ error: "Geçersiz workStatus" });
      }
      updates.workStatus = workStatus;
    }
    if (color !== undefined && typeof color === "string") {
      updates.color = color;
    }
    const row = await Project.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ error: "Bulunamadı" });
    return res.json(row);
  } catch (err) {
    console.error("PUT /api/projects/:id:", err);
    return res.status(500).json({ error: "Güncellenemedi" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Geçersiz kimlik" });
    }
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Bulunamadı" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/projects/:id:", err);
    return res.status(500).json({ error: "Silinemedi" });
  }
});

export default router;
