export interface VehicleHistoryFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const VEHICLE_HISTORY_FAQS: VehicleHistoryFaqItem[] = [
  {
    id: 'como-recebo',
    question: 'Como recebo o resultado?',
    answer: 'Após o atendimento no WhatsApp e confirmação do pagamento, você recebe o link oficial da consulta e o arquivo em PDF direto na conversa.',
  },
  {
    id: 'pagar-pix',
    question: 'Posso pagar via Pix ou Cartão?',
    answer: 'Sim! Aceitamos Pix com liberação imediata ou cartão de crédito via link de pagamento seguro enviado na conversa.',
  },
  {
    id: 'processo-imediato',
    question: 'O processo é imediato?',
    answer: 'Sim. Nossa equipe atende você no WhatsApp, confere os dados e libera o link oficial e o laudo em PDF em poucos minutos.',
  },
  {
    id: 'qualquer-estado',
    question: 'A consulta funciona para qualquer estado do Brasil?',
    answer: 'Sim, abrange veículos de todos os 26 estados e DF cadastrados no Senatran, Detrans estaduais e sistemas judiciais.',
  },
  {
    id: 'concorrentes-preco',
    question: 'Por que o valor é mais acessível que em outros lugares?',
    answer: 'Enquanto concorrentes cobram R$ 64,90 pela mesma consulta, oferecemos o histórico completo das bases oficiais por um preço justo e com suporte humanizado da nossa equipe.',
  },
  {
    id: 'tipos-veiculos',
    question: 'Serve para moto, carro e caminhão?',
    answer: 'Sim! Funciona para qualquer veículo com placa nacional (Mercosul ou placa cinza antiga), sem distinção de modelo.',
  },
];

