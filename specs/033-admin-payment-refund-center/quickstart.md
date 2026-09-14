# Guia Rápido: Central Administrativa de Pagamentos e Estornos

## 1. Pré-requisitos e Variáveis de Ambiente

Certifique-se de que o arquivo `.env.local` contenha as variáveis essenciais:
```env
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-anon-key"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"

MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..."
MERCADO_PAGO_PUBLIC_KEY="APP_USR-..."
MERCADO_PAGO_WEBHOOK_SECRET="seu-webhook-secret"

APIBRASIL_TOKEN="seu-token-apibrasil"
APIBRASIL_SECRET_KEY="sua-secret-key-apibrasil"
VEHICLE_LOOKUP_MODE="live"
```

---

## 2. Inicialização Local

1. Instale dependências e execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
2. Acesse a aplicação no navegador:
   ```text
   http://localhost:3000/admin/login
   ```
3. Faça login com uma conta que possua perfil ativo na tabela `admin_profiles` (`role = 'admin'` ou `'super_admin'`).
4. Navegue pelo menu lateral até **Pagamentos & Estornos** ou acesse diretamente:
   ```text
   http://localhost:3000/admin/pagamentos-consultas
   ```

---

## 3. Roteiro de Validação dos Casos de Uso

### Cenário 1: Identificação de Saldo Insuficiente
1. Localize no topo o card vermelho/âmbar **"Saldo API Brasil Insuficiente"**.
2. Clique no card para filtrar a tabela apenas por transações retidas com código `APIBRASIL_INSUFFICIENT_CREDITS`.
3. Verifique o banner informativo no topo da tabela orientando a recarga.

### Cenário 2: Solicitação de Estorno Seguro
1. Clique em **"Ver detalhes"** ou no botão de ação **"Estornar"** em uma consulta retida sem laudo entregue.
2. O modal de confirmação reforçada é exibido com o valor e dados da transação.
3. Tente clicar no botão de confirmação sem preencher o texto — ele permanece bloqueado.
4. Digite a palavra exata `ESTORNAR` e selecione o motivo `APIBRASIL_INSUFFICIENT_CREDITS`.
5. Confirme o estorno. Verifique que o status muda para `confirmed` ou `pending` e o botão de estorno torna-se inativo.

### Cenário 3: Reconciliação de Estorno Pendente
1. Para transações com status de estorno `pending` ou `failed`, clique em **"Reconciliar"**.
2. O sistema consulta autoritativamente o Mercado Pago e sincroniza a base de dados.

### Cenário 4: Reprocessamento de Entrega
1. Localize uma transação aprovada sem estorno ativo que tenha falhado anteriormente por instabilidade ou falta de créditos.
2. Clique em **"Reprocessar"**.
3. No modal, confirme o checkbox declarando que os créditos da API Brasil foram restabelecidos.
4. Confirme o reprocessamento e acompanhe a transição do laudo para `completed`.
