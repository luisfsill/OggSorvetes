import { formatarPreco, limparSacola, totalSacola, montarMensagem, linkWhatsApp, validarPedido } from './pedido.mjs';

const CHAVE = 'oggi-piumhi-sacola';
const $ = (s, el = document) => el.querySelector(s);

const artes = {
  picole: '<svg viewBox="0 0 40 52"><rect x="8" y="2" width="24" height="34" rx="12" fill="var(--cor)"/><rect x="8" y="2" width="24" height="34" rx="12" fill="url(#brilho)"/><rect x="17" y="34" width="6" height="16" rx="3" fill="#E2B77E"/></svg>',
  cone: '<svg viewBox="0 0 40 52"><circle cx="20" cy="16" r="13" fill="#F3E3EE"/><path d="M8 16c4 6 20 6 24 0" fill="var(--cor)"/><path d="M7 20h26L20 50z" fill="#E2A65A"/></svg>',
  copo: '<svg viewBox="0 0 40 52"><circle cx="20" cy="14" r="11" fill="var(--cor)"/><path d="M6 20h28l-4 30H10z" fill="#fff" stroke="var(--cor)" stroke-width="2.5"/></svg>',
  caixa: '<svg viewBox="0 0 40 52"><rect x="4" y="12" width="32" height="32" rx="6" fill="var(--cor)"/><circle cx="14" cy="22" r="5" fill="#5A2E1A"/><circle cx="26" cy="22" r="5" fill="#5A2E1A"/><circle cx="14" cy="34" r="5" fill="#5A2E1A"/><circle cx="26" cy="34" r="5" fill="#5A2E1A"/></svg>',
  pote: '<svg viewBox="0 0 40 52"><rect x="4" y="12" width="32" height="6" rx="3" fill="#9F3081"/><path d="M6 18h28l-3 28H9z" fill="var(--cor)" stroke="#9F3081" stroke-width="2"/></svg>'
};

let itens = [];
let loja = {};
let sacola = {};

function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(sacola)); } catch { /* modo privado: segue sem salvar */ }
}

function lerSacola() {
  try { return JSON.parse(localStorage.getItem(CHAVE)); } catch { return {}; }
}

function renderizarCardapio(cardapio) {
  $('#cardapio-aviso').textContent = cardapio.aviso;
  $('.abas').innerHTML = cardapio.categorias.map(c => `<a href="#cat-${c.id}">${c.aba || c.nome}</a>`).join('');
  $('.categorias').innerHTML = `<svg width="0" height="0" aria-hidden="true"><linearGradient id="brilho" x1="0" x2="1"><stop offset=".15" stop-color="#fff" stop-opacity=".35"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient></svg>` +
    cardapio.categorias.map(c => `
      <section class="categoria" id="cat-${c.id}" aria-labelledby="t-${c.id}">
        <h3 id="t-${c.id}">${c.nome}</h3>
        <ul class="itens">${c.itens.map(i => `
          <li class="item" style="--cor:${i.cor}" data-id="${i.id}">
            <div class="item-arte" aria-hidden="true">${artes[i.forma || 'picole']}</div>
            <div>
              <h4>${i.nome}</h4>
              <p>${i.descricao}</p>
              <span class="item-preco">${formatarPreco(i.preco)}</span>
            </div>
            <div class="qtd">
              <button type="button" data-acao="menos" aria-label="Tirar um ${i.nome}" hidden>−</button>
              <output aria-label="Quantidade de ${i.nome}" hidden>0</output>
              <button type="button" data-acao="mais" aria-label="Adicionar ${i.nome}">+</button>
            </div>
          </li>`).join('')}
        </ul>
      </section>`).join('');
}

function atualizar(anuncio) {
  sacola = limparSacola(sacola, itens);
  salvar();
  for (const li of document.querySelectorAll('.item')) {
    const qtd = sacola[li.dataset.id] || 0;
    const out = $('output', li);
    out.textContent = qtd;
    out.hidden = qtd === 0;
    $('[data-acao="menos"]', li).hidden = qtd === 0;
  }
  const quantidade = Object.values(sacola).reduce((a, b) => a + b, 0);
  const total = formatarPreco(totalSacola(sacola, itens));
  const botao = $('.sacola-botao');
  botao.hidden = quantidade === 0;
  $('.sacola-resumo', botao).textContent = `Ver sacola (${quantidade}) · ${total}`;
  botao.setAttribute('aria-label', `Ver sacola: ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}, ${total}`);
  if (anuncio) {
    $('#sacola-anuncio').textContent = anuncio;
    botao.removeAttribute('data-pulso');
    void botao.offsetWidth;
    botao.setAttribute('data-pulso', '');
  }
  renderizarSacola();
}

