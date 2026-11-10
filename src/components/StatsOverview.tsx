import React from "react";
import {
  Droplets,
  Coins,
  FileCheck2,
  TrendingUp,
  Flame,
  Gauge,
  Layers,
} from "lucide-react";
import { InvoiceRecord } from "../lib/invoiceStore";

interface StatsOverviewProps {
  invoices: InvoiceRecord[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ invoices }) => {
  const totalInvoices = invoices.length;

  const totalCubicMeters = invoices.reduce((acc, inv) => acc + (inv.cubicMeters || 0), 0);
  const totalAmount = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

  const waterInvoices = invoices.filter((i) => i.serviceType === "water");
  const gasInvoices = invoices.filter((i) => i.serviceType === "gas");

  const waterM3 = waterInvoices.reduce((acc, i) => acc + (i.cubicMeters || 0), 0);
  const gasM3 = gasInvoices.reduce((acc, i) => acc + (i.cubicMeters || 0), 0);

  const avgCostPerM3 = totalCubicMeters > 0 ? totalAmount / totalCubicMeters : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Métrica 1: Consumo Total em m³ */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/15 relative overflow-hidden">
        <div className="absolute right-2 -bottom-2 opacity-15 pointer-events-none">
          <Droplets className="w-24 h-24" />
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-100">
            Consumo Total m³
          </span>
          <div className="p-1 rounded-lg bg-white/20">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
          {totalCubicMeters.toLocaleString("pt-PT", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{" "}
          <span className="text-base sm:text-lg font-bold text-blue-100">m³</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-blue-100/90 font-medium">
          <span>Água: {waterM3.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} m³</span>
          <span>•</span>
          <span>Gás: {gasM3.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} m³</span>
        </div>
      </div>

      {/* Métrica 2: Total Faturado */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5 text-slate-500 dark:text-slate-400">
          <span className="text-xs uppercase font-bold tracking-wider">
            Total Faturado (€)
          </span>
          <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
          {totalAmount.toLocaleString("pt-PT", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          })}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Média por fatura:{" "}
          <strong className="text-slate-700 dark:text-slate-300">
            {totalInvoices > 0
              ? (totalAmount / totalInvoices).toLocaleString("pt-PT", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                })
              : "0 €"}
          </strong>
        </div>
      </div>

      {/* Métrica 3: Custo por m³ */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5 text-slate-500 dark:text-slate-400">
          <span className="text-xs uppercase font-bold tracking-wider">
            Custo Médio / m³
          </span>
          <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
          {avgCostPerM3.toLocaleString("pt-PT", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          <span className="text-sm font-semibold text-slate-500">€ / m³</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Eficiência volumétrica do resort hoteleiro
        </div>
      </div>

      {/* Métrica 4: Total de Faturas no Lote */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5 text-slate-500 dark:text-slate-400">
          <span className="text-xs uppercase font-bold tracking-wider">
            Faturas no Lote
          </span>
          <div className="p-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
            <FileCheck2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1 flex items-baseline gap-2">
          <span>{totalInvoices}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            100% Auditadas
          </span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Sincronizado com o Firestore em tempo real</span>
        </div>
      </div>
    </div>
  );
};
