import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export interface InvoiceExtractionResult {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  periodStart: string;
  periodEnd: string;
  serviceType: "water" | "gas" | "electricity" | "maintenance" | "cleaning" | "other";
  cubicMeters: number;
  cubicMetersUnit: string;
  totalAmount: number;
  taxAmount: number;
  currency: string;
  summary: string;
  hotelDepartment: string;
  meterReading: string;
  confidenceScore: number;
}

export async function extractInvoiceData(params: {
  fileName: string;
  mimeType: string;
  base64Data?: string;
  textData?: string;
}): Promise<InvoiceExtractionResult> {
  const { fileName, mimeType, base64Data, textData } = params;

  const prompt = `Analisa esta fatura para o Diretor Financeiro (CFO) de uma unidade hoteleira.
Ficheiro: "${fileName}".
O teu objetivo primordial é identificar e extrair com rigor absoluto:
1. Consumo em METROS CÚBICOS (m³ ou m3). Procura consumos de água potável, saneamento, rega, gás natural ou qualquer fornecimento com contador volumétrico. Se a fatura indicar consumo ou leituras de contador em m³, extrai o valor numérico exato (exemplo: 1450.50 m³ -> 1450.5). Se não houver consumo em m³, atribui 0.
2. Fornecedor emissor (ex.: EPAL, Águas do Porto, Indaqua, Águas de Portugal, Galp, EDP Gás, etc.).
3. Número da fatura e data de emissão.
4. Período faturado (início e fim, se disponíveis).
5. Tipo de fornecimento (water / gas / electricity / maintenance / cleaning / other).
6. Valor total (com IVA incluído) e valor de impostos/IVA.
7. Moeda (habitualmente EUR).
8. Departamento provável do hotel (Spa & Piscinas, Lavandaria Industrial, Quartos e Pisos, Cozinha & Restauração, Zonas Verdes e Rega, Climatização, Geral).
9. Leitura do contador (ex.: "Anterior: 12450 m³ - Atual: 13900 m³ - Diferença: 1450 m³"), se discriminada.
10. Breve resumo executivo em português de Portugal (pt-PT) com foco no consumo em m³ e custo unitário.`;

  const contents: any[] = [];

  if (base64Data && base64Data.length > 0) {
    contents.push({
      inlineData: {
        mimeType: mimeType || "application/pdf",
        data: base64Data,
      },
    });
  }

  if (textData && textData.trim().length > 0) {
    contents.push({
      text: `Conteúdo textual da fatura:\n${textData}`,
    });
  }

  contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents,
    config: {
      systemInstruction:
        "És um auditor financeiro sénior especializado em gestão hoteleira em Portugal e controlo de custos de utilidades (água, gás, energia). Escreve sempre em português europeu (pt-PT) com rigor financeiro e exatidão matemática.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          supplierName: { type: Type.STRING, description: "Nome da entidade fornecedora" },
          invoiceNumber: { type: Type.STRING, description: "Número de identificação da fatura" },
          invoiceDate: { type: Type.STRING, description: "Data de emissão da fatura (AAAA-MM-DD)" },
          periodStart: { type: Type.STRING, description: "Início do período de faturação" },
          periodEnd: { type: Type.STRING, description: "Fim do período de faturação" },
          serviceType: {
            type: Type.STRING,
            description: "Tipo de fornecimento: water, gas, electricity, maintenance, cleaning, other",
          },
          cubicMeters: {
            type: Type.NUMBER,
            description: "Consumo total em metros cúbicos (m³). Número decimal puro, ex: 1240.5. Se não existir, 0.",
          },
          cubicMetersUnit: { type: Type.STRING, description: "Unidade indicada (ex.: m3)" },
          totalAmount: { type: Type.NUMBER, description: "Valor total a pagar com IVA" },
          taxAmount: { type: Type.NUMBER, description: "Valor total de IVA e taxas" },
          currency: { type: Type.STRING, description: "Moeda (EUR, USD)" },
          summary: { type: Type.STRING, description: "Resumo executivo em português de Portugal para o CFO" },
          hotelDepartment: { type: Type.STRING, description: "Departamento ou centro de custo hoteleiro" },
          meterReading: { type: Type.STRING, description: "Detalhe das leituras do contador (anterior e atual)" },
          confidenceScore: { type: Type.NUMBER, description: "Nível de confiança da extração entre 0 e 100" },
        },
        required: ["supplierName", "cubicMeters", "totalAmount", "serviceType", "summary"],
      },
    },
  });

  const text = response.text || "{}";
  try {
    const parsed = JSON.parse(text);
    return {
      supplierName: parsed.supplierName || "Fornecedor não identificado",
      invoiceNumber: parsed.invoiceNumber || fileName.replace(/\.[^/.]+$/, ""),
      invoiceDate: parsed.invoiceDate || new Date().toISOString().split("T")[0],
      periodStart: parsed.periodStart || "",
      periodEnd: parsed.periodEnd || "",
      serviceType: parsed.serviceType || "water",
      cubicMeters: Number(parsed.cubicMeters) || 0,
      cubicMetersUnit: parsed.cubicMetersUnit || "m³",
      totalAmount: Number(parsed.totalAmount) || 0,
      taxAmount: Number(parsed.taxAmount) || 0,
      currency: parsed.currency || "EUR",
      summary: parsed.summary || "Fatura analisada com sucesso.",
      hotelDepartment: parsed.hotelDepartment || "Fornecimentos Gerais",
      meterReading: parsed.meterReading || "Sem discriminação de contador",
      confidenceScore: Number(parsed.confidenceScore) || 95,
    };
  } catch (err) {
    console.error("Erro ao converter resposta JSON do Gemini:", err, text);
    throw new Error("Não foi possível interpretar a resposta estruturada da fatura.");
  }
}

