# Experimento

Landing page do **Ateliê do Sabor**, escola de culinária fictícia (briefing do Grupo 2). A página apresenta os cursos **Culinária Essencial** e **Culinária Kids** e leva à **pré-inscrição de demonstração**, com revisão antes de concluir.

> Esta versão foi gerada com o **Claude** (Anthropic), pelo Claude Code, em 26/10/2026, a partir do *Briefing grupo 2* e do *Material de apoio de UX/UI e acessibilidade*. As decisões finais e a escolha da versão entregue são do estudante.

## Como abrir

- **Online:** https://uisgabrieo.github.io/Experimento/
- **No computador:** abra o `index.html` no navegador. Não há build nem dependências.
- **Testes das regras** (Node 18 ou superior), na raiz do projeto: `node --test`

Nenhum dado é enviado ou guardado. O formulário funciona só na página: validação, erro, revisão e confirmação acontecem no navegador.

## Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Página única em português, HTML semântico |
| `css/style.css` | Estilo mobile first, com cores, tipografia e espaçamentos centralizados em `:root` |
| `js/regras.js` | Dados dos cursos e turmas, calendário de início, formatos pt-BR e validações (sem acesso à página) |
| `js/app.js` | Menu, seção atual, datas das turmas e formulário em 3 etapas |
| `img/` | Ilustração decorativa e ícone, em SVG próprio |
| `tests/regras.test.js` | 13 testes das regras com `node:test` |
| `verificacao/` | Relatórios do Lighthouse e capturas de tela em alto contraste |

## Contexto de uso (seção 0)

O público são adolescentes a partir de 13 anos, adultos e idosos que querem aprender a cozinhar do zero, e famílias com crianças de 6 a 12 anos. Inclui pessoas 50+ e pessoas com deficiência visual, auditiva ou motora. A tarefa principal é comparar os cursos e as turmas e concluir uma pré-inscrição, principalmente pelo celular, às vezes com conexão limitada, teclado ou tecnologia assistiva.

- **Objetivo principal:** concluir a pré-inscrição no curso e turma adequados à idade e à rotina.
- **CTA primário:** “Fazer pré-inscrição”.

## Estrutura e decisões

1. **Apresentação:** o que é, para quem e o próximo passo. Um CTA dominante (“Fazer pré-inscrição”) e um secundário (“Conhecer os cursos”).
2. **Cursos:** dois cartões com os mesmos atributos na mesma ordem: para quem, formato, vagas, turmas, valor, incluso, certificado e módulos. O preço parcelado sempre aparece com o total.
3. **Como funciona:** o percurso em 4 passos, a instrutora e as regras importantes (reembolso, certificado, dupla do Kids, responsável legal).
4. **Turmas e datas:** quatro cartões comparáveis, com as 3 próximas datas de início calculadas.
5. **Pré-inscrição:** 3 etapas (Curso e turma → Participantes → Revisão), com indicador textual “Etapa 2 de 3”.
6. **Dúvidas** (perguntas em `<details>`), **Privacidade** e **Contato** no rodapé.

**Visual:** referência de livro de receitas, com papel claro, verde-oliva e terracota. Títulos em Georgia e texto em fontes do sistema, sem fonte externa. O corpo tem 18 px e altura de linha 1,6. Não há vídeo, áudio, carrossel nem movimento automático.

**Formulário:**

- Grupos por pessoa (`fieldset`/`legend`). Os campos condicionais só aparecem quando a escolha os exige, com explicação e aviso discreto para leitor de tela.
- Valida ao sair do campo e ao continuar, nunca a cada tecla. Cada erro diz o que corrigir, fica junto do campo (ícone, cor e texto, com `aria-describedby` e `aria-invalid`) e também aparece num resumo com links. O foco vai para o resumo.
- Telefone aceito com ou sem máscara, com +55 ou 0 na frente. O e-mail sugere correção de domínio (ex.: `gmial.com` → `gmail.com`).
- Não pede o mesmo dado duas vezes: “Eu, usar os meus dados” reaproveita nome e telefone de quem preenche.
- Autorizações separadas e nunca pré-marcadas: dados de menor de idade, informações de saúde (alergias) e aviso de privacidade.
- A revisão tem botão de edição por grupo e preserva tudo. O botão de conclusão entra em carregamento e bloqueia clique duplo. A confirmação usa `role="status"`, resume a escolha e diz que nada foi enviado, cobrado ou reservado.
- Os formulários usam `method="dialog"`: mesmo sem JavaScript, nenhum dado sai da página.

## Suposições

