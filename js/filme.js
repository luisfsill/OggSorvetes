// Filme guiado pela rolagem: desenha no canvas o quadro que corresponde ao progresso da seção.
// O progresso é suavizado (persegue a rolagem em vez de saltar), o que deixa o efeito liso no celular.
const secao = document.querySelector('.filme');
const palco = secao.querySelector('.palco');
const canvas = secao.querySelector('.tela-canvas');
const ctx = canvas.getContext('2d');
const legendas = [...secao.querySelectorAll('.legenda')];
const nome = secao.querySelector('.nome-gigante');
const barra = secao.querySelector('.progresso span');
const topo = document.querySelector('.topo');
const total = Number(secao.dataset.quadros);
const corTema = document.querySelector('meta[name="theme-color"]');
const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
const computador = matchMedia('(min-width: 900px) and (min-aspect-ratio: 1/1)');
// No celular carrega um quadro sim, um não: metade da memória e do download; a suavização cobre a diferença.
const passo = computador.matches ? 1 : 2;

const quadros = new Array(total);
let corVideo = '#3D1866';
let desenhado = -1;

// Geometria medida só no carregamento e no redimensionamento (nada de medir a cada quadro).
let inicio = 0;
let curso = 1;
let fimDoFilme = 0;

let pAlvo = 0;
let pAtual = 0;
let rodando = false;
let ultimoTempo = 0;
let solidoAntes = null;
let rolouAntes = null;
let temaEm = 0;

const caminho = i => `assets/quadros/f${String(i + 1).padStart(3, '0')}.webp`;

function carregar(i) {
  if (quadros[i]) return quadros[i].pronto;
  const img = new Image();
  img.decoding = 'async';
  img.src = caminho(i);
  quadros[i] = { img, ok: false };
  quadros[i].pronto = img.decode().then(async () => {
    quadros[i].cores = coresDaBorda(img);
    // Quadro já decodificado e no tamanho da tela: desenhar fica instantâneo, sem decodificar no meio da rolagem.
    quadros[i].img = await paraBitmap(img);
    quadros[i].ok = true;
    acordar();
  }).catch(() => {});
  return quadros[i].pronto;
}

async function paraBitmap(img) {
  if (!('createImageBitmap' in window) || !canvas.width) return img;
  const escala = Math.min(1, Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight));
  try {
    return await createImageBitmap(img, {
      resizeWidth: Math.round(img.naturalWidth * escala),
      resizeHeight: Math.round(img.naturalHeight * escala),
      resizeQuality: 'medium'
    });
  } catch {
    return img;
  }
}

// Cor das faixas esquerda e direita do quadro: o fundo da página acompanha o vídeo.
const amostra = document.createElement('canvas');
amostra.width = 2;
amostra.height = 8;
const ctxAmostra = amostra.getContext('2d', { willReadFrequently: true });

function corDaFaixa(img, x0) {
  const w = img.naturalWidth * 0.04;
  ctxAmostra.drawImage(img, x0 * (img.naturalWidth - w), img.naturalHeight * 0.2, w, img.naturalHeight * 0.6, 0, 0, 2, 8);
  const px = ctxAmostra.getImageData(0, 0, 2, 8).data;
  const soma = [0, 0, 0];
  for (let i = 0; i < px.length; i += 4) for (let c = 0; c < 3; c++) soma[c] += px[i + c];
  return `rgb(${soma.map(v => Math.round(v / 16)).join(' ')})`;
}

const coresDaBorda = img => [corDaFaixa(img, 0), corDaFaixa(img, 1)];

// Ordem de carga em passos cada vez menores: rolagem rápida já encontra um quadro próximo.
function ordemDeCarga() {
  const ordem = [];
  const visto = new Set();
  for (let p = 16 * passo; p >= passo; p /= 2) {
    for (let i = 0; i < total; i += p) if (!visto.has(i)) { visto.add(i); ordem.push(i); }
  }
  return ordem;
}

async function carregarTodos() {
  const ordem = ordemDeCarga();
  let pos = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (pos < ordem.length) await carregar(ordem[pos++]);
  }));
}

// Esmaecimento das bordas feito dentro do canvas (mais leve que máscara CSS a cada quadro).
let bordas = [];

function medir() {
  inicio = secao.getBoundingClientRect().top + scrollY;
  curso = Math.max(1, secao.offsetHeight - innerHeight);
  fimDoFilme = inicio + secao.offsetHeight - topo.offsetHeight;

  const dpr = Math.min(devicePixelRatio || 1, computador.matches ? 2 : 1.5);
  const { width, height } = canvas.getBoundingClientRect();
  const W0 = Math.round(width * dpr);
  const H0 = Math.round(height * dpr);
  // No celular a barra de endereço some e volta durante a rolagem: se o canvas não mudou, não redesenha.
  if (W0 === canvas.width && H0 === canvas.height && bordas.length) { lerRolagem(); acordar(); return; }
  canvas.width = W0;
  canvas.height = H0;
  const W = canvas.width;
  const H = canvas.height;
  const faixa = (x0, y0, x1, y1) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    return g;
  };
  const lado = W * (computador.matches ? 0.14 : 0.16);
  bordas = [
    [faixa(0, 0, lado, 0), 0, 0, lado, H],
    [faixa(W, 0, W - lado, 0), W - lado, 0, lado, H]
  ];
  if (!computador.matches) {
    bordas.push([faixa(0, 0, 0, H * 0.1), 0, 0, W, H * 0.1]);
    bordas.push([faixa(0, H, 0, H * 0.88), 0, H * 0.88, W, H * 0.12]);
  }
  desenhado = -1;
  lerRolagem();
  aplicar(true);
}

