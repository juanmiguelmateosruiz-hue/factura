import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Droplets,
  Flame,
  FileText,
  Calendar,
  Building,
  Eye,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { InvoiceRecord } from "../lib/invoiceStore";

interface InvoiceDataTableProps {
  invoices: InvoiceRecord[];
  onDeleteInvoice?: (id: string) => void;
}

export const InvoiceDataTable: React.FC<InvoiceDataTableProps> = ({ invoices, onDeleteInvoice }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"cubicMeters" | "totalAmount" | "invoiceDate">("cubicMeters");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  // Departments list for dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.hotelDepartment) set.add(inv.hotelDepartment);
    });
    return Array.from(set);
  }, [invoices]);

  // Filter and sort
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch =
          inv.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (inv.hotelDepartment && inv.hotelDepartment.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesService = serviceFilter === "all" || inv.serviceType === serviceFilter;
        const matchesDept = departmentFilter === "all" || inv.hotelDepartment === departmentFilter;

        return matchesSearch && matchesService && matchesDept;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];
        if (sortBy === "invoiceDate") {
          valA = new Date(valA).getTime() || 0;
          valB = new Date(valB).getTime() || 0;
        }
        if (sortOrder === "desc") {
          return valB > valA ? 1 : -1;
        } else {
          return valA > valB ? 1 : -1;
        }
      });
  }, [invoices, searchTerm, serviceFilter, departmentFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (column: "cubicMeters" | "totalAmount" | "invoiceDate") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Lista Discriminada de Faturas ({filteredInvoices.length})</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Procurar fatura, fornecedor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
            />
          </div>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">Todos os Fornecimentos</option>
            <option value="water">Água Potável (m³)</option>
            <option value="gas">Gás Natural (m³)</option>
            <option value="electricity">Eletricidade</option>
          </select>

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden max-w-[160px] truncate"
            >
              <option value="all">Todos os Departamentos</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value={15}>15 por pág</option>
            <option value={30}>30 por pág</option>
            <option value={60}>60 por pág</option>
            <option value={100}>100 por pág</option>
            <option value={380}>Ver todas as 380</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Fatura / Fornecedor</th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                onClick={() => toggleSort("invoiceDate")}
              >
                <div className="flex items-center gap-1">
                  <span>Data</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3">Departamento Hotel</th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-bold bg-blue-50/60 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200"
                onClick={() => toggleSort("cubicMeters")}
              >
                <div className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Consumo (m³)</span>
                  <ArrowUpDown className="w-3 h-3 text-blue-600" />
                </div>
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                onClick={() => toggleSort("totalAmount")}
              >
                <div className="flex items-center gap-1">
                  <span>Total (€)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  Nenhuma fatura encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{inv.invoiceNumber}</span>
                      {inv.serviceType === "water" ? (
                        <span className="p-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          <Droplets className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                          <Flame className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                      {inv.supplierName}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    <div>{inv.invoiceDate}</div>
                    {inv.periodStart && (
                      <div className="text-[10px] text-slate-400">
                        {inv.periodStart} a {inv.periodEnd}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {inv.hotelDepartment || "Geral"}
                    </span>
                  </td>
                  {/* Highlighted m³ metric required by CFO */}
                  <td className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/80 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold font-mono">
                      <span>
                        {inv.cubicMeters.toLocaleString("pt-PT", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </span>
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        m³
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {inv.totalAmount.toLocaleString("pt-PT", {
                      style: "currency",
                      currency: inv.currency || "EUR",
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                      title="Ver auditoria da fatura"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
        <div>
          A mostrar{" "}
          <strong className="text-slate-700 dark:text-slate-200">
            {paginatedInvoices.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </strong>{" "}
          -{" "}
          <strong className="text-slate-700 dark:text-slate-200">
            {Math.min(currentPage * pageSize, filteredInvoices.length)}
          </strong>{" "}
          de{" "}
          <strong className="text-slate-700 dark:text-slate-200">
            {filteredInvoices.length}
          </strong>{" "}
          faturas
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-2">
            Pág. {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Auditoria da Fatura: {selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">{selectedInvoice.fileName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Highlighted m³ reading */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-100">
                    Consumo Auditado (m³)
                  </div>
                  <div className="text-2xl font-black">
                    {selectedInvoice.cubicMeters.toLocaleString("pt-PT", {
                      minimumFractionDigits: 1,
                    })}{" "}
                    m³
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-100">
                    Valor Total
                  </div>
                  <div className="text-xl font-bold">
                    {selectedInvoice.totalAmount.toLocaleString("pt-PT", {
                      style: "currency",
                      currency: selectedInvoice.currency || "EUR",
                    })}
                  </div>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] block">Fornecedor</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedInvoice.supplierName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Departamento Atribuído</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedInvoice.hotelDepartment || "Geral"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Data de Faturação</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedInvoice.invoiceDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Período de Consumo</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedInvoice.periodStart || "N/D"} a {selectedInvoice.periodEnd || "N/D"}
                  </span>
                </div>
              </div>

              {/* Meter readings */}
              {selectedInvoice.meterReading && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                    Leituras do Contador Registadas:
                  </span>
                  {selectedInvoice.meterReading}
                </div>
              )}

              {/* Raw snippet / Gemini notes */}
              {selectedInvoice.rawSnippet && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                    Resumo de Auditoria Extraído:
                  </span>
                  {selectedInvoice.rawSnippet}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