1. A pré-inscrição registra interesse. Não garante vaga e não faz cobrança.
2. **Essencial, 13 a 17 anos:** a pré-inscrição pede nome e telefone do responsável legal e a autorização dele. Acompanhar na cozinha é regra só do Kids, como diz o briefing.
3. **Kids:** quem preenche pode ser o responsável que cozinha (reaproveita os dados) ou indicar outra pessoa.
4. **Sábado e Kids:** seguem a lista explícita (fevereiro, abril, junho, agosto e outubro). Dezembro não entra, apesar da expressão “a cada 2 meses” no briefing.
5. As datas são calculadas no fuso de São Paulo. Uma turma que começa hoje não é oferecida. Feriados não são considerados. As datas não indicam vagas disponíveis.
6. O reembolso “até 7 dias antes do início” vai até a data de início menos 7 dias. Se esse prazo já passou para a data escolhida, a revisão avisa.
7. A forma de pagamento é só uma preferência. Não há dados de cartão.
8. O Essencial não tem limite de idade. O campo só recusa números acima de 120, como provável erro de digitação.
9. Regras não definidas pelo briefing (reembolso após o prazo, prazo de retorno) não foram inventadas.

## Regras do material não aplicadas ou adaptadas

| Seção | Regra | Decisão e motivo |
| --- | --- | --- |
| 1 | Ordem “prova e credibilidade → como funciona → opções e preços” | Preço e idade aparecem já nos cartões dos cursos, porque decidem qual curso serve. A instrutora e as regras vêm logo depois, em “Como funciona”. |
| 2 | Um CTA dominante por seção | A seção Cursos tem dois botões primários, um por cartão, porque são escolhas paralelas e equivalentes. |
| 3 | Cabeçalho fixo com `scroll-padding-top` | Fixo só em telas largas e altas. Com zoom ou em tela pequena, fica no fluxo para não cobrir conteúdo nem foco. |
| 5 | Confirmação com prazo (“Respondemos em até 2 dias úteis”) | Sem back-end, ninguém entra em contato. A confirmação diz isso e não inventa prazo. |
| 5 | Falha de rede com “Tentar novamente” | Não há rede. Existe tratamento de falha local com “Tentar novamente”, preservando os dados. |
| 5 | Captcha acessível | Não se aplica: não há envio. |
| 6 | Legendas, audiodescrição, Libras, carrossel | Não se aplicam: a página não tem vídeo, áudio nem carrossel. |
| 8 | Modal, tooltip, banner de cookies | Não se aplicam: não existem na página e não há cookies nem rastreamento. |
| 9 | `loading="lazy"` e `font-display` | A única imagem está acima da dobra (usa `fetchpriority="high"`). Não há fonte externa. |
| 10 | Contato real e política de privacidade | Os contatos são os fictícios do briefing, sinalizados e sem link, para não acionar número ou e-mail inexistente. Há um aviso de privacidade curto, não uma política jurídica. |

## Verificação realizada

Todos os testes usaram dados fictícios.

**Validador HTML (Nu Html Checker 26.10.12, offline):** HTML, CSS e SVG sem erros nem avisos.

**Regras (`node --test`, Node 24):** 13 testes passando:

- calendário das 4 turmas, sem dezembro, com virada de ano, “hoje” excluído e fuso de São Paulo;
- prazo de reembolso, datas e valores em pt-BR;
- idades limite (5, 6, 12, 13, 17 e 92);
- telefone com e sem máscara;
- e-mail e sugestão de domínio;
- nome e descrição de alergias.

**Navegador: Microsoft Edge 156, headless, controlado por script (DevTools Protocol), 128 verificações passando:**

- **Largura:** sem rolagem horizontal em 1366×900, 768×1024, 390×844, 320×640 e 640×360 (paisagem).
- **Zoom 200%** (640 px CSS): sem rolagem horizontal, cabeçalho no fluxo.
- **Texto ampliado a 200%** em 1366 px e em 320 px: sem rolagem horizontal.
- **Espaçamento de texto** (WCAG 1.4.12: linha 1,5, letras 0,12em, palavras 0,16em, parágrafos 2em) em 320 px: sem rolagem horizontal.
- **Conteúdo:** os 37 fatos obrigatórios do briefing presentes; um `h1`; títulos sem pular nível; IDs únicos; referências ARIA e `label for` válidas; todos os links internos com destino.
- **axe-core 4.10.2** (WCAG 2.0, 2.1 e 2.2 A/AA e boas práticas), em três estados (página inicial, revisão e confirmação): **0 violações**. Nove itens ficaram para revisão manual: textos do topo sobre um degradê, que o axe não calcula. O contraste foi conferido à mão (tabela abaixo).
- **Teclado:**
  - o link de salto é o primeiro foco e leva ao conteúdo;
  - o menu móvel abre com Enter e fecha com Esc, devolvendo o foco ao botão;
  - os links do menu fecham o menu, e o botão Voltar do navegador funciona com as âncoras;
  - o foco é visível (3 px);
  - um fluxo completo do Essencial adulto foi concluído só com Tab, Espaço, setas e Enter.
