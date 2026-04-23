import express from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";

const router = express.Router();

/**
 * POST /api/tasks
 */
router.post("/", async (req, res) => {
  try {
    const { title, date, time, description, completed } = req.body;
    if (title == null || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title (string) gerekli" });
    }
    const task = await Task.create({
      title: title.trim(),
      date: typeof date === "string" ? date.trim() : "",
      time: typeof time === "string" ? time.trim() : "",
      description: typeof description === "string" ? description.trim() : "",
      completed: typeof completed === "boolean" ? completed : false,
    });
    return res.status(201).json(task);
  } catch (err) {
    console.error("POST /api/tasks:", err);
    return res.status(500).json({ error: "Görev oluşturulamadı" });
  }
});

/**
 * GET /api/tasks
 */
router.get("/", async (_req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    return res.json(tasks);
  } catch (err) {
    console.error("GET /api/tasks:", err);
    return res.status(500).json({ error: "Görevler listelenemedi" });
  }
});

/**
 * PUT /api/tasks/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Geçersiz görev kimliği" });
    }
    const { title, completed } = req.body;
    const updates = {};
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "title boş olamaz" });
      }
      updates.title = title.trim();
    }
    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({ error: "completed boolean olmalı" });
      }
      updates.completed = completed;
    }
    const task = await Task.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!task) {
      return res.status(404).json({ error: "Görev bulunamadı" });
    }
    return res.json(task);
  } catch (err) {
    console.error("PUT /api/tasks/:id:", err);
    return res.status(500).json({ error: "Görev güncellenemedi" });
  }
});

/**
 * DELETE /api/tasks/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Geçersiz görev kimliği" });
    }
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Görev bulunamadı" });
    }
    return res.json({ ok: true, removed: deleted._id });
  } catch (err) {
    console.error("DELETE /api/tasks/:id:", err);
    return res.status(500).json({ error: "Görev silinemedi" });
  }
});

export default router;
