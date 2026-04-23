import mongoose from "mongoose";

/**
 * MongoDB bağlantısı — `MONGO_URI` ortam değişkeni gerekli.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri || typeof uri !== "string" || !uri.trim()) {
    throw new Error("MONGO_URI tanımlı değil (.env içinde ayarlayın)");
  }
  try {
    await mongoose.connect(uri.trim(), {
      serverSelectionTimeoutMS: 10_000,
    });
    const conn = mongoose.connection;
    console.log(
      `MongoDB bağlantısı kuruldu → veritabanı: "${conn.name}", host: ${conn.host ?? "?"}`
    );
  } catch (err) {
    console.error("MongoDB bağlantı hatası:", err);
    throw err;
  }
}
