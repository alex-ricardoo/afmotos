import { Phone, Mail, Clock } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SocialLinkItem, FormattedBusinessHours } from '@/types/site-settings';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';

interface AboutContactProps {
  phone: string;
  email: string;
  socialLinks: SocialLinkItem[];
  businessHours: FormattedBusinessHours;
}

export function AboutContact({ phone, email, socialLinks, businessHours }: AboutContactProps) {
  const whatsappUrl = generateWhatsAppLink(phone, 'Olá, estou vindo da página Sobre do site e gostaria de mais informações.');

  return (
    <section className="w-full bg-zinc-100 dark:bg-zinc-900/80 py-16 md:py-24 border-t border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Contato Direto */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Fale Conosco
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
                    <Phone className="w-5 h-5 text-red-600 dark:text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-white">WhatsApp / Telefone</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">{phone}</p>
                    <a 
                      href={whatsappUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: 'link' }), "p-0 h-auto text-red-600 dark:text-red-500 mt-1")}
                    >
                      Iniciar conversa
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
                    <Mail className="w-5 h-5 text-red-600 dark:text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-white">E-mail</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">{email}</p>
                    <a 
                      href={`mailto:${email}`}
                      className={cn(buttonVariants({ variant: 'link' }), "p-0 h-auto text-red-600 dark:text-red-500 mt-1")}
                    >
                      Enviar e-mail
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {socialLinks.length > 0 && (
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="font-medium text-zinc-900 dark:text-white mb-4">Siga nossas redes</h3>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a 
                      key={social.key}
                      href={social.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "bg-white dark:bg-zinc-950")}
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Horários */}
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-zinc-400" />
              Horário de Funcionamento
            </h2>
            <div className="bg-white dark:bg-zinc-950 rounded-xl p-6 md:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <ul className="space-y-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                <li className="flex justify-between items-center pb-4">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Segunda a Sexta</span>
                  <span className="text-zinc-600 dark:text-zinc-400 text-right">
                    {businessHours.weekdays.replace('Segunda a Sexta: ', '')}
                  </span>
                </li>
                <li className="flex justify-between items-center py-4">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Sábado</span>
                  <span className="text-zinc-600 dark:text-zinc-400 text-right">
                    {businessHours.saturday.replace('Sábado: ', '')}
                  </span>
                </li>
                <li className="flex justify-between items-center pt-4">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Domingo e Feriados</span>
                  <span className="text-zinc-600 dark:text-zinc-400 text-right">
                    {businessHours.sunday.replace('Domingo: ', '')}
                  </span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
