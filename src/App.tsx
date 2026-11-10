import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./lib/firebase";
import {
  InvoiceRecord,
  QueryRecord,
  saveBatchToFirestore,
  saveInvoiceToFirestore,
  getAllUserInvoices,
  getUserQueries,
} from "./lib/invoiceStore";
import { Header } from "./components/Header";
import { StatsOverview } from "./components/StatsOverview";
import { BatchUploader } from "./components/BatchUploader";
import { CfoQueryPanel } from "./components/CfoQueryPanel";
import { InvoiceDataTable } from "./components/InvoiceDataTable";
import { CreditsHelpModal } from "./components/CreditsHelpModal";
import { generate380HotelInvoices } from "./data/sampleHotelInvoices";
import { FileSpreadsheet, Sparkles, Database, CheckCircle, ShieldCheck } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [batchId] = useState<string>(() => `batch-hotel-380-${Date.now().toString().slice(-6)}`);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [queriesHistory, setQueriesHistory] = useState<QueryRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"workspace" | "table">("workspace");

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const storedInvoices = await getAllUserInvoices(user.uid);
          if (storedInvoices && storedInvoices.length > 0) {
            setInvoices(storedInvoices);
          }
          const storedQueries = await getUserQueries(user.uid);
          if (storedQueries && storedQueries.length > 0) {
            setQueriesHistory(storedQueries);
          }
        } catch (err) {
          console.warn("Aviso ao carregar dados do utilizador a partir do Firestore:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const userId = currentUser ? currentUser.uid : "cfo-guest-hotel";

  // 1-Click Load 380 Sample Invoices
  const handleLoadSample380 = async () => {
    setIsProcessing(true);
    const sample380 = generate380HotelInvoices(userId, batchId);
    setInvoices(sample380);

    // Save batch record and sample invoices to Firestore
    try {
      const totalM3 = sample380.reduce((acc, i) => acc + (i.cubicMeters || 0), 0);
      const totalEur = sample380.reduce((acc, i) => acc + (i.totalAmount || 0), 0);

      await saveBatchToFirestore({
        id: batchId,
        name: "Lote Anual 380 Faturas - Grande Hotel & Spa Resort",
        totalFiles: 380,
        processedFiles: 380,
        totalCubicMeters: totalM3,
        totalAmount: totalEur,
        ownerId: userId,
        status: "ready",
        createdAt: new Date().toISOString(),
      });

      // Persist sample batch records in background
      for (let i = 0; i < Math.min(40, sample380.length); i++) {
        saveInvoiceToFirestore(sample380[i]).catch(() => {});
      }
    } catch (e) {
      console.warn("Nota de sincronização do lote no Firestore:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddInvoices = (newInvoices: InvoiceRecord[]) => {
    setInvoices((prev) => [...prev, ...newInvoices]);
  };

  const handleClearBatch = () => {
    if (window.confirm("Pretende limpar o lote atual de faturas?")) {
      setInvoices([]);
      setQueriesHistory([]);
    }
  };

  const handleAddQuery = (q: QueryRecord) => {
    setQueriesHistory((prev) => [q, ...prev]);
  };

  // Export invoices to CSV
  const handleExportCsv = () => {
    if (invoices.length === 0) return;

    const headers = [
      "Numero_Fatura",
      "Fornecedor",
      "Data_Emissao",
      "Periodo_Inicio",
      "Periodo_Fim",
      "Departamento_Hotel",
      "Consumo_Metros_Cubicos_m3",
      "Valor_Total_EUR",
      "Impostos_IVA_EUR",
      "Tipo_Fornecimento",
      "Leitura_Contador",
      "Ficheiro_Original",
    ];

    const rows = invoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.supplierName}"`,
      `"${inv.invoiceDate}"`,
      `"${inv.periodStart || ""}"`,
      `"${inv.periodEnd || ""}"`,
      `"${inv.hotelDepartment || ""}"`,
      inv.cubicMeters,
      inv.totalAmount,
      inv.taxAmount || 0,
      `"${inv.serviceType}"`,
      `"${inv.meterReading || ""}"`,
      `"${inv.fileName}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Auditoria_Faturas_Hotel_${invoices.length}_m3.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        currentUser={currentUser}
        onOpenCredits={() => setIsCreditsModalOpen(true)}
        onExportCsv={handleExportCsv}
        invoicesCount={invoices.length}
        totalCubicMeters={invoices.reduce((acc, i) => acc + (i.cubicMeters || 0), 0)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Intro Banner for the CFO */}
        <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                Direção Financeira
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Auditoria e Extração de Metros Cúbicos (m³)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Carregue o seu lote de 380 a 400 faturas simultâneas à esquerda e faça qualquer pergunta em linguagem natural à direita. O motor Gemini 3.8 Flash examina cada fatura com rigor matemático e guarda os metadados no Firestore.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("workspace")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "workspace"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Espaço de Trabalho & Consulta
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "table"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Tabela Completa ({invoices.length})
            </button>
          </div>
        </div>

        {/* Global Statistics Overview */}
        <StatsOverview invoices={invoices} />

        {/* Core Split Screen: Left (Uploader) & Right (Q&A Panel) */}
        {activeTab === "workspace" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Left Column: Batch Uploader (5 cols) */}
            <div className="lg:col-span-5 flex flex-col">
              <BatchUploader
                invoices={invoices}
                onAddInvoices={handleAddInvoices}
                onClearBatch={handleClearBatch}
                onLoadSample380={handleLoadSample380}
                userId={userId}
                batchId={batchId}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            </div>

            {/* Right Column: Natural Language CFO Query Panel (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <CfoQueryPanel
                invoices={invoices}
                queriesHistory={queriesHistory}
                onAddQuery={handleAddQuery}
                userId={userId}
                batchId={batchId}
              />
            </div>
          </div>
        )}

        {/* Full Data Table */}
        <div className="mt-2 mb-8">
          <InvoiceDataTable invoices={invoices} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">FaturaIntel Hotel CFO</span>
            <span>•</span>
            <span>Base de Dados Firestore: <code className="text-slate-600 dark:text-slate-400">ai-studio-facturas-96797e10-db5b-4a7c-b2e3-99e7e626689e</code></span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Região europe-west2</span>
            </span>
            <span>•</span>
            <span>Modelo: gemini-3.8-flash</span>
          </div>
        </div>
      </footer>

      {/* Credits Help Modal */}
      <CreditsHelpModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
    </div>
  );
}