function cobrir(img, alpha) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const escala = Math.max(canvas.width / iw, canvas.height / ih);
  const w = iw * escala;
  const h = ih * escala;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}

// Desenha o quadro a e funde o quadro b por cima na proporção mistura: movimento contínuo entre quadros.
function desenhar(a, b, mistura) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cobrir(quadros[a].img, 1);
  if (b !== a && mistura > 0.01) cobrir(quadros[b].img, mistura);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'destination-out';
  for (const [g, x, y, bw, bh] of bordas) { ctx.fillStyle = g; ctx.fillRect(x, y, bw, bh); }
  ctx.globalCompositeOperation = 'source-over';

  const [esq, dir] = quadros[mistura > 0.5 ? b : a].cores;
  if (esq !== corVideo || palco.dataset.dir !== dir) {
    palco.style.background = `linear-gradient(to right, ${esq} 30%, ${dir} 70%)`;
    secao.style.backgroundColor = esq;
    palco.dataset.dir = dir;
  }
  corVideo = esq;
}

function vizinhos(exato) {
  const base = Math.floor(exato);
  let a = -1;
  let b = -1;
  for (let i = base; i >= 0; i--) if (quadros[i]?.ok) { a = i; break; }
  for (let i = base + 1; i < total; i++) if (quadros[i]?.ok) { b = i; break; }
  if (a < 0) a = b;
  if (b < 0) b = a;
  return [a, b];
}

function lerRolagem() {
  pAlvo = Math.min(1, Math.max(0, (scrollY - inicio) / curso));
}

// Aplica o progresso suavizado: quadro, textos, nome gigante e barra.
function aplicar(forcar) {
  const p = pAtual;
  const exato = p * (total - 1);
  const [a, b] = vizinhos(exato);
  if (a >= 0) {
    const mistura = b > a ? Math.min(1, Math.max(0, (exato - a) / (b - a))) : 0;
    const chave = a + mistura.toFixed(3) + b;
    if (chave !== desenhado || forcar) { desenhar(a, b, mistura); desenhado = chave; }
  }

  const v = p.toFixed(4);
  nome.style.setProperty('--progresso', v);
  barra.style.setProperty('--progresso', v);
  for (const el of legendas) {
    const t = Math.min(1, Math.max(0, (p - el.dataset.de) / (el.dataset.ate - el.dataset.de)));
    el.style.setProperty('--t', t.toFixed(4));
    const ativa = t > 0.1 && t < 0.9;
    if (ativa !== el.hasAttribute('data-ativa')) el.toggleAttribute('data-ativa', ativa);
  }
  const rolou = p > 0.02;
  if (rolou !== rolouAntes) { secao.toggleAttribute('data-rolou', rolou); rolouAntes = rolou; }
}

// Cabeçalho e barra de status: dependem da rolagem real, não da suavizada.
function atualizarTopo(agora) {
  const solido = scrollY >= fimDoFilme;
  if (solido !== solidoAntes) {
    topo.toggleAttribute('data-solido', solido);
    solidoAntes = solido;
    temaEm = 0;
  }
  // Trocar a cor da barra do navegador tem custo: no máximo a cada 250 ms.
  if (agora - temaEm > 250) {
    const cor = solido ? '#9F3081' : corVideo;
    if (corTema.content !== cor) corTema.content = cor;
    temaEm = agora;
  }
}

function quadro(agora) {
  const dt = Math.min(64, agora - (ultimoTempo || agora));
  ultimoTempo = agora;
  const k = 1 - Math.pow(1 - 0.16, dt / 16.67);
  pAtual += (pAlvo - pAtual) * k;
  if (Math.abs(pAlvo - pAtual) < 0.0004) pAtual = pAlvo;
  aplicar(false);
  atualizarTopo(agora);
  if (pAtual !== pAlvo) requestAnimationFrame(quadro);
  else { rodando = false; ultimoTempo = 0; }
}

function acordar() {
  if (rodando) return;
  rodando = true;
  requestAnimationFrame(quadro);
}

function iniciar() {
  if (reduzido.matches) {
    legendas[0].setAttribute('data-ativa', '');
    addEventListener('scroll', () => {
      const solido = scrollY > 40;
      topo.toggleAttribute('data-solido', solido);
      corTema.content = solido ? '#9F3081' : corVideo;
    }, { passive: true });
    return;
  }
  medir();
  carregar(0).then(() => {
    secao.setAttribute('data-pronto', '');
    acordar();
  });
  carregarTodos();
  addEventListener('scroll', () => {
    lerRolagem();
    // Salto (clique na logo ou num link): o vídeo vai junto de uma vez, sem rebobinar na frente da pessoa.
    if (Math.abs(pAlvo - pAtual) > 0.3) { pAtual = pAlvo; aplicar(true); }
    acordar();
  }, { passive: true });
  addEventListener('resize', medir);
  pAtual = pAlvo;
  aplicar(true);
  atualizarTopo(performance.now());
}

iniciar();
