import React from "react";
import { X, CreditCard, Sparkles, ExternalLink, CheckCircle2, ShieldAlert } from "lucide-react";

interface CreditsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreditsHelpModal: React.FC<CreditsHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Gestão de Créditos e Quotas da Gemini API
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informações para trabalhar neste projeto sem restrições de volume
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm text-slate-600 dark:text-slate-300 max-h-[75vh] overflow-y-auto">
          {/* Explanation 1 */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-950 dark:text-blue-200 text-sm mb-1">
                Como funcionam os créditos e quotas neste projeto?
              </h4>
              <p className="text-xs text-blue-900/80 dark:text-blue-300/90 leading-relaxed">
                Este projeto utiliza o modelo <strong>Gemini 3.8 Flash</strong> através da API oficial do Google AI Studio / Google Cloud. No AI Studio, existe uma quota diária gratuita destinada a desenvolvimento e testes.
              </p>
            </div>
          </div>

          {/* Steps to add billing/credits */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
              Passos para associar faturação ou adicionar créditos à sua conta Google Cloud:
            </h4>

            <div className="space-y-2">
              <div className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Aceder à consola de Faturação da Google Cloud
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Aceda a <span className="font-mono text-blue-600 dark:text-blue-400">console.cloud.google.com/billing</span> com a sua conta ({'Juanmiguelmateosruiz@gmail.com'}).
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Ativar os $300 USD de Crédito Gratuito ou associar método de pagamento
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Se a sua conta for nova na Google Cloud, tem direito a <strong>$300 USD de créditos gratuitos</strong> durante 90 dias.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Associar a conta de faturação ao projeto
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Vincule a conta de faturação ao ID do seu projeto: <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">gen-lang-client-0594661414</code>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Chave de API gerida no painel Secrets do AI Studio
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    A chave de API é injetada automaticamente nas variáveis de ambiente seguras do servidor, sem necessidade de configuração manual.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="pt-2 flex flex-wrap gap-2">
            <a
              href="https://console.cloud.google.com/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-xs"
            >
              <span>Abrir Google Cloud Billing</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors"
            >
              <span>Consultar API Keys no AI Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors"
          >
            Entendido, regressar à aplicação
          </button>
        </div>
      </div>
    </div>
  );
};
