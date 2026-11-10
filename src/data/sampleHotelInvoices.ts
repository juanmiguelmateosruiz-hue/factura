import { InvoiceRecord } from "../lib/invoiceStore";

const suppliers = [
  { name: "EPAL - Empresa Portuguesa das Águas Livres", service: "water", baseM3: 620, baseEurM3: 2.15 },
  { name: "Águas do Porto, EM (Água Potável)", service: "water", baseM3: 780, baseEurM3: 2.28 },
  { name: "Indaqua Saneamento e Abastecimento", service: "water", baseM3: 490, baseEurM3: 1.98 },
  { name: "Águas do Tejo Atlântico (Rede Hídrica)", service: "water", baseM3: 540, baseEurM3: 2.05 },
  { name: "Galp Gás Natural (Aquecimento Central)", service: "gas", baseM3: 1150, baseEurM3: 1.18 },
  { name: "EDP Gás Distribuição (Cozinhas & Caldeiras)", service: "gas", baseM3: 920, baseEurM3: 1.22 },
];

const departments = [
  "Lavandaria Industrial e Rouparia",
  "Spa & Piscinas Hidrotermais",
  "Quartos e Pisos (1 a 8)",
  "Cozinha Central, Buffet e Eventos",
  "Jardins, Espaços Verdes e Rega",
  "Sistemas AVAC e Climatização",
];

export function generate380HotelInvoices(ownerId: string, batchId: string): InvoiceRecord[] {
  const invoices: InvoiceRecord[] = [];
  const months = [
    { name: "Janeiro 2024", days: 31, factor: 0.82 },
    { name: "Fevereiro 2024", days: 29, factor: 0.85 },
    { name: "Março 2024", days: 31, factor: 0.92 },
    { name: "Abril 2024", days: 30, factor: 1.05 },
    { name: "Maio 2024", days: 31, factor: 1.18 },
    { name: "Junho 2024", days: 30, factor: 1.38 },
    { name: "Julho 2024 (Época Alta)", days: 31, factor: 1.72 },
    { name: "Agosto 2024 (Ocupação Máxima)", days: 31, factor: 1.85 },
    { name: "Setembro 2024", days: 30, factor: 1.34 },
    { name: "Outubro 2024", days: 31, factor: 1.08 },
    { name: "Novembro 2024", days: 30, factor: 0.88 },
    { name: "Dezembro 2024 (Fim de Ano)", days: 31, factor: 1.15 },
  ];

  // Exactly 380 invoices: 12 months * 31 or 32 invoices per month
  const targetTotal = 380;
  let idCounter = 1;

  for (let m = 0; m < months.length && idCounter <= targetTotal; m++) {
    const month = months[m];
    const monthIndex = m + 1;
    const monthStr = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;

    // Calculate how many invoices this month needs to hit exactly 380
    const remainingInvoices = targetTotal - idCounter + 1;
    const remainingMonths = months.length - m;
    const invoicesThisMonth = Math.min(
      remainingInvoices,
      Math.ceil(remainingInvoices / remainingMonths)
    );

    for (let i = 0; i < invoicesThisMonth && idCounter <= targetTotal; i++) {
      const sup = suppliers[(idCounter - 1) % suppliers.length];
      const dept = departments[(idCounter - 1) % departments.length];
      const day = Math.min(month.days, Math.floor((i / invoicesThisMonth) * (month.days - 1)) + 1);
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const invNum = `FAT-2024-${String(idCounter).padStart(4, "0")}`;

      // Weight multiplier based on department
      const deptMultiplier = dept.includes("Lavandaria")
        ? 1.45
        : dept.includes("Spa")
        ? 1.35
        : dept.includes("Jardins")
        ? month.factor > 1.2 ? 1.7 : 0.5
        : dept.includes("Quartos")
        ? 1.25
        : 1.0;

      const randomJitter = 0.88 + Math.random() * 0.28;
      const m3 = Math.round(sup.baseM3 * month.factor * deptMultiplier * randomJitter * 10) / 10;
      const subtotal = Math.round(m3 * sup.baseEurM3 * 100) / 100;
      const taxRate = sup.service === "water" ? 0.06 : 0.23; // IVA em Portugal: 6% água, 23% gás/eletricidade
      const tax = Math.round(subtotal * taxRate * 100) / 100;
      const totalAmount = Math.round((subtotal + tax) * 100) / 100;

      const meterPrev = 15000 + idCounter * 380;
      const meterCurr = meterPrev + Math.round(m3);

      const invoice: InvoiceRecord = {
        id: `inv-${batchId}-${String(idCounter).padStart(4, "0")}`,
        fileName: `${invNum}_${sup.name.split(" ")[0]}_${dept.split(" ")[0]}_2024-${monthStr}.pdf`,
        fileSize: Math.floor(115000 + Math.random() * 95000),
        fileType: "application/pdf",
        supplierName: sup.name,
        invoiceNumber: invNum,
        invoiceDate: `2024-${monthStr}-${dayStr}`,
        periodStart: `2024-${monthStr}-01`,
        periodEnd: `2024-${monthStr}-${month.days}`,
        cubicMeters: m3,
        serviceType: sup.service as any,
        totalAmount,
        taxAmount: tax,
        currency: "EUR",
        status: "processed",
        hotelDepartment: dept,
        meterReading: `Leitura anterior: ${meterPrev.toLocaleString("pt-PT")} m³ | Leitura atual: ${meterCurr.toLocaleString("pt-PT")} m³ | Volume: ${m3.toLocaleString("pt-PT")} m³`,
        rawSnippet: `Fatura ${invNum} emitida por ${sup.name}. Consumo volumétrico auditado: ${m3.toFixed(1)} m³ imputado a ${dept}. Valor total com IVA: ${totalAmount.toFixed(2)} € (IVA de ${tax.toFixed(2)} €).`,
        batchId,
        ownerId,
        createdAt: new Date(2024, m, day, 10, 0, 0).toISOString(),
      };

      invoices.push(invoice);
      idCounter++;
    }
  }

  return invoices;
}
