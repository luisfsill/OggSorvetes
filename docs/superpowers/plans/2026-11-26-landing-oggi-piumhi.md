# Landing Oggi Piumhi — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Landing estática da loja Oggi Piumhi com filme guiado pela rolagem, cardápio fictício com sacolinha que abre o WhatsApp e localização.

**Architecture:** HTML/CSS/JS puros, sem build. O filme é uma sequência de quadros WebP desenhada num `<canvas>` dentro de um palco `position: sticky`. Dados da loja e do cardápio em JSON; a lógica pura do pedido em `js/pedido.mjs`, testada com `node --test`.

**Tech Stack:** HTML, CSS, ES modules, ffmpeg (extração), Node 20+ (`node --test`).

**Spec:** `docs/superpowers/specs/2026-11-26-landing-oggi-piumhi-design.md`

## Global Constraints

- Cores: magenta `#9F3081`, rosa `#E62866`, laranja `#F29200`, ciano `#2CC3D5`; fundo de leitura creme.
- Fonte display arredondada livre (OFL), auto-hospedada.
- Funciona sem JS (conteúdo, cardápio e link do WhatsApp); `prefers-reduced-motion` mostra quadro fixo.
- Seção do cardápio com o aviso "Cardápio ilustrativo".
- Tudo o que varia por loja em `data/loja.json` e `data/cardapio.json`.
- Mensagem do WhatsApp com no máximo 30 linhas de itens.

## Review Focus

- Sacolinha vazia: "Fazer pedido" desabilitado, sem abrir WhatsApp vazio.
- Entrega sem endereço: bloqueia o envio e mostra o erro no campo.
- `localStorage` com item que saiu do cardápio: o item é descartado ao carregar.
- Nome com acentos e `&`/`#`: a URL do WhatsApp sai codificada.
- Rolagem rápida até o fim antes de todos os quadros carregarem: desenha o quadro carregado mais próximo.

---

### Task 1: Quadros e assets

**Files:** Create `tools/quadros.sh`, `assets/quadros/f001.webp…`, `assets/poster.webp`, `assets/picole.webp`, `assets/logo-oggi.svg`

- [ ] Recortar o clipe 1 (720×1280) para 720×1140 (`crop=720:1140:0:60`), tirando a marca d'água e o selo "AI"; exportar 30 fps (≈150 quadros) em WebP q=72.
- [ ] Último quadro vira `assets/poster.webp`; a imagem do picolé vira `assets/picole.webp` (largura 900).
- [ ] Conferir: total dos quadros ≤ 8 MB.
- [ ] Commit.

### Task 2: Lógica do pedido (TDD)

**Files:** Create `js/pedido.mjs`, `tests/pedido.test.mjs`

**Interfaces — Produces:**
- `formatarPreco(centavos: number) -> string` ("R$ 6,00")
- `limparSacola(sacola: {[id]: qtd}, itens: Item[]) -> {[id]: qtd}` (remove ids inexistentes e qtd ≤ 0)
- `totalSacola(sacola, itens) -> number` (centavos)
- `montarMensagem({sacola, itens, nome, modo: 'retirada'|'entrega', endereco}) -> string`
- `linkWhatsApp(numero: string, texto: string) -> string` (`https://wa.me/<só dígitos>?text=<encodeURIComponent>`)
- `validarPedido({sacola, modo, endereco, nome}) -> {ok: boolean, erros: {campo: msg}}`

- [ ] Testes: preço "R$ 6,00"; item inexistente descartado; total; mensagem começa com "Olá, Oggi Piumhi! Quero fazer um pedido:" e tem "2x Picolé de Morango — R$ 6,00"; corte em 30 linhas; acentos e `&` codificados no link; sacola vazia e entrega sem endereço → `ok:false`.
- [ ] Rodar `node --test tests/` (falha), implementar, rodar (passa). Commit.

### Task 3: Página, filme e cardápio

**Files:** Create `index.html`, `css/site.css`, `js/filme.js`, `js/cardapio.js`, `data/loja.json`, `data/cardapio.json`, `fonts/*`

**Interfaces — Consumes:** Task 1 (quadros `assets/quadros/fNNN.webp`), Task 2 (funções acima).

- [ ] Seções: abertura (500vh, palco sticky, 4 legendas por progresso 0–20/25–45/50–70/80–100 %), cardápio, localização (iframe Maps preguiçoso + Google Maps/Waze), inauguração/rodapé.
- [ ] `filme.js`: carrega o primeiro quadro já, o resto em segundo plano; desenha em rAF o quadro do progresso (ou o carregado mais próximo); `cover` no canvas; reduced-motion → só poster.
- [ ] `cardapio.js`: renderiza do JSON, botões +/−, sacolinha com `aria-live`, salva no `localStorage`, painel de pedido (nome, retirada/entrega, endereço), abre o `linkWhatsApp`.
- [ ] Sem JS: cardápio estático em `<noscript>` não necessário — HTML inicial já traz botão "Pedir pelo WhatsApp" com link simples.
- [ ] Commit.

### Task 4: Verificação no navegador

- [ ] Servir com `python -m http.server`, abrir em 390×844 e 1440×900: filme avança e volta, legendas trocam, sacolinha monta mensagem, link abre `wa.me`, console sem erros.
- [ ] Commit final.
