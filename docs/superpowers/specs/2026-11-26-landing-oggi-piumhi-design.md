# Landing da Oggi Sorvetes Piumhi — design

Data: 26/11/2026

## Intenção e porquê

Luis quer **vender** esta landing por cerca de R$ 1.000 à loja Oggi Sorvetes de Piumhi, que está para inaugurar. A página vai pronta no direct do Instagram como demonstração. Ela precisa impressionar no primeiro toque, quase sempre num celular aberto a partir do Instagram, e mostrar valor prático: onde fica a loja e como pedir.

O efeito central é um **filme guiado pela rolagem**: ao rolar, a imagem avança como um vídeo em alta qualidade (sorvete, calda, derretimento) e volta quando a pessoa rola para cima.

## Fatos confirmados (Instagram @oggisorvetespiumhi, 26/11/2026)

- Nome: Oggi Sorvetes Piumhi. 5 posts, ~1.680 seguidores.
- Bio: "Em breve inauguração", "Sorvetes a preço de fábrica", "A maior rede de sorvetes do Brasil", "Rua Miguel Couto, 91, centro".
- Tom dos posts: animado, muitos emojis, roxo (💜), "sabor de milhões, preço de pouquinhos", foco em picolé e preço baixo.
- Oggi é **franquia nacional**. Logo e roxo são da marca. A página se apresenta como "a página da loja de Piumhi", sem se passar pela rede.
- Não há WhatsApp, horário, data de inauguração nem cardápio publicados.

## Marca (lojas de Formiga e Boa Esperança + site oggisorvetes.com.br, 26/11/2026)

- Cores do site oficial: magenta `#9F3081` (principal), rosa `#E62866`, laranja `#F29200` (uniforme da equipe), ciano `#2CC3D5`. Fonte oficial Omnes (arredondada); usar equivalente livre.
- Logo oficial em SVG branco (`assets/raw/oggi-logo.svg`, do site da rede).
- O carro-chefe é o **picolé**: picolés cobertos de chocolate, de fruta (manga, morango, limão), linha Délice, Kids com personagens. A loja é um autosserviço com freezers ("shopping do sorvete"). Linhas reais: Giratto (cone), Top Sundae, Sensa Bombom, potes de massa. Picolé de torta de limão a R$ 2,76 (post de Formiga).
- Formiga mostra horário (seg–sáb 10h–19h; dom/feriado 9h–18h), iFood e carrinho Oggi Fest para festas. Piumhi pode seguir o mesmo modelo, a confirmar.
- O cardápio fictício usa as categorias reais (Picolés de fruta, Picolés cremosos e cobertos, Especiais, Potes e massa, Kids) com nomes genéricos e preços de exemplo.

## Objetivos

1. Abertura com filme guiado pela rolagem, liso no celular e no computador.
2. Cardápio **fictício** com sacolinha. "Fazer pedido" abre o WhatsApp da loja com a mensagem montada (itens, quantidades, total, nome e retirada ou entrega).
3. Localização: endereço, mapa e botões "Como chegar" (Google Maps e Waze).
4. Inauguração "em breve", Instagram e WhatsApp no rodapé.

## Não objetivos

- Painel administrativo, pagamento on-line, login, banco de dados.
- Site institucional da rede Oggi.
- Publicação no ar: só com OK de Luis (provável Netlify, como o site da Reyla).

## Antiobjetivos (falha mesmo funcionando)

- Página pesada ou travando no celular de entrada, que é o público.
- Parecer site oficial da franqueadora ou inventar fatos (data de inauguração, prêmios, sabores reais apresentados como reais).
- Cardápio fictício parecer real: a seção leva o aviso "Cardápio ilustrativo".

## Restrições

- HTML, CSS e JavaScript puros, sem etapa de build, como a referência Sérum Âmbar (`ultimate-front-pack/landing-pages/vitrines-de-produto/serum-ambar`).
- Funciona sem JavaScript: conteúdo legível, cardápio visível e link direto do WhatsApp.
- `prefers-reduced-motion`: filme vira quadros fixos.
- Acessibilidade: botões reais, foco visível, contraste AA, `aria-live` na sacolinha.
- Tudo o que muda de loja para loja fica em um lugar só: `data/loja.json` (WhatsApp, endereço, coordenadas, horário, Instagram) e `data/cardapio.json` (categorias e itens).

## Abordagens consideradas

| | Abordagem | Troca |
|---|---|---|
| **A (escolhida)** | Clipes do Dreamina convertidos em sequência de quadros `.webp` desenhados num `<canvas>` pela rolagem | Visual de filme real; gasta créditos e pesa 8 a 15 MB carregados aos poucos |
| B | Animação feita em código (WebGL/SVG) | Leve e grátis, mas parece ilustração |
| C | Vídeo de banco gratuito | Rápido, porém genérico e sem o roxo da marca |

