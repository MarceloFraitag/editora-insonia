# Editora Insônia

Prévia do catálogo de livros físicos da Editora Insônia, feita em HTML, CSS e JavaScript. A página usa o banner estrelado oficial e destaca a chegada de Gargoyle Game à editora em 2027. O catálogo tem busca, filtros, favoritos, cartas de tarô interativas e uma sacola de demonstração.

## Rodar localmente

O projeto roda sem instalar dependências ou gerar um build. Sirva a pasta por HTTP para que a revoada possa carregar o áudio. Na raiz, execute:

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
| `olho.js` | Olho 3D da bolha de atendimento, que segue o ponteiro |
| `chat.js` | Chat de prévia aberto pelo olho, com respostas prontas |
| `corvos.js` | Revoada de corvos e som ao revelar uma carta |
| `cards.js` | Inclinação 3D das cartas e brilho dos cards |
| `menu.js` | Troca animada dos nomes do menu no hover |
| `efeitos.js` | Lanterna e brasas no banner, relógio da insônia, sinos e livro voando até a sacola |
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

O Hero e a ficha de Gargoyle Game usam a mesma capa WebP de 720 px de largura. O Hero, a ficha e o catálogo podem reaproveitar a mesma requisição, e o JPG original permanece como alternativa para navegadores sem WebP. O botão na capa abre a ficha pelo mesmo mecanismo dos botões do catálogo. A prévia usa `noindex`; revise essa configuração e a URL de compartilhamento quando o domínio oficial for definido.

## Visualização no celular

Em telas estreitas, o catálogo organiza os filtros em duas colunas. Em paisagem, a abertura usa duas colunas quando há espaço. Os detalhes dos livros e o resumo do pedido mantêm o botão de fechar visível durante a rolagem, e o chat se ajusta à altura da tela.

## Tema, olho e corvos

No menu do topo, as letras giram no hover e revelam um nome sombrio (Catálogo vira Grimório, por exemplo). Os pares ficam no objeto `trocas` de `menu.js`; leitores de tela continuam lendo o nome original.

`efeitos.js` cuida do resto da atmosfera: no banner, o ponteiro funciona como lanterna e brasas rosadas sobem do fundo. Entre meia-noite e 5h, o aviso do topo mostra a hora ("São 2h14. Só mais um capítulo?") e o olho pisca mais devagar, como quem está com sono. Ao abrir a ficha do Gargoyle Game, um sino distante dobra duas vezes (som sintetizado no navegador, sem arquivo). Ao adicionar um livro, a capa voa até a sacola deixando penas e o contador pulsa. Com movimento reduzido no sistema, a lanterna fica parada e as brasas e o voo não aparecem.

O botão de lua e sol alterna entre os temas escuro e claro. Fica no cabeçalho em telas de até 900 px e no canto inferior direito nas demais. O navegador guarda a preferência em `editora-insonia-theme` e mantém favoritos e sacola em `editora-insonia-v5-demo`.

O olho flutuante abre um chat de prévia. As respostas ficam na lista `respostas` de `chat.js` e não há atendimento real conectado.

Ao revelar uma carta, corvos saem de trás dela. O som começa desligado. O botão “Som dos corvos”, no catálogo, guarda a escolha em `editora-insonia-raven-sound`. Com o som habilitado, o navegador ainda exige um gesto para iniciar o áudio. O ganho é de 0,24, e disparos próximos são limitados. A preferência de movimento reduzido já desativa a revoada e a inclinação das cartas.

A sacola e o resumo do pedido são simulações. A etapa de compra está prevista para a integração com WooCommerce. Veja o [roteiro de integração](docs/INTEGRACAO-WOOCOMMERCE.md).

As artes foram fornecidas para o protótipo. O uso de capas, cartas, marca e conteúdo editorial depende das permissões dos titulares. O som da revoada veio do arquivo `freesound_community-raven-manymp3-14529.mp3` (freesound_community); confira a licença na origem antes de publicar a loja.

## Verificação

```sh
node --check catalog.js
node --check script.js
node --check olho.js
node --check chat.js
node --check corvos.js
node --check cards.js
node --check menu.js
node --check efeitos.js
```

No navegador, confira a busca, os filtros, a virada das cartas e a sacola. Use Enter na capa do Hero, navegue com Tab na ficha e feche com Escape para conferir a devolução do foco. Teste também ficha → sacola → resumo e a remoção do último favorito. A sacola usa miniaturas sem interação. Recarregue a página para conferir as preferências de tema e áudio.
