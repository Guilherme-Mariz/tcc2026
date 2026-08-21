document.addEventListener("DOMContentLoaded", () => {
    const TEMPO_CARREGAMENTO = 3000;
    const DURACAO_FADE_TELA = 220;

    const fases = [
        {
            instrucao: "Teko chegou à escola e encontrou uma colega. O que ele pode dizer?",
            imagem: "/img/atv/oq-posso-dizer/fase1.webp",
            descricaoImagem: "Teko chegando à escola e cumprimentando uma colega",
            resposta: "Oi! Bom dia!",
            opcoes: [
                "Oi! Bom dia!",
                "Tchau! Até amanhã!",
                "Pode me dar um lápis?",
                "Você pode sair daqui?"
            ],
            parabens: "Muito bem! Teko cumprimentou a colega de forma gentil."
        },
        {
            instrucao: "Uma colega emprestou um lápis ao Teko. O que ele pode dizer?",
            imagem: "/img/atv/oq-posso-dizer/fase2.webp",
            descricaoImagem: "Uma pessoa entregando um lápis ao Teko na sala de aula",
            resposta: "Obrigado por me emprestar!",
            opcoes: [
                "Pode abaixar o som?",
                "Obrigado por me emprestar!",
                "Eu não quero brincar.",
                "Que horas é o recreio?"
            ],
            parabens: "Ótimo! Teko agradeceu pela ajuda que recebeu."
        },
        {
            instrucao: "Teko quer brincar com as crianças no parque. O que ele pode dizer?",
            imagem: "/img/atv/oq-posso-dizer/fase3.webp",
            descricaoImagem: "Teko se aproximando de crianças que brincam com uma bola",
            resposta: "Posso brincar com vocês?",
            opcoes: [
                "Posso brincar com vocês?",
                "Até amanhã!",
                "Quero ficar sozinho agora.",
                "Onde está meu caderno?"
            ],
            parabens: "Muito bem! Teko pediu para participar da brincadeira."
        },
        {
            instrucao: "Teko recebeu um recado, mas não entendeu. O que ele pode dizer?",
            imagem: "/img/atv/oq-posso-dizer/fase4.webp",
            descricaoImagem: "Teko olhando para um recado com expressão de dúvida",
            resposta: "Não entendi. Pode explicar de novo?",
            opcoes: [
                "Obrigado pelo presente!",
                "Não entendi. Pode explicar de novo?",
                "Posso pegar a bola?",
                "Posso ir ao banheiro?"
            ],
            parabens: "Excelente! Teko pediu que explicassem novamente."
        },
        {
            instrucao: "Um barulho alto está incomodando o Teko. O que ele pode dizer?",
            imagem: "/img/atv/oq-posso-dizer/fase5.webp",
            descricaoImagem: "Teko cobrindo os ouvidos por causa de um barulho alto",
            resposta: "O som está muito alto. Pode abaixar, por favor?",
            opcoes: [
                "Posso brincar com vocês?",
                "Fale ainda mais alto!",
                "O som está muito alto. Pode abaixar, por favor?",
                "Obrigado pelo lápis!"
            ],
            parabens: "Parabéns! Teko explicou o que estava incomodando e pediu ajuda."
        }
    ];

    const telas = {
        inicio: document.getElementById("opd-intro"),
        carregamento: document.getElementById("opd-loading"),
        jogo: document.getElementById("opd-game"),
        conclusao: document.getElementById("opd-done")
    };

    const palcoAtividade = document.getElementById("activity-stage");

    const elementos = {
        iniciar: document.getElementById("opd-start-btn"),
        indicador: document.getElementById("opd-round-indicator"),
        instrucao: document.getElementById("opd-instruction"),
        imagem: document.getElementById("opd-scene-image"),
        opcoes: document.getElementById("opd-options-area"),
        feedback: document.getElementById("opd-feedback"),
        limpar: document.getElementById("opd-clear-btn"),
        ouvir: document.getElementById("opd-listen-btn"),
        confirmar: document.getElementById("opd-confirm-btn"),
        resultado: document.getElementById("opd-done-text"),
        reiniciar: document.getElementById("opd-play-again-btn")
    };

    let faseAtual = 0;
    let fraseEscolhida = "";
    let opcoesEmbaralhadas = [];
    let faseConcluida = false;
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

    function criarOpcao(frase) {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = frase === fraseEscolhida
            ? "opd-option opd-selected"
            : "opd-option";

        if (
            faseConcluida &&
            frase === fases[faseAtual].resposta
        ) {
            botao.classList.add("activity-answer-correct");
        }

        botao.textContent = frase;
        botao.disabled = faseConcluida;

        botao.setAttribute(
            "aria-pressed",
            String(frase === fraseEscolhida)
        );

        botao.addEventListener("click", () => {
            if (faseConcluida) {
                return;
            }

            fraseEscolhida = frase;

            limparFeedback();
            renderizarOpcoes();
        });

        return botao;
    }

    function renderizarOpcoes() {
        elementos.opcoes.replaceChildren();

        opcoesEmbaralhadas.forEach(frase => {
            elementos.opcoes.appendChild(
                criarOpcao(frase)
            );
        });
    }

    function limparFeedback() {
        elementos.feedback.textContent = "";
        elementos.feedback.className = "opd-feedback";
    }

    function desativarControles(desativar) {
        elementos.confirmar.disabled = desativar;
        elementos.limpar.disabled = desativar;
        elementos.ouvir.disabled = desativar;
    }

    function carregarFase() {
        const fase = fases[faseAtual];

        fraseEscolhida = "";
        opcoesEmbaralhadas = embaralhar(fase.opcoes);
        faseConcluida = false;

        elementos.indicador.textContent =
            `Fase ${faseAtual + 1} de ${fases.length}`;

        elementos.instrucao.textContent = fase.instrucao;
        elementos.imagem.src = fase.imagem;
        elementos.imagem.alt = fase.descricaoImagem;

        desativarControles(false);
        limparFeedback();
        renderizarOpcoes();
    }

    function iniciarAtividade() {
        trocarTela("inicio", "carregamento", () => {
            palcoAtividade.classList.add(
                "activity-stage-revealing"
            );
        });

        clearTimeout(carregamentoId);

        carregamentoId = setTimeout(() => {
            faseAtual = 0;

            carregarFase();
            trocarTela("carregamento", "jogo");
        }, TEMPO_CARREGAMENTO);
    }

    function limparEscolha() {
        if (faseConcluida) {
            return;
        }

        fraseEscolhida = "";

        limparFeedback();
        renderizarOpcoes();
    }

    function confirmarResposta() {
        if (!fraseEscolhida) {
            elementos.feedback.textContent =
                "Escolha uma frase antes de confirmar.";

            elementos.feedback.className =
                "opd-feedback opd-feedback-warn";

            return;
        }

        if (fraseEscolhida !== fases[faseAtual].resposta) {
            elementos.feedback.textContent =
                "Quase! Observe a situação e tente outra frase.";

            elementos.feedback.className =
                "opd-feedback opd-feedback-retry";

            return;
        }

        faseConcluida = true;

        desativarControles(true);
        elementos.feedback.textContent = fases[faseAtual].parabens;
        elementos.feedback.className = "opd-feedback opd-feedback-correct";
        renderizarOpcoes();

        transicaoNivel.run(avancarFaseAutomatico);
    }

    function avancarFaseAutomatico() {
        faseAtual += 1;

        if (faseAtual < fases.length) {
            carregarFase();
            elementos.opcoes.querySelector(".opd-option")?.focus();
            return;
        }

        exibirConclusao();
    }

    function exibirConclusao() {
        desativarControles(false);

        elementos.resultado.textContent =
            "Você concluiu a atividade O que Posso Dizer e ajudou o Teko nas 5 situações.";

        trocarTela("jogo", "conclusao", () => {
            elementos.reiniciar.focus();
        });
    }

    function reiniciarAtividade() {
        clearTimeout(carregamentoId);
        transicaoNivel.cancel();
        window.speechSynthesis?.cancel();
        faseAtual = 0;
        fraseEscolhida = "";
        faseConcluida = false;
        palcoAtividade.classList.remove("activity-stage-revealing");

        trocarTela("conclusao", "inicio", () => {
            elementos.iniciar.focus();
        });
    }

    function ouvirFrase() {
        if (!fraseEscolhida) {
            elementos.ouvir.classList.remove(
                "opd-listen-shake"
            );

            void elementos.ouvir.offsetWidth;

            elementos.ouvir.classList.add(
                "opd-listen-shake"
            );

            elementos.feedback.textContent =
                "Escolha uma frase primeiro para ouvi-la.";

            elementos.feedback.className =
                "opd-feedback opd-feedback-warn";

            return;
        }

        if (!("speechSynthesis" in window)) {
            elementos.feedback.textContent =
                "Seu navegador não conseguiu reproduzir a frase.";

            elementos.feedback.className =
                "opd-feedback opd-feedback-warn";

            return;
        }

        window.speechSynthesis.cancel();

        const fala = new SpeechSynthesisUtterance(
            fraseEscolhida
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
        limparEscolha
    );

    elementos.ouvir.addEventListener(
        "click",
        ouvirFrase
    );

    elementos.confirmar.addEventListener(
        "click",
        confirmarResposta
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