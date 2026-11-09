# Editora Insônia — Protótipo HTML V5

Protótipo navegável de uma **loja de livros físicos** da Editora Insônia, baseado na V3. Mantém o logotipo original, o olho decorativo e a identidade noturna em vinho, ameixa e magenta.

## Como abrir

Extraia o ZIP inteiro e abra `index.html`. Se o navegador restringir recursos locais, rode um servidor HTTP estático no diretório do projeto:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000/`.

Não é necessário instalar dependências e não há chamadas de rede para processar dados de compra.

## O que já funciona na V5

- Layout responsivo para desktop, tablet e celular, com menu mobile.
- Catálogo de **livros físicos** com busca por título/autora e filtros.
- Ficha de produto em janela acessível, aberta por botões de detalhes.
- Favoritos, com estado salvo em `localStorage` do navegador.
- Sacola demonstrativa com inclusão, atualização de quantidades, remoção, contador e subtotal.
- Persistência da sacola após recarregar a página (neste navegador).
- Prévia do resumo do pedido, **sem formulário de dados pessoais, pagamento ou criação de pedido**.
- Avisos claros sobre preços ilustrativos e sobre cálculo futuro de frete.
- Navegação por teclado, teclas Escape/Tab em diálogos, foco visível e preferência por animações reduzidas.

## Catálogo e transparência

O arquivo `catalog.js` concentra os produtos. A V5 não presume disponibilidade, estoque nem abre pré-venda.

| Livro | Preço na V5 | Sacola demo | Arte |
|---|---|---|---|
| Gargoyle Love — Sabine Vecchi | **R$ 69,90** (valor ilustrativo herdado da V3) | Sim | Capa conceitual em CSS da V3 |
| Gargoyle Game — Sabine Vecchi | A confirmar | Não | Representação tipográfica conceitual |
| Trilogia Gargoyle — vol. 3 | A confirmar | Não | Cartão de espera conceitual |

A ficha de Gargoyle Love contém os dados da V3: 528 páginas, 16 × 23 cm, data **15/03/2027**. A data **não** foi verificada com a editora. A capa e quaisquer dados comerciais precisam ser validados antes da publicação.

## Arquivos

- `index.html`: interface e textos.
- `styles.css`: identidade visual e responsividade.
- `catalog.js`: dados demonstrativos dos livros físicos.
- `script.js`: filtros, favoritos, sacola, detalhes e resumo.
- `assets/insomnia-logotype.svg`: logotipo fornecido na V3.
- `assets/eye-pointer.png`: decoração original fornecida na V3.
- `docs/INTEGRACAO-WOOCOMMERCE.md`: plano de implementação real da loja.

## Antes de publicar uma loja real

**Este projeto ainda não é um checkout funcional.** Não há servidor, meios de pagamento, pedidos, estoque real, frete real, cadastro ou envio de dados. Não habilite cobranças nem use os valores demonstrativos como dados oficiais.

Para produção, o caminho previsto é **WordPress + WooCommerce**, usando o visual desta V5 como referência e os produtos nativos do WooCommerce como fonte de verdade. O fluxo de sacola e checkout demonstrativos deve ser substituído pelo sistema do WooCommerce, em vez de adaptado para realizar cobranças por conta própria.

Antes da ativação: confirmar dados e artes oficiais, quantidade/estoque, política de frete, condições de entrega, contatos, CNPJ, páginas legais e testes de ponta a ponta.