function renderizarSacola() {
  const lista = itens.filter(i => sacola[i.id]);
  const foco = document.activeElement?.closest?.('.sacola-itens [data-acao]');
  const voltar = foco && `[data-id="${foco.closest('li').dataset.id}"] [data-acao="${foco.dataset.acao}"]`;
  $('.sacola-itens').innerHTML = lista.length
    ? lista.map(i => `
      <li data-id="${i.id}">
        <span class="sacola-nome">${i.nome}<small>${formatarPreco(i.preco)} cada</small></span>
        <span class="sacola-preco">${formatarPreco(sacola[i.id] * i.preco)}</span>
        <span class="qtd">
          <button type="button" data-acao="menos" aria-label="Tirar um ${i.nome}">−</button>
          <output aria-label="Quantidade de ${i.nome}">${sacola[i.id]}</output>
          <button type="button" data-acao="mais" aria-label="Adicionar um ${i.nome}">+</button>
        </span>
        <button type="button" class="sacola-remover" data-acao="remover" aria-label="Remover ${i.nome} da sacola">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 .8 12a2 2 0 0 0 2 1.9h4.4a2 2 0 0 0 2-1.9L17 7M10 11v6M14 11v6"/></svg>
        </button>
      </li>`).join('')
    : '<li class="sacola-vazia">Sua sacola está vazia. Escolha seus sabores no cardápio.</li>';
  $('.sacola-total strong').textContent = formatarPreco(totalSacola(sacola, itens));
  const esvaziar = $('.sacola-esvaziar');
  esvaziar.hidden = lista.length === 0;
  esvaziar.removeAttribute('data-confirmar');
  esvaziar.textContent = 'Esvaziar sacola';
  if (voltar) ($(voltar) || $('.fechar')).focus();
  else if (foco) $('.fechar').focus();
}

function mudar(id, delta) {
  const item = itens.find(i => i.id === id);
  sacola[id] = Math.max(0, (sacola[id] || 0) + delta);
  atualizar(`${item.nome}: ${sacola[id]} na sacola.`);
}

function ligarSacola() {
  const dialogo = $('.sacola');
  const form = $('.sacola-form');
  const campoEndereco = $('.campo-endereco');

  $('.categorias').addEventListener('click', e => {
    const botao = e.target.closest('button[data-acao]');
    if (botao) mudar(botao.closest('.item').dataset.id, botao.dataset.acao === 'mais' ? 1 : -1);
  });
  $('.sacola-botao').addEventListener('click', () => dialogo.showModal());
  $('.sacola-itens').addEventListener('click', e => {
    const botao = e.target.closest('button[data-acao]');
    if (!botao) return;
    const id = botao.closest('li').dataset.id;
    if (botao.dataset.acao === 'remover') {
      sacola[id] = 0;
      atualizar(`${itens.find(i => i.id === id).nome} removido da sacola.`);
    } else mudar(id, botao.dataset.acao === 'mais' ? 1 : -1);
  });
  // Esvaziar pede um segundo toque para confirmar, sem janela de confirmação do navegador.
  $('.sacola-esvaziar').addEventListener('click', e => {
    const botao = e.currentTarget;
    if (!botao.hasAttribute('data-confirmar')) {
      botao.setAttribute('data-confirmar', '');
      botao.textContent = 'Toque de novo para esvaziar';
      return;
    }
    sacola = {};
    atualizar('Sacola esvaziada.');
    $('.fechar').focus();
  });
  dialogo.addEventListener('click', e => { if (e.target === dialogo) dialogo.close(); });

  if (!loja.entrega) $('[data-entrega]').remove();
  form.addEventListener('change', () => { campoEndereco.hidden = form.modo.value !== 'entrega'; });

  form.addEventListener('submit', e => {
    if (e.submitter?.value !== 'enviar') return;
    e.preventDefault();
    const pedido = { sacola, itens, nome: form.nome.value, modo: form.modo.value, endereco: form.endereco.value };
    const { ok, erros } = validarPedido(pedido);
    for (const el of form.querySelectorAll('[data-erro]')) el.textContent = erros[el.dataset.erro] || '';
    form.nome.setAttribute('aria-invalid', String(Boolean(erros.nome)));
    form.endereco.setAttribute('aria-invalid', String(Boolean(erros.endereco)));
    if (!ok) { (erros.nome ? form.nome : erros.endereco ? form.endereco : form.nome).focus(); return; }
    window.open(linkWhatsApp(loja.whatsapp, montarMensagem(pedido)), '_blank', 'noopener');
    // Pedido enviado: esvazia a sacola, limpa o endereço e volta para o site.
    sacola = {};
    form.endereco.value = '';
    atualizar('Pedido enviado pelo WhatsApp. Sacola esvaziada.');
    dialogo.close();
  });
}

