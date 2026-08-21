document.addEventListener("DOMContentLoaded", () => {
    const TEMPO_CARREGAMENTO = 1400;
    const DURACAO_FADE_TELA = 220;
    const DURACAO_TRANSICAO_POPUP = 260;
    const TEMPO_EXIBICAO_POPUP = 2000;

    const frases = [
        {
            instrucao: "Monte uma frase para pedir água.",
            resposta: ["Eu quero", "água"],
            opcoes: ["água", "brincar", "Eu quero", "não"],
            parabens: "Muito bem! Você montou uma frase para pedir água."
        },
        {
            instrucao: "Monte uma frase para pedir ajuda.",
            resposta: ["Eu preciso", "de ajuda"],
            opcoes: ["de ajuda", "Eu preciso", "brincar", "água"],
            parabens: "Ótimo trabalho! Você mostrou como pedir ajuda."
        },
        {
            instrucao: "Monte uma frase para dizer que quer brincar.",
            resposta: ["Eu quero", "brincar"],
            opcoes: ["parar", "brincar", "Eu quero", "de ajuda"],
            parabens: "Que legal! Você disse que quer brincar."
        },
        {
            instrucao: "Monte uma frase para pedir que algo pare.",
            resposta: ["Eu quero", "parar"],
            opcoes: ["Eu quero", "ler", "parar", "água"],
            parabens: "Muito bem! Você conseguiu pedir para parar."
        },
        {
            instrucao: "Monte uma frase sobre algo que você gosta.",
            resposta: ["Eu gosto", "de ler"],
            opcoes: ["de ler", "Eu gosto", "parar", "brincar"],
            parabens: "Parabéns! Você contou que gosta de ler."
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
        instrucao: document.getElementById("mf-instruction"),
        frase: document.getElementById("mf-sentence-area"),
        opcoes: document.getElementById("mf-options-area"),
        feedback: document.getElementById("mf-feedback"),
        limpar: document.getElementById("mf-clear-btn"),
        ouvir: document.getElementById("mf-listen-btn"),
        confirmar: document.getElementById("mf-confirm-btn"),
        resultado: document.getElementById("mf-done-text"),
        popup: document.getElementById("mf-success-popup"),
        popupMensagem: document.getElementById("mf-success-message")
    };

    let rodadaAtual = 0;
    let palavrasEscolhidas = [];
    let opcoesEmbaralhadas = [];
    let rodadaConcluida = false;
    let carregamentoId;

    function trocarTela(nomeAtual, nomeNovo, aoEntrar) {
        function exibirNova() {
            Object.keys(telas).forEach(chave => {
                if (chave !== nomeNovo) {
                    telas[chave].hidden = true;
                    telas[chave].classList.remove("activity-screen-fade-out");
                    telas[chave].classList.remove("activity-screen-fade-in");
                }
            });

            const telaNova = telas[nomeNovo];

            telaNova.classList.add("activity-screen-fade-in");
            telaNova.hidden = false;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    telaNova.classList.remove("activity-screen-fade-in");
                });
            });

            const atividadeIniciada =
                nomeNovo === "jogo" || nomeNovo === "conclusao";

            palcoAtividade.classList.toggle(
                "activity-stage-active",
                atividadeIniciada
            );

            if (typeof aoEntrar === "function") {
                aoEntrar();
            }
        }

        const telaAtual = telas[nomeAtual];

        if (telaAtual && !telaAtual.hidden) {
            telaAtual.classList.add("activity-screen-fade-out");

            setTimeout(exibirNova, DURACAO_FADE_TELA);
            return;
        }

        exibirNova();
    }

    function embaralhar(lista) {
        const copia = [...lista];

        for (let i = copia.length - 1; i > 0; i--) {
            const indice = Math.floor(Math.random() * (i + 1));

            [copia[i], copia[indice]] = [
                copia[indice],
                copia[i]
            ];
        }

        return copia;
    }

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

    function exibirPopupSucesso(mensagem) {
        elementos.popupMensagem.textContent = mensagem;
        elementos.popup.hidden = false;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                elementos.popup.classList.add(
                    "activity-success-popup-visible"
                );
            });
        });
    }

    function esconderPopupSucesso(aoFinalizar) {
        elementos.popup.classList.remove(
            "activity-success-popup-visible"
        );

        setTimeout(() => {
            elementos.popup.hidden = true;

            if (typeof aoFinalizar === "function") {
                aoFinalizar();
            }
        }, DURACAO_TRANSICAO_POPUP);
    }

    function confirmarFrase() {
        const resposta = frases[rodadaAtual].resposta;

        const estaCorreta =
            palavrasEscolhidas.length === resposta.length &&
            palavrasEscolhidas.every(
                (palavra, indice) => palavra === resposta[indice]
            );

        if (!estaCorreta) {
            elementos.feedback.textContent =
                "Quase! Tente organizar as palavras de outro jeito.";

            elementos.feedback.className =
                "mf-feedback mf-feedback-retry";

            return;
        }

        rodadaConcluida = true;

        limparFeedback();
        desativarControles(true);

        exibirPopupSucesso(frases[rodadaAtual].parabens);

        setTimeout(() => {
            esconderPopupSucesso(avancarRodadaAutomatico);
        }, TEMPO_EXIBICAO_POPUP);
    }

    function avancarRodadaAutomatico() {
        rodadaAtual += 1;

        if (rodadaAtual < frases.length) {
            carregarRodada();
            return;
        }

        exibirConclusao();
    }

    function exibirConclusao() {
        desativarControles(false);

        elementos.resultado.textContent =
            "Você concluiu a atividade Monte a Frase e completou todas as 5 frases.";

        trocarTela("jogo", "conclusao");
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
    telas.inicio.hidden = false;
    telas.carregamento.hidden = true;
    telas.jogo.hidden = true;
    telas.conclusao.hidden = true;
});