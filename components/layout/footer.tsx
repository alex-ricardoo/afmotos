import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  FileCheck,
  Award,
  Phone,
  Mail,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';

export function Footer({ settings }: { settings?: any }) {
  const contactPhone = settings?.whatsapp_phone || CONSTANTS.CONTACT_PHONE;
  const siteName = settings?.site_name || 'AF LOCAÇÕES E VENDAS';
  const slogan = settings?.settings?.slogan || 'Loja Premium de Motocicletas';
  const description = settings?.settings?.institutional_description || 'Referência em locação, venda e consignação de motocicletas com padrão premium, procedência atestada e atendimento exclusivo.';
  const contactEmail = settings?.contact_email || CONSTANTS.CONTACT_EMAIL;

  const whatsappUrl = generateWhatsAppLink(
    contactPhone,
    `Olá! Gostaria de mais informações sobre a ${siteName}.`
  );

  return (
    <footer className="bg-[#050505] text-[#b8bcc2] border-t border-[#c9a44c]/20">
      {/* Trust Seals Bar */}
      <div className="border-b border-[#c9a44c]/20 bg-[#0d0d0d]">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#e3c56c]" />
              </div>
              <div>
                <h4 className="text-white text-sm font-bold">Laudo Cautelar 100%</h4>
                <p className="text-xs text-[#a6a6a1]">Inspeção rigorosa de histórico e chassi</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/30 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-[#e3c56c]" />
              </div>
              <div>
                <h4 className="text-white text-sm font-bold">Documentação em Dia</h4>
                <p className="text-xs text-[#a6a6a1]">Transferência rápida e sem burocracia</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/30 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-[#e3c56c]" />
              </div>
              <div>
                <h4 className="text-white text-sm font-bold">Melhor Avaliação</h4>
                <p className="text-xs text-[#a6a6a1]">Pagamento à vista na compra da sua moto</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#c9a44c]/40 bg-[#050505] shrink-0 shadow-[0_0_15px_rgba(201,164,76,0.15)]">
                <Image
                  src="/logo.jpg"
                  alt={siteName}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5 font-heading">
                  {siteName}
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c9a44c]" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#b8bcc2] mt-0.5">
                  {slogan}
                </span>
              </div>
            </Link>
            <p className="text-sm text-[#a6a6a1] max-w-sm leading-relaxed">
              {description}
            </p>
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,211,102,0.2)]"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Atendimento pelo WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Links: Navegação */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest text-[#e3c56c]">
              Estoque & Modelos
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/motos" className="hover:text-white transition-colors">
                  Todas as Motos
                </Link>
              </li>
              <li>
                <Link href="/motos?status=disponivel" className="hover:text-white transition-colors">
                  Motos Disponíveis
                </Link>
              </li>
              <li>
                <Link href="/motos-vendidas" className="hover:text-white transition-colors">
                  Histórico de Vendidas
                </Link>
              </li>
            </ul>
          </div>

          {/* Links: Serviços */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest text-[#e3c56c]">
              Nossos Serviços
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/venda-sua-moto" className="hover:text-white transition-colors">
                  Venda sua Moto
                </Link>
              </li>
              <li>
                <Link href="/consignar-moto" className="hover:text-white transition-colors">
                  Consignação Digital
                </Link>
              </li>
              <li>
                <Link href="/aluguel" className="hover:text-white transition-colors">
                  Aluguel de Motocicletas
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato & Atendimento */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest text-[#e3c56c]">
              Atendimento
            </h4>
            <ul className="space-y-3 text-xs text-[#a6a6a1]">
              <li className="flex items-center gap-2 text-white font-medium">
                <Phone className="w-4 h-4 text-[#c9a44c] shrink-0" />
                <span>{contactPhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#c9a44c] shrink-0" />
                <span>{contactEmail}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#c9a44c] shrink-0 mt-0.5" />
                <div>
                  <p>Segunda a Sexta: 08h às 18h</p>
                  <p>Sábado: 08h às 13h</p>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Legal Bar */}
      <div className="border-t border-[#c9a44c]/15 py-6 bg-[#050505] text-xs text-[#71717a]">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} AF Locações e Vendas. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">
              Política de Privacidade
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              Termos de Uso
            </span>
            <Link href="/admin/login" className="hover:text-white transition-colors">
              Área Restrita
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
