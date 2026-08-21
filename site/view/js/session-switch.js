document.addEventListener("DOMContentLoaded", () => {
    if (window.__tekoSessionSwitchInitialized) return;

    window.__tekoSessionSwitchInitialized = true;

    garantirInterface();
    adaptarInterfaceParaPin();

    const elementos = {
        abrir: document.getElementById("session-switch-button"),
        abrirMobile: document.getElementById("drawer-session-switch"),
        overlay: document.getElementById("session-switch-overlay"),
        modal: document.querySelector(".session-switch-modal"),
        fechar: document.getElementById("session-switch-close"),
        cancelar: document.getElementById("session-switch-cancel"),
        confirmar: document.getElementById("session-switch-confirm"),
        mostrarPin: document.getElementById("session-password-toggle"),
        pin: document.getElementById("session-password"),
        erro: document.getElementById("session-switch-error"),
        opcoes: document.getElementById("home-session-options")
    };

    if (Object.values(elementos).some(elemento => !elemento)) return;

    let criancasDisponiveis = [];
    let criancaSelecionada = null;
    let selecaoInicial = false;

    carregarCriancas().then(() => {
        const deveIniciar =
            sessionStorage.getItem("teko_iniciar_sessao") === "true";

        if (deveIniciar) {
            sessionStorage.removeItem("teko_iniciar_sessao");
            abrirModal(true);
        }
    });

    elementos.abrir.addEventListener("click", () => abrirModal(false));

    elementos.abrirMobile.addEventListener("click", () => {
        fecharMenuMobile();
        abrirModal();
    });

    elementos.fechar.addEventListener("click", () => fecharModal());
    elementos.cancelar.addEventListener("click", () => fecharModal());
    elementos.confirmar.addEventListener("click", confirmarTroca);
    elementos.mostrarPin.addEventListener("click", alternarPin);

    elementos.pin.addEventListener("input", () => {
        elementos.pin.value = elementos.pin.value
            .replace(/\D/g, "")
            .slice(0, 4);

        elementos.erro.textContent = "";
    });

    elementos.pin.addEventListener("keydown", evento => {
        if (evento.key === "Enter") {
            confirmarTroca();
        }
    });

    elementos.overlay.addEventListener("click", evento => {
        if (!elementos.modal.contains(evento.target)) {
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

            const recebidas = Array.isArray(lista)
                ? lista
                : [lista];

            criancasDisponiveis = recebidas.filter(
                crianca => crianca && obterNome(crianca)
            );

            renderizarOpcoes();
        } catch (erro) {
            console.error("Erro ao carregar crianças:", erro);

            const cadastradas = obterCriancasLocais();

            criancasDisponiveis = cadastradas;
            renderizarOpcoes();

            if (cadastradas.length === 0) {
                elementos.erro.textContent =
                    "Não foi possível carregar as crianças.";
            }
        }
    }

    function obterCriancasLocais() {
        try {
            const lista = JSON.parse(
                localStorage.getItem("teko_registered_children") || "[]"
            );

            return Array.isArray(lista)
                ? lista.filter(crianca => crianca && obterNome(crianca))
                : [];
        } catch (erro) {
            return [];
        }
    }

    function obterNome(crianca) {
        return (
            crianca?.nome ||
            crianca?.nome_completo ||
            crianca?.firstName ||
            crianca?.nomeCrianca ||
            ""
        );
    }

    function obterId(crianca) {
        return (
            crianca?.id ||
            crianca?.crianca_id ||
            crianca?.child_id ||
            obterNome(crianca)
        );
    }

    function obterCriancaAtiva() {
        try {
            const sessao = JSON.parse(
                localStorage.getItem("teko_session") || "{}"
            );

            return sessao?.crianca || null;
        } catch (erro) {
            return null;
        }
    }

    function obterPinCadastrado() {
        const pinLocal = localStorage.getItem("teko_access_pin");

        if (/^\d{4}$/.test(pinLocal || "")) {
            return pinLocal;
        }

        try {
            const sessao = JSON.parse(
                localStorage.getItem("teko_session") || "{}"
            );

            const pinSessao = String(
                sessao?.responsavel?.pin || ""
            );

            return /^\d{4}$/.test(pinSessao)
                ? pinSessao
                : "";
        } catch (erro) {
            return "";
        }
    }

    function salvarCriancaAtiva(crianca) {
        let sessao = {};

        try {
            sessao = JSON.parse(
                localStorage.getItem("teko_session") || "{}"
            );
        } catch (erro) {
            sessao = {};
        }

        sessao.crianca = {
            ...crianca,
            id: obterId(crianca),
            nome: obterNome(crianca)
        };

        localStorage.setItem(
            "teko_session",
            JSON.stringify(sessao)
        );
    }

    function abrirModal(modoInicial = false) {
        selecaoInicial = Boolean(modoInicial);

        const campoPin = document.querySelector(".session-password-field");
        const titulo = document.getElementById("session-switch-title");
        const descricao = document.querySelector(".session-switch-description");

        elementos.pin.value = "";
        elementos.pin.type = "password";
        elementos.erro.textContent = "";
        elementos.mostrarPin.querySelector("i").className =
            "fa-solid fa-eye";

        if (campoPin) campoPin.hidden = selecaoInicial;
        elementos.fechar.hidden = selecaoInicial;
        elementos.cancelar.hidden = selecaoInicial;
        elementos.confirmar.textContent = selecaoInicial
            ? "Iniciar sessão"
            : "Confirmar troca";

        if (titulo) {
            titulo.textContent = selecaoInicial
                ? "Quem vai usar o teko.?"
                : "Trocar sessão";
        }

        if (descricao) {
            descricao.textContent = selecaoInicial
                ? "Escolha a criança para começar."
                : "Escolha a criança que usará a plataforma.";
        }

        renderizarOpcoes();

        elementos.overlay.classList.add("active");
        elementos.overlay.setAttribute("aria-hidden", "false");

        if (!selecaoInicial) {
            setTimeout(() => elementos.pin.focus(), 250);
        }
    }

    function fecharModal(forcar = false) {
        if (selecaoInicial && !forcar) return;

        elementos.overlay.classList.remove("active");
        elementos.overlay.setAttribute("aria-hidden", "true");
        elementos.pin.value = "";
        elementos.erro.textContent = "";
    }

    function fecharMenuMobile() {
        document
            .getElementById("mobile_drawer")
            ?.classList.remove("active");

        document
            .getElementById("mobile_overlay")
            ?.classList.remove("active");

        document.body.style.overflow = "";
    }

    function renderizarOpcoes() {
        elementos.opcoes.replaceChildren();
        criancaSelecionada = null;

        if (criancasDisponiveis.length === 0) {
            const aviso = document.createElement("p");

            aviso.className = "session-switch-empty";
            aviso.textContent = "Nenhuma criança cadastrada.";

            elementos.opcoes.appendChild(aviso);
            return;
        }

        const idAtivo = obterId(obterCriancaAtiva());

        criancasDisponiveis.forEach((crianca, indice) => {
            const botao = document.createElement("button");
            const avatar = document.createElement("span");
            const icone = document.createElement("i");
            const nome = document.createElement("span");

            botao.type = "button";
            botao.className = "home-session-option";
            botao.setAttribute("aria-pressed", "false");

            avatar.className = "home-session-avatar";
            icone.className = "fa-solid fa-child";
            nome.className = "home-session-name";
            nome.textContent =
                obterNome(crianca) || `Criança ${indice + 1}`;

            avatar.appendChild(icone);
            botao.append(avatar, nome);

            botao.addEventListener("click", () => {
                selecionar(botao, crianca);
            });

            elementos.opcoes.appendChild(botao);

            const deveSelecionar = idAtivo
                ? obterId(crianca) === idAtivo
                : indice === 0;

            if (deveSelecionar) {
                selecionar(botao, crianca);
            }
        });
    }

    function selecionar(botao, crianca) {
        elementos.opcoes
            .querySelectorAll(".home-session-option")
            .forEach(opcao => {
                opcao.classList.remove("selected");
                opcao.setAttribute("aria-pressed", "false");
            });

        botao.classList.add("selected");
        botao.setAttribute("aria-pressed", "true");

        criancaSelecionada = crianca;
        elementos.erro.textContent = "";
    }

    function alternarPin() {
        const mostrando = elementos.pin.type === "text";
        const icone = elementos.mostrarPin.querySelector("i");

        elementos.pin.type = mostrando
            ? "password"
            : "text";

        icone.className = mostrando
            ? "fa-solid fa-eye"
            : "fa-solid fa-eye-slash";

        elementos.mostrarPin.setAttribute(
            "aria-label",
            mostrando ? "Mostrar PIN" : "Ocultar PIN"
        );
    }

    function confirmarTroca() {
        if (!criancaSelecionada) {
            elementos.erro.textContent = "Escolha uma criança.";
            return;
        }

        if (!selecaoInicial) {
            const pinDigitado = elementos.pin.value.trim();

            if (!/^\d{4}$/.test(pinDigitado)) {
                elementos.erro.textContent =
                    "Digite o PIN de 4 números.";

                elementos.pin.focus();
                return;
            }

            const pinCadastrado = obterPinCadastrado();

            if (!pinCadastrado) {
                elementos.erro.textContent =
                    "Nenhum PIN foi configurado para esta conta.";
                return;
            }

            if (pinDigitado !== pinCadastrado) {
                elementos.erro.textContent =
                    "PIN incorreto. Tente novamente.";

                elementos.pin.value = "";
                elementos.pin.focus();
                return;
            }
        }

        salvarCriancaAtiva(criancaSelecionada);

        window.dispatchEvent(
            new CustomEvent("teko:session-changed", {
                detail: { child: criancaSelecionada }
            })
        );

        selecaoInicial = false;
        fecharModal(true);
        window.location.reload();
    }

    function adaptarInterfaceParaPin() {
        const campo = document.querySelector(
            ".session-password-field"
        );

        const rotulo = campo?.querySelector("label");
        const input = document.getElementById("session-password");
        const botao = document.getElementById(
            "session-password-toggle"
        );

        if (rotulo) {
            rotulo.textContent = "PIN do responsável";
        }

        if (input) {
            input.placeholder = "Digite o PIN de 4 números";
            input.inputMode = "numeric";
            input.maxLength = 4;
            input.pattern = "[0-9]{4}";
            input.autocomplete = "off";
            input.setAttribute("aria-label", "PIN de 4 números");
        }

        if (botao) {
            botao.setAttribute("aria-label", "Mostrar PIN");
        }
    }

    function garantirInterface() {
        if (!document.getElementById("session-switch-overlay")) {
            document.body.insertAdjacentHTML(
                "afterbegin",
                `
                    <div id="session-switch-overlay" class="session-switch-overlay" aria-hidden="true">
                        <div class="session-switch-modal" role="dialog" aria-modal="true" aria-labelledby="session-switch-title">
                            <button type="button" class="session-switch-close" id="session-switch-close" aria-label="Fechar">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                            <div class="session-switch-icon" aria-hidden="true">
                                <i class="fa-solid fa-repeat"></i>
                            </div>
                            <h2 id="session-switch-title">Trocar sessão</h2>
                            <p class="session-switch-description">Escolha a criança que usará a plataforma.</p>
                            <div class="home-session-options" id="home-session-options"></div>
                            <div class="session-password-field">
                                <label for="session-password">PIN do responsável</label>
                                <div class="session-password-wrap">
                                    <i class="fa-solid fa-key" aria-hidden="true"></i>
                                    <input type="password" id="session-password" placeholder="Digite o PIN de 4 números" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" autocomplete="off" aria-label="PIN de 4 números">
                                    <button type="button" id="session-password-toggle" aria-label="Mostrar PIN">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                </div>
                                <span class="session-switch-error" id="session-switch-error" aria-live="polite"></span>
                            </div>
                            <div class="session-switch-actions">
                                <button type="button" class="session-switch-cancel" id="session-switch-cancel">Cancelar</button>
                                <button type="button" class="session-switch-confirm" id="session-switch-confirm">Confirmar troca</button>
                            </div>
                        </div>
                    </div>
                `
            );
        }

        const rodape = document.querySelector(".sidebar-bottom");

        if (
            rodape &&
            !document.getElementById("session-switch-button")
        ) {
            const configuracoes =
                rodape.querySelector(".snav-config");

            const botao = document.createElement("button");
            const divisor = document.createElement("span");

            botao.type = "button";
            botao.className =
                "snav-item session-switch-button";
            botao.id = "session-switch-button";
            botao.innerHTML = `
                <span class="snav-icon">
                    <i class="fa-solid fa-repeat"></i>
                </span>
                <span class="snav-label">Trocar sessão</span>
            `;

            divisor.className = "sidebar-divider";
            divisor.setAttribute("aria-hidden", "true");

            rodape.insertBefore(botao, configuracoes);
            rodape.insertBefore(divisor, configuracoes);
        }

        const menuMobile =
            document.querySelector(".drawer-nav");

        if (
            menuMobile &&
            !document.getElementById("drawer-session-switch")
        ) {
            const configuracoes = menuMobile.querySelector(
                'a[href="/configuracoes"]'
            );

            const botao = document.createElement("button");

            botao.type = "button";
            botao.className =
                "snav-item drawer-session-switch";
            botao.id = "drawer-session-switch";
            botao.innerHTML = `
                <span class="snav-icon">
                    <i class="fa-solid fa-repeat"></i>
                </span>
                <span class="snav-label">Trocar sessão</span>
            `;

            menuMobile.insertBefore(botao, configuracoes);
        }
    }
});
