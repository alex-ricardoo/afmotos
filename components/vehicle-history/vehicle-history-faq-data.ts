export interface VehicleHistoryFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const VEHICLE_HISTORY_FAQS: VehicleHistoryFaqItem[] = [
  {
    id: 'como-recebo',
    question: 'Como recebo o resultado?',
    answer: 'Após a confirmação do pagamento 100% online, seu laudo é liberado instantaneamente na sua Área do Cliente. Você pode visualizar todos os detalhes na tela e baixar o laudo oficial em PDF autenticado quando quiser.',
  },
  {
    id: 'pagar-pix',
    question: 'Posso pagar via Pix ou Cartão?',
    answer: 'Sim! O checkout é 100% online e integrado. Aceitamos Pix com liberação imediata em segundos ou cartão de crédito com aprovação instantânea com total segurança.',
  },
  {
    id: 'processo-imediato',
    question: 'O processo é imediato?',
    answer: 'Sim. Todo o processo é automatizado. Assim que o pagamento é confirmado pelo sistema, o laudo é emitido e fica salvo na sua conta com acesso vitalício.',
  },
  {
    id: 'qualquer-estado',
    question: 'A consulta funciona para qualquer estado do Brasil?',
    answer: 'Sim, abrange veículos de todos os 26 estados e DF cadastrados no Senatran, Detrans estaduais e sistemas judiciais.',
  },
  {
    id: 'concorrentes-preco',
    question: 'Por que o valor é mais acessível que em outros lugares?',
    answer: 'Enquanto concorrentes cobram R$ 64,90 pela mesma consulta, oferecemos o histórico completo das bases oficiais por um preço justo, direto na plataforma e com suporte dedicado.',
  },
  {
    id: 'tipos-veiculos',
    question: 'Serve para moto, carro e caminhão?',
    answer: 'Sim! Funciona para qualquer veículo com placa nacional (Mercosul ou placa cinza antiga), sem distinção de modelo.',
  },
];