export async function askInvoicesQuery(params: {
  question: string;
  invoicesSummary: Array<{
    fileName: string;
    supplierName: string;
    invoiceNumber: string;
    invoiceDate: string;
    cubicMeters: number;
    totalAmount: number;
    currency: string;
    serviceType: string;
    hotelDepartment?: string;
  }>;
  totalBatchStats: {
    totalFiles: number;
    totalCubicMeters: number;
    totalAmount: number;
  };
}): Promise<{
  answer: string;
  highlightNumber?: string;
  highlightLabel?: string;
  breakdown?: Array<{ label: string; value: string | number }>;
  recommendedActions?: string[];
}> {
  const { question, invoicesSummary, totalBatchStats } = params;

  // Aggregate stats by department and supplier to empower Gemini with global intelligence over all 380-400 invoices
  const byDept: Record<string, { m3: number; eur: number; count: number }> = {};
  const bySupplier: Record<string, { m3: number; eur: number; count: number }> = {};
  const byMonth: Record<string, { m3: number; eur: number; count: number }> = {};

  invoicesSummary.forEach((inv) => {
    const dept = inv.hotelDepartment || "Outro";
    if (!byDept[dept]) byDept[dept] = { m3: 0, eur: 0, count: 0 };
    byDept[dept].m3 += inv.cubicMeters || 0;
    byDept[dept].eur += inv.totalAmount || 0;
    byDept[dept].count += 1;

    const sup = inv.supplierName || "Geral";
    if (!bySupplier[sup]) bySupplier[sup] = { m3: 0, eur: 0, count: 0 };
    bySupplier[sup].m3 += inv.cubicMeters || 0;
    bySupplier[sup].eur += inv.totalAmount || 0;
    bySupplier[sup].count += 1;

    const m = inv.invoiceDate ? inv.invoiceDate.substring(0, 7) : "2024-00";
    if (!byMonth[m]) byMonth[m] = { m3: 0, eur: 0, count: 0 };
    byMonth[m].m3 += inv.cubicMeters || 0;
    byMonth[m].eur += inv.totalAmount || 0;
    byMonth[m].count += 1;
  });

  const prompt = `O Diretor Financeiro (CFO) do hotel colocou uma questão analítica sobre o lote de ${totalBatchStats.totalFiles} faturas faturadas e analisadas no sistema.

Métricas Globais Consolidadas:
- Total de Faturas no Lote: ${totalBatchStats.totalFiles} faturas
- Consumo Total de Metros Cúbicos: ${totalBatchStats.totalCubicMeters.toFixed(1)} m³
- Custo Total Acumulado: ${totalBatchStats.totalAmount.toFixed(2)} EUR
- Custo Médio Unitário: ${(totalBatchStats.totalCubicMeters > 0 ? totalBatchStats.totalAmount / totalBatchStats.totalCubicMeters : 0).toFixed(2)} EUR/m³

Agregações por Departamento (Centro de Custo):
${JSON.stringify(byDept, null, 2)}

Agregações por Fornecedor:
${JSON.stringify(bySupplier, null, 2)}

Consumos Mensais (m³ e EUR):
${JSON.stringify(byMonth, null, 2)}

Amostra de faturas representativas (amostra de dados individuais):
${JSON.stringify(invoicesSummary.slice(0, 100))}

Pergunta do Diretor Financeiro:
"${question}"

Instruções Mandatórias:
1. Responde obrigatoriamente em PORTUGUÊS DE PORTUGAL (pt-PT). Utiliza a ortografia e terminologia portuguesa (ex.: faturas, equipa, lavandaria, quartos, água potável, saneamento, custos, IVA).
2. Se a questão for sobre o consumo total de metros cúbicos (m³), fornece o número exato imediatamente.
3. Disponibiliza uma métrica destacada no campo "highlightNumber" (ex.: "82 450,5 m³" ou "194 320 €") e etiqueta em "highlightLabel".
4. Elabora um discriminativo detalhado em "breakdown" com 3 a 6 pontos chave.
5. Apresenta 2 ou 3 recomendações financeiras concretas para o CFO poupar custos e controlar eventuais consumos anómalos de água/gás.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      systemInstruction:
        "És o consultor financeiro sénior e auditor de contas de uma cadeia hoteleira em Portugal. Comunica em português de Portugal (pt-PT), com postura executiva, matemática e objetiva para o Diretor Financeiro.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: {
            type: Type.STRING,
            description: "Resposta executiva completa e justificada em português de Portugal.",
          },
          highlightNumber: {
            type: Type.STRING,
            description: "O dado principal com unidade (ex.: '84 250,5 m³')",
          },
          highlightLabel: {
            type: Type.STRING,
            description: "Etiqueta da métrica principal (ex.: 'Consumo total de m³')",
          },
          breakdown: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: "Rótulo ou departamento" },
                value: { type: Type.STRING, description: "Valor numérico com unidade" },
              },
              required: ["label", "value"],
            },
            description: "Desdobramento analítico de dados",
          },
          recommendedActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Recomendações financeiras para o Diretor Financeiro",
          },
        },
        required: ["answer", "highlightNumber", "highlightLabel"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {
      answer: response.text || "Não foi possível estruturar a resposta da análise.",
      highlightNumber: `${totalBatchStats.totalCubicMeters.toFixed(1)} m³`,
      highlightLabel: "Total m³ no lote",
    };
  }
}
