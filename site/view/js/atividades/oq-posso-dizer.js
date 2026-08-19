document.addEventListener("DOMContentLoaded", () => {
    const TEMPO_CARREGAMENTO = 1400;
    const DURACAO_FADE_TELA = 220;
    const DURACAO_TRANSICAO_POPUP = 260;
    const TEMPO_EXIBICAO_POPUP = 2000;

    const fases = [
        {
            instrucao: "Teko chegou à escola e encontrou uma colega. O que ele pode dizer?",
            imagem: "/img/atv/oq-posso-dizer/fase1.png",
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
            imagem: "/img/atv/oq-posso-dizer/fase2.png",
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
            imagem: "/img/atv/oq-posso-dizer/fase3.png",
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
            imagem: "/img/atv/oq-posso-dizer/fase4.png",
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
            imagem: "/img/atv/oq-posso-dizer/fase5.png",
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
        popup: document.getElementById("opd-success-popup"),
        popupMensagem: document.getElementById("opd-success-message")
    };

    let faseAtual = 0;
    let fraseEscolhida = "";
    let opcoesEmbaralhadas = [];
    let faseConcluida = false;
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

    function criarOpcao(frase) {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = frase === fraseEscolhida
            ? "opd-option opd-selected"
            : "opd-option";

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

        limparFeedback();
        desativarControles(true);
        renderizarOpcoes();

        exibirPopupSucesso(
            fases[faseAtual].parabens
        );

        setTimeout(() => {
            esconderPopupSucesso(
                avancarFaseAutomatico
            );
        }, TEMPO_EXIBICAO_POPUP);
    }

    function avancarFaseAutomatico() {
        faseAtual += 1;

        if (faseAtual < fases.length) {
            carregarFase();
            return;
        }

        exibirConclusao();
    }

    function exibirConclusao() {
        desativarControles(false);

        elementos.resultado.textContent =
            "Você concluiu a atividade O que Posso Dizer e ajudou o Teko nas 5 situações.";

        trocarTela("jogo", "conclusao");
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

    function configurarNavegacao() {
        document.querySelectorAll("[data-nav]").forEach(link => {
            link.addEventListener("click", evento => {
                const destino = link.getAttribute("href");

                if (!destino || destino === "#") {
                    return;
                }

                evento.preventDefault();

                document.body.classList.add(
                    "page-leaving"
                );

                setTimeout(() => {
                    window.location.href = destino;
                }, 180);
            });
        });
    }

    function configurarMenuMobile() {
        const abrir = document.getElementById("mobile_btn");
        const fechar = document.getElementById("mobile_close");
        const menu = document.getElementById("mobile_drawer");
        const fundo = document.getElementById("mobile_overlay");

        function fecharMenu() {
            menu.classList.remove("active");
            fundo.classList.remove("active");
            document.body.style.overflow = "";
        }

        if (abrir) {
            abrir.addEventListener("click", () => {
                menu.classList.add("active");
                fundo.classList.add("active");
                document.body.style.overflow = "hidden";
            });
        }

        if (fechar) {
            fechar.addEventListener(
                "click",
                fecharMenu
            );
        }

        if (fundo) {
            fundo.addEventListener(
                "click",
                fecharMenu
            );
        }
    }

    function configurarLogout() {
        const fundo = document.getElementById(
            "logout-overlay"
        );

        const cancelar = document.getElementById(
            "logout-cancel"
        );

        const confirmar = document.getElementById(
            "logout-confirm"
        );

        function abrirLogout() {
            fundo.classList.add("active");
            fundo.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        }

        function fecharLogout() {
            fundo.classList.remove("active");
            fundo.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        }

        document
            .querySelectorAll("[data-logout-open]")
            .forEach(botao => {
                botao.addEventListener(
                    "click",
                    abrirLogout
                );
            });

        if (cancelar) {
            cancelar.addEventListener(
                "click",
                fecharLogout
            );
        }

        if (confirmar) {
            confirmar.addEventListener("click", () => {
                localStorage.removeItem("teko_session");
                localStorage.removeItem("teko_streak");

                window.location.href =
                    "/pages/login.html";
            });
        }

        if (fundo) {
            fundo.addEventListener("click", evento => {
                if (evento.target === fundo) {
                    fecharLogout();
                }
            });
        }

        document.addEventListener("keydown", evento => {
            if (evento.key === "Escape") {
                fecharLogout();
            }
        });
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

    configurarNavegacao();
    configurarMenuMobile();
    configurarLogout();

    telas.inicio.hidden = false;
    telas.carregamento.hidden = true;
    telas.jogo.hidden = true;
    telas.conclusao.hidden = true;
});