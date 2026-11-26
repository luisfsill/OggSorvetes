// Filme guiado pela rolagem: desenha no canvas o quadro que corresponde ao progresso da seção.
const secao = document.querySelector('.filme');
const canvas = secao.querySelector('.tela-canvas');
const ctx = canvas.getContext('2d');
const legendas = [...secao.querySelectorAll('.legenda')];
const topo = document.querySelector('.topo');
const total = Number(secao.dataset.quadros);
const corTema = document.querySelector('meta[name="theme-color"]');
const reduzido = matchMedia('(prefers-reduced-motion: reduce)');

const quadros = new Array(total);
let alvo = 0;
let desenhado = -1;
let pendente = 0;

const caminho = i => `assets/quadros/f${String(i + 1).padStart(3, '0')}.webp`;

function carregar(i) {
  if (quadros[i]) return quadros[i].pronto;
  const img = new Image();
  img.decoding = 'async';
  img.src = caminho(i);
  quadros[i] = { img, ok: false };
  quadros[i].pronto = img.decode().then(() => { quadros[i].cores = coresDaBorda(img); quadros[i].ok = true; if (Math.abs(i - alvo) < Math.abs(desenhado - alvo)) agendar(); }).catch(() => {});
  return quadros[i].pronto;
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
  for (let passo = 16; passo >= 1; passo /= 2) {
    for (let i = 0; i < total; i += passo) if (!visto.has(i)) { visto.add(i); ordem.push(i); }
  }
  return ordem;
}

async function carregarTodos() {
  const ordem = ordemDeCarga();
  const paralelo = 6;
  let pos = 0;
  await Promise.all(Array.from({ length: paralelo }, async () => {
    while (pos < ordem.length) await carregar(ordem[pos++]);
  }));
}

function maisProximo(i) {
  for (let d = 0; d < total; d++) {
    if (quadros[i - d]?.ok) return i - d;
    if (quadros[i + d]?.ok) return i + d;
  }
  return -1;
}

function ajustarCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  desenhado = -1;
  agendar();
}

function desenhar(i) {
  const { img } = quadros[i];
  const escala = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const w = img.naturalWidth * escala;
  const h = img.naturalHeight * escala;
  ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  const [esq, dir] = quadros[i].cores;
  secao.style.setProperty('--esq', esq);
  secao.style.setProperty('--dir', dir);
  corTema.content = esq;
  desenhado = i;
}

function progresso() {
  const caixa = secao.getBoundingClientRect();
  const curso = secao.offsetHeight - innerHeight;
  return Math.min(1, Math.max(0, -caixa.top / curso));
}

function render() {
  pendente = 0;
  topo.toggleAttribute('data-solido', secao.getBoundingClientRect().bottom <= topo.offsetHeight);
  const p = progresso();
  secao.style.setProperty('--progresso', p.toFixed(4));
  secao.toggleAttribute('data-rolou', p > 0.02);
  for (const el of legendas) {
    const t = (p - el.dataset.de) / (el.dataset.ate - el.dataset.de);
    el.style.setProperty('--t', Math.min(1, Math.max(0, t)).toFixed(4));
    el.toggleAttribute('data-ativa', t > 0.1 && t < 0.9);
  }

  alvo = Math.round(p * (total - 1));
  const i = maisProximo(alvo);
  if (i >= 0 && i !== desenhado) desenhar(i);
}

function agendar() {
  if (!pendente) pendente = requestAnimationFrame(render);
}

function iniciar() {
  if (reduzido.matches) {
    legendas[0].setAttribute('data-ativa', '');
    addEventListener('scroll', () => topo.toggleAttribute('data-solido', scrollY > 40), { passive: true });
    return;
  }
  carregar(0).then(() => {
    secao.setAttribute('data-pronto', '');
    ajustarCanvas();
  });
  carregarTodos();
  addEventListener('scroll', agendar, { passive: true });
  addEventListener('resize', ajustarCanvas);
  agendar();
}

iniciar();
