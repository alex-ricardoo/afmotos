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
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import {
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
  YouTubeIcon,
} from '@/components/icons/social-icons';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink, formatPhoneForDisplay } from '@/lib/utils/whatsapp';
import { getSiteLogo, getSocialLinks, getBusinessHours, getMapsUrl } from '@/lib/site-settings';

export function Footer({ settings }: { settings?: any }) {
  const contactPhone = settings?.whatsapp_phone || CONSTANTS.CONTACT_PHONE;
  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;
  const slogan = settings?.settings?.slogan || 'Compra, venda e locação de motos de forma simples';
  const description =
    settings?.settings?.description ||
    settings?.settings?.institutional_description ||
    'Compra, venda e locação de motos com atendimento direto e transparente pelo WhatsApp.';
  const contactEmail = settings?.contact_email || CONSTANTS.CONTACT_EMAIL;
  const addressText = settings?.address || CONSTANTS.STORE_ADDRESS;

  const logoInfo = getSiteLogo(settings);
  const socialLinks = getSocialLinks(settings);
  const businessHours = getBusinessHours(settings);
  const mapsUrl = getMapsUrl(settings);

  const whatsappUrl = generateWhatsAppLink(
    contactPhone,
    `Olá! Gostaria de mais informações sobre a ${siteName}.`,
  );

  const getSocialIcon = (key: string) => {
    switch (key) {
      case 'instagram':
        return <InstagramIcon className="w-4 h-4" />;
      case 'facebook':
        return <FacebookIcon className="w-4 h-4" />;
      case 'tiktok':
        return <TikTokIcon className="w-4 h-4" />;
      case 'youtube':
        return <YouTubeIcon className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <footer className="bg-[#050505] text-[#b8bcc2] border-t border-[#c9a44c]/20">
      {/* Trust Seals Bar */}
      <div className="border-b border-[#c9a44c]/20 bg-[#0d0d0d]">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="flex items-center justify-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#e3c56c]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-sm font-bold leading-tight">Atendimento Direto</h4>
                <p className="text-xs text-[#a6a6a1] mt-0.5">
                  Fale com a gente no WhatsApp sem intermediários
                </p>
              </div>
            </div>

            <div className="flex items-center justify-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/30 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-[#e3c56c]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-sm font-bold leading-tight">Documentação Clara</h4>
                <p className="text-xs text-[#a6a6a1] mt-0.5">
                  Orientação e transparência na transferência da moto
                </p>
              </div>
            </div>

            <div className="flex items-center justify-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/30 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-[#e3c56c]" />
              </div>
              <div className="text-left">
                <h4 className="text-white text-sm font-bold leading-tight">
                  Negociação Transparente
                </h4>
                <p className="text-xs text-[#a6a6a1] mt-0.5">
                  Preço e condições combinados com clareza
                </p>
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
                  src={logoInfo.src}
                  alt={logoInfo.alt || siteName}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized={logoInfo.isCustom}
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
            <p className="text-sm text-[#a6a6a1] max-w-sm leading-relaxed">{description}</p>

            {/* Redes Sociais Dinâmicas */}
            {socialLinks.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[11px] font-bold text-[#e3c56c] uppercase tracking-wider block">
                  Siga a AF Motos
                </span>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {socialLinks.map((social) => (
                    <a
                      key={social.key}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Acessar nosso ${social.label}`}
                      className="w-9 h-9 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                      title={social.label}
                    >
                      {getSocialIcon(social.key)}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,211,102,0.2)] cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
                <span>Falar no WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Links: Navegação */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest text-[#e3c56c]">
              Motos & Catálogo
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-amber-500 transition-colors duration-200">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/motos" className="hover:text-amber-500 transition-colors duration-200">
                  Motos Disponíveis
                </Link>
              </li>
              <li>
                <Link
                  href="/motos-vendidas"
                  className="hover:text-amber-500 transition-colors duration-200"
                >
                  Motos Vendidas
                </Link>
              </li>
            </ul>
          </div>

          {/* Links: Serviços */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest text-[#e3c56c]">
              Serviços
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/vender-minha-moto"
                  className="hover:text-amber-500 transition-colors duration-200"
                >
                  Venda sua Moto
                </Link>
              </li>
              <li>
                <Link
                  href="/anunciar-sua-moto"
                  className="hover:text-amber-500 transition-colors duration-200"
                >
                  Anuncie sua Moto
                </Link>
              </li>
              <li>
                <Link
                  href="/aluguel"
                  className="hover:text-amber-500 transition-colors duration-200"
                >
                  Aluguel de Motos
                </Link>
              </li>

              <li>
                <Link
                  href="/politica-de-privacidade"
                  className="hover:text-amber-500 transition-colors duration-200"
                >
                  Privacidade & Dados
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato, Localização & Horários */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest text-[#e3c56c]">
              Atendimento & Loja
            </h4>
            <ul className="space-y-3 text-xs text-[#a6a6a1]">
              <li>
                <a
                  href={`tel:${contactPhone.replace(/\D/g, '')}`}
                  className="flex items-center gap-2 transition-colors duration-200 hover:text-amber-500"
                >
                  <Phone className="h-4 w-4 shrink-0 text-[#c9a44c]" />
                  <span className="font-medium text-white hover:text-amber-500">
                    {formatPhoneForDisplay(contactPhone)}
                  </span>
                </a>
              </li>
              {contactEmail && (
                <li>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="flex items-center gap-2 hover:text-amber-500 transition-colors duration-200"
                  >
                    <Mail className="w-4 h-4 text-[#c9a44c] shrink-0" />
                    <span>{contactEmail}</span>
                  </a>
                </li>
              )}
              {/* Endereço clicável com link para Google Maps */}
              <li>
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-zinc-300 hover:text-amber-400 transition-colors group cursor-pointer"
                    title="Clique para ver a localização no Google Maps"
                  >
                    <MapPin className="w-4 h-4 text-[#c9a44c] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="leading-relaxed block">{addressText}</span>
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                        <span>Ver no Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-start gap-2 text-zinc-400">
                    <MapPin className="w-4 h-4 text-[#c9a44c] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{addressText}</span>
                  </div>
                )}
              </li>
              {/* Horários de funcionamento */}
              <li className="flex items-start gap-2 pt-1 border-t border-zinc-900">
                <Clock className="w-4 h-4 text-[#c9a44c] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p>{businessHours.weekdays}</p>
                  <p>{businessHours.saturday}</p>
                  {businessHours.sunday && <p className="text-zinc-500">{businessHours.sunday}</p>}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Legal Bar */}
      <div className="border-t border-[#c9a44c]/15 py-6 bg-[#050505] text-xs text-[#71717a]">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} {siteName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/politica-de-privacidade"
              className="hover:text-amber-500 cursor-pointer transition-colors duration-200"
            >
              Política de Privacidade
            </Link>
            <Link
              href="/admin/login"
              className="hover:text-amber-500 transition-colors duration-200"
            >
              Área Restrita
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
