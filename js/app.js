/*
 * Interações da página: menu, seção atual, datas das turmas e pré-inscrição.
 * Nada é enviado nem guardado: os dados existem só enquanto a página está aberta.
 */
(function () {
  'use strict';

  const R = window.AtelieRegras;
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));
  const porId = (id) => document.getElementById(id);

  iniciarMenu();
  iniciarSecaoAtual();
  if (R) {
    preencherProximasDatas();
    iniciarPreInscricao();
  }

  // Cria um elemento. Textos entram como nós de texto, nunca como HTML.
  function el(tag, atributos = {}, ...filhos) {
    const elemento = document.createElement(tag);
    Object.entries(atributos).forEach(([nome, valor]) => {
      if (valor === false || valor == null) return;
      elemento.setAttribute(nome, valor === true ? '' : valor);
    });
    elemento.append(...filhos.flat().filter((filho) => filho != null && filho !== false));
    return elemento;
  }

  function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  /* ---------- Menu ---------- */

  function iniciarMenu() {
    const botao = $('.menu-toggle');
    const menu = porId('menu-principal');
    if (!botao || !menu) return;

    const aberto = () => botao.getAttribute('aria-expanded') === 'true';
    const definir = (abrir) => botao.setAttribute('aria-expanded', String(abrir));

    botao.addEventListener('click', () => definir(!aberto()));
    menu.addEventListener('click', (evento) => {
      if (evento.target.closest('a')) definir(false);
    });
    document.addEventListener('keydown', (evento) => {
      if (evento.key !== 'Escape' || !aberto()) return;
      definir(false);
      botao.focus();
    });
  }

  /* ---------- Seção atual indicada no menu ---------- */

  function iniciarSecaoAtual() {
    const links = $$('#menu-principal a[href^="#"]');
    // A apresentação não tem item no menu: ao voltar a ela, nenhum item fica marcado.
    const secoes = $$('main > section, #contato');
    if (!('IntersectionObserver' in window) || !links.length) return;

    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        links.forEach((link) => {
          if (link.hash === `#${entrada.target.id}`) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    secoes.forEach((secao) => observador.observe(secao));
  }

  /* ---------- Próximas datas nas turmas ---------- */

  function preencherProximasDatas() {
    $$('[data-proximos]').forEach((alvo) => {
      alvo.textContent = R.listarDatas(R.proximosInicios(alvo.dataset.proximos));
      alvo.parentElement.hidden = false;
    });
  }

  /* ---------- Pré-inscrição ---------- */

  function iniciarPreInscricao() {
    const area = porId('inscricao');
    if (!area) return;

    const etapas = [porId('etapa-1'), porId('etapa-2'), porId('etapa-3')];
    const progresso = porId('progresso');
    const avisoVivo = porId('aviso-formulario');
    const confirmacao = porId('confirmacao');
    const botaoConcluir = porId('botao-concluir');
    const falha = porId('falha-conclusao');
    const campoTextual = 'input[type="text"], input[type="email"], input[type="tel"], textarea';

    let etapaAtual = 1;
    let concluindo = false;
    let turmaComDatas = '';

    const marcado = (nome) => {
      const opcao = $(`input[name="${nome}"]:checked`, area);
      return opcao ? opcao.value : '';
    };
    const valor = (id) => porId(id).value;
    const texto = (id) => R.normalizarEspacos(valor(id));
    const marcada = (id) => porId(id).checked;
    const obrigatorio = (preenchido, mensagem) => (preenchido ? '' : mensagem);

    // Campos na ordem em que aparecem. "ativo" diz quando o campo vale para a situação atual.
    const CAMPOS = [
      { chave: 'curso', etapa: 1, ativo: () => true, validar: (s) => obrigatorio(s.curso, R.MENSAGENS.curso) },
      { chave: 'turma', etapa: 1, ativo: (s) => Boolean(s.curso), validar: (s) => obrigatorio(s.turma, R.MENSAGENS.turma) },
      { chave: 'data-inicio', etapa: 1, ativo: (s) => Boolean(s.turma), validar: (s) => obrigatorio(s.dataInicio, R.MENSAGENS.dataInicio) },
      { chave: 'pagamento', etapa: 1, ativo: (s) => Boolean(s.curso), validar: (s) => obrigatorio(s.pagamento, R.MENSAGENS.pagamento) },

      { chave: 'nome', etapa: 2, ativo: () => true, validar: () => R.validarNome(valor('nome'), 'o seu nome') },
      { chave: 'email', etapa: 2, ativo: () => true, validar: () => R.validarEmail(valor('email')).mensagem },
      { chave: 'telefone', etapa: 2, ativo: () => true, validar: () => R.validarTelefone(valor('telefone'), 'o seu telefone') },

      { chave: 'participante', etapa: 2, ativo: (s) => s.essencial, validar: (s) => obrigatorio(s.participante, R.MENSAGENS.participante) },
      { chave: 'participante-nome', etapa: 2, ativo: (s) => s.essencial && s.participante === 'outra', validar: () => R.validarNome(valor('participante-nome'), 'o nome do participante') },
      {
        chave: 'participante-idade',
        etapa: 2,
        ativo: (s) => s.essencial,
        validar: (s) => R.validarIdade(valor('participante-idade'), 'essencial', s.participante === 'eu' ? 'a sua idade' : 'a idade do participante')
      },
      { chave: 'responsavel-legal', etapa: 2, ativo: (s) => s.perguntarResponsavelLegal, validar: (s) => obrigatorio(s.respostaResponsavelLegal, R.MENSAGENS.responsavelLegal) },
      { chave: 'responsavel-legal-nome', etapa: 2, ativo: (s) => s.camposResponsavelLegal, validar: () => R.validarNome(valor('responsavel-legal-nome'), 'o nome do responsável legal') },
      { chave: 'responsavel-legal-telefone', etapa: 2, ativo: (s) => s.camposResponsavelLegal, validar: () => R.validarTelefone(valor('responsavel-legal-telefone'), 'o telefone do responsável legal') },

      { chave: 'crianca-nome', etapa: 2, ativo: (s) => s.kids, validar: () => R.validarNome(valor('crianca-nome'), 'o nome da criança') },
      { chave: 'crianca-idade', etapa: 2, ativo: (s) => s.kids, validar: () => R.validarIdade(valor('crianca-idade'), 'kids', 'a idade da criança') },
      { chave: 'responsavel-aula', etapa: 2, ativo: (s) => s.kids, validar: (s) => obrigatorio(s.responsavelAula, R.MENSAGENS.responsavelAula) },
      { chave: 'responsavel-aula-nome', etapa: 2, ativo: (s) => s.kids && s.responsavelAula === 'outra', validar: () => R.validarNome(valor('responsavel-aula-nome'), 'o nome do responsável') },
      { chave: 'responsavel-aula-telefone', etapa: 2, ativo: (s) => s.kids && s.responsavelAula === 'outra', validar: () => R.validarTelefone(valor('responsavel-aula-telefone'), 'o telefone do responsável') },

      { chave: 'autorizacao-menor', etapa: 2, ativo: (s) => s.menorEnvolvido, validar: () => obrigatorio(marcada('autorizacao-menor'), R.MENSAGENS.autorizacaoMenor) },
      { chave: 'alergias-pessoa', etapa: 2, ativo: (s) => s.kids && s.informarAlergias, validar: (s) => obrigatorio(s.alergiasPessoa, R.MENSAGENS.alergiasPessoa) },
      { chave: 'alergias-descricao', etapa: 2, ativo: (s) => s.informarAlergias, validar: () => R.validarDescricao(valor('alergias-descricao')) },
      { chave: 'autorizacao-saude', etapa: 2, ativo: (s) => s.informarAlergias, validar: () => obrigatorio(marcada('autorizacao-saude'), R.MENSAGENS.autorizacaoSaude) },
      { chave: 'aceite-privacidade', etapa: 2, ativo: () => true, validar: () => obrigatorio(marcada('aceite-privacidade'), R.MENSAGENS.privacidade) }
    ];

    function lerSituacao() {
      const curso = marcado('curso');
      const essencial = curso === 'essencial';
      const kids = curso === 'kids';
      const participante = marcado('participante');
      const respostaResponsavelLegal = marcado('responsavel-legal');
      const menorNoEssencial = essencial && R.ehMenorNoEssencial(R.lerIdade(valor('participante-idade')));
      const perguntarResponsavelLegal = menorNoEssencial && participante === 'outra';
      return {
        curso,
        essencial,
        kids,
        turma: marcado('turma'),
        dataInicio: marcado('data-inicio'),
        pagamento: marcado('pagamento'),
        participante,
        menorNoEssencial,
        perguntarResponsavelLegal,
        respostaResponsavelLegal,
        responsavelLegalSouEu: perguntarResponsavelLegal && respostaResponsavelLegal === 'eu',
        camposResponsavelLegal: menorNoEssencial && (participante === 'eu' || (perguntarResponsavelLegal && respostaResponsavelLegal === 'outra')),
        responsavelAula: marcado('responsavel-aula'),
        menorEnvolvido: kids || menorNoEssencial,
        informarAlergias: marcada('informar-alergias'),
        alergiasPessoa: marcado('alergias-pessoa')
      };
    }

    /* Mostrar e esconder grupos conforme as escolhas */

    function anunciar(mensagem) {
      avisoVivo.textContent = '';
      window.setTimeout(() => {
        avisoVivo.textContent = mensagem;
      }, 50);
    }

    function atualizarVisibilidade(anunciarMudancas) {
      const s = lerSituacao();
      const mensagens = [];
      const alternar = (id, visivel, mensagem) => {
        const elemento = porId(id);
        if (visivel && elemento.hidden && mensagem) mensagens.push(mensagem);
        elemento.hidden = !visivel;
      };

      alternar('grupo-turma', Boolean(s.curso), 'As turmas do curso apareceram abaixo.');
      alternar('grupo-data-inicio', Boolean(s.turma), 'As datas de início apareceram abaixo.');
      alternar('grupo-pagamento', Boolean(s.curso));

      alternar('bloco-essencial', s.essencial);
      alternar('campo-participante-nome', s.essencial && s.participante === 'outra', 'Apareceu o campo para o nome do participante.');
      alternar('bloco-responsavel-legal', s.menorNoEssencial, 'Como o participante tem menos de 18 anos, apareceram os campos do responsável legal e a autorização.');
      alternar('grupo-responsavel-legal', s.perguntarResponsavelLegal);
      alternar('responsavel-legal-reuso', s.responsavelLegalSouEu);
      alternar('campos-responsavel-legal', s.camposResponsavelLegal, 'Apareceram os campos para o nome e o telefone do responsável legal.');

      alternar('bloco-kids', s.kids);
      alternar('responsavel-aula-reuso', s.kids && s.responsavelAula === 'eu');
      alternar('campos-responsavel-aula', s.kids && s.responsavelAula === 'outra', 'Apareceram os campos para o nome e o telefone do responsável.');

      alternar('bloco-autorizacao-menor', s.menorEnvolvido);
      alternar('bloco-alergias', s.informarAlergias, 'Apareceram os campos de alergias e a autorização para usar essas informações.');
      alternar('grupo-alergias-pessoa', s.kids && s.informarAlergias);

      porId('etapa-2-intro').textContent = s.kids
        ? 'Informe os seus dados, os da criança e quem vai cozinhar com ela. Depois: revisão.'
        : 'Informe os seus dados e quem vai fazer o curso. Para menores de 18 anos, pedimos também o responsável legal. Depois: revisão.';

      if (anunciarMudancas && mensagens.length) anunciar(mensagens.join(' '));
    }

    function aoMudarCurso() {
      const curso = marcado('curso');
      $$('#grupo-turma [data-curso]').forEach((opcao) => {
        const doCurso = opcao.dataset.curso === curso;
        const radio = $('input', opcao);
        opcao.hidden = !doCurso;
        radio.disabled = !doCurso;
        if (!doCurso) radio.checked = false;
      });
      // O Kids tem uma única turma: ela já vem escolhida.
      if (curso === 'kids') $('#grupo-turma input[value="kids"]').checked = true;

      porId('turma-dica').textContent = curso === 'kids'
        ? 'O Culinária Kids tem uma turma.'
        : 'Escolha uma das três turmas do Culinária Essencial.';

      if (curso) {
        const dados = R.CURSOS[curso];
        const porDupla = curso === 'kids' ? ' por dupla' : '';
        $('[data-valor="avista"]', area).textContent = R.formatarValor(dados.valorAVista) + porDupla;
        $('[data-valor="cartao"]', area).textContent =
          `${dados.parcelas}x de ${R.formatarValor(dados.valorParcela)} (total ${R.formatarValor(dados.parcelas * dados.valorParcela)})${porDupla}`;
      }
      aoMudarTurma();
    }

    function aoMudarTurma() {
      const turma = marcado('turma');
      if (turma === turmaComDatas) return;
      turmaComDatas = turma;
      const opcoes = porId('opcoes-data-inicio');
      opcoes.replaceChildren(
        ...(turma ? R.proximosInicios(turma) : []).map((data) => el('label', { class: 'choice' },
          el('input', { type: 'radio', name: 'data-inicio', value: R.paraISO(data), required: true }),
          el('span', { class: 'choice__text' },
            el('span', { class: 'choice__title' }, R.formatarData(data)),
            el('span', { class: 'choice__hint' }, capitalizar(R.diaDaSemana(data)))
          )
        ))
      );
    }

    /* Erros */

    const regraDa = (chave) => CAMPOS.find((regra) => regra.chave === chave);
    const envoltorio = (chave) => $(`[data-campo="${chave}"]`, area);

    // Campo de texto ou caixa: o próprio input. Grupo de opções: o fieldset.
    function controleDo(chave) {
      return porId(chave) || envoltorio(chave);
    }

    function focoDo(chave) {
      const controle = porId(chave);
      if (controle) return controle;
      const grupo = envoltorio(chave);
      return $('input:checked', grupo) || $('input:not(:disabled)', grupo);
    }

    function definirErro(chave, mensagem) {
      const erro = porId(`${chave}-erro`);
      const controle = controleDo(chave);
      envoltorio(chave).classList.toggle('field--invalid', Boolean(mensagem));

      erro.replaceChildren();
      if (mensagem) {
        erro.append(
          el('span', { class: 'field-error__icon', 'aria-hidden': 'true' }, '!'),
          el('span', {}, el('span', { class: 'sr-only' }, 'Erro: '), mensagem)
        );
      }
      erro.hidden = !mensagem;

      const descricao = (controle.getAttribute('aria-describedby') || '').split(' ').filter((id) => id && id !== erro.id);
      if (mensagem) descricao.push(erro.id);
      if (descricao.length) controle.setAttribute('aria-describedby', descricao.join(' '));
      else controle.removeAttribute('aria-describedby');

      if (controle.matches('input, textarea')) {
        if (mensagem) controle.setAttribute('aria-invalid', 'true');
        else controle.removeAttribute('aria-invalid');
      }
    }

    function validarCampo(regra, s = lerSituacao()) {
      const mensagem = regra.ativo(s) ? regra.validar(s) : '';
      definirErro(regra.chave, mensagem);
      return mensagem;
    }

    function validarEtapa(numero) {
      const s = lerSituacao();
      return CAMPOS
        .filter((regra) => regra.etapa === numero)
        .map((regra) => ({ regra, mensagem: validarCampo(regra, s) }))
        .filter((item) => item.mensagem);
    }

    function focarCampo(chave) {
      const alvo = focoDo(chave);
      if (!alvo) return;
      const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      (envoltorio(chave) || alvo).scrollIntoView({ block: 'center', behavior: reduzir ? 'auto' : 'smooth' });
      alvo.focus({ preventScroll: true });
    }

    function montarResumo(numero, erros) {
      const resumo = porId(`etapa-${numero}-erros`);
      const idTitulo = `etapa-${numero}-erros-titulo`;
      if (!erros.length) {
        resumo.hidden = true;
        resumo.removeAttribute('aria-labelledby');
        resumo.replaceChildren();
        return resumo;
      }
      const titulo = erros.length === 1 ? 'Corrija 1 item para continuar' : `Corrija ${erros.length} itens para continuar`;
      resumo.setAttribute('aria-labelledby', idTitulo);
      resumo.replaceChildren(
        el('h4', { id: idTitulo }, titulo),
        el('ul', {}, erros.map(({ regra, mensagem }) => {
          const alvo = porId(regra.chave) ? regra.chave : `grupo-${regra.chave}`;
          const link = el('a', { href: `#${alvo}` }, mensagem);
          link.addEventListener('click', (evento) => {
            evento.preventDefault();
            focarCampo(regra.chave);
          });
          return el('li', {}, link);
        }))
      );
      resumo.hidden = false;
      return resumo;
    }

    function mostrarResumo(numero, erros) {
      const resumo = montarResumo(numero, erros);
      resumo.scrollIntoView({ block: 'start' });
      resumo.focus({ preventScroll: true });
    }

    // Depois de uma correção, o resumo some ou encolhe, sem mover o foco.
    function atualizarResumo(numero) {
      const resumo = porId(`etapa-${numero}-erros`);
      if (resumo.hidden) return;
      const s = lerSituacao();
      const pendentes = CAMPOS
        .filter((regra) => regra.etapa === numero && regra.ativo(s) && envoltorio(regra.chave).classList.contains('field--invalid'))
        .map((regra) => ({ regra, mensagem: regra.validar(s) }))
        .filter((item) => item.mensagem);
      montarResumo(numero, pendentes);
    }

    /* Etapas */

    function irPara(numero, focar = true) {
      etapaAtual = numero;
      etapas.forEach((etapa, indice) => {
        etapa.hidden = indice !== numero - 1;
      });
      $$('li', progresso).forEach((item, indice) => {
        const passo = indice + 1;
        item.classList.toggle('is-done', passo < numero);
        if (passo === numero) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
        $('.progress__state', item).textContent = passo < numero ? ' (concluída)' : '';
      });
      if (numero === 3) montarRevisao();
      if (focar) porId(`etapa-${numero}-titulo`).focus();
    }

    function avancar(numero) {
      atualizarVisibilidade(false);
      const erros = validarEtapa(numero);
      if (erros.length) {
        mostrarResumo(numero, erros);
        return;
      }
      montarResumo(numero, []);
      irPara(numero + 1);
    }

    /* Revisão */

    function lerInscricao() {
      const s = lerSituacao();
      const curso = R.CURSOS[s.curso];
      const turma = R.TURMAS[s.turma];
      const inicio = R.deISO(s.dataInicio);
      const voce = texto('nome');
      const pessoa = (nomeId, telefoneId) => `${texto(nomeId)}, ${R.formatarTelefone(valor(telefoneId))}`;

      const participantes = [];
      if (s.essencial) {
        const idade = R.lerIdade(valor('participante-idade'));
        const nome = s.participante === 'eu' ? `${voce} (você)` : texto('participante-nome');
        participantes.push(['Participante', `${nome}, ${idade} anos`]);
        if (s.menorNoEssencial) {
          participantes.push(['Responsável legal', s.responsavelLegalSouEu ? `${voce} (você)` : pessoa('responsavel-legal-nome', 'responsavel-legal-telefone')]);
        }
      } else {
        participantes.push(['Criança', `${texto('crianca-nome')}, ${R.lerIdade(valor('crianca-idade'))} anos`]);
        participantes.push(['Responsável na cozinha', s.responsavelAula === 'eu' ? `${voce} (você)` : pessoa('responsavel-aula-nome', 'responsavel-aula-telefone')]);
      }

      const referencia = { crianca: 'à criança', responsavel: 'ao responsável', ambos: 'à criança e ao responsável' };
      let alergias = 'Não informadas';
      if (s.informarAlergias) {
        alergias = texto('alergias-descricao');
        if (s.kids) alergias += ` (refere-se ${referencia[s.alergiasPessoa]})`;
      }

      const autorizacoes = [];
      if (s.menorEnvolvido) autorizacoes.push(['Dados do menor de idade', 'Autorizado pelo responsável legal']);
      if (s.informarAlergias) autorizacoes.push(['Informações de saúde', 'Autorizado o uso para planejar receitas e segurança']);
      autorizacoes.push(['Aviso de privacidade', 'Lido e aceito']);

      return { s, curso, turma, inicio, voce, participantes, alergias, autorizacoes };
    }

    function textoReembolso(inicio) {
      const prazo = R.prazoReembolso(inicio);
      const hoje = R.comoData(R.hojeEmSaoPaulo());
      if (prazo < hoje) {
        return `O reembolso integral vale até 7 dias antes do início (${R.formatarData(prazo)}). Para esta data, esse prazo já passou.`;
      }
      return `Integral até ${R.formatarData(prazo)}, 7 dias antes do início.`;
    }

    function listaDeFatos(linhas) {
      return el('dl', { class: 'facts' }, linhas.map(([termo, descricao]) => el('div', {}, el('dt', {}, termo), el('dd', {}, descricao))));
    }

    function grupoDeRevisao(id, titulo, rotuloEditar, chaveFoco, linhas) {
      const editar = el('button', { class: 'link-button', type: 'button' }, rotuloEditar);
      editar.addEventListener('click', () => {
        irPara(regraDa(chaveFoco) ? regraDa(chaveFoco).etapa : 2, false);
        focarCampo(chaveFoco);
      });
      return el('section', { class: 'review-group', 'aria-labelledby': id },
        el('div', { class: 'review-group__header' }, el('h4', { id }, titulo), editar),
        listaDeFatos(linhas)
      );
    }

    function montarRevisao() {
      const i = lerInscricao();
      porId('revisao-conteudo').replaceChildren(
        grupoDeRevisao('revisao-curso', 'Curso e turma', 'Editar curso e turma', 'curso', [
          ['Curso', i.curso.nome],
          ['Turma', `${i.turma.nome}: ${i.turma.dias.toLowerCase()}, ${i.turma.horario}`],
          ['Início', `${R.formatarData(i.inicio)} (${R.diaDaSemana(i.inicio)})`],
          ['Duração', `${i.turma.duracao}, ${i.curso.aulas}`],
          ['Valor', `${R.descreverValor(i.s.curso, i.s.pagamento)}${i.s.kids ? ', por dupla' : ''}`],
          ['Incluso', i.curso.inclusos],
          ['Reembolso', textoReembolso(i.inicio)]
        ]),
        grupoDeRevisao('revisao-contato', 'Seus dados', 'Editar seus dados', 'nome', [
          ['Nome', i.voce],
          ['E-mail', texto('email')],
          ['Telefone', R.formatarTelefone(valor('telefone'))]
        ]),
        grupoDeRevisao('revisao-participantes', 'Participantes', 'Editar participantes', i.s.kids ? 'crianca-nome' : 'participante', i.participantes),
        grupoDeRevisao('revisao-autorizacoes', 'Alergias e autorizações', 'Editar alergias e autorizações', 'informar-alergias', [
          ['Alergias e restrições', i.alergias],
          ...i.autorizacoes
        ])
      );
    }

    /* Conclusão */

    function definirCarregando(ativo) {
      botaoConcluir.classList.toggle('is-loading', ativo);
      if (ativo) botaoConcluir.setAttribute('aria-disabled', 'true');
      else botaoConcluir.removeAttribute('aria-disabled');
      $('.button__label', botaoConcluir).textContent = ativo ? 'Concluindo…' : 'Concluir pré-inscrição';
    }

    function concluir() {
      if (concluindo) return;
      atualizarVisibilidade(false);
      for (const numero of [1, 2]) {
        const erros = validarEtapa(numero);
        if (erros.length) {
          irPara(numero, false);
          mostrarResumo(numero, erros);
          return;
        }
      }

      concluindo = true;
      falha.hidden = true;
      definirCarregando(true);
      anunciar('Concluindo a pré-inscrição de demonstração.');

      // Pausa curta para o estado de carregamento ficar perceptível. Nada sai da página.
      window.setTimeout(() => {
        try {
          mostrarConfirmacao(lerInscricao());
        } catch (erro) {
          falha.hidden = false;
          falha.focus();
        } finally {
          concluindo = false;
          definirCarregando(false);
        }
      }, 600);
    }

    function mostrarConfirmacao(i) {
      const participantes = i.participantes.map(([papel, pessoa]) => `${papel}: ${pessoa}`);
      const proximos = [
        'Em um site real, a escola usaria os seus contatos para confirmar a vaga e o pagamento. Como esta é uma demonstração, ninguém vai entrar em contato.',
        i.s.kids
          ? 'Não é preciso levar ingredientes nem aventais: os da criança e do responsável estão inclusos.'
          : 'Não é preciso levar ingredientes nem avental: estão inclusos.',
        `Reembolso: ${textoReembolso(i.inicio)}`,
        'Certificado de conclusão com 75% de presença, ou seja, 6 das 8 aulas.'
      ];
      if (i.s.kids) proximos.push('Nas aulas, a criança participa com o responsável informado, que também cozinha.');

      confirmacao.replaceChildren(
        el('h3', { id: 'confirmacao-titulo', tabindex: '-1' }, 'Pré-inscrição de demonstração concluída'),
        el('p', {}, el('strong', {}, 'Nada foi enviado, cobrado ou reservado.'), ' Esta página é um protótipo acadêmico e os dados ficaram só nesta tela.'),
        el('h4', {}, 'Resumo'),
        listaDeFatos([
          ['Curso', i.curso.nome],
          ['Turma', `${i.turma.nome}: ${i.turma.dias.toLowerCase()}, ${i.turma.horario}`],
          ['Início', `${R.formatarData(i.inicio)} (${R.diaDaSemana(i.inicio)})`],
          ['Participantes', participantes.join('; ')],
          ['Valor', `${R.descreverValor(i.s.curso, i.s.pagamento)}${i.s.kids ? ', por dupla' : ''}`]
        ]),
        el('h4', {}, 'O que acontece agora'),
        el('ul', {}, proximos.map((item) => el('li', {}, item))),
        el('p', {}, 'Dúvidas? Veja os ', el('a', { href: '#contato' }, 'contatos da escola (fictícios)'), '.'),
        el('div', { class: 'actions' },
          el('button', { class: 'button button--primary', type: 'button', id: 'nova-inscricao' }, 'Fazer outra pré-inscrição'),
          el('a', { class: 'button button--secondary', href: '#topo' }, 'Voltar ao início')
        )
      );
      porId('nova-inscricao').addEventListener('click', () => reiniciar(true));

      etapas.forEach((etapa) => {
        etapa.hidden = true;
      });
      progresso.hidden = true;
      porId('confirmacao-titulo').focus();
    }

    function reiniciar(focar) {
      etapas.forEach((etapa) => etapa.reset());
      $$('[data-editado]', area).forEach((campo) => {
        delete campo.dataset.editado;
      });
      CAMPOS.forEach((regra) => definirErro(regra.chave, ''));
      montarResumo(1, []);
      montarResumo(2, []);
      porId('email-sugestao').hidden = true;
      falha.hidden = true;
      confirmacao.replaceChildren();
      progresso.hidden = false;
      turmaComDatas = null;
      aoMudarCurso();
      atualizarVisibilidade(false);
      irPara(1, focar);
    }

    /* Sugestão de e-mail */

    function atualizarSugestaoEmail() {
      const { mensagem, sugestao } = R.validarEmail(valor('email'));
      const mostrar = !mensagem && Boolean(sugestao);
      porId('email-sugestao-texto').textContent = sugestao;
      porId('email-sugestao').hidden = !mostrar;
    }

    porId('usar-sugestao').addEventListener('click', () => {
      porId('email').value = porId('email-sugestao-texto').textContent;
      porId('email-sugestao').hidden = true;
      validarCampo(regraDa('email'));
      atualizarResumo(2);
      porId('email').focus();
    });

    /* Eventos */

    // Valida ao sair do campo, só se a pessoa digitou algo nele.
    area.addEventListener('focusout', (evento) => {
      const campo = evento.target;
      if (!campo.matches(campoTextual) || campo.dataset.editado !== 'true') return;
      const regra = regraDa(campo.closest('[data-campo]')?.dataset.campo);
      if (!regra) return;
      const mensagem = validarCampo(regra);
      if (!mensagem && campo.type === 'tel') campo.value = R.formatarTelefone(campo.value);
      if (campo.id === 'email') atualizarSugestaoEmail();
      atualizarResumo(regra.etapa);
    });

    // Enquanto digita, só retira o erro quando o valor fica correto. Nunca acrescenta erro a cada tecla.
    area.addEventListener('input', (evento) => {
      const campo = evento.target;
      if (!campo.matches(campoTextual)) return;
      campo.dataset.editado = 'true';
      if (campo.getAttribute('aria-invalid') !== 'true') return;
      const regra = regraDa(campo.closest('[data-campo]')?.dataset.campo);
      if (regra && !regra.validar(lerSituacao())) {
        definirErro(regra.chave, '');
        atualizarResumo(regra.etapa);
      }
    });

    area.addEventListener('change', (evento) => {
      const campo = evento.target;
      if (campo.name === 'curso') aoMudarCurso();
      if (campo.name === 'turma') aoMudarTurma();
      atualizarVisibilidade(true);
      const s = lerSituacao();
      CAMPOS.filter((regra) => !regra.ativo(s)).forEach((regra) => definirErro(regra.chave, ''));
      if (campo.type === 'radio' || campo.type === 'checkbox') {
        const regra = regraDa(campo.closest('[data-campo]')?.dataset.campo);
        if (regra && envoltorio(regra.chave).classList.contains('field--invalid')) validarCampo(regra);
      }
      if (etapaAtual < 3) atualizarResumo(etapaAtual);
    });

    etapas[0].addEventListener('submit', (evento) => {
      evento.preventDefault();
      avancar(1);
    });
    etapas[1].addEventListener('submit', (evento) => {
      evento.preventDefault();
      avancar(2);
    });
    etapas[2].addEventListener('submit', (evento) => {
      evento.preventDefault();
      concluir();
    });

    $$('[data-voltar]', area).forEach((botao) => {
      botao.addEventListener('click', () => irPara(Number(botao.dataset.voltar)));
    });

    porId('tentar-novamente').addEventListener('click', concluir);

    // Links dos cursos e das turmas já deixam a escolha marcada no formulário.
    $$('a[data-curso]').forEach((link) => {
      link.addEventListener('click', () => {
        if (confirmacao.childElementCount) reiniciar(false);
        $(`input[name="curso"][value="${link.dataset.curso}"]`, area).checked = true;
        aoMudarCurso();
        if (link.dataset.turma) {
          $(`input[name="turma"][value="${link.dataset.turma}"]`, area).checked = true;
          aoMudarTurma();
        }
        atualizarVisibilidade(false);
        ['curso', 'turma'].forEach((chave) => definirErro(chave, ''));
        atualizarResumo(1);
        if (etapaAtual !== 1) irPara(1, false);
      });
    });

    // Estado inicial. O reset descarta valores que o navegador tenha restaurado ao recarregar.
    area.hidden = false;
    reiniciar(false);
  }
})();
