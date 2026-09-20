import React from 'react';
import { Check, X, ShieldCheck, HelpCircle, FileText, Search, Zap } from 'lucide-react';

interface VehicleHistorySeoGuideProps {
  siteName: string;
  priceFormatted: string;
}

export function VehicleHistorySeoGuide({ siteName, priceFormatted }: VehicleHistorySeoGuideProps) {
  const comparisonRows = [
    {
      feature: 'Histórico de Leilão e Perda Total (Sinistro)',
      ourPlatform: true,
      detran: false,
      competitors: true,
    },
    {
      feature: 'Débitos de IPVA, Licenciamento e Multas Nacionais',
      ourPlatform: true,
      detran: 'Apenas no Estado da Placa',
      competitors: true,
    },
    {
      feature: 'Gravames e Restrições Financeiras (Alienação)',
      ourPlatform: true,
      detran: 'Parcial',
      competitors: true,
    },
    {
      feature: 'Bloqueios Judiciais e Renajud em Todo o Brasil',
      ourPlatform: true,
      detran: false,
      competitors: true,
    },
    {
      feature: 'Comparativo de Preço FIPE Atualizado',
      ourPlatform: true,
      detran: false,
      competitors: 'Cobrado à parte',
    },
    {
      feature: 'Validade do Laudo Gerado',
      ourPlatform: 'Não expira na área do cliente',
      detran: 'Sem área do cliente',
      competitors: 'Expira em 30 dias',
    },
    {
      feature: 'Preço por Consulta Completa',
      ourPlatform: `A partir de ${priceFormatted}`,
      detran: 'Gratuito mas incompleto',
      competitors: 'R$ 60,00 ou mais',
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-slate-950 border-t border-white/5 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Bloco Semântico de Definição Direta para Usuários, Google e Motores de IA (GEO) */}
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guia Completo de Procedência</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-slate-100 tracking-tight font-heading leading-snug">
            O que é a Consulta de Histórico Veicular por Placa?
          </h2>

          <div className="space-y-3.5 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            <p>
              A <strong>consulta de histórico veicular</strong> da <strong>{siteName}</strong> é um serviço digital
              oficial que compila e analisa o histórico completo de qualquer automóvel, motocicleta ou caminhão
              registrado no Brasil utilizando apenas a <strong>placa do veículo</strong> (seja no padrão Mercosul ou placa cinza antiga).
            </p>
            <p>
              O laudo checa em tempo real mais de 100 indicadores nas bases de dados oficiais do <strong>Senatran</strong>,
              <strong>Detrans estaduais</strong>, bases judiciais de <strong>Renajud</strong>, companhias seguradoras
              e leiloeiros credenciados. Ele identifica se o veículo possui registros de sinistro com perda total,
              passagem por leilão judicial ou financeiro, roubo e furto ativo, alienação fiduciária com dívidas em bancos,
              débitos pendentes de IPVA e multas, além de verificar se o veículo é legalmente apto para transferência imediata.
            </p>
          </div>

          {/* Destaques Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                <Search className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">100% por Placa</span>
                <span className="text-slate-400">Sem precisar do Renavam</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Liberação Instantânea</span>
                <span className="text-slate-400">Laudo liberado em segundos</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Laudo em PDF</span>
                <span className="text-slate-400">Salvo vitalício no seu painel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Comparativa de Autoridade (Reconhecida por Motores de IA e Google Search) */}
        <div className="space-y-5">
          <div className="text-center sm:text-left space-y-1.5">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-100 font-heading">
              Comparativo: Por que consultar na {siteName}?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Veja as diferenças entre a consulta completa da nossa plataforma, o extrato básico do Detran e os concorrentes do mercado.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 shadow-xl">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/70 text-slate-300">
                  <th className="py-4 px-4 sm:px-6 font-semibold">Informação no Laudo</th>
                  <th className="py-4 px-3 sm:px-4 font-bold text-amber-400 text-center bg-amber-500/10 border-x border-amber-500/20">
                    {siteName}
                  </th>
                  <th className="py-4 px-3 sm:px-4 font-semibold text-slate-400 text-center">
                    Detran Grátis
                  </th>
                  <th className="py-4 px-3 sm:px-4 font-semibold text-slate-400 text-center">
                    Outros Sites
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-200">
                      {row.feature}
                    </td>

                    {/* AF Veículos PE */}
                    <td className="py-3.5 px-3 sm:px-4 text-center bg-amber-500/[0.04] border-x border-amber-500/20 font-semibold text-amber-300">
                      {typeof row.ourPlatform === 'boolean' ? (
                        row.ourPlatform ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 mx-auto">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )
                      ) : (
                        <span className="text-xs font-bold text-amber-400">{row.ourPlatform}</span>
                      )}
                    </td>

                    {/* Detran Grátis */}
                    <td className="py-3.5 px-3 sm:px-4 text-center text-slate-400 text-xs">
                      {typeof row.detran === 'boolean' ? (
                        row.detran ? (
                          <Check className="w-4 h-4 text-slate-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-rose-500/70 mx-auto" />
                        )
                      ) : (
                        row.detran
                      )}
                    </td>

                    {/* Outros Sites */}
                    <td className="py-3.5 px-3 sm:px-4 text-center text-slate-400 text-xs">
                      {typeof row.competitors === 'boolean' ? (
                        row.competitors ? (
                          <Check className="w-4 h-4 text-slate-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-rose-500/70 mx-auto" />
                        )
                      ) : (
                        row.competitors
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
