import type { Plugin } from "vite";
import { extractInvoiceData, askInvoicesQuery } from "./geminiService";

export function viteApiPlugin(): Plugin {
  return {
    name: "vite-api-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host}`);

        // Helper to parse JSON body
        const readBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", () => {
              const raw = Buffer.concat(chunks).toString("utf-8");
              if (!raw || raw.trim().length === 0) {
                resolve({});
                return;
              }
              try {
                resolve(JSON.parse(raw));
              } catch (err) {
                reject(err);
              }
            });
            req.on("error", reject);
          });
        };

        const sendJson = (status: number, data: any) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        };

        try {
          if (url.pathname === "/api/health" && req.method === "GET") {
            return sendJson(200, {
              status: "ok",
              hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
              timestamp: new Date().toISOString(),
            });
          }

          if (url.pathname === "/api/extract-invoice" && req.method === "POST") {
            const body = await readBody();
            const { fileName, mimeType, base64Data, textData } = body;

            if (!fileName) {
              return sendJson(400, { error: "El parámetro fileName es obligatorio." });
            }

            const result = await extractInvoiceData({
              fileName,
              mimeType: mimeType || "application/pdf",
              base64Data,
              textData,
            });

            return sendJson(200, result);
          }

          if (url.pathname === "/api/query-invoices" && req.method === "POST") {
            const body = await readBody();
            const { question, invoicesSummary, totalBatchStats } = body;

            if (!question) {
              return sendJson(400, { error: "La pregunta es requerida." });
            }

            const answerResult = await askInvoicesQuery({
              question,
              invoicesSummary: invoicesSummary || [],
              totalBatchStats: totalBatchStats || {
                totalFiles: invoicesSummary?.length || 0,
                totalCubicMeters: 0,
                totalAmount: 0,
              },
            });

            return sendJson(200, answerResult);
          }

          // Not found api
          return sendJson(404, { error: `Endpoint ${url.pathname} no encontrado.` });
        } catch (error: any) {
          console.error("API error handling:", error);
          return sendJson(500, {
            error: error?.message || "Error interno en el procesamiento de la factura.",
          });
        }
      });
    },
  };
}
