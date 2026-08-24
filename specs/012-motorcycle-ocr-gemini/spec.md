# Feature Specification: OCR Inteligente para Cadastro de Motos

**Feature Branch**: `012-motorcycle-ocr-gemini`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "OCR inteligente para cadastro de motos com Google Gemini"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Leitura e Preenchimento Automático via Foto/Anexo de Documento (Priority: P1)

Como administrador do sistema, desejo tirar uma foto com a câmera do celular ou anexar uma imagem do documento do veículo (CRLV/CRV) na tela de cadastro de moto, para que os dados principais (marca, modelo, versão, anos, placa, RENAVAM, chassi, cor, combustível, cilindrada) sejam extraídos e preenchidos automaticamente no formulário, reduzindo o tempo de digitação e diminuindo erros manuais.

**Why this priority**: É a funcionalidade central de produtividade administrativa. Permite cadastrar motos em segundos diretamente do pátio usando o celular ou no desktop com documentos digitalizados.

**Independent Test**:
- Acessar o formulário de cadastro de moto (`/admin/motos/nova`).
- Anexar ou fotografar um documento válido de motocicleta.
- Acionar a leitura do documento.
- Constatar que os campos correspondentes do formulário foram preenchidos com os valores extraídos e sinalizados visualmente.

**Acceptance Scenarios**:

1. **Given** que o administrador está no formulário de nova moto com campos vazios, **When** ele anexa uma foto nítida de CRLV e solicita a leitura, **Then** o sistema processa o documento, exibe feedback de progresso e preenche os campos identificados (marca, modelo, versão, ano fab/mod, placa, renavam, chassi, cor, combustível, cilindrada), destacando-os com indicador visual de preenchimento assistido.
2. **Given** que o administrador está usando um dispositivo móvel com câmera, **When** ele clica na opção "Tirar foto", **Then** a interface aciona diretamente a câmera traseira do dispositivo para captura imediata com preview antes do processamento.
3. **Given** que a leitura foi concluída com sucesso, **When** os dados são injetados no formulário, **Then** a moto NÃO é salva automaticamente no banco de dados, mantendo o formulário em estado de rascunho para conferência humana.

---

### User Story 2 - Revisão Humana, Tratamento de Incertezas e Proteção de Dados Manuais (Priority: P2)

Como administrador, desejo visualizar claramente quais campos foram preenchidos pela leitura automática, receber alertas sobre dados com baixa confiança ou ilegíveis e ter total liberdade para corrigir valores antes do cadastro definitivo, sem que dados já preenchidos manualmente sejam sobrescritos sem consentimento.

**Why this priority**: Garante integridade e governança de dados. A IA atua como assistente e não como decisor final, prevenindo erros cadastrais e perda de trabalho manual.

**Independent Test**:
- Preencher manualmente alguns campos do formulário (ex.: placa e cor).
- Executar a leitura de um documento.
- Verificar que o sistema solicita confirmação antes de sobrescrever dados preenchidos previamente.
- Verificar que campos com baixa confiabilidade ou alertas recebem sinalização visual de conferência.

**Acceptance Scenarios**:

1. **Given** que o administrador já digitou informações em campos do formulário, **When** a leitura do documento retorna valores para esses mesmos campos, **Then** o sistema alerta o usuário e solicita confirmação antes de substituir as informações existentes.
2. **Given** que um campo do documento possui caracteres parcialmente ilegíveis ou baixa certeza de leitura, **When** a extração é apresentada, **Then** o campo é marcado com alerta visual de atenção, orientando a revisão minuciosa.
3. **Given** que o formulário foi preenchido pela extração, **When** o administrador edita qualquer campo manualmente, **Then** o valor manual prevalece e a validação padrão do formulário é aplicada no momento da submissão final.

---

### User Story 3 - Isolamento Estrito do Documento e Privacidade (Priority: P3)

Como gestor da plataforma, desejo que a foto do documento seja utilizada unicamente para o processamento de leitura e descartada em seguida, garantindo que o documento do veículo NUNCA seja publicado no catálogo público nem associado à galeria de fotos da motocicleta.

**Why this priority**: Protege a privacidade de dados do proprietário do veículo e assegura a integridade visual da vitrine pública de motos.

**Independent Test**:
- Realizar a leitura de um documento no cadastro.
- Enviar as fotos reais da moto para o catálogo.
- Concluir o cadastro da motocicleta.
- Verificar no catálogo público e no banco de dados que apenas as fotos da moto foram publicadas e que a imagem do documento não está exposta.

**Acceptance Scenarios**:

1. **Given** que o administrador realizou a leitura de um documento, **When** a moto é salva no sistema, **Then** a imagem do documento não é gravada na tabela de imagens públicas da moto e não é exibida em nenhuma listagem pública.
2. **Given** que um usuário não autenticado ou sem perfil de administrador tenta invocar a funcionalidade de leitura documental, **When** a requisição é recebida, **Then** o sistema recusa a operação com mensagem de não autorizado e nenhum processamento de documento ocorre.

---

### Edge Cases