Luis escolheu A. Quadros em canvas no lugar de `video.currentTime` porque o seek de vídeo engasga no celular.

## Decisões de Luis

- Filme guiado pela rolagem com vídeo gerado no Dreamina (ele tem créditos).
- Pedido pelo WhatsApp com cardápio fictício e sacolinha. O cardápio real virá da loja depois.

## Decisões minhas (para Luis conferir)

- **Formato do filme: vertical 9:16, 1080×1920.** O público chega pelo Instagram no celular. No computador, o filme ocupa uma coluna à direita, em altura total, com os textos à esquerda e o fundo roxo. Gerar em 16:9 e cortar perderia nitidez no celular.
- **Roteiro (3 clipes de 5 s, encadeados pela última imagem):**
  1. Bola de sorvete de uva/roxo girando devagar sobre fundo roxo escuro, gotas de condensação.
  2. Calda de chocolate escorrendo pela bola e a casquinha.
  3. Câmera se afasta, a casquinha começa a derreter e o espaço vazio fica no topo para a mensagem final.
  - Os prompts ficam em `docs/prompts-dreamina.md`.
- **Quadros:** 24 por segundo de clipe, cerca de 360 no total, em WebP 1080×1920 (celular recebe uma versão 720×1280). Primeiro quadro carregado de imediato; os outros em segundo plano.
- **Quadros provisórios** até os clipes chegarem: sequência gerada por script (gradiente roxo com uma forma de sorvete simples), só para o efeito funcionar.
- **Legendas no filme:** "A Oggi chegou em Piumhi", "Preço de fábrica", "Muuuita variedade", "Peça agora".
- **Cardápio fictício:** Picolés, Sorvete de massa, Açaí, Milkshakes, Taças. 4 a 6 itens cada, com preços fictícios. A sacolinha fica salva no `localStorage`.
- **Mensagem do WhatsApp:** "Olá, Oggi Piumhi! Quero fazer um pedido:" + linhas "2x Picolé de Morango — R$ 6,00" + total + nome + retirada/entrega (+ endereço quando entrega). Link `https://wa.me/<número>?text=...`. Número provisório marcado `[CONFIRMAR]`.
- **Mapa:** iframe do Google Maps por endereço (sem chave de API) carregado só quando a seção aparece.
- **Logo:** avatar do Instagram, na maior resolução que o Instagram servir.
- **Tipografia e cor:** roxo da Oggi como cor principal, creme como fundo de leitura, um acento morango. Fonte display arredondada, auto-hospedada.
- **Teste:** um teste em Node para a função que monta a mensagem e o link do WhatsApp.

## Respostas à revisão do construtor (minhas decisões)

- **Clipes:** chegam como `.mp4` do Dreamina. A conversão em quadros é um script com ffmpeg (instalado, 9.1). O site é entregue primeiro com quadros provisórios; trocar pelos reais é rodar o script e ajustar os pontos das legendas.
- **Rolagem da abertura:** seção de 500vh com um palco fixo (`position: sticky`, 100vh). Legendas por progresso: 0–20 % "A Oggi chegou em Piumhi", 25–45 % "Preço de fábrica", 50–70 % "Muuuita variedade", 80–100 % "Peça agora" com o botão do cardápio.
- **Computador:** palco fixo; filme na coluna direita em altura total; as legendas trocam no mesmo lugar, na coluna esquerda, com fade. **Celular:** filme em tela cheia, legenda na parte de baixo sobre um degradê.
- **Sem JavaScript:** a abertura mostra o último quadro como imagem e as quatro legendas empilhadas.
- **Entrega:** `loja.json` tem `"entrega": true|false`. Com entrega, o endereço do cliente é obrigatório; sem entrega, a opção some e o pedido é só retirada. A demonstração usa `true`.
- **Mapa** por endereço; sem coordenadas. **Horário** desconhecido aparece como "Horário em breve".
- **Logo:** baixo o avatar pelo Chrome. **Fonte:** escolha minha, auto-hospedada e com licença OFL.
- **Peso:** primeiro quadro e texto em até 1,5 s no 4G; conjunto de quadros do celular entre 5 e 8 MB, do computador até 15 MB.
- **WhatsApp:** a mensagem é limitada a 30 linhas de itens, bem abaixo do limite do link.

## Fica para quem constrói

- Estrutura de pastas, nomes de classes, curvas de easing e o ritmo exato da rolagem.
- Tamanho final dos lotes de quadros e a estratégia de pré-carregamento.
- Ícones e microinterações da sacolinha.

## Pendências para pedir à loja

`[CONFIRMAR]` número de WhatsApp, horário, data de inauguração, cardápio real com preços, se fazem entrega e autorização da franqueadora para página própria.
