document.addEventListener("DOMContentLoaded", () => {
    const TOTAL_RESPIRACOES = 5;
    const DURACAO_INSPIRAR = 4000;
    const DURACAO_EXPIRAR = 5000;
    const DURACAO_CARREGAMENTO = 3000;

    const telas = {
        inicio: document.getElementById("rt-intro"),
        carregamento: document.getElementById("rt-loading"),
        jogo: document.getElementById("rt-game"),
        checkin: document.getElementById("rt-checkin"),
        conclusao: document.getElementById("rt-done")
    };

    const elementos = {
        palco: document.getElementById("activity-stage"),
        iniciar: document.getElementById("rt-start-btn"),
        iniciarViagem: document.getElementById("rt-journey-btn"),
        cena: document.getElementById("rt-scene"),
        telaComeco: document.getElementById("rt-scene-start"),
        barco: document.getElementById("rt-boat"),
        brilhos: document.getElementById("rt-arrival-sparkles"),
        progressoTexto: document.getElementById("rt-progress-label"),
        progressoPontos: [...document.querySelectorAll(".rt-progress-dot")],
        progressoGrupo: document.getElementById("rt-progress-dots"),
        faseKicker: document.getElementById("rt-phase-kicker"),
        faseTexto: document.getElementById("rt-phase-text"),
        faseAjuda: document.getElementById("rt-phase-help"),
        contagem: document.getElementById("rt-countdown"),
        orbe: document.getElementById("rt-breath-orb"),
        pausar: document.getElementById("rt-pause-btn"),
        reiniciar: document.getElementById("rt-restart-btn"),
        som: document.getElementById("rt-sound-btn"),
        opcoesSentimento: [...document.querySelectorAll("[data-feeling]")],
        resposta: document.getElementById("rt-checkin-response"),
        respostaIcone: document.getElementById("rt-response-icon"),
        respostaTitulo: document.getElementById("rt-response-title"),
        respostaTexto: document.getElementById("rt-response-text"),
        acoesCheckin: document.getElementById("rt-checkin-actions"),
        respirarExtra: document.getElementById("rt-extra-breath-btn"),
        finalizar: document.getElementById("rt-finish-btn"),
        jogarNovamente: document.getElementById("rt-play-again-btn")
    };

    const mensagensDeChegada = [
        "O barquinho saiu do cais.",
        "Os peixinhos vieram acompanhar.",
        "O sol apareceu mais forte.",
        "A ilha está bem pertinho.",
        "Chegamos à ilha!"
    ];

    const respostasCheckin = {
        calm: {
            icone: "🌱",
            titulo: "Que bom perceber essa mudança.",
            texto: "Mesmo uma pequena sensação de calma já é um jeito de cuidar de você."
        },
        same: {
            icone: "💛",
            titulo: "Tudo bem continuar parecido.",
            texto: "Às vezes o corpo precisa de mais tempo. O importante é que você tentou."
        },
        bothered: {
            icone: "🤝",
            titulo: "Obrigado por perceber e contar.",
            texto: "Você pode fazer só mais uma respiração. Se continuar difícil, chame um adulto em quem confia."
        }
    };

    let telaAtual = null;
    let tokenExecucao = 0;
    let pausado = false;
    let executando = false;
    let narracaoAtiva = false;
    let guiaAtual = {
        kicker: "Vamos começar",
        texto: "Encontre uma posição confortável",
        ajuda: "Você pode pausar quando quiser."
    };

    const executarTrocaTela = TekoActivityCore.createScreenTransition({
        screens: telas,
        stage: elementos.palco,
        duration: 220,
        activeScreens: ["jogo", "checkin", "conclusao"]
    });

    function trocarTela(nome) {
        const telaAnterior = telaAtual;

        telaAtual = nome;
        executarTrocaTela(telaAnterior, nome);
    }

    function atualizarGuia(kicker, texto, ajuda) {
        guiaAtual = { kicker, texto, ajuda };
        elementos.faseKicker.textContent = kicker;
        elementos.faseTexto.textContent = texto;
        elementos.faseAjuda.textContent = ajuda;
    }

    function restaurarGuia() {
        elementos.faseKicker.textContent = guiaAtual.kicker;
        elementos.faseTexto.textContent = guiaAtual.texto;
        elementos.faseAjuda.textContent = guiaAtual.ajuda;
    }

    function obterFimDoBarco() {
        if (window.innerWidth <= 520) {
            return 42;
        }

        if (window.innerWidth <= 760) {
            return 45;
        }

        return 48;
    }

    function posicionarBarco(progresso) {
        const inicio = 2;
        const fim = obterFimDoBarco();
        const posicao = inicio + (fim - inicio) * Math.max(0, Math.min(1, progresso));

        elementos.barco.style.left = `${posicao}%`;
    }

    function atualizarProgresso(concluidas, atual = concluidas) {
        elementos.progressoPontos.forEach((ponto, indice) => {
            ponto.classList.toggle("is-complete", indice < concluidas);
            ponto.classList.toggle(
                "is-current",
                indice === atual && concluidas < TOTAL_RESPIRACOES
            );
        });

        const fraseAcessivel = concluidas === 0
            ? "nenhuma de cinco respirações concluída"
            : concluidas === 1
                ? "uma de cinco respirações concluída"
                : `${concluidas} de cinco respirações concluídas`;

        elementos.progressoGrupo.setAttribute("aria-label", `Progresso: ${fraseAcessivel}`);
    }

    function atualizarBotaoPausa() {
        const icone = elementos.pausar.querySelector("i");
        const texto = elementos.pausar.querySelector("span");

        icone.className = pausado ? "fa-solid fa-play" : "fa-solid fa-pause";
        texto.textContent = pausado ? "Continuar" : "Pausar";
        elementos.pausar.setAttribute("aria-pressed", String(pausado));
        elementos.orbe.classList.toggle("is-paused", pausado);
        telas.jogo.classList.toggle("is-paused", pausado);
    }

    function cancelarFala() {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    }

    function narrar(texto) {
        if (!narracaoAtiva || !("speechSynthesis" in window)) {
            return;
        }

        cancelarFala();

        const fala = new SpeechSynthesisUtterance(texto);
        fala.lang = "pt-BR";
        fala.rate = 0.86;
        fala.pitch = 1.04;
        fala.volume = 0.9;

        window.speechSynthesis.speak(fala);
    }

    function animarDuracao(duracao, token, aCadaQuadro = () => {}) {
        return new Promise(resolve => {
            let tempoDecorrido = 0;
            let ultimoTempo = null;

            function quadro(agora) {
                if (token !== tokenExecucao) {
                    resolve(false);
                    return;
                }

                if (ultimoTempo === null) {
                    ultimoTempo = agora;
                }

                if (!pausado) {
                    const passo = Math.min(agora - ultimoTempo, 120);
                    tempoDecorrido += Math.max(0, passo);

                    const progresso = Math.min(tempoDecorrido / duracao, 1);
                    const restante = Math.max(0, duracao - tempoDecorrido);

                    aCadaQuadro(progresso, restante);

                    if (progresso >= 1) {
                        resolve(true);
                        return;
                    }
                }

                ultimoTempo = agora;
                requestAnimationFrame(quadro);
            }

            requestAnimationFrame(quadro);
        });
    }

    function esperar(duracao, token) {
        return animarDuracao(duracao, token);
    }

    async function fazerUmaRespiracao(indice, total, token, moverBarco = true) {
        const numero = indice + 1;
        const textoContador = total === TOTAL_RESPIRACOES
            ? `Respiração ${numero} de ${TOTAL_RESPIRACOES}`
            : "Uma respiração extra";

        elementos.progressoTexto.textContent = textoContador;

        if (total === TOTAL_RESPIRACOES) {
            atualizarProgresso(indice, indice);
        }

        atualizarGuia(
            textoContador,
            "Puxe o ar devagar...",
            "Deixe o ar entrar como o vento enchendo a vela."
        );
        narrar("Puxe o ar devagar");

        const inspirou = await animarDuracao(DURACAO_INSPIRAR, token, (progresso, restante) => {
            const escala = 0.76 + progresso * 0.62;
            elementos.orbe.style.transform = `scale(${escala.toFixed(3)})`;
            elementos.contagem.textContent = String(Math.max(1, Math.ceil(restante / 1000)));
        });

        if (!inspirou) {
            return false;
        }

        atualizarGuia(
            textoContador,
            "Agora, prepare para soltar...",
            "Sem pressa."
        );
        elementos.contagem.textContent = "•";

        if (!(await esperar(420, token))) {
            return false;
        }

        atualizarGuia(
            textoContador,
            "Solte o ar bem devagar...",
            moverBarco
                ? "O vento está levando o Teko mais perto da ilha."
                : "Deixe os ombros ficarem mais leves."
        );
        narrar("Agora solte o ar bem devagar");

        const expirou = await animarDuracao(DURACAO_EXPIRAR, token, (progresso, restante) => {
            const escala = 1.38 - progresso * 0.62;
            elementos.orbe.style.transform = `scale(${escala.toFixed(3)})`;
            elementos.contagem.textContent = String(Math.max(1, Math.ceil(restante / 1000)));

            if (moverBarco) {
                posicionarBarco((indice + progresso) / TOTAL_RESPIRACOES);
                elementos.barco.style.transform = `translateY(${Math.sin(progresso * Math.PI) * -4}px) rotate(${Math.sin(progresso * Math.PI * 2) * 0.7}deg)`;
            }
        });

        elementos.barco.style.transform = "";

        if (!expirou) {
            return false;
        }

        elementos.orbe.style.transform = "scale(0.76)";
        elementos.contagem.textContent = "✓";

        if (moverBarco) {
            const concluidas = indice + 1;
            posicionarBarco(concluidas / TOTAL_RESPIRACOES);
            atualizarProgresso(concluidas, concluidas);
            elementos.cena.dataset.moment = String(concluidas);

            atualizarGuia(
                `Respiração ${numero} concluída`,
                mensagensDeChegada[indice],
                concluidas < TOTAL_RESPIRACOES
                    ? "Muito bem. Vamos continuar quando o próximo ciclo começar."
                    : "Você fez as cinco respirações."
            );
        } else {
            atualizarGuia(
                "Respiração extra concluída",
                "Você se deu mais um momento de calma.",
                "Perceba novamente como seu corpo está."
            );
        }

        return esperar(moverBarco && indice === TOTAL_RESPIRACOES - 1 ? 1250 : 760, token);
    }

    async function iniciarCiclos() {
        if (executando) {
            return;
        }

        const token = ++tokenExecucao;
        executando = true;
        pausado = false;
        atualizarBotaoPausa();
        elementos.pausar.disabled = false;
        elementos.telaComeco.classList.add("is-hidden");
        elementos.brilhos.classList.remove("is-visible");

        for (let indice = 0; indice < TOTAL_RESPIRACOES; indice += 1) {
            const terminou = await fazerUmaRespiracao(
                indice,
                TOTAL_RESPIRACOES,
                token,
                true
            );

            if (!terminou || token !== tokenExecucao) {
                return;
            }
        }

        executando = false;
        elementos.pausar.disabled = true;
        elementos.progressoTexto.textContent = "5 de 5 concluídas";
        elementos.brilhos.classList.add("is-visible");
        narrar("Chegamos à ilha. Muito bem.");

        if (!(await esperar(1050, token))) {
            return;
        }

        limparCheckin();
        trocarTela("checkin");
    }

    async function fazerRespiracaoExtra() {
        if (executando) {
            return;
        }

        limparCheckin();
        trocarTela("jogo");
        elementos.telaComeco.classList.add("is-hidden");
        elementos.cena.dataset.moment = String(TOTAL_RESPIRACOES);
        elementos.brilhos.classList.add("is-visible");
        posicionarBarco(1);
        atualizarProgresso(TOTAL_RESPIRACOES, TOTAL_RESPIRACOES);

        const token = ++tokenExecucao;
        executando = true;
        pausado = false;
        atualizarBotaoPausa();
        elementos.pausar.disabled = false;

        const terminou = await fazerUmaRespiracao(0, 1, token, false);

        if (!terminou || token !== tokenExecucao) {
            return;
        }

        executando = false;
        elementos.pausar.disabled = true;

        if (!(await esperar(800, token))) {
            return;
        }

        trocarTela("checkin");
    }

    function prepararJogo() {
        tokenExecucao += 1;
        cancelarFala();
        executando = false;
        pausado = false;
        atualizarBotaoPausa();

        elementos.pausar.disabled = true;
        elementos.telaComeco.classList.remove("is-hidden");
        elementos.cena.dataset.moment = "0";
        elementos.brilhos.classList.remove("is-visible");
        elementos.orbe.style.transform = "scale(0.76)";
        elementos.contagem.textContent = "—";
        elementos.progressoTexto.textContent = "Respiração 1 de 5";

        posicionarBarco(0);
        atualizarProgresso(0, 0);
        atualizarGuia(
            "Vamos começar",
            "Encontre uma posição confortável",
            "Você pode pausar quando quiser."
        );
    }

    function iniciarAtividade() {
        const tokenAtual = ++tokenExecucao;
        trocarTela("carregamento");
        elementos.palco.classList.add("activity-stage-revealing");

        window.setTimeout(() => {
            if (tokenAtual !== tokenExecucao) {
                return;
            }

            prepararJogo();
            trocarTela("jogo");
        }, DURACAO_CARREGAMENTO);
    }

    function reiniciarJogo() {
        const jogoJaEstaVisivel = telaAtual === "jogo";

        prepararJogo();

        if (!jogoJaEstaVisivel) {
            trocarTela("jogo");
        }

        requestAnimationFrame(() => {
            elementos.iniciarViagem.focus();
        });
    }

    function reiniciarAtividade() {
        prepararJogo();
        trocarTela("inicio");

        requestAnimationFrame(() => {
            elementos.iniciar.focus();
        });
    }

    function alternarPausa() {
        if (!executando) {
            return;
        }

        pausado = !pausado;
        atualizarBotaoPausa();

        if (pausado) {
            cancelarFala();
            elementos.faseKicker.textContent = "Pausa";
            elementos.faseTexto.textContent = "Tudo bem parar um pouco";
            elementos.faseAjuda.textContent = "Continue somente quando se sentir pronto."
        } else {
            restaurarGuia();
            narrar(guiaAtual.texto.replaceAll(".", ""));
        }
    }

    function alternarNarracao() {
        narracaoAtiva = !narracaoAtiva;

        const icone = elementos.som.querySelector("i");
        const texto = elementos.som.querySelector("span");

        elementos.som.setAttribute("aria-pressed", String(narracaoAtiva));
        elementos.som.setAttribute(
            "aria-label",
            narracaoAtiva ? "Desativar narração" : "Ativar narração"
        );
        icone.className = narracaoAtiva
            ? "fa-solid fa-volume-high"
            : "fa-solid fa-volume-xmark";
        texto.textContent = narracaoAtiva
            ? "Narração ligada"
            : "Narração desligada";

        if (narracaoAtiva) {
            narrar(guiaAtual.texto.replaceAll(".", ""));
        } else {
            cancelarFala();
        }
    }

    function limparCheckin() {
        elementos.opcoesSentimento.forEach(botao => {
            botao.classList.remove("is-selected", "is-muted");
            botao.removeAttribute("aria-pressed");
        });

        elementos.resposta.hidden = true;
        elementos.acoesCheckin.hidden = true;
        elementos.respirarExtra.hidden = true;
    }

    function escolherSentimento(sentimento, botaoSelecionado) {
        const resposta = respostasCheckin[sentimento];

        elementos.opcoesSentimento.forEach(botao => {
            const selecionado = botao === botaoSelecionado;
            botao.classList.toggle("is-selected", selecionado);
            botao.classList.toggle("is-muted", !selecionado);
            botao.setAttribute("aria-pressed", String(selecionado));
        });

        elementos.respostaIcone.textContent = resposta.icone;
        elementos.respostaTitulo.textContent = resposta.titulo;
        elementos.respostaTexto.textContent = resposta.texto;
        elementos.resposta.hidden = false;
        elementos.acoesCheckin.hidden = false;
        elementos.respirarExtra.hidden = sentimento !== "bothered";
    }

    function finalizarAtividade() {
        tokenExecucao += 1;
        cancelarFala();
        executando = false;
        pausado = false;
        trocarTela("conclusao");
    }

    elementos.iniciar.addEventListener("click", iniciarAtividade);
    elementos.iniciarViagem.addEventListener("click", iniciarCiclos);
    elementos.pausar.addEventListener("click", alternarPausa);
    elementos.reiniciar.addEventListener("click", reiniciarJogo);
    elementos.som.addEventListener("click", alternarNarracao);
    elementos.respirarExtra.addEventListener("click", fazerRespiracaoExtra);
    elementos.finalizar.addEventListener("click", finalizarAtividade);
    elementos.jogarNovamente.addEventListener("click", reiniciarAtividade);

    elementos.opcoesSentimento.forEach(botao => {
        botao.addEventListener("click", () => {
            escolherSentimento(botao.dataset.feeling, botao);
        });
    });

    window.addEventListener("resize", () => {
        if (!executando && telaAtual === "jogo") {
            const concluido = Number(elementos.cena.dataset.moment) || 0;
            posicionarBarco(concluido / TOTAL_RESPIRACOES);
        }
    });

    window.addEventListener("pagehide", () => {
        tokenExecucao += 1;
        cancelarFala();
    });

    prepararJogo();
    trocarTela("inicio");
});
