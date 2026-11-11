# Editora Insônia — V6.3.1

Protótipo de catálogo de livros físicos em HTML, CSS e JavaScript. Identidade escura em roxo e magenta, capa oficial de Gargoyle Game e cartas de tarô interativas. Base visual para futura integração com WordPress e WooCommerce.

## Executar

Abra `index.html` no navegador. Não há instalação de dependências nem etapa de build.
Para testar por HTTP, execute na pasta do projeto:

```sh
python -m http.server 8000
```

Acesse http://localhost:8000. O servidor é apenas para desenvolvimento.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Estrutura, banner, seções institucionais e camadas da interface |
| `styles.css` | Cores, tipografia, layout, responsividade e animações |
| `catalog.js` | Títulos, sinopses, temas, preços e informações dos livros |
| `script.js` | Catálogo, busca, filtros, favoritos, sacola, modais e cartas |
| `assets/` | Capa oficial, cartas e identidade visual |
| `docs/INTEGRACAO-WOOCOMMERCE.md` | Roteiro para integração da loja |
| `CHANGELOG.md` | Histórico das entregas |

## Editar o conteúdo

Altere os produtos em `catalog.js`. Preços são inteiros em centavos (`6990` representa R$ 69,90); `null` exibe preço a confirmar. Preserve os IDs para manter a associação com favoritos e sacola.

`description` contém a chamada curta; `details`, a sinopse; `tropes`, os temas exibidos na ficha. `artwork` seleciona a imagem e a carta. Textos institucionais e destaque ficam em `index.html`. Cores e regras de tamanho ficam em `styles.css`.

## Cartas e imagens

| Livro | Frente inicial | Carta revelada |
|---|---|---|
| Gargoyle Game — Ricci | `gargoyle-game.jpg` | `tarot-moon.jpg` |
| Gargoyle Love — Dylan | `tarot-back.jpg` | `tarot-death.jpg` |
| Volume 3 — Mason | `tarot-back.jpg` | `tarot-hanged.jpg` |

As imagens estão em `assets/`. O banner também usa `gargoyle-game.jpg`. Passe o mouse sobre a carta para revelar; clique ou toque alterna o estado fixado. O botão funciona com Enter e Espaço. A preferência de redução de movimento desativa a transição.

O recorte das margens brancas está em `.tarot-face.is-tarot img`, no CSS. Os arquivos originais foram preservados: se trocar as imagens por arquivos já recortados, ajuste largura e altura para 100% e posições para zero. A borda preta em `::after` cobre a linha residual na extremidade.

## Estado local e limitações

Favoritos e sacola usam `localStorage`, na chave `editora-insonia-v5-demo`, mantida para compatibilidade. Nenhum pedido ou pagamento real é processado. Valores, disponibilidade e alguns dados comerciais são demonstrativos ou pendentes. O catálogo não substitui um backend de comércio eletrônico.

As artes foram fornecidas para o protótipo. Este repositório não concede licença sobre capas, cartas, marca ou conteúdo editorial.

## Validação

Verificação de sintaxe:

```sh
node --check script.js
node --check catalog.js
```

Antes da publicação, conferir no navegador:

- Banner com capa oficial e catálogo sem margens brancas nas cartas.
- Virada com mouse, toque e teclado; retorno ao estado inicial.
- Sinopse e seis temas de Gargoyle Game na ficha.
- Busca, filtros, favoritos e sacola demonstrativa.
- Fechamento dos modais com Escape e navegação por Tab.
- Layout em celular e desktop, sem rolagem horizontal.

A revisão V6.3.1 verifica a sintaxe; a validação visual e funcional em navegador ainda está pendente.

## Atualizar o Git

Copie o conteúdo desta pasta para a raiz do repositório existente, preservando a pasta `.git`. Não coloque o ZIP no repositório. Confira as alterações antes do commit:

```sh
git status
git diff --stat
git add index.html styles.css script.js catalog.js assets docs README.md CHANGELOG.md .gitignore .gitattributes
git commit -m "V6.3.1 - Documentação e organização do protótipo"
```

Depois, envie para a branch usada pela equipe. Consulte `docs/INTEGRACAO-WOOCOMMERCE.md` para a migração à loja real.
