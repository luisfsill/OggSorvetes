// Filme guiado pela rolagem: desenha no canvas o quadro que corresponde ao progresso da seção.
const secao = document.querySelector('.filme');
const canvas = secao.querySelector('.tela-canvas');
const ctx = canvas.getContext('2d');
const legendas = [...secao.querySelectorAll('.legenda')];
const topo = document.querySelector('.topo');
const total = Number(secao.dataset.quadros);
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
  quadros[i].pronto = img.decode().then(() => { quadros[i].ok = true; if (Math.abs(i - alvo) < Math.abs(desenhado - alvo)) agendar(); }).catch(() => {});
  return quadros[i].pronto;
}

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
  for (const el of legendas) el.toggleAttribute('data-ativa', p >= Number(el.dataset.de) && p < Number(el.dataset.ate));

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
