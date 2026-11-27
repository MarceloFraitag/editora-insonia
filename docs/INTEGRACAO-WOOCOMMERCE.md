# Roteiro técnico — WordPress + WooCommerce

**Escopo de lançamento confirmado:** livros **físicos**. Não criar variações de e-book nem liberar vendas até validação da operação com a editora.

## 1. Estrutura proposta

- **WordPress:** CMS e publicação de conteúdo editorial.
- **WooCommerce:** produtos físicos, catálogo, atributos, estoque, carrinho, checkout, impostos/frete e pedidos.
- **Tema próprio ou tema filho:** traduzir o HTML/CSS da prévia atual para templates do WordPress e estilos de blocos/áreas WooCommerce compatíveis.
- **Plugins de pagamento e entrega:** escolher provedores compatíveis após confirmar CNPJ, logística e conta da editora. Nunca colocar credenciais no tema.

## 2. Mapeamento do protótipo

| Protótipo estático | Origem futura | Implementação |
|---|---|---|
| `catalog.js` | Produtos WooCommerce | Título, preço, SKU real, descrição, imagens, categorias e atributos |
| Cards de produto | Loop de produtos WooCommerce | Template de catálogo ou componentes de blocos |
| Detalhes em modal | Página de produto WooCommerce | URL do produto e template personalizado com acessibilidade |
| Favoritos locais | Recurso opcional | Manter local ou integrar solução confiável, se a editora aprovar |
| Sacola `localStorage` | Carrinho WooCommerce | **Substituir**, não compartilhar estados paralelos |
| Resumo de demonstração | Checkout WooCommerce | **Substituir**, com gateway, frete e pedidos reais |
| Filtros/busca | Busca e taxonomias WP/Woo | Filtros do catálogo com URLs navegáveis |
| Capas e cartas em assets | Biblioteca de mídia WP | Arquivos oficiais licenciados da editora |
| Texto institucional | Páginas WordPress | Editor visual e campos configuráveis |

## 3. Cadastro inicial de produtos

Validar para cada livro: nome, autor, gênero, descrição, ISBN/EAN (se disponível), preço de capa, preço de venda, peso, dimensões **com embalagem**, estoque, imagem oficial, data e condições de disponibilidade. Os SKUs `DEMO-` e `PENDENTE-` são identificadores de protótipo; não devem ir para produção sem revisão.

**Gargoyle Love:** a data 15/03/2027 está na V3 recebida. Em novembro/2026, é uma data futura. **Não habilitar venda antecipada automaticamente.** Caso a editora queira pré-venda no futuro, definir regras específicas de disponibilidade, entrega e informação ao cliente.

**Gargoyle Game e volume 3:** o protótipo não apresenta preços ou disponibilidade por falta de dados oficiais.

## 4. Fluxo de compra real

1. Cliente abre a página do livro físico, confere descrição/edição e estoque.
2. Adiciona o produto ao carrinho nativo do WooCommerce.
3. Informa CEP e endereço no checkout nativo (HTTPS), de acordo com o método de envio configurado.
4. Seleciona uma opção real de envio e um meio de pagamento configurado.
5. WooCommerce registra pedido/status e envia notificações conforme as configurações.
6. A equipe acompanha pedidos, estoque, reembolso e expedição no painel.

## 5. Checklist antes da liberação

- [ ] Confirmar catálogo, capas e demais artes oficiais com a Elena/editora.
- [ ] Confirmar preços, ISBN, peso, medidas com embalagem e quantidades.
- [ ] Definir modalidades de entrega e regiões atendidas.
- [ ] Definir gateway de Pix/cartão, credenciais e tarifas.
- [ ] Configurar páginas de política de privacidade, troca, devolução, termos e dados institucionais (revisão jurídica/operacional).
- [ ] Definir configuração de impostos/documentos fiscais com apoio contábil.
- [ ] Escolher hospedagem com HTTPS, backups e atualização de plugins.
- [ ] Testar compra autorizada, recusada, cancelada, reembolso, e-mails, estoque e frete em ambiente de homologação.
- [ ] Testar mobile, acessibilidade, performance e links antes de apontar domínio.
- [ ] Remover marcas “protótipo” **apenas depois** da loja operar de verdade.

## 6. Observação de segurança

Não criar uma API de pagamento própria em `script.js`; não armazenar dados de cartão em `localStorage`; não usar `catalog.js` como fonte de preço ou estoque durante a venda. Preço, frete e confirmação de pedido devem ser calculados/validados no ambiente do WooCommerce e provedores configurados.

Na migração, vincular a capa do Hero à página oficial de Gargoyle Game. Preço, estoque, data de chegada, ISBN, classificação indicativa e dados da edição dependem de confirmação. A campanha de 2027 informa a chegada à Editora Insônia. Manter o filtro comercial ligado aos dados confirmados no WooCommerce.

Revisar `noindex` e o endereço da imagem de compartilhamento na configuração do domínio oficial.
