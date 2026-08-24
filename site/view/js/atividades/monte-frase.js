document.addEventListener("DOMContentLoaded", () => {
    const TEMPO_CARREGAMENTO = 3000;
    const DURACAO_FADE_TELA = 220;

    const frases = [
        {
            instrucao: "Monte uma frase para pedir água.",
            respostas: [
                ["Eu quero", "água", "por favor"],
                ["Pode me dar", "água", "por favor"]
            ],
            opcoes: [
                "Eu quero",
                "Pode me dar",
                "água",
                "por favor",
                "brincar"
            ],
            parabens: "Muito bem! Você montou uma frase para pedir água."
        },
        {
            instrucao: "Monte uma frase para pedir ajuda.",
            respostas: [
                ["Eu preciso", "de ajuda", "por favor"],
                ["Pode", "me ajudar", "por favor"]
            ],
            opcoes: [
                "Eu preciso",
                "de ajuda",
                "Pode",
                "me ajudar",
                "por favor",
                "sozinho"
            ],
            parabens: "Ótimo trabalho! Você mostrou como pedir ajuda."
        },
        {
            instrucao: "Monte uma frase para pedir para participar da brincadeira.",
            respostas: [
                ["Eu quero", "brincar", "com vocês"],
                ["Posso", "brincar", "com vocês"]
            ],
            opcoes: [
                "Eu quero",
                "Posso",
                "brincar",
                "com vocês",
                "parar"
            ],
            parabens: "Que legal! Você montou uma frase para participar da brincadeira."
        },
        {
            instrucao: "Monte uma frase para pedir que uma brincadeira pare.",
            respostas: [
                ["Pare", "com", "essa brincadeira"],
                ["Eu quero", "que você pare", "por favor"]
            ],
            opcoes: [
                "Pare",
                "com",
                "essa brincadeira",
                "Eu quero",
                "que você pare",
                "por favor"
            ],
            parabens: "Muito bem! Você comunicou com clareza que quer parar."
        },
        {
            instrucao: "Monte uma frase sobre algo que você gosta.",
            respostas: [
                ["Eu gosto", "de ler", "histórias"],
                ["Gosto muito", "de ler", "histórias"]
            ],
            opcoes: [
                "Eu gosto",
                "Gosto muito",
                "de ler",
                "histórias",
                "parar"
            ],
            parabens: "Parabéns! Você contou que gosta de ler."
        },
        {
            instrucao: "Monte uma frase para explicar que o barulho está incomodando.",
            respostas: [
                ["O barulho", "está muito alto", "para mim.", "Preciso de uma pausa."],
                ["O barulho", "está me incomodando.", "Por favor,", "Preciso de uma pausa."]
            ],
            opcoes: [
                "O barulho",
                "está muito alto",
                "para mim.",
                "Preciso de uma pausa.",
                "está me incomodando.",
                "Por favor,"
            ],
            parabens: "Muito bem! Você explicou o incômodo e pediu uma pausa."
        },
        {
            instrucao: "Monte uma frase para pedir que alguém explique uma tarefa novamente.",
            respostas: [
                ["Eu não entendi", "a tarefa.", "Pode explicar", "de novo, por favor?"],
                ["Eu não entendi", "o que devo fazer.", "Pode explicar", "mais uma vez?"]
            ],
            opcoes: [
                "Eu não entendi",
                "a tarefa.",
                "o que devo fazer.",
                "Pode explicar",
                "de novo, por favor?",
                "mais uma vez?"
            ],
            parabens: "Excelente! Você montou uma frase clara para pedir outra explicação."
        }
    ];

    const telas = {
        inicio: document.getElementById("mf-intro"),
        carregamento: document.getElementById("mf-loading"),
        jogo: document.getElementById("mf-game"),
        conclusao: document.getElementById("mf-done")
    };

    const palcoAtividade = document.getElementById("activity-stage");

    const elementos = {
        iniciar: document.getElementById("mf-start-btn"),
        indicador: document.getElementById("mf-round-indicator"),
        quantidadeBlocos: document.getElementById("mf-block-count"),
        instrucao: document.getElementById("mf-instruction"),
        frase: document.getElementById("mf-sentence-area"),
        opcoes: document.getElementById("mf-options-area"),
        feedback: document.getElementById("mf-feedback"),
        limpar: document.getElementById("mf-clear-btn"),
        ouvir: document.getElementById("mf-listen-btn"),
        confirmar: document.getElementById("mf-confirm-btn"),
        resultado: document.getElementById("mf-done-text"),
        reiniciar: document.getElementById("mf-play-again-btn")
    };

    let rodadaAtual = 0;
    let palavrasEscolhidas = [];
    let opcoesEmbaralhadas = [];
    let rodadaConcluida = false;
    let carregamentoId;

    const trocarTela = TekoActivityCore.createScreenTransition({
        screens: telas,
        stage: palcoAtividade,
        duration: DURACAO_FADE_TELA
    });

    const embaralhar = TekoActivityCore.shuffle;

    const transicaoNivel = TekoActivityCore.createLevelTransition({
        container: telas.jogo
    });

    function criarCartao(palavra, selecionado) {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = selecionado
            ? "word-card mf-selected"
            : "word-card";

        botao.textContent = palavra;
        botao.setAttribute("aria-label", palavra);

        botao.addEventListener("click", () => {
            if (rodadaConcluida) {
                return;
            }

            if (selecionado) {
                removerPalavra(botao);
            } else {
                palavrasEscolhidas.push(palavra);
            }

            limparFeedback();
            renderizarJogo();
        });

        return botao;
    }

    function removerPalavra(botao) {
        const cartoes = [
            ...elementos.frase.querySelectorAll(".word-card")
        ];

        const indice = cartoes.indexOf(botao);

        if (indice >= 0) {
            palavrasEscolhidas.splice(indice, 1);
        }
    }

    function palavraFoiUsada(palavra) {
        const quantidadeDisponivel = opcoesEmbaralhadas.filter(
            item => item === palavra
        ).length;

        const quantidadeUsada = palavrasEscolhidas.filter(
            item => item === palavra
        ).length;

        return quantidadeUsada >= quantidadeDisponivel;
    }

    function renderizarFrase() {
        elementos.frase.replaceChildren();

        if (palavrasEscolhidas.length === 0) {
            elementos.frase.classList.remove("mf-has-words");

            const aviso = document.createElement("p");

            aviso.className = "mf-sentence-placeholder";
            aviso.textContent =
                "Toque nas palavras abaixo para montar sua frase";

            elementos.frase.appendChild(aviso);
            return;
        }

        elementos.frase.classList.add("mf-has-words");

        palavrasEscolhidas.forEach(palavra => {
            const cartao = criarCartao(palavra, true);
            elementos.frase.appendChild(cartao);
        });
    }

    function renderizarOpcoes() {
        elementos.opcoes.replaceChildren();

        opcoesEmbaralhadas.forEach(palavra => {
            if (!palavraFoiUsada(palavra)) {
                const cartao = criarCartao(palavra, false);
                elementos.opcoes.appendChild(cartao);
            }
        });
    }

    function renderizarJogo() {
        const blocosNecessarios =
            frases[rodadaAtual].respostas[0].length;

        elementos.quantidadeBlocos.textContent =
            `${palavrasEscolhidas.length} de ${blocosNecessarios} blocos escolhidos`;

        renderizarFrase();
        renderizarOpcoes();
    }

    function limparFeedback() {
        elementos.feedback.textContent = "";
        elementos.feedback.className = "mf-feedback";
    }

    function desativarControles(desativar) {
        elementos.confirmar.disabled = desativar;
        elementos.limpar.disabled = desativar;
        elementos.ouvir.disabled = desativar;
    }

    function carregarRodada() {
        const rodada = frases[rodadaAtual];

        palavrasEscolhidas = [];
        opcoesEmbaralhadas = embaralhar(rodada.opcoes);
        rodadaConcluida = false;
        elementos.frase.classList.remove("activity-answer-correct");

        elementos.indicador.textContent =
            `Frase ${rodadaAtual + 1} de ${frases.length}`;

        elementos.instrucao.textContent = rodada.instrucao;

        desativarControles(false);
        limparFeedback();
        renderizarJogo();
    }

    function iniciarAtividade() {
        trocarTela("inicio", "carregamento", () => {
            palcoAtividade.classList.add("activity-stage-revealing");
        });

        clearTimeout(carregamentoId);

        carregamentoId = setTimeout(() => {
            rodadaAtual = 0;

            carregarRodada();
            trocarTela("carregamento", "jogo");
        }, TEMPO_CARREGAMENTO);
    }

    function limparFrase() {
        if (rodadaConcluida) {
            return;
        }

        palavrasEscolhidas = [];

        limparFeedback();
        renderizarJogo();
    }

    function confirmarFrase() {
        const respostas = frases[rodadaAtual].respostas;

        const estaCorreta = respostas.some(resposta =>
            palavrasEscolhidas.length === resposta.length &&
            palavrasEscolhidas.every(
                (palavra, indice) => palavra === resposta[indice]
            )
        );

        if (!estaCorreta) {
            elementos.feedback.textContent =
                "Quase! Tente organizar as palavras de outro jeito.";

            elementos.feedback.className =
                "mf-feedback mf-feedback-retry";

            return;
        }

        rodadaConcluida = true;

        desativarControles(true);
        elementos.frase.classList.add("activity-answer-correct");
        elementos.feedback.textContent = frases[rodadaAtual].parabens;
        elementos.feedback.className = "mf-feedback mf-feedback-correct";

        transicaoNivel.run(avancarRodadaAutomatico);
    }

    function avancarRodadaAutomatico() {
        rodadaAtual += 1;

        if (rodadaAtual < frases.length) {
            carregarRodada();
            elementos.opcoes.querySelector(".word-card")?.focus();
            return;
        }

        exibirConclusao();
    }

    function exibirConclusao() {
        desativarControles(false);

        elementos.resultado.textContent =
            `Você concluiu a atividade Monte a Frase e completou todas as ${frases.length} frases.`;

        trocarTela("jogo", "conclusao", () => {
            elementos.reiniciar.focus();
        });
    }

    function reiniciarAtividade() {
        clearTimeout(carregamentoId);
        transicaoNivel.cancel();
        window.speechSynthesis?.cancel();
        rodadaAtual = 0;
        palavrasEscolhidas = [];
        rodadaConcluida = false;
        elementos.frase.classList.remove("activity-answer-correct");
        palcoAtividade.classList.remove("activity-stage-revealing");

        trocarTela("conclusao", "inicio", () => {
            elementos.iniciar.focus();
        });
    }

    function ouvirFrase() {
        if (palavrasEscolhidas.length === 0) {
            elementos.ouvir.classList.remove("mf-listen-shake");

            void elementos.ouvir.offsetWidth;

            elementos.ouvir.classList.add("mf-listen-shake");

            elementos.feedback.textContent =
                "Escolha as palavras primeiro para ouvir a frase.";

            elementos.feedback.className =
                "mf-feedback mf-feedback-warn";

            return;
        }

        if (!("speechSynthesis" in window)) {
            elementos.feedback.textContent =
                "Seu navegador não conseguiu reproduzir a frase.";

            elementos.feedback.className =
                "mf-feedback mf-feedback-warn";

            return;
        }

        window.speechSynthesis.cancel();

        const fala = new SpeechSynthesisUtterance(
            palavrasEscolhidas.join(" ")
        );

        fala.lang = "pt-BR";

        window.speechSynthesis.speak(fala);
    }

    elementos.iniciar.addEventListener(
        "click",
        iniciarAtividade
    );

    elementos.limpar.addEventListener(
        "click",
        limparFrase
    );

    elementos.ouvir.addEventListener(
        "click",
        ouvirFrase
    );

    elementos.confirmar.addEventListener(
        "click",
        confirmarFrase
    );

    elementos.reiniciar.addEventListener(
        "click",
        reiniciarAtividade
    );

    window.addEventListener("pagehide", () => {
        clearTimeout(carregamentoId);
        transicaoNivel.cancel();
        window.speechSynthesis?.cancel();
    });

    telas.inicio.hidden = false;
    telas.carregamento.hidden = true;
    telas.jogo.hidden = true;
    telas.conclusao.hidden = true;
});
