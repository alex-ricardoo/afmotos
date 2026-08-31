import React from 'react';
import {
  Gavel,
  CreditCard,
  Scale,
  DollarSign,
  Users,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

const PILLARS = [
  {
    title: 'Passagem por Leilão & Sinistro',
    description: 'Saiba se o veículo já foi batido, recuperado por seguradora ou arrematado em leilões judiciais e de bancos.',
    icon: Gavel,
    badge: 'Risco Alto de Perda Financeira',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  {
    title: 'Gravame & Financiamento Ativo',
    description: 'Descubra na hora se há alienação fiduciária ou reserva de domínio ativa que impeça a transferência do veículo.',
    icon: CreditCard,
    badge: 'Bloqueio de Transferência',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    title: 'Bloqueio Judicial (Renajud)',
    description: 'Evite comprar um veículo com mandado de busca e apreensão, penhora trabalhista ou restrição judicial registrada.',
    icon: Scale,
    badge: 'Proteção Jurídica',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    title: 'Débitos & Multas Estaduais',
    description: 'Levantamento de débitos de IPVA, Licenciamento, multas Renainf e pendências no Detran para abater no preço.',
    icon: DollarSign,
    badge: 'Poder de Negociação',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    title: 'Histórico de Donos & Locadora',
    description: 'Veja se o veículo já pertenceu a frotas, locadoras de alta quilometragem ou se teve múltiplos donos anteriores.',
    icon: Users,
    badge: 'Desgaste e Uso Real',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    title: 'Preço FIPE & Histórico de KM',
    description: 'Compare com a cotação oficial da tabela FIPE atualizada e verifique registros de quilometragem anteriores.',
    icon: TrendingDown,
    badge: 'Valor Justo de Mercado',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
];

export function VehicleHistoryBenefits() {
  return (
    <section className="py-16 sm:py-24 bg-[#080B11] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Transparência Máxima</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            O que o laudo oficial revela sobre o veículo
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Tudo o que pode desvalorizar ou travar o veículo analisado em segundos através das bases oficiais.
          </p>
        </div>

        {/* 6 Visual Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative p-6 rounded-3xl bg-[#131A26] border border-[#1F293D] hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-amber-500/5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${pillar.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${pillar.badgeColor}`}>
                      {pillar.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
