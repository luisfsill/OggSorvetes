// Lógica pura do pedido: sem DOM, testada em tests/pedido.test.mjs.
export const MAX_LINHAS = 30;

export function formatarPreco(centavos) {
  return 'R$ ' + (centavos / 100).toFixed(2).replace('.', ',');
}

export function limparSacola(sacola, itens) {
  const ids = new Set(itens.map(i => i.id));
  return Object.fromEntries(
    Object.entries(sacola || {}).filter(([id, qtd]) => ids.has(id) && Number.isInteger(qtd) && qtd > 0)
  );
}

export function totalSacola(sacola, itens) {
  return itens.reduce((soma, item) => soma + (sacola[item.id] || 0) * item.preco, 0);
}

export function montarMensagem({ sacola, itens, nome, modo, endereco = '' }) {
  const linhas = itens
    .filter(item => sacola[item.id] > 0)
    .map(item => `${sacola[item.id]}x ${item.nome} — ${formatarPreco(sacola[item.id] * item.preco)}`);
  const extras = linhas.length - MAX_LINHAS;
  return [
    'Olá, Oggi Piumhi! Quero fazer um pedido:',
    '',
    ...linhas.slice(0, MAX_LINHAS),
    ...(extras > 0 ? [`+${extras} itens (completo o pedido por aqui)`] : []),
    '',
    `Total: ${formatarPreco(totalSacola(sacola, itens))}`,
    `Nome: ${nome.trim()}`,
    modo === 'entrega' ? `Entrega: ${endereco.trim()}` : 'Retirada na loja'
  ].join('\n');
}

export function linkWhatsApp(numero, texto) {
  let digitos = numero.replace(/\D/g, '');
  if (digitos.length <= 11) digitos = '55' + digitos;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`;
}

export function validarPedido({ sacola, modo, nome = '', endereco = '' }) {
  const erros = {};
  if (!Object.values(sacola || {}).some(q => q > 0)) erros.sacola = 'Escolha pelo menos um item.';
  if (!nome.trim()) erros.nome = 'Diga seu nome.';
  if (modo === 'entrega' && !endereco.trim()) erros.endereco = 'Informe o endereço de entrega.';
  return { ok: Object.keys(erros).length === 0, erros };
}