function preencherLoja() {
  for (const el of document.querySelectorAll('[data-loja]')) {
    const valor = loja[el.dataset.loja];
    if (valor) el.textContent = valor;
  }
  const whats = linkWhatsApp(loja.whatsapp, 'Olá, Oggi Piumhi!');
  for (const a of document.querySelectorAll('[data-whats]')) a.href = whats;
}

function mapaPreguicoso() {
  const mapa = $('.mapa');
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    mapa.innerHTML = `<iframe src="${mapa.dataset.mapa}" title="Mapa da Oggi Sorvetes Piumhi" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  }, { rootMargin: '300px' }).observe(mapa);
}

function abasAtivas() {
  const abas = $('.abas');
  const links = [...abas.querySelectorAll('a')];
  const secoes = [...document.querySelectorAll('.categoria')];
  const fundoDoMenu = () => parseFloat(getComputedStyle(abas).top) + abas.offsetHeight;
  let travada = null;
  let alvo = 0;
  let soltar = 0;
  const liberar = () => { travada = null; clearTimeout(soltar); conferir(); };

  const marcar = id => links.forEach(a => a.toggleAttribute('aria-current', a.hash === '#' + id));

  // Ativa a última categoria cujo título já chegou logo abaixo do menu fixo.
  function conferir() {
    if (travada) return;
    const limite = fundoDoMenu() + 40;
    let atual = secoes[0];
    for (const s of secoes) if (s.querySelector('h3').getBoundingClientRect().top <= limite) atual = s;
    marcar(atual.id);
  }
  addEventListener('scroll', () => {
    if (travada && Math.abs(scrollY - alvo) < 3) liberar();
    else conferir();
  }, { passive: true });
  // Se a pessoa rolar por conta própria no meio do caminho, a aba volta a seguir a rolagem.
  for (const tipo of ['wheel', 'touchstart', 'keydown']) addEventListener(tipo, () => { if (travada) liberar(); }, { passive: true });
  conferir();

  // Só as abas deslizam suave; os links do topo pulam direto.
  abas.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    e.preventDefault();
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const titulo = document.querySelector(link.hash + ' h3');
    const topo = titulo.getBoundingClientRect().top + scrollY - fundoDoMenu() - 14;
    // Durante a rolagem suave a aba clicada fica marcada; solta quando a rolagem para.
    travada = link.hash;
    alvo = Math.min(Math.max(0, topo), document.documentElement.scrollHeight - innerHeight);
    marcar(link.hash.slice(1));
    clearTimeout(soltar);
    soltar = setTimeout(liberar, 4000);
    scrollTo({ top: topo, behavior: suave ? 'smooth' : 'auto' });
    history.replaceState(null, '', link.hash);
  });
}

function zoomPicole() {
  const img = $('.cardapio-picole');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  addEventListener('scroll', () => {
    const r = img.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, 1 - r.top / innerHeight));
    img.style.setProperty('--zoom', (1.12 - p * 0.12).toFixed(3));
  }, { passive: true });
}

async function iniciar() {
  const [cardapio, dadosLoja] = await Promise.all([
    fetch('data/cardapio.json').then(r => r.json()),
    fetch('data/loja.json').then(r => r.json())
  ]);
  loja = dadosLoja;
  itens = cardapio.categorias.flatMap(c => c.itens);
  renderizarCardapio(cardapio);
  sacola = lerSacola();
  preencherLoja();
  ligarSacola();
  atualizar();
  abasAtivas();
  mapaPreguicoso();
  zoomPicole();
}

iniciar();
