import express from "express";
import path from "path";
import dotenv from "dotenv";
import { extractInvoiceData, askInvoicesQuery } from "./src/server/geminiService";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Body limit of 50MB for batch/large invoice uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API routes
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/extract-invoice", async (req, res) => {
  try {
    const { fileName, mimeType, base64Data, textData } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: "El parámetro fileName es obligatorio." });
    }
    const result = await extractInvoiceData({
      fileName,
      mimeType: mimeType || "application/pdf",
      base64Data,
      textData,
    });
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/extract-invoice:", error);
    return res.status(500).json({ error: error?.message || "Error procesando factura" });
  }
});

app.post("/api/query-invoices", async (req, res) => {
  try {
    const { question, invoicesSummary, totalBatchStats } = req.body;
    if (!question) {
      return res.status(400).json({ error: "La pregunta es requerida." });
    }
    const result = await askInvoicesQuery({
      question,
      invoicesSummary: invoicesSummary || [],
      totalBatchStats: totalBatchStats || {
        totalFiles: invoicesSummary?.length || 0,
        totalCubicMeters: 0,
        totalAmount: 0,
      },
    });
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/query-invoices:", error);
    return res.status(500).json({ error: error?.message || "Error analizando facturas" });
  }
});

// Serve static assets in production
const distPath = path.resolve(process.cwd(), "dist");
app.use(express.static(distPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`FacturaIntel Hotel CFO Server running on port ${PORT}`);
});
