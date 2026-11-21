# Editora Insônia

Protótipo do catálogo de livros físicos da Editora Insônia, feito em HTML, CSS e JavaScript. A página destaca Gargoyle Game, de Sabine Vecchi, com a capa oficial e o banner do corvo. O catálogo tem busca, filtros, favoritos, cartas de tarô interativas e uma sacola de demonstração.

## Rodar localmente

Abra `index.html` no navegador. O projeto roda sem instalar dependências ou gerar um build. Para servir a pasta por HTTP, execute na raiz:

```sh
python -m http.server 8000
```

Abra [localhost:8000](http://localhost:8000).

## Onde editar

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Banner, textos da editora e estrutura da página |
| `styles.css` | Layout, temas, responsividade e animações |
| `catalog.js` | Livros, sinopses, temas, preços e disponibilidade |
| `script.js` | Busca, filtros, cartas, favoritos, sacola e troca de tema |
| `assets/` | Artes do banner, capa, cartas e marca |
| `CHANGELOG.md` | Histórico das versões |

Em `catalog.js`, use `description` para a chamada do card, `details` para a sinopse da ficha e `tropes` para os temas do livro. Os preços ficam em `priceCents`: `6990` equivale a R$ 69,90 e `null` exibe “Preço a confirmar”. Preserve o `id` de cada livro para manter a associação com favoritos e sacola.

O campo `artwork` escolhe as imagens da frente e do verso:

| Valor | Frente | Carta revelada |
|---|---|---|
| `game` | Capa de Gargoyle Game | A Lua |
| `love` | Verso do baralho | A Morte |
| `mystery` | Verso do baralho | O Enforcado |

Passe o mouse para revelar a carta. Clique, toque, Enter ou Espaço alternam o estado fixado. O recorte das margens das cartas fica em `.tarot-face.is-tarot img`.

## Tema e sacola

O botão do olho no canto inferior direito alterna entre os temas escuro e claro. O navegador guarda a preferência em `editora-insonia-theme` e mantém favoritos e sacola em `editora-insonia-v5-demo`.

A sacola e o resumo do pedido são simulações. A etapa de compra está prevista para a integração com WooCommerce. Veja o [roteiro de integração](docs/INTEGRACAO-WOOCOMMERCE.md).

As artes foram fornecidas para o protótipo. O uso de capas, cartas, marca e conteúdo editorial depende das permissões dos titulares.

## Verificação

```sh
node --check catalog.js
node --check script.js
```

No navegador, confira a busca, os filtros, a virada das cartas, a sacola e o fechamento dos diálogos com Escape. Recarregue a página para conferir a preferência de tema e teste o layout em celular e desktop.
