document.addEventListener("DOMContentLoaded", () => {
    const frases = [
        {
            instrucao: "Monte uma frase para pedir água.",
            resposta: ["Eu quero", "água"],
            opcoes: ["água", "brincar", "Eu quero", "não"]
        },
        {
            instrucao: "Monte uma frase para pedir ajuda.",
            resposta: ["Eu preciso", "de ajuda"],
            opcoes: ["de ajuda", "Eu preciso", "brincar", "água"]
        },
        {
            instrucao: "Monte uma frase para dizer que quer brincar.",
            resposta: ["Eu quero", "brincar"],
            opcoes: ["parar", "brincar", "Eu quero", "de ajuda"]
        },
        {
            instrucao: "Monte uma frase para pedir que algo pare.",
            resposta: ["Eu quero", "parar"],
            opcoes: ["Eu quero", "ler", "parar", "água"]
        },
        {
            instrucao: "Monte uma frase sobre algo que você gosta.",
            resposta: ["Eu gosto", "de ler"],
            opcoes: ["de ler", "Eu gosto", "parar", "brincar"]
        }
    ];

    const telas = {
        inicio: document.getElementById("mf-intro"),
        carregamento: document.getElementById("mf-loading"),
        jogo: document.getElementById("mf-game"),
        conclusao: document.getElementById("mf-done")
    };

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
        proxima: document.getElementById("mf-next-btn"),
        resultado: document.getElementById("mf-done-text"),
        recomecar: document.getElementById("mf-replay-btn")
    };

    let rodadaAtual = 0;
    let palavrasEscolhidas = [];
    let opcoesEmbaralhadas = [];
    let rodadaConcluida = false;
    let carregamentoId;

    function mostrarTela(nome) {
        Object.entries(telas).forEach(([chave, tela]) => {
            tela.hidden = chave !== nome;
        });
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

    function carregarRodada() {
        const rodada = frases[rodadaAtual];

        palavrasEscolhidas = [];
        opcoesEmbaralhadas = embaralhar(rodada.opcoes);
        rodadaConcluida = false;

        elementos.indicador.textContent =
            `Frase ${rodadaAtual + 1} de ${frases.length}`;

        elementos.instrucao.textContent = rodada.instrucao;

        elementos.confirmar.hidden = false;
        elementos.confirmar.disabled = false;
        elementos.proxima.hidden = true;

        limparFeedback();
        renderizarJogo();
    }

    function iniciarAtividade() {
        mostrarTela("carregamento");
        clearTimeout(carregamentoId);

        carregamentoId = setTimeout(() => {
            rodadaAtual = 0;

            carregarRodada();
            mostrarTela("jogo");
        }, 1500);
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

        elementos.feedback.textContent =
            "Muito bem! Você mostrou o que queria dizer.";

        elementos.feedback.className =
            "mf-feedback mf-feedback-correct";

        elementos.confirmar.hidden = true;
        elementos.proxima.hidden = false;
        elementos.proxima.focus();
    }

    function avancarRodada() {
        rodadaAtual += 1;

        if (rodadaAtual < frases.length) {
            carregarRodada();
            return;
        }

        elementos.resultado.textContent =
            `Você completou ${frases.length} de ${frases.length} frases.`;

        mostrarTela("conclusao");
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

    function recomecarAtividade() {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        rodadaAtual = 0;
        palavrasEscolhidas = [];

        mostrarTela("inicio");
    }

    function configurarNavegacao() {
        const links = document.querySelectorAll("[data-nav]");

        links.forEach(link => {
            link.addEventListener("click", evento => {
                const destino = link.getAttribute("href");

                if (!destino || destino === "#") {
                    return;
                }

                evento.preventDefault();

                document.body.classList.add("page-leaving");

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
            fechar.addEventListener("click", fecharMenu);
        }

        if (fundo) {
            fundo.addEventListener("click", fecharMenu);
        }
    }

    function configurarLogout() {
        const fundo = document.getElementById("logout-overlay");
        const cancelar = document.getElementById("logout-cancel");
        const confirmar = document.getElementById("logout-confirm");

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

        const botoesAbrir = document.querySelectorAll(
            "[data-logout-open]"
        );

        botoesAbrir.forEach(botao => {
            botao.addEventListener("click", abrirLogout);
        });

        if (cancelar) {
            cancelar.addEventListener("click", fecharLogout);
        }

        if (confirmar) {
            confirmar.addEventListener("click", () => {
                localStorage.removeItem("teko_session");
                localStorage.removeItem("teko_streak");

                window.location.href = "/pages/login.html";
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

    elementos.proxima.addEventListener(
        "click",
        avancarRodada
    );

    elementos.recomecar.addEventListener(
        "click",
        recomecarAtividade
    );

    configurarNavegacao();
    configurarMenuMobile();
    configurarLogout();
    mostrarTela("inicio");
});