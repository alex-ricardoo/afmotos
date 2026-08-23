# Quickstart / Guia de Validação

Este documento orienta o processo de validação manual para verificar se a funcionalidade de Vendas e Recibos foi implementada corretamente, de ponta a ponta.

## 1. Validar Alteração de Status

1. Acesse o painel como administrador e navegue até a listagem de motocicletas (`/admin/motos`).
2. Edite uma moto disponível ou adicione uma nova para fins de teste.
3. No campo "Status", altere para **Vendida**.
4. **Resultado Esperado**: Um modal deve aparecer com a pergunta "Marcar esta moto como vendida? Deseja registrar os dados da venda agora?".

## 2. Validar Registro de Venda

1. No modal acima, clique em **Registrar venda**.
2. **Resultado Esperado**: O formulário de vendas (`/admin/vendas/nova`) deve ser aberto, pré-preenchido com a moto que estava sendo editada, seu valor e a data atual.
3. Preencha os dados do comprador (nome e telefone), forma de pagamento e valor pago.
4. Salve.
5. **Resultado Esperado**: Um feedback visual (toast) de sucesso deve aparecer, e a moto original agora consta como `SOLD` no banco. A venda aparece no topo do histórico (`/admin/vendas`).

## 3. Validar Histórico e Buscas

1. Acesse `/admin/vendas`.
2. Verifique os indicadores no topo: "Total vendido", "Vendas no mês". Devem refletir a venda recém-criada.
3. Utilize a barra de busca e tente filtrar pelo nome do comprador recém-adicionado.
4. Redimensione a janela (ou teste num aparelho mobile).
5. **Resultado Esperado**: No mobile, a listagem de vendas se transforma em Cards verticais legíveis, sem barra de rolagem horizontal desnecessária.

## 4. Validar Geração do Recibo PDF

1. No histórico de vendas, encontre a venda criada e clique em **Gerar Recibo**.
2. **Resultado Esperado**: Uma nova janela se abre ou o download de um arquivo PDF inicia imediatamente (dependendo do navegador).
3. Abra o PDF.
4. **Verificações Visuais no PDF**:
   - A logo da AF Motos e os contatos (do `site_settings`) devem constar no cabeçalho.
   - Os dados do veículo (Marca, Modelo, Ano) devem ser exatos.
   - O valor BRL deve estar formatado corretamente (ex: `R$ 25.000,00`).
   - Não devem aparecer os textos indesejados mencionados nas restrições (ex: cláusulas restritivas sem permissão).
