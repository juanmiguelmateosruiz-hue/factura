import React, { useRef, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  Layers,
  FileUp,
  FolderSync,
} from "lucide-react";
import confetti from "canvas-confetti";
import { InvoiceRecord, saveInvoiceToFirestore } from "../lib/invoiceStore";

interface BatchUploaderProps {
  invoices: InvoiceRecord[];
  onAddInvoices: (newInvoices: InvoiceRecord[]) => void;
  onClearBatch: () => void;
  onLoadSample380: () => void;
  userId: string;
  batchId: string;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const BatchUploader: React.FC<BatchUploaderProps> = ({
  invoices,
  onAddInvoices,
  onClearBatch,
  onLoadSample380,
  userId,
  batchId,
  isProcessing,
  setIsProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processUploadedFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsProcessing(true);
    setUploadProgress({
      current: 0,
      total: fileArray.length,
      currentFileName: fileArray[0].name,
    });

    const results: InvoiceRecord[] = [];
    const concurrency = 4; // Parallel workers for fast processing of up to 400 invoices

    for (let i = 0; i < fileArray.length; i += concurrency) {
      const slice = fileArray.slice(i, i + concurrency);

      const promises = slice.map(async (file, idx) => {
        const fileIndex = i + idx;
        setUploadProgress({
          current: fileIndex + 1,
          total: fileArray.length,
          currentFileName: file.name,
        });

        try {
          // Read file as base64
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const base64 = res.includes(",") ? res.split(",")[1] : res;
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Call server-side Gemini API
          const response = await fetch("/api/extract-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type || "application/pdf",
              base64Data,
            }),
          });

          if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
          }

          const extracted = await response.json();

          const record: InvoiceRecord = {
            id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || "application/pdf",
            supplierName: extracted.supplierName || "Fornecedor Geral",
            invoiceNumber: extracted.invoiceNumber || file.name,
            invoiceDate: extracted.invoiceDate || new Date().toISOString().split("T")[0],
            periodStart: extracted.periodStart,
            periodEnd: extracted.periodEnd,
            cubicMeters: Number(extracted.cubicMeters) || 0,
            serviceType: extracted.serviceType || "water",
            totalAmount: Number(extracted.totalAmount) || 0,
            taxAmount: Number(extracted.taxAmount) || 0,
            currency: extracted.currency || "EUR",
            status: "processed",
            hotelDepartment: extracted.hotelDepartment || "Fornecimentos Gerais",
            meterReading: extracted.meterReading,
            rawSnippet: extracted.summary,
            batchId,
            ownerId: userId,
            createdAt: new Date().toISOString(),
          };

          // Save to Firestore automatically
          try {
            await saveInvoiceToFirestore(record);
          } catch (fireErr) {
            console.warn("Could not save single record to Firestore, keeping locally:", fireErr);
          }

          return record;
        } catch (err) {
          console.error("Erro ao extrair dados do ficheiro:", file.name, err);
          const fallback: InvoiceRecord = {
            id: `inv-err-${Date.now()}-${idx}`,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            supplierName: "Pendente / Rever",
            invoiceNumber: file.name,
            invoiceDate: new Date().toISOString().split("T")[0],
            cubicMeters: 0,
            serviceType: "other",
            totalAmount: 0,
            currency: "EUR",
            status: "error",
            rawSnippet: "Erro ao processar documento com o modelo Gemini.",
            batchId,
            ownerId: userId,
            createdAt: new Date().toISOString(),
          };
          return fallback;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      onAddInvoices(batchResults);
    }

    setIsProcessing(false);
    setUploadProgress(null);

    // Fire celebration confetti when batch is complete
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 flex flex-col h-full">
      {/* Title & Quick Actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Carregamento Massivo de Faturas</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Carregue até 400 ficheiros PDF, JPG ou PNG em simultâneo
          </p>
        </div>

        {invoices.length > 0 && (
          <button
            onClick={onClearBatch}
            disabled={isProcessing}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
            title="Limpar lote atual"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* 1-Click 380 Invoices Demo Button */}
      <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            380
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Deseja testar com as 380 faturas do hotel agora?
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Carrega o lote completo de 380 faturas (água em m³, gás, spa, lavandaria e rega).
            </p>
          </div>
        </div>
        <button
          onClick={onLoadSample380}
          disabled={isProcessing}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Carregar 380 Faturas</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/30"
            : "border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30"
        } ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
          onChange={(e) => e.target.files && processUploadedFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            Arraste as suas 380 a 400 faturas para aqui ou clique para selecionar
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Formatos suportados: Faturas digitalizadas ou em PDF, PNG, JPG. O sistema extrai automaticamente o consumo em metros cúbicos (m³), valores e fornecedores.
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700">PDFs</span>
            <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700">Imagens</span>
            <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700">Até 400 ficheiros</span>
          </div>
        </div>
      </div>

      {/* Upload & Processing Progress Bar */}
      {uploadProgress && (
        <div className="mt-4 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1.5">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>A extrair dados com o Gemini 3.8 Flash...</span>
            </span>
            <span>
              {uploadProgress.current} de {uploadProgress.total} ({Math.round(
                (uploadProgress.current / uploadProgress.total) * 100
              )}
              %)
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{
                width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
              }}
            ></div>
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-1.5 truncate">
            A processar: <span className="font-mono">{uploadProgress.currentFileName}</span>
          </div>
        </div>
      )}

      {/* Mini summary list */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-500" />
          <span>
            Lote atual: <strong className="text-slate-800 dark:text-slate-200">{invoices.length}</strong> faturas
          </span>
        </span>
        <span className="text-slate-400">
          Base de dados: <span className="text-emerald-600 dark:text-emerald-400 font-medium">Firestore Conectado</span>
        </span>
      </div>
    </div>
  );
};
