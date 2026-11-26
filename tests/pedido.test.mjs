import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatarPreco, limparSacola, totalSacola, montarMensagem, linkWhatsApp, validarPedido, MAX_LINHAS
} from '../js/pedido.mjs';

const itens = [
  { id: 'morango', nome: 'Picolé de Morango', preco: 300 },
  { id: 'cone', nome: 'Cone Crocante', preco: 850 }
];

test('formata preço em reais', () => {
  assert.equal(formatarPreco(600), 'R$ 6,00');
  assert.equal(formatarPreco(1234), 'R$ 12,34');
});

test('descarta itens que saíram do cardápio e quantidades inválidas', () => {
  assert.deepEqual(limparSacola({ morango: 2, sumiu: 1, cone: 0 }, itens), { morango: 2 });
  assert.deepEqual(limparSacola(null, itens), {});
});

test('soma o total em centavos', () => {
  assert.equal(totalSacola({ morango: 2, cone: 1 }, itens), 1450);
});

test('monta a mensagem do pedido', () => {
  const texto = montarMensagem({ sacola: { morango: 2 }, itens, nome: 'Ana', modo: 'retirada' });
  assert.ok(texto.startsWith('Olá, Oggi Piumhi! Quero fazer um pedido:'));
  assert.ok(texto.includes('2x Picolé de Morango — R$ 6,00'));
  assert.ok(texto.includes('Total: R$ 6,00'));
  assert.ok(texto.includes('Nome: Ana'));
  assert.ok(texto.includes('Retirada na loja'));
});

test('inclui endereço na entrega', () => {
  const texto = montarMensagem({ sacola: { cone: 1 }, itens, nome: 'Ana', modo: 'entrega', endereco: 'Rua A, 10' });
  assert.ok(texto.includes('Entrega: Rua A, 10'));
});

test('limita a mensagem a 30 linhas de itens', () => {
  const muitos = Array.from({ length: 40 }, (_, i) => ({ id: 'i' + i, nome: 'Item ' + i, preco: 100 }));
  const sacola = Object.fromEntries(muitos.map(i => [i.id, 1]));
  const texto = montarMensagem({ sacola, itens: muitos, nome: 'Ana', modo: 'retirada' });
  assert.equal(MAX_LINHAS, 30);
  assert.equal(texto.split('\n').filter(l => /^\d+x /.test(l)).length, 30);
  assert.ok(texto.includes('+10 itens'));
});

test('codifica acentos e símbolos no link do WhatsApp', () => {
  const url = linkWhatsApp('(37) 99999-0000', 'Olá & #1');
  assert.equal(url, 'https://wa.me/5537999990000?text=Ol%C3%A1%20%26%20%231');
});

test('valida sacola vazia, nome e endereço da entrega', () => {
  assert.equal(validarPedido({ sacola: {}, modo: 'retirada', nome: 'Ana' }).ok, false);
  const r = validarPedido({ sacola: { morango: 1 }, modo: 'entrega', nome: ' ', endereco: '' });
  assert.equal(r.ok, false);
  assert.ok(r.erros.nome && r.erros.endereco);
  assert.equal(validarPedido({ sacola: { morango: 1 }, modo: 'retirada', nome: 'Ana' }).ok, true);
});
