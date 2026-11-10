import React, { useState } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  HelpCircle,
  TrendingDown,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Calculator,
} from "lucide-react";
import { InvoiceRecord, QueryRecord, saveQueryRecord } from "../lib/invoiceStore";

interface CfoQueryPanelProps {
  invoices: InvoiceRecord[];
  queriesHistory: QueryRecord[];
  onAddQuery: (q: QueryRecord) => void;
  userId: string;
  batchId: string;
}

export const CfoQueryPanel: React.FC<CfoQueryPanelProps> = ({
  invoices,
  queriesHistory,
  onAddQuery,
  userId,
  batchId,
}) => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sampleQuestions = [
    "Qual é o consumo total de metros cúbicos (m³) em todas as 380 faturas?",
    "Quanto consumiu a Lavandaria Industrial em relação ao Spa?",
    "Quais são as 5 faturas com maior volume de m³ e os respetivos fornecedores?",
    "Qual foi o custo médio ponderado por metro cúbico (€/m³) de água e gás?",
    "Existe algum mês com consumo anómalo ou suspeita de fuga de água?",
  ];

  const handleAsk = async (questionToAsk?: string) => {
    const q = questionToAsk || inputText;
    if (!q.trim() || invoices.length === 0 || isLoading) return;

    setIsLoading(true);

    try {
      // Calculate batch stats
      const totalCubicMeters = invoices.reduce((acc, i) => acc + (i.cubicMeters || 0), 0);
      const totalAmount = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);

      // Map summary of invoices for prompt context
      const invoicesSummary = invoices.map((i) => ({
        fileName: i.fileName,
        supplierName: i.supplierName,
        invoiceNumber: i.invoiceNumber,
        invoiceDate: i.invoiceDate,
        cubicMeters: i.cubicMeters,
        totalAmount: i.totalAmount,
        currency: i.currency,
        serviceType: i.serviceType,
        hotelDepartment: i.hotelDepartment,
      }));

      const res = await fetch("/api/query-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          invoicesSummary,
          totalBatchStats: {
            totalFiles: invoices.length,
            totalCubicMeters,
            totalAmount,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Erro no servidor: ${res.status}`);
      }

      const data = await res.json();

      let formattedAnswer = data.answer || "Não foi possível obter resposta.";
      if (data.highlightNumber) {
        formattedAnswer = `[DESTACADO: ${data.highlightNumber} - ${data.highlightLabel}]\n\n${formattedAnswer}`;
      }

      if (data.breakdown && Array.isArray(data.breakdown) && data.breakdown.length > 0) {
        formattedAnswer += `\n\nDiscriminativo Analítico:\n` + data.breakdown.map((b: any) => `• ${b.label}: ${b.value}`).join("\n");
      }

      if (data.recommendedActions && Array.isArray(data.recommendedActions) && data.recommendedActions.length > 0) {
        formattedAnswer += `\n\nRecomendações para o Diretor Financeiro:\n` + data.recommendedActions.map((a: string) => `→ ${a}`).join("\n");
      }

      const queryRecord: QueryRecord = {
        id: `query-${Date.now()}`,
        question: q,
        answer: formattedAnswer,
        matchedInvoicesCount: invoices.length,
        ownerId: userId,
        batchId,
        createdAt: new Date().toISOString(),
      };

      onAddQuery(queryRecord);

      // Save to Firestore
      try {
        await saveQueryRecord(queryRecord);
      } catch (err) {
        console.warn("Could not save query to Firestore, keeping locally:", err);
      }

      setInputText("");
    } catch (err: any) {
      console.error("Erro ao consultar faturas:", err);
      const errRecord: QueryRecord = {
        id: `query-err-${Date.now()}`,
        question: q,
        answer: `Erro ao analisar as faturas: ${err?.message || "Verifique a ligação ou credenciais."}`,
        matchedInvoicesCount: invoices.length,
        ownerId: userId,
        batchId,
        createdAt: new Date().toISOString(),
      };
      onAddQuery(errRecord);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Perguntar ao Lote de Faturas</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O Gemini 3.8 Flash analisa as 380 faturas e extrai o dado exato
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
          {invoices.length} faturas ativas
        </span>
      </div>

      {/* Suggested Questions */}
      <div className="px-5 py-3 bg-slate-50/40 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Questões Frequentes do Diretor Financeiro (CFO):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleAsk(sq)}
              disabled={isLoading || invoices.length === 0}
              className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" />
              <span className="truncate max-w-[280px]">{sq}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Answers / Conversation Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[520px]">
        {queriesHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              {invoices.length > 0
                ? "Coloque a sua questão sobre o lote de faturas"
                : "Primeiro carregue o lote de 380 faturas"}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Por exemplo: "Qual é o consumo total de metros cúbicos de água?", "Quanto se pagou por m³ em agosto?", ou "Qual o departamento com maior consumo de água?"
            </p>
          </div>
        ) : (
          queriesHistory.map((q) => {
            const highlightMatch = q.answer.match(/\[DESTACADO:\s*(.*?)\s*-\s*(.*?)\]/);
            const cleanAnswer = q.answer.replace(/\[DESTACADO:.*?\]\n\n?/, "");

            return (
              <div
                key={q.id}
                className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
              >
                {/* User question */}
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    CFO
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {q.question}
                  </div>
                </div>

                {/* Highlight metric card if returned by Gemini */}
                {highlightMatch && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-blue-100">
                        {highlightMatch[2]}
                      </div>
                      <div className="text-xl sm:text-2xl font-black tracking-tight">
                        {highlightMatch[1]}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/10 text-white">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                  </div>
                )}

                {/* AI Detailed Answer */}
                <div className="flex items-start gap-2.5 pt-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {cleanAnswer}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-400">
                      <span>
                        Calculado sobre {q.matchedInvoicesCount} faturas analisadas • {new Date(q.createdAt).toLocaleTimeString("pt-PT")}
                      </span>
                      <button
                        onClick={() => copyToClipboard(q.answer, q.id)}
                        className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {copiedId === q.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar relatório</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div>
              <div className="font-semibold">O Gemini 3.8 Flash está a examinar as 380 faturas...</div>
              <p className="text-[11px] text-blue-600/80 dark:text-blue-300/80">
                A calcular consumos volumétricos em m³, somatórios e centros de custo em português de Portugal.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading || invoices.length === 0}
            placeholder={
              invoices.length === 0
                ? "Carregue primeiro as faturas no painel esquerdo..."
                : "Escreva a sua questão (ex.: Qual é o consumo total de metros cúbicos de água?)..."
            }
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || invoices.length === 0}
            className="absolute right-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
