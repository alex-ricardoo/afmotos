# Roteiro de Checagem Manual para Cenários com Dependências Bloqueadas

**Feature**: Auditoria E2E de Caixa-Preta e Base de Testes Reproduzíveis  
**Data**: 2026-09-18  
**Objetivo**: Orientar a validação assistida dos fluxos que dependem de serviços externos ou ambientes descartáveis não configurados no runner headless.

---

## 1. Cenário B-07: Autenticação via Google OAuth

- **Pré-requisitos**: Navegador com sessão Google ativa; ambiente com `NEXT_PUBLIC_SUPABASE_URL` apontando para projeto com provedor Google habilitado.
- **Procedimento**:
  1. Acessar `/cliente/login`.
  2. Clicar no botão **"Entrar com o Google"**.
  3. Verificar redirecionamento para o domínio `accounts.google.com`.
  4. Selecionar a conta Google de teste e conceder consentimento de escopo básico (email, profile).
  5. Confirmar retorno seguro para `/cliente` com exibição do nome do usuário.
- **Critério de Sucesso**: Usuário autenticado sem mensagens de erro de redirect URI.

---

## 2. Cenário B-08: Cadastro de Novo Usuário em Staging

- **Pré-requisitos**: Banco de dados Supabase branch/staging com e-mail confirmation desabilitado ou interceptador de e-mail (ex.: Inbucket).
- **Procedimento**:
  1. Acessar `/cliente/cadastro`.
  2. Preencher Nome: `E2E_Cliente_Manual`, E-mail: `e2e_manual_XXXX@afmotos.test`, Senha: `E2E_Password123!`.
  3. Marcar o checkbox de aceite dos Termos de Uso e Política de Privacidade.
  4. Clicar em **"Cadastrar"**.
- **Critério de Sucesso**: Conta criada com perfil em `customer_profiles` e saldo inicial zerado no ledger de créditos.

---

## 3. Cenário D-03: Consumo de 1 Crédito para Consulta

- **Pré-requisitos**: Usuário de teste com saldo `balance >= 1` em `customer_credit_balances`; `VEHICLE_LOOKUP_MODE=mock`.
- **Procedimento**:
  1. Fazer login com o usuário de teste e acessar `/cliente/consultas`.
  2. Informar placa `E2E1A23`.
  3. Clicar no botão **"Usar 1 Crédito"**.
  4. Confirmar o modal de dedução de crédito.
- **Critério de Sucesso**: Saldo debitado em 1 unidade no ledger sem chamada externa de cobrança Mercado Pago; laudo gerado e exibido no painel.

---

## 4. Cenário E-03: Checkout Pro Mercado Pago em Modo Sandbox

- **Pré-requisitos**: `MERCADO_PAGO_CHECKOUT_MODE=test`; credenciais de comprador sandbox da conta de desenvolvedor Mercado Pago.
- **Procedimento**:
  1. Acessar `/cliente/pacotes` com usuário logado.
  2. Escolher o Pacote Básico (3 consultas) e clicar em **"Comprar"**.
  3. Na interface do Mercado Pago Sandbox, selecionar cartão de teste ou PIX simulado.
  4. Concluir o pagamento simulado.
  5. Aguardar retorno à URL `/cliente/pagamento?status=approved`.
- **Critério de Sucesso**: Créditos adicionados ao extrato do cliente após validação de webhook/status.