- **Formulário, com cliques e digitação reais:**
  - Essencial de 15 anos (responsável legal e autorização), adulto de 67 anos, Kids com idades 5, 6, 12 e 13;
  - e-mail com domínio errado; telefone com e sem máscara e com +55; telefone inválido só ao sair do campo;
  - alergia sem descrição ou sem autorização; desmarcar alergias limpa os erros;
  - clique no texto das autorizações marca a caixa;
  - editar na revisão sem perder dados; trocar de curso sem apagar o que foi digitado;
  - carregamento com bloqueio de clique duplo; confirmação com foco; reiniciar com todas as caixas desmarcadas.
- **Privacidade:** só pedidos GET dos arquivos da própria página. Nenhum POST e nenhum dado na URL. `localStorage`, `sessionStorage` e cookies vazios. Sem erros no console.

**Lighthouse 13.5.0** (Edge 156), na página publicada: **100** em Desempenho, Acessibilidade, Práticas recomendadas e SEO, tanto no perfil celular quanto no computador. Os relatórios completos estão em `verificacao/`.
- O GitHub Pages já comprime os arquivos (gzip), então o código pôde continuar legível, sem minificação.
- A única sugestão restante é um cache mais longo. O GitHub Pages fixa `max-age=600` (10 minutos), e isso não depende do projeto.
- O Lighthouse também lista 10 itens de acessibilidade para conferência manual. Eles estão cobertos pelos testes de teclado e de formulário acima, menos o leitor de tela (ver pendências).

**Três motores de navegador (Playwright 1.64.1), 52 verificações passando:** Edge 156 (Chromium), Firefox 157 e WebKit 27.2 (o motor do Safari, aqui no Windows, que não é o Safari do iPhone).
- Em cada um: sem rolagem horizontal em 320, 390 e 1366 px; datas calculadas; menu móvel com Esc devolvendo o foco.
- Também em cada um, o fluxo Kids completo com cliques e digitação reais: erros e foco no resumo, idade 13 recusada, clique no texto das autorizações, revisão, confirmação com foco, nada guardado e sem erros de JavaScript.

**Alto contraste (`forced-colors`, simulado no Edge):** botões, campos, opções escolhidas, ícones de erro e foco continuam visíveis. Capturas em `verificacao/`.

**Árvore de acessibilidade** (o que o leitor de tela recebe, lido no Edge pela DevTools Protocol): cada campo da etapa 2 com erro chega com nome, “obrigatório”, “inválido” e uma descrição com a dica e a mensagem de erro. Os grupos chegam com o nome da legenda, e o resumo chega como “Corrija 8 itens para continuar”. Isso complementa, mas não substitui, ouvir com um leitor de tela.

**Correções feitas a partir da verificação:**

1. O aviso “Protótipo acadêmico” estava fora de qualquer região (axe `region`). Virou `<aside>` com rótulo.
2. Os resumos de erro apontavam `aria-labelledby` para um título que só existe quando há erro. O vínculo agora é criado junto com o título.
3. Com texto a 200% em 320 px havia até 65 px de rolagem horizontal. Itens de grade e flex agora podem encolher, e palavras longas quebram nos rótulos, botões, etiquetas, indicador de etapas e perguntas.
4. Com “movimento reduzido” ligado, o destaque da opção escolhida aparecia com um quadro de atraso (visto no Edge). A regra global `transition-duration` criava transições em todas as propriedades. Agora só o indicador de carregamento para de girar.

**Contraste (WCAG, calculado a partir das cores do CSS):**

| Combinação | Razão | Combinação | Razão |
| --- | --- | --- | --- |
| Texto / papel | 14,51:1 | Texto / sálvia | 12,99:1 |
| Texto secundário / papel | 7,47:1 | Texto secundário / sálvia | 6,68:1 |
| Botão: branco / oliva | 7,38:1 | Botão em hover: branco / oliva escura | 10,51:1 |
| Terracota / papel | 5,86:1 | Terracota / sálvia | 5,24:1 |
| Erro / branco | 7,77:1 | Confirmação: verde / fundo verde | 6,86:1 |
| Borda do campo / branco | 4,07:1 | Borda do campo / papel | 3,81:1 |
| Foco / papel | 14,51:1 | Rodapé: texto / fundo | 10,53:1 |
| Botão desabilitado: texto / fundo | 5,20:1 | Link oliva escura / branco | 10,51:1 |

## Pendências (não executadas)

- **Leitor de tela real** (NVDA, VoiceOver ou TalkBack): ouvir topo, menu, formulário, um erro e a confirmação. A árvore de acessibilidade foi conferida, mas não substitui ouvir.
- **Checklist completo da ABNT NBR 17225:** a norma é paga e não estava disponível.
- **Celulares reais** (Safari no iPhone, Chrome no Android) e o tema de alto contraste ligado de verdade no Windows. Até aqui, os dois foram simulados.
- **Revisão cruzada por outra ferramenta de IA** (Gemini ou ChatGPT). Quem gerou o código não deve ser quem o revisa (seção 11 do material).
- **Teste com pessoas do público.**
