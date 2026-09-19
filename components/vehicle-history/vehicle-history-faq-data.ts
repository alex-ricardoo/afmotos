export interface VehicleHistoryFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const VEHICLE_HISTORY_FAQS: VehicleHistoryFaqItem[] = [
  {
    id: 'como-recebo',
    question: 'Como recebo o laudo e onde ele fica salvo?',
    answer:
      'Assim que o pagamento é confirmado, seu laudo é liberado instantaneamente na sua Área do Cliente. Você terá uma plataforma exclusiva onde todos os seus laudos ficam salvos para você consultar sempre que quiser, com acesso vitalício. Você pode visualizá-lo online no celular ou computador e baixar o laudo oficial em PDF autenticado a qualquer momento.',
  },
  {
    id: 'formas-pagamento-mercado-pago',
    question: 'Quais são as formas de pagamento e como funciona o Mercado Pago?',
    answer:
      'O pagamento é processado com máxima segurança diretamente pelo Mercado Pago em ambiente oficial e criptografado. Aceitamos: Pix com aprovação imediata em segundos, Cartão de Crédito com parcelamento em até 12x, Cartão de Débito virtual da Caixa Econômica Federal e Saldo em conta Mercado Pago. Os meios exibidos no checkout podem variar conforme a elegibilidade e disponibilidade do Mercado Pago.',
  },
  {
    id: 'imprimir-pdf',
    question: 'Posso baixar em PDF e imprimir o laudo para levar na negociação?',
    answer:
      'Sim! Todos os laudos possuem formatação oficial e botão de download em PDF de alta resolução, perfeito para você imprimir em folha A4 e levar na hora de fechar negócio ou compartilhar diretamente pelo WhatsApp com o vendedor, comprador ou despachante.',
  },
  {
    id: 'multiplas-consultas',
    question: 'Posso consultar mais de um veículo na mesma plataforma?',
    answer:
      'Com certeza! Na sua Área do Cliente você pode realizar quantas consultas quiser. Todas as placas consultadas ficam organizadas no seu painel exclusivo, permitindo comparar veículos, reabrir laudos antigos e manter todo o seu histórico centralizado.',
  },
  {
    id: 'qualquer-estado',
    question: 'A consulta funciona para qualquer estado do Brasil?',
    answer:
      'Sim, abrange motos, carros e caminhões de todos os 26 estados e DF cadastrados nas bases oficiais do Senatran, Detrans estaduais e sistemas judiciais.',
  },
  {
    id: 'concorrentes-preco',
    question: 'Por que o valor é mais acessível que em outros lugares?',
    answer:
      'Enquanto concorrentes cobram R$ 64,90 pela mesma consulta, oferecemos o histórico completo das bases oficiais por um preço justo, direto na plataforma, com laudo vitalício e suporte dedicado.',
  },
  {
    id: 'tipos-veiculos',
    question: 'Serve para moto, carro e caminhão?',
    answer:
      'Sim! Funciona para qualquer veículo com placa nacional (Mercosul ou placa cinza antiga), sem distinção de modelo.',
  },
  {
    id: 'pacotes-b2b-lojistas',
    question: 'Vocês oferecem pacotes de consultas com desconto para lojistas ou frotistas?',
    answer:
      'Sim! Para lojistas de motos e carros, revendas, despachantes e frotistas, oferecemos pacotes pré-pagos (como 5, 15, 30 e 50+ consultas) com descontos progressivos e preços dinâmicos exclusivos. A contratação é 100% online direto pelo Mercado Pago (Pix imediato ou Cartão de Crédito em até 12x), com ativação automática instantânea dos créditos no seu painel. Os créditos nunca expiram e permitem emitir laudos em 1 clique. Para frotas e concessionárias com demanda corporativa a partir de 50 consultas, também oferecemos propostas sob medida com faturamento PJ via WhatsApp.',
  },
];