- **Documento de baixa qualidade ou fora de foco**: O sistema deve informar amigavelmente que o documento não pôde ser interpretado e orientar nova captura ou preenchimento manual, sem quebrar o formulário.
- **Formato ou arquivo inválido**: Arquivos corrompidos, com tipos não suportados ou acima do limite de tamanho devem ser rejeitados imediatamente na seleção com mensagem explicativa.
- **Falha de conectividade ou indisponibilidade temporária do serviço de IA**: O sistema deve exibir mensagem clara de indisponibilidade temporária e permitir que o administrador continue o cadastro manualmente sem perda de dados.
- **Documento de outro tipo (não veicular)**: Caso o usuário anexe uma imagem que não seja documento veicular, o sistema deve retornar aviso de dados não identificados e manter o formulário inalterado.
- **Duplicidade de registros cadastrais (Placa, RENAVAM ou Chassi já existentes)**: Na tentativa de salvar a moto após revisão, a validação de unicidade deve impedir a duplicidade com mensagem de erro clara.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar na tela de cadastro de moto (`/admin/motos/nova`) uma seção destacada para preenchimento assistido por leitura de documento veicular.
- **FR-002**: A interface DEVE permitir captura direta via câmera traseira de dispositivos móveis com suporte ao atributo `capture="environment"`.
- **FR-003**: A interface DEVE permitir o envio de arquivos de imagem nos formatos JPEG, PNG e WebP com tamanho de até 10 MB.
- **FR-004**: O sistema DEVE exibir preview da imagem selecionada, permitindo trocar ou remover a imagem antes e depois do acionamento da leitura.
- **FR-005**: O acionamento do serviço de IA DEVE ocorrer exclusivamente sob demanda do usuário (ao clicar em botão explícito "Ler documento") e nunca de forma automática ao selecionar o arquivo.
- **FR-006**: O processamento de inteligência artificial DEVE ser executado estritamente no ambiente do servidor, sendo proibida a exposição de credenciais ou chaves secretas no cliente/navegador.
- **FR-007**: O serviço de leitura DEVE ser restrito a administradores autenticados, rejeitando qualquer requisição sem sessão administrativa válida.
- **FR-008**: O sistema DEVE extrair de forma estruturada os seguintes campos do documento: Marca, Modelo, Versão, Ano de Fabricação, Ano do Modelo, Placa, RENAVAM, Chassi, Cor, Combustível e Cilindrada.
- **FR-009**: O sistema DEVE aplicar normalização padronizada para Placa (maiúsculas, sem traços/espaços), RENAVAM (string preservando zeros à esquerda), Chassi (maiúsculas) e Cilindrada (número inteiro).
- **FR-010**: O sistema NÃO DEVE inferir nem preencher automaticamente campos comerciais e operacionais (Preço, Tipo de Propriedade, Operação, Categoria, Status, Destaque e Descrição Comercial), mantendo sua definição sob controle do administrador.
- **FR-011**: O sistema DEVE sinalizar visualmente no formulário os campos preenchidos pela leitura assistida com ícone/indicador informativo.
- **FR-012**: O sistema DEVE sinalizar com destaque de alerta os campos com baixa confiança ou ilegibilidade parcial apontados pelo processamento.
- **FR-013**: Caso existam campos já digitados no formulário, o sistema DEVE solicitar confirmação explícita do administrador antes de sobrescrever esses valores com dados da leitura.
- **FR-014**: O sistema NUNCA DEVE salvar a moto no banco de dados automaticamente como resultado da leitura; a persistência ocorre apenas mediante submissão explícita do formulário pelo administrador.
- **FR-015**: A imagem do documento veicular NÃO DEVE ser incluída na galeria de imagens públicas da motocicleta (`motorcycle_images`) nem exposta publicamente.
- **FR-016**: Em caso de falha, erro estrutural ou indisponibilidade da IA, o sistema DEVE exibir mensagem amigável e permitir preenchimento 100% manual sem travar o fluxo.

---

### Key Entities

- **Documento Veicular Temporário**: Imagem fornecida pelo administrador (via câmera ou upload) utilizada temporariamente no servidor para extração de caracteres e descarte logo após a interpretação.
- **Resultado da Leitura Assistida (OCR Result)**: Estrutura transitória de dados contendo campos extraídos, níveis de confiança por campo, avisos de ilegibilidade e tipo de documento identificado.
- **Motocicleta (`public.motorcycles`)**: Entidade principal de persistência no catálogo contendo dados técnicos revisados, documentação, especificações comerciais e fotos oficiais do veículo.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O tempo médio de preenchimento dos dados técnicos de uma motocicleta nova é reduzido em pelo menos 60% quando utilizado documento legível.
- **SC-002**: 100% das requisições de leitura são processadas exclusivamente pelo servidor, com zero vazamento de credenciais ou dados brutos em pacotes de cliente.
- **SC-003**: 0% de fotos de documentos anexadas para leitura aparecem acidentalmente na galeria pública de imagens de motos.
- **SC-004**: O processamento de leitura e retorno dos dados para a interface ocorre em menos de 8 segundos em condições normais de conectividade.
- **SC-005**: 100% dos cadastros efetuados com auxílio da leitura passam por confirmação humana antes da gravação no banco de dados.

---

## Assumptions

- O usuário administrador possui dispositivo com navegador moderno e suporte a upload de arquivos de imagem e/ou câmera.
- A chave de acesso ao serviço de IA (`GEMINI_API_KEY`) é configurada no ambiente seguro do servidor e possui cota disponível para requisições da equipe interna.
- O formato prioritário de documentos analisados corresponde aos padrões brasileiros de CRLV (Certificado de Registro e Licenciamento de Veículo) e CRV digital/físico.
- O fluxo de cadastro manual continua plenamente operacional caso o administrador opte por não utilizar a leitura de documentos.
