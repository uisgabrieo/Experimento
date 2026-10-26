/*
 * Regras do Ateliê do Sabor: dados dos cursos, calendário das turmas,
 * formatos pt-BR e validações do formulário.
 * Não acessa a página, para poder ser testado no Node (tests/regras.test.js).
 */
(function (raiz, criar) {
  const regras = criar();
  if (typeof module === 'object' && module.exports) {
    module.exports = regras;
  } else {
    raiz.AtelieRegras = regras;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CURSOS = {
    essencial: {
      id: 'essencial',
      nome: 'Culinária Essencial',
      aulas: '8 aulas de 3 horas',
      capacidade: '12 vagas por turma',
      valorAVista: 480,
      parcelas: 4,
      valorParcela: 130,
      cobranca: 'por participante',
      inclusos: 'Ingredientes e avental',
      idadeMinima: 13,
      idadeMaxima: null
    },
    kids: {
      id: 'kids',
      nome: 'Culinária Kids',
      aulas: '8 aulas de 2 horas',
      capacidade: '8 duplas por turma',
      valorAVista: 560,
      parcelas: 4,
      valorParcela: 150,
      cobranca: 'por dupla (criança + responsável)',
      inclusos: 'Ingredientes e aventais da criança e do responsável',
      idadeMinima: 6,
      idadeMaxima: 12
    }
  };

  // Meses contados a partir de 0 (janeiro). O briefing lista fevereiro, abril,
  // junho, agosto e outubro; dezembro não entra, apesar de "a cada 2 meses".
  const MESES_SABADO = [1, 3, 5, 7, 9];

  const TURMAS = {
    manha: {
      id: 'manha',
      curso: 'essencial',
      nome: 'Manhã',
      dias: 'Segundas e quartas',
      horario: '8h às 11h',
      duracao: '4 semanas',
      diaDaSemana: 1,
      meses: null,
      regraInicio: 'Todo mês, na primeira segunda-feira'
    },
    noite: {
      id: 'noite',
      curso: 'essencial',
      nome: 'Noite',
      dias: 'Terças e quintas',
      horario: '19h às 22h',
      duracao: '4 semanas',
      diaDaSemana: 2,
      meses: null,
      regraInicio: 'Todo mês, na primeira terça-feira'
    },
    sabado: {
      id: 'sabado',
      curso: 'essencial',
      nome: 'Sábado',
      dias: 'Sábados',
      horario: '14h às 17h',
      duracao: '8 semanas',
      diaDaSemana: 6,
      meses: MESES_SABADO,
      regraInicio: 'No primeiro sábado de fevereiro, abril, junho, agosto e outubro'
    },
    kids: {
      id: 'kids',
      curso: 'kids',
      nome: 'Sábado',
      dias: 'Sábados',
      horario: '9h às 11h',
      duracao: '8 semanas',
      diaDaSemana: 6,
      meses: MESES_SABADO,
      regraInicio: 'No primeiro sábado de fevereiro, abril, junho, agosto e outubro'
    }
  };

  const MENSAGENS = {
    curso: 'Escolha um curso: Culinária Essencial ou Culinária Kids.',
    turma: 'Escolha a turma.',
    dataInicio: 'Escolha a data de início.',
    pagamento: 'Escolha a forma de pagamento preferida. Nada será cobrado.',
    participante: 'Informe quem vai fazer o curso: você ou outra pessoa.',
    responsavelLegal: 'Informe se você é o responsável legal pelo participante.',
    responsavelAula: 'Informe quem vai cozinhar com a criança nas aulas.',
    alergiasPessoa: 'Informe a quem se referem as alergias ou restrições.',
    alergiasDescricao: 'Descreva as alergias ou restrições. Exemplo: alergia a amendoim.',
    autorizacaoMenor: 'Para continuar, marque a autorização do responsável legal para usar o nome e a idade do participante.',
    autorizacaoSaude: 'Para informar alergias, marque a autorização de uso dessas informações. Se preferir não informar, desmarque “Quero informar alergias ou restrições alimentares”.',
    privacidade: 'Para continuar, marque que leu e concorda com o aviso de privacidade.'
  };

  const FUSO_DA_ESCOLA = 'America/Sao_Paulo';
  const UM_DIA = 24 * 60 * 60 * 1000;

  /* ---------- Datas ----------
   * As datas são guardadas como meia-noite UTC e tratadas só como dia do
   * calendário. "Hoje" é calculado no fuso de São Paulo.
   */

  function hojeEmSaoPaulo(agora = new Date()) {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO_DA_ESCOLA,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).formatToParts(agora);
    const parte = (tipo) => Number(partes.find((p) => p.type === tipo).value);
    return { ano: parte('year'), mes: parte('month') - 1, dia: parte('day') };
  }

  function comoData({ ano, mes, dia }) {
    return new Date(Date.UTC(ano, mes, dia));
  }

  function primeiroDiaDaSemanaNoMes(ano, mes, diaDaSemana) {
    const diaDaSemanaDoDia1 = new Date(Date.UTC(ano, mes, 1)).getUTCDay();
    return 1 + ((diaDaSemana - diaDaSemanaDoDia1 + 7) % 7);
  }

  // Próximas datas de início depois de hoje (uma turma que começa hoje já não aparece).
  function proximosInicios(turmaId, quantidade = 3, hoje = hojeEmSaoPaulo()) {
    const turma = TURMAS[turmaId];
    if (!turma) return [];
    const limite = comoData(hoje).getTime();
    const datas = [];
    let { ano, mes } = hoje;
    while (datas.length < quantidade) {
      if (!turma.meses || turma.meses.includes(mes)) {
        const dia = primeiroDiaDaSemanaNoMes(ano, mes, turma.diaDaSemana);
        const data = new Date(Date.UTC(ano, mes, dia));
        if (data.getTime() > limite) datas.push(data);
      }
      mes += 1;
      if (mes === 12) {
        mes = 0;
        ano += 1;
      }
    }
    return datas;
  }

  // Reembolso integral até 7 dias antes do início.
  function prazoReembolso(inicio) {
    return new Date(inicio.getTime() - 7 * UM_DIA);
  }

  const formatoData = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formatoDiaDaSemana = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long' });
  const formatoLista = new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' });

  function formatarData(data) {
    return formatoData.format(data);
  }

  function diaDaSemana(data) {
    return formatoDiaDaSemana.format(data);
  }

  function listarDatas(datas) {
    return formatoLista.format(datas.map(formatarData));
  }

  function paraISO(data) {
    return data.toISOString().slice(0, 10);
  }

  function deISO(texto) {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto || '');
    if (!partes) return null;
    return new Date(Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])));
  }

  /* ---------- Valores ---------- */

  function formatarValor(reais) {
    return 'R$ ' + new Intl.NumberFormat('pt-BR').format(reais);
  }

  function descreverValor(cursoId, pagamento) {
    const curso = CURSOS[cursoId];
    if (!curso) return '';
    if (pagamento === 'cartao') {
      const total = curso.parcelas * curso.valorParcela;
      return `${curso.parcelas}x de ${formatarValor(curso.valorParcela)} no cartão (total ${formatarValor(total)})`;
    }
    return `${formatarValor(curso.valorAVista)} à vista`;
  }

  /* ---------- Normalização e validação ----------
   * Cada validador devolve '' quando o valor é aceito ou a mensagem de erro.
   */

  function normalizarEspacos(texto) {
    return String(texto == null ? '' : texto).replace(/\s+/g, ' ').trim();
  }

  function validarNome(valor, rotulo) {
    const nome = normalizarEspacos(valor);
    if (!nome) return `Digite ${rotulo}.`;
    const letras = nome.match(/\p{L}/gu) || [];
    if (letras.length < 2) return `Confira ${rotulo}: use pelo menos 2 letras.`;
    return '';
  }

  const DOMINIOS_COM_ERRO_COMUM = {
    'gmial.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmail.com.br': 'gmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    'hotmail.co': 'hotmail.com',
    'hotmail.con': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outlook.con': 'outlook.com',
    'yahoo.con': 'yahoo.com',
    'yaho.com.br': 'yahoo.com.br'
  };

  function validarEmail(valor) {
    const email = String(valor == null ? '' : valor).trim();
    if (!email) {
      return { mensagem: 'Digite o seu e-mail. Exemplo: nome@exemplo.com.br.', sugestao: '' };
    }
    const formato = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;
    if (!formato.test(email)) {
      return {
        mensagem: 'Confira o seu e-mail: ele precisa ter @ e um domínio, como nome@exemplo.com.br.',
        sugestao: ''
      };
    }
    const [usuario, dominio] = email.split('@');
    const corrigido = DOMINIOS_COM_ERRO_COMUM[dominio.toLowerCase()];
    return { mensagem: '', sugestao: corrigido ? `${usuario}@${corrigido}` : '' };
  }

  // Aceita telefone com ou sem máscara, espaços, +55 ou 0 antes do DDD.
  function normalizarTelefone(valor) {
    let digitos = String(valor == null ? '' : valor).replace(/\D/g, '');
    if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
      digitos = digitos.slice(2);
    }
    if (digitos.startsWith('0')) digitos = digitos.slice(1);
    return digitos;
  }

  function telefoneValido(digitos) {
    if (digitos.length !== 10 && digitos.length !== 11) return false;
    if (digitos[0] === '0' || digitos[1] === '0') return false;
    if (digitos.length === 11 && digitos[2] !== '9') return false;
    return true;
  }

  function validarTelefone(valor, rotulo) {
    if (!normalizarEspacos(valor)) return `Digite ${rotulo} com DDD. Exemplo: (86) 99999-9999.`;
    if (!telefoneValido(normalizarTelefone(valor))) {
      return `Confira ${rotulo}: use DDD e número, com 10 ou 11 dígitos. Exemplo: (86) 99999-9999.`;
    }
    return '';
  }

  function formatarTelefone(valor) {
    const digitos = normalizarTelefone(valor);
    if (!telefoneValido(digitos)) return normalizarEspacos(valor);
    const ddd = digitos.slice(0, 2);
    const numero = digitos.slice(2);
    const corte = numero.length - 4;
    return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`;
  }

  // Aceita "15" e também "15 anos". Devolve null se vazio e NaN se não for número.
  function lerIdade(valor) {
    const texto = normalizarEspacos(valor);
    if (!texto) return null;
    const partes = /^(\d{1,3})(\s*anos?)?$/i.exec(texto);
    return partes ? Number(partes[1]) : NaN;
  }

  function validarIdade(valor, cursoId, rotulo) {
    const idade = lerIdade(valor);
    if (idade === null) return `Digite ${rotulo} no início do curso.`;
    if (Number.isNaN(idade)) return `Digite ${rotulo} só com números. Exemplo: ${cursoId === 'kids' ? 8 : 15}.`;
    if (cursoId === 'kids') {
      if (idade < 6) return 'O Culinária Kids é para crianças de 6 a 12 anos.';
      if (idade > 12) {
        return 'O Culinária Kids é para crianças de 6 a 12 anos. A partir de 13 anos, é possível fazer o Culinária Essencial.';
      }
      return '';
    }
    if (idade < 13) {
      return 'O Culinária Essencial é a partir de 13 anos. Para crianças de 6 a 12 anos, veja o Culinária Kids.';
    }
    if (idade > 120) return `Confira ${rotulo}: o número parece ter um dígito a mais.`;
    return '';
  }

  function ehMenorNoEssencial(idade) {
    return Number.isInteger(idade) && idade >= 13 && idade < 18;
  }

  function validarDescricao(valor) {
    const texto = normalizarEspacos(valor);
    if (texto.length < 3) return MENSAGENS.alergiasDescricao;
    return '';
  }

  return {
    CURSOS,
    TURMAS,
    MENSAGENS,
    hojeEmSaoPaulo,
    comoData,
    proximosInicios,
    prazoReembolso,
    formatarData,
    diaDaSemana,
    listarDatas,
    paraISO,
    deISO,
    formatarValor,
    descreverValor,
    normalizarEspacos,
    validarNome,
    validarEmail,
    normalizarTelefone,
    validarTelefone,
    formatarTelefone,
    lerIdade,
    validarIdade,
    ehMenorNoEssencial,
    validarDescricao
  };
});
