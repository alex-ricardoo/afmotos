import React from 'react';
import { Phone, Mail, Clock, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { SocialLinkItem, FormattedBusinessHours } from '@/types/site-settings';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';

interface AboutContactProps {
  phone: string;
  email: string;
  socialLinks: SocialLinkItem[];
  businessHours: FormattedBusinessHours;
  siteName?: string;
}

export function AboutContact({
  phone,
  email,
  socialLinks,
  businessHours,
  siteName,
}: AboutContactProps) {
  const store = siteName || 'AF Motos';
  const whatsappUrl = generateWhatsAppLink(
    phone,
    `Olá! Estava navegando pela página Sobre do site da ${store} e gostaria de tirar algumas dúvidas.`,
  );

  return (
    <section className="w-full bg-zinc-950 py-16 md:py-24 border-t border-zinc-800/80 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Canais Oficiais</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Fale com a {store}
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Nossa equipe de consultores está sempre pronta para esclarecer dúvidas, simular financiamentos ou agendar seu atendimento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Contato Direto & Redes */}
          <div className="space-y-5">
            {/* Card WhatsApp */}
            <div className="bg-zinc-900/70 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-zinc-800/80 hover:border-emerald-500/30 transition-all shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-md shadow-emerald-500/10">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base font-heading">
                      WhatsApp / Telefone
                    </h3>
                    <p className="text-zinc-300 text-sm mt-0.5">{phone}</p>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Atendimento Rápido
                    </span>
                  </div>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md active:scale-[0.98] shrink-0"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>Conversar</span>
                </a>
              </div>

              <div className="sm:hidden pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>Iniciar conversa no WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Card E-mail */}
            <div className="bg-zinc-900/70 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-zinc-800/80 hover:border-amber-500/30 transition-all shadow-xl space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-md shadow-amber-500/10">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base font-heading">
                    E-mail Institucional
                  </h3>
                  <p className="text-zinc-300 text-sm">{email}</p>
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline pt-0.5"
                  >
                    <span>Enviar mensagem por e-mail</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="bg-zinc-900/70 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-zinc-800/80 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm font-heading uppercase tracking-wider">
                    Siga Nossas Redes Sociais
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {socialLinks.map((social) => (
                    <a
                      key={social.key}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
                    >
                      <span>{social.label}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Horários de Funcionamento & Caixa VIP */}
          <div className="space-y-5">
            <div className="bg-zinc-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-800/80 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-heading tracking-tight">
                    Horário de Funcionamento
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Visite nossa loja ou receba atendimento digital
                  </p>
                </div>
              </div>

              <div className="divide-y divide-zinc-800/80 border-y border-zinc-800/80 py-2">
                <div className="flex justify-between items-center py-3.5">
                  <span className="font-medium text-zinc-300 text-sm">Segunda a Sexta</span>
                  <span className="text-white font-bold text-sm bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                    {businessHours.weekdays.replace('Segunda a Sexta: ', '')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3.5">
                  <span className="font-medium text-zinc-300 text-sm">Sábado</span>
                  <span className="text-white font-bold text-sm bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                    {businessHours.saturday.replace('Sábado: ', '')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3.5">
                  <span className="font-medium text-zinc-300 text-sm">Domingos e Feriados</span>
                  <span className="text-zinc-400 font-medium text-xs bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                    {businessHours.sunday.replace('Domingo: ', '')}
                  </span>
                </div>
              </div>

              {/* Callout box dentro do card de horários */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/25 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Deseja um Horário Exclusivo?</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Podemos agendar a apresentação de uma moto ou simulação no horário mais conveniente para sua rotina.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all shadow-md active:scale-[0.98]"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                  <span>Agendar com um Consultor</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
