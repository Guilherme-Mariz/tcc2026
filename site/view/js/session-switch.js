document.addEventListener("DOMContentLoaded", () => {
    if (window.__tekoSessionSwitchInitialized) {
        return;
    }

    window.__tekoSessionSwitchInitialized = true;

    const botaoAbrir =
        document.getElementById("session-switch-button");

    const botaoAbrirMobile =
        document.getElementById("drawer-session-switch");

    const overlay =
        document.getElementById("session-switch-overlay");

    const modal =
        document.querySelector(".session-switch-modal");

    const botaoFechar =
        document.getElementById("session-switch-close");

    const botaoCancelar =
        document.getElementById("session-switch-cancel");

    const botaoConfirmar =
        document.getElementById("session-switch-confirm");

    const botaoMostrarSenha =
        document.getElementById("session-password-toggle");

    const inputSenha =
        document.getElementById("session-password");

    const mensagemErro =
        document.getElementById("session-switch-error");

    const opcoes =
        document.getElementById("home-session-options");

    if (
        !botaoAbrir ||
        !overlay ||
        !modal ||
        !botaoFechar ||
        !botaoCancelar ||
        !botaoConfirmar ||
        !botaoMostrarSenha ||
        !inputSenha ||
        !mensagemErro ||
        !opcoes
    ) {
        return;
    }

    let criancasDisponiveis = [
        {
            id: "crianca-frontend",
            nome: "Criança"
        }
    ];

    let criancaSelecionada = null;

    carregarCriancas();

    botaoAbrir.addEventListener("click", abrirModal);

    if (botaoAbrirMobile) {
        botaoAbrirMobile.addEventListener("click", () => {
            fecharMenuMobile();
            abrirModal();
        });
    }

    botaoFechar.addEventListener("click", fecharModal);
    botaoCancelar.addEventListener("click", fecharModal);
    botaoConfirmar.addEventListener("click", confirmarTroca);

    botaoMostrarSenha.addEventListener(
        "click",
        alternarVisibilidadeSenha
    );

    overlay.addEventListener("click", evento => {
        if (!modal.contains(evento.target)) {
            fecharModal();
        }
    });

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape") {
            fecharModal();
        }
    });

    async function carregarCriancas() {
        try {
            const resposta = await fetch("/children", {
                credentials: "include"
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.error ||
                    resultado.erro ||
                    "Erro ao buscar crianças"
                );
            }

            const lista =
                resultado.children ||
                resultado.criancas ||
                resultado;

            const criancasRecebidas = Array.isArray(lista)
                ? lista
                : [lista];

            const criancasValidas =
                criancasRecebidas.filter(crianca => {
                    return (
                        crianca &&
                        obterNomeCrianca(crianca)
                    );
                });

            if (criancasValidas.length > 0) {
                criancasDisponiveis = criancasValidas;
            }

            renderizarOpcoes();
        } catch (erro) {
            console.error(
                "Erro ao carregar crianças:",
                erro
            );

            renderizarOpcoes();
        }
    }

    function obterNomeCrianca(crianca) {
        return (
            crianca?.nome ||
            crianca?.nome_completo ||
            crianca?.firstName ||
            crianca?.nomeCrianca ||
            ""
        );
    }

    function abrirModal() {
        inputSenha.value = "";
        mensagemErro.textContent = "";

        renderizarOpcoes();

        overlay.classList.add("active");
        overlay.setAttribute("aria-hidden", "false");

        setTimeout(() => {
            inputSenha.focus();
        }, 250);
    }

    function fecharModal() {
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");

        inputSenha.value = "";
        mensagemErro.textContent = "";
    }

    function fecharMenuMobile() {
        document
            .getElementById("mobile_drawer")
            ?.classList.remove("active");

        document
            .getElementById("mobile_overlay")
            ?.classList.remove("active");
    }

    function renderizarOpcoes() {
        opcoes.replaceChildren();

        criancaSelecionada = null;

        criancasDisponiveis.forEach(
            (crianca, indice) => {
                const botao =
                    document.createElement("button");

                const avatar =
                    document.createElement("span");

                const icone =
                    document.createElement("i");

                const nome =
                    document.createElement("span");

                botao.type = "button";
                botao.className = "home-session-option";
                botao.setAttribute(
                    "aria-pressed",
                    "false"
                );

                avatar.className =
                    "home-session-avatar";

                icone.className =
                    "fa-solid fa-child";

                nome.className =
                    "home-session-name";

                nome.textContent =
                    obterNomeCrianca(crianca) ||
                    `Criança ${indice + 1}`;

                avatar.appendChild(icone);
                botao.append(avatar, nome);

                botao.addEventListener("click", () => {
                    selecionarCrianca(
                        botao,
                        crianca
                    );
                });

                opcoes.appendChild(botao);

                if (indice === 0) {
                    selecionarCrianca(
                        botao,
                        crianca
                    );
                }
            }
        );
    }

    function selecionarCrianca(botao, crianca) {
        opcoes
            .querySelectorAll(".home-session-option")
            .forEach(opcao => {
                opcao.classList.remove("selected");

                opcao.setAttribute(
                    "aria-pressed",
                    "false"
                );
            });

        botao.classList.add("selected");

        botao.setAttribute(
            "aria-pressed",
            "true"
        );

        criancaSelecionada = crianca;
        mensagemErro.textContent = "";
    }

    function alternarVisibilidadeSenha() {
        const mostrandoSenha =
            inputSenha.type === "text";

        const icone =
            botaoMostrarSenha.querySelector("i");

        inputSenha.type = mostrandoSenha
            ? "password"
            : "text";

        icone.className = mostrandoSenha
            ? "fa-solid fa-eye"
            : "fa-solid fa-eye-slash";

        botaoMostrarSenha.setAttribute(
            "aria-label",
            mostrandoSenha
                ? "Mostrar senha"
                : "Ocultar senha"
        );
    }

    function confirmarTroca() {
        if (!criancaSelecionada) {
            mensagemErro.textContent =
                "Escolha uma criança.";

            return;
        }

        if (!inputSenha.value.trim()) {
            mensagemErro.textContent =
                "Digite a senha do responsável.";

            inputSenha.focus();

            return;
        }

        mensagemErro.textContent = "";

        /*
            Backend depois:
            validar a senha do responsável,
            salvar a criança escolhida como sessão ativa
            e atualizar a página atual.
        */
    }
});