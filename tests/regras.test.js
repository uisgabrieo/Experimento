// Testes das regras da página. Executar na raiz do projeto com: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/regras.js');

const NBSP = ' ';
const isos = (datas) => datas.map(R.paraISO);
const dia = (ano, mes, d) => ({ ano, mes: mes - 1, dia: d });

test('Manhã começa na primeira segunda-feira de cada mês', () => {
  assert.deepEqual(isos(R.proximosInicios('manha', 3, dia(2026, 10, 26))), ['2026-11-02', '2026-12-07', '2027-01-04']);
});

test('Noite começa na primeira terça-feira de cada mês', () => {
  assert.deepEqual(isos(R.proximosInicios('noite', 3, dia(2026, 10, 26))), ['2026-11-03', '2026-12-01', '2027-01-05']);
});

test('Sábado e Kids seguem fevereiro, abril, junho, agosto e outubro, sem dezembro', () => {
  const esperado = ['2027-02-06', '2027-04-03', '2027-06-05'];
  assert.deepEqual(isos(R.proximosInicios('sabado', 3, dia(2026, 10, 26))), esperado);
  assert.deepEqual(isos(R.proximosInicios('kids', 3, dia(2026, 10, 26))), esperado);
  const umAno = R.proximosInicios('kids', 5, dia(2026, 10, 26));
  assert.ok(umAno.every((d) => [1, 3, 5, 7, 9].includes(d.getUTCMonth())));
});

test('Turma que começa hoje não é oferecida', () => {
  assert.equal(R.paraISO(R.proximosInicios('manha', 1, dia(2026, 11, 2))[0]), '2026-12-07');
});

test('Calendário atravessa a virada do ano', () => {
  assert.equal(R.paraISO(R.proximosInicios('manha', 1, dia(2026, 12, 20))[0]), '2027-01-04');
});

test('"Hoje" usa o fuso de São Paulo', () => {
  // 02h30 UTC do dia 27 ainda é dia 26 em São Paulo.
  assert.deepEqual(R.hojeEmSaoPaulo(new Date('2026-10-27T02:30:00Z')), dia(2026, 10, 26));
});

test('Prazo de reembolso é 7 dias antes do início', () => {
  assert.equal(R.paraISO(R.prazoReembolso(R.deISO('2026-11-02'))), '2026-10-26');
});

test('Datas e valores no formato brasileiro', () => {
  const data = R.deISO('2026-11-02');
  assert.equal(R.formatarData(data), '02/11/2026');
  assert.equal(R.diaDaSemana(data), 'segunda-feira');
  assert.equal(R.listarDatas([data, R.deISO('2026-12-07')]), '02/11/2026 e 07/12/2026');
  assert.equal(R.descreverValor('essencial', 'avista'), `R$${NBSP}480 à vista`);
  assert.equal(R.descreverValor('essencial', 'cartao'), `4x de R$${NBSP}130 no cartão (total R$${NBSP}520)`);
  assert.equal(R.descreverValor('kids', 'avista'), `R$${NBSP}560 à vista`);
  assert.equal(R.descreverValor('kids', 'cartao'), `4x de R$${NBSP}150 no cartão (total R$${NBSP}600)`);
});

test('Idade no Essencial: a partir de 13 anos, sem limite máximo', () => {
  const v = (idade) => R.validarIdade(idade, 'essencial', 'a idade');
  assert.match(v('12'), /a partir de 13 anos/);
  assert.equal(v('13'), '');
  assert.equal(v('17'), '');
  assert.equal(v('92'), '');
  assert.equal(v('15 anos'), '');
  assert.match(v(''), /Digite a idade/);
  assert.match(v('quinze'), /só com números/);
  assert.ok(R.ehMenorNoEssencial(13) && R.ehMenorNoEssencial(17));
  assert.ok(!R.ehMenorNoEssencial(18));
});

test('Idade no Kids: de 6 a 12 anos', () => {
  const v = (idade) => R.validarIdade(idade, 'kids', 'a idade da criança');
  assert.match(v('5'), /6 a 12 anos/);
  assert.equal(v('6'), '');
  assert.equal(v('12'), '');
  assert.match(v('13'), /Culinária Essencial/);
});

test('Telefone aceita máscara, espaços e +55', () => {
  for (const tel of ['(86) 99999-9999', '86999999999', '+55 86 99999-9999', '0 86 3333-4444', ' 86 3333 4444 ']) {
    assert.equal(R.validarTelefone(tel, 'o telefone'), '', tel);
  }
  for (const tel of ['99999-9999', '(00) 00000-0000', '(86) 89999-9999', '123']) {
    assert.match(R.validarTelefone(tel, 'o telefone'), /Confira o telefone/, tel);
  }
  assert.match(R.validarTelefone('', 'o telefone'), /Digite o telefone com DDD/);
  assert.equal(R.formatarTelefone('86999999999'), '(86) 99999-9999');
  assert.equal(R.formatarTelefone('+55 (86) 3333-4444'), '(86) 3333-4444');
});

test('E-mail: formato e sugestão de domínio', () => {
  assert.deepEqual(R.validarEmail('ana@exemplo.com.br'), { mensagem: '', sugestao: '' });
  assert.match(R.validarEmail('').mensagem, /Digite o seu e-mail/);
  assert.match(R.validarEmail('ana@').mensagem, /precisa ter @/);
  assert.match(R.validarEmail('ana exemplo.com').mensagem, /precisa ter @/);
  assert.match(R.validarEmail('ana@exemplo').mensagem, /precisa ter @/);
  assert.deepEqual(R.validarEmail('ana@gmial.com'), { mensagem: '', sugestao: 'ana@gmail.com' });
});

test('Nome e descrição de alergias', () => {
  assert.equal(R.validarNome('  Ana   Souza ', 'o seu nome'), '');
  assert.equal(R.validarNome('', 'o seu nome'), 'Digite o seu nome.');
  assert.match(R.validarNome('A', 'o seu nome'), /pelo menos 2 letras/);
  assert.equal(R.validarDescricao('alergia a amendoim'), '');
  assert.equal(R.validarDescricao(' '), R.MENSAGENS.alergiasDescricao);
});
