# Quickstart Guide: Consulta de Placa Veicular — AF Motos

**Feature**: `018-consulta-placa-historico-veicular`  
**Target Environment**: Local / Staging / Production  

---

## 1. Configuração de Variáveis de Ambiente

No arquivo `.env.local` (ou painel de variáveis da Vercel):

```env
# Modo de Operação da Consulta Veicular ('mock' para desenvolvimento e testes, 'live' para produção)
VEHICLE_LOOKUP_MODE=mock

# Token Bearer da API Brasil (Necessário apenas quando VEHICLE_LOOKUP_MODE=live)
APIBRASIL_TOKEN=seu_token_aqui
```

> **Atenção**: Em modo `mock`, nenhuma chamada à API externa é efetuada e nenhum crédito é consumido.

---

## 2. Passo a Passo de Teste e Validação

### Cenário 1: Nova Consulta em Modo Mock (Simulação Segura)
1. Acesse o painel administrativo em: `http://localhost:3000/admin/consulta-placa`
2. No campo de busca, digite uma placa de teste (ex.: `BRA2E19` ou `ABC-1234`).
3. O sistema formatará automaticamente a placa. Clique em **"Verificar Placa"**.
4. Como a placa não existe no banco local, o sistema exibe o botão **"Consultar Histórico Oficial"**.
5. Ao clicar, o **Modal de Confirmação** será aberto exibindo:
   - Placa formatada em destaque (`BRA-2E19`).
   - Custo estimado: R$ 0,00 (badge `Consulta Simulada`).
   - Checkbox obrigatório: *"Conferi a placa e entendo que esta consulta poderá gerar cobrança."*
6. Marque o checkbox e clique em **"Confirmar e Executar"**.
7. O sistema carregará a fixture mock, salvará no banco e redirecionará para `/admin/consulta-placa/[id]`.
8. Verifique o badge amarelo: `Consulta Simulada (Nenhum crédito foi consumido)`.

---

### Cenário 2: Verificação de Cache Local (Custo R$ 0,00)
1. Retorne para a página `/admin/consulta-placa`.
2. Digite novamente a mesma placa consultada anteriormente (`BRA2E19`).
3. Observe que o card de busca exibe instantaneamente:
   - Badge verde: `Em Cache no Sistema (Custo Adicional: R$ 0,00)`.
   - Marca, Modelo, Ano e Nível de Risco já calculados.
   - Botão direto **"Abrir Histórico Salvo"**.
4. Nenhuma chamada externa é realizada.

---

### Cenário 3: Navegação pelas 9 Abas Temáticas
Na página de detalhes `/admin/consulta-placa/[id]`:
- **Resumo**: Confira o score de risco, status de roubo/furto, sinistro, leilão e débitos.
- **Dados do Veículo**: Confira marca, modelo, ano, chassi, motor e município.
- **Situação e Débitos**: Confira a soma de multas e IPVA.
- **Restrições e Gravames**: Confira alienação fiduciária e restrições financeiras.
- **Histórico**: Confira proprietários anteriores (com CPFs mascarados) e leilões.
- **Preço e FIPE**: Confira o valor de referência oficial FIPE e comparativo.
- **Anúncios e Km**: Confira registros históricos de anúncios da placa.
- **Dados Técnicos**: Confira dados de engenharia (potência, cilindrada, eixos).
- **JSON Técnico**: Confira o visualizador de código JSON com botão "Copiar JSON".

---

### Cenário 4: Geração e Download de Laudo em PDF
1. Na página de detalhes, clique no botão **"Baixar Laudo PDF"**.
2. O sistema iniciará o download direto do arquivo `historico-veicular_BRA2E19_[id].pdf`.
3. Abra o PDF e valide:
   - Logotipo oficial da AF Motos e cabeçalho institucional com CNPJ.
   - Diagramação limpa em folha A4 com tipografia nítida.
   - Mascaramento estrito de dados pessoais de terceiros (LGPD).
   - Disclaimer de isenção de responsabilidade no rodapé.
   - Ausência de saldo de créditos ou tokens da loja.

---

### Cenário 5: Vínculo com Motocicleta do Estoque
1. Na página de detalhes da consulta, clique em **"Vincular ao Inventário"**.
2. Selecione uma motocicleta cadastrada no dropdown e confirme.
3. Acesse a página da moto em `/admin/motos/[id]` e comprove que a consulta agora está vinculada e referenciada.
