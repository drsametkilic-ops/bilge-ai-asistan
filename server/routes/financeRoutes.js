import express from "express";
import mongoose from "mongoose";
import Finance from "../models/Finance.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { amount, type, date, note } = req.body;
    const n = typeof amount === "number" ? amount : Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      return res.status(400).json({ error: "amount pozitif sayı olmalı" });
    }
    if (type !== "income" && type !== "expense") {
      return res.status(400).json({ error: "type: income veya expense" });
    }
    const row = await Finance.create({
      amount: n,
      type,
      date: typeof date === "string" ? date.trim() : "",
      note: typeof note === "string" ? note.trim() : "",
    });
    return res.status(201).json(row);
  } catch (err) {
    console.error("POST /api/finance:", err);
    return res.status(500).json({ error: "Kayıt oluşturulamadı" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const rows = await Finance.find().sort({ createdAt: -1 }).lean();
    return res.json(rows);
  } catch (err) {
    console.error("GET /api/finance:", err);
    return res.status(500).json({ error: "Liste alınamadı" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Geçersiz kimlik" });
    }
    const { amount, type, date, note } = req.body;
    const updates = {};
    if (amount !== undefined) {
      const n = typeof amount === "number" ? amount : Number(amount);
      if (!Number.isFinite(n) || n <= 0) {
        return res.status(400).json({ error: "amount pozitif olmalı" });
      }
      updates.amount = n;
    }
    if (type !== undefined) {
      if (type !== "income" && type !== "expense") {
        return res.status(400).json({ error: "type: income veya expense" });
      }
      updates.type = type;
    }
    if (date !== undefined) {
      updates.date = typeof date === "string" ? date.trim() : "";
    }
    if (note !== undefined) {
      updates.note = typeof note === "string" ? note.trim() : "";
    }
    const row = await Finance.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ error: "Bulunamadı" });
    return res.json(row);
  } catch (err) {
    console.error("PUT /api/finance/:id:", err);
    return res.status(500).json({ error: "Güncellenemedi" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Geçersiz kimlik" });
    }
    const deleted = await Finance.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Bulunamadı" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/finance/:id:", err);
    return res.status(500).json({ error: "Silinemedi" });
  }
});

export default router;
