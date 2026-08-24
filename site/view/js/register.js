document.addEventListener("DOMContentLoaded", () => {
    const formularios = {
        responsavel: document.getElementById("etapa1"),
        crianca1: document.getElementById("etapa2"),
        crianca2: document.getElementById("etapa3")
    };

    let dadosResponsavel = {};
    let dadosCriancas = [];
    let quantidadeCriancas = 1;
    let criancaSelecionada = null;

    configurarIntroducao();
    configurarSenhas();
    configurarMascaras();
    configurarFormularios();
    configurarBotoesDeVoltar();
    configurarBotaoDeSessao();

    function configurarIntroducao() {
        const navegacao = performance.getEntriesByType("navigation")[0];

        if (navegacao?.type === "back_forward") {
            mostrarCadastroSemAnimacao();
        } else {
            window.addEventListener("load", animarEntradaCadastro, {
                once: true
            });
        }

        window.addEventListener("pageshow", evento => {
            if (evento.persisted) {
                mostrarCadastroSemAnimacao();
            }
        });
    }

    function mostrarCadastroSemAnimacao() {
        const intro = document.getElementById("intro-screen");
        const sucesso = document.getElementById("success-screen");
        const app = document.getElementById("app");

        gsap.killTweensOf([intro, sucesso, app]);

        intro.style.display = "none";
        sucesso.style.display = "none";
        app.classList.remove("app-hidden");

        gsap.set(app, {
            visibility: "visible",
            opacity: 1,
            filter: "none"
        });
    }

    function animarEntradaCadastro() {
        const timeline = gsap.timeline();

        timeline
            .from(".intro-logo", {
                opacity: 0,
                y: 10,
                duration: 0.6,
                ease: "power3.out"
            })
            .from(".intro-line", {
                scaleX: 0,
                duration: 0.5,
                ease: "power3.out"
            }, "-=0.2")
            .from(".intro-headline", {
                opacity: 0,
                y: 16,
                duration: 0.7,
                ease: "power3.out"
            }, "-=0.2")
            .from(".intro-sub", {
                opacity: 0,
                y: 10,
                duration: 0.5,
                ease: "power3.out"
            }, "-=0.3")
            .to("#intro-screen", {
                opacity: 0,
                scale: 1.03,
                duration: 0.7,
                delay: 0.9,
                ease: "power2.inOut"
            })
            .set("#intro-screen", {
                display: "none"
            })
            .set("#app", {
                visibility: "visible"
            })
            .call(() => {
                document
                    .getElementById("app")
                    .classList.remove("app-hidden");
            })
            .from(".reg-header", {
                opacity: 0,
                y: -14,
                duration: 0.5,
                ease: "power3.out"
            }, "-=0.1")
            .from(".reg-left", {
                opacity: 0,
                x: -24,
                duration: 0.6,
                ease: "power3.out"
            }, "-=0.3")
            .from(".reg-right", {
                opacity: 0,
                x: 24,
                duration: 0.7,
                ease: "power3.out"
            }, "-=0.5")
            .from(".step-indicator", {
                opacity: 0,
                y: 8,
                duration: 0.4,
                ease: "power2.out"
            }, "-=0.4");
    }

    function configurarFormularios() {
        formularios.responsavel.addEventListener("submit", evento => {
            evento.preventDefault();

            if (!validarResponsavel()) {
                sacudir(formularios.responsavel);
                return;
            }

            const dados = new FormData(formularios.responsavel);

            quantidadeCriancas = Number(
                dados.get("quantidade_criancas")
            );

            dadosResponsavel = {
                nome: dados.get("nome"),
                cpf: dados.get("cpf_responsavel"),
                email: dados.get("email"),
                senha: dados.get("senha"),
                pin: dados.get("pin"),
                telefone: dados.get("telefone"),
                relacao: dados.get("relacao")
            };

            if (quantidadeCriancas === 1) {
                dadosCriancas = dadosCriancas.slice(0, 1);
            }

            atualizarQuantidadeDeEtapas();
            irParaEtapa(2);
        });

        formularios.crianca1.addEventListener("submit", evento => {
            evento.preventDefault();

            const botao = formularios.crianca1.querySelector(
                'button[type="submit"]'
            );

            botao.disabled = true;

            if (!validarCrianca(1)) {
                sacudir(formularios.crianca1);
                botao.disabled = false;
                return;
            }

            dadosCriancas[0] = obterDadosCrianca(1);

            if (quantidadeCriancas === 2) {
                irParaEtapa(3);
                botao.disabled = false;
                return;
            }

            finalizarCadastroFrontend(botao);
        });

        formularios.crianca2.addEventListener("submit", evento => {
            evento.preventDefault();

            const botao = formularios.crianca2.querySelector(
                'button[type="submit"]'
            );

            botao.disabled = true;

            if (!validarCrianca(2)) {
                sacudir(formularios.crianca2);
                botao.disabled = false;
                return;
            }

            dadosCriancas[1] = obterDadosCrianca(2);
            finalizarCadastroFrontend(botao);
        });
    }

    function configurarBotoesDeVoltar() {
        document
            .getElementById("voltar-etapa-2")
            .addEventListener("click", () => {
                irParaEtapa(1);
            });

        document
            .getElementById("voltar-etapa-3")
            .addEventListener("click", () => {
                irParaEtapa(2);
            });
    }

    function atualizarQuantidadeDeEtapas() {
        const possuiDuas = quantidadeCriancas === 2;

        const indicador3 =
            document.getElementById("step-3-ind");

        const conector3 =
            document.getElementById("step-3-connector");

        const label2 =
            document.getElementById("step-2-label");

        const titulo1 =
            document.getElementById("titulo-crianca-1");

        const textoBotao =
            document.getElementById("texto-btn-crianca-1");

        const iconeBotao =
            document.getElementById("icone-btn-crianca-1");

        indicador3.hidden = !possuiDuas;
        conector3.hidden = !possuiDuas;

        label2.textContent = possuiDuas
            ? "Criança 1"
            : "Criança";

        titulo1.textContent = possuiDuas
            ? "Dados da Criança 1"
            : "Dados da Criança";

        textoBotao.textContent = possuiDuas
            ? "Avançar"
            : "Concluir";

        iconeBotao.className = possuiDuas
            ? "fa-solid fa-arrow-right"
            : "fa-solid fa-check";
    }

    function irParaEtapa(numero) {
        const etapaAtual =
            document.querySelector(".etapa.active");

        const proximaEtapa =
            document.getElementById(`etapa${numero}`);

        atualizarIndicadores(numero);

        if (etapaAtual === proximaEtapa) {
            return;
        }

        const numeroAtual = Number(
            etapaAtual.id.replace("etapa", "")
        );

        const avancando = numero > numeroAtual;

        gsap.to(etapaAtual, {
            opacity: 0,
            x: avancando ? -24 : 24,
            duration: 0.28,
            ease: "power2.in",

            onComplete: () => {
                etapaAtual.classList.remove("active");
                proximaEtapa.classList.add("active");

                gsap.fromTo(
                    proximaEtapa,
                    {
                        opacity: 0,
                        x: avancando ? 24 : -24
                    },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.38,
                        ease: "power3.out"
                    }
                );
            }
        });
    }

    function atualizarIndicadores(etapaAtual) {
        document.querySelectorAll(".step-item").forEach(indicador => {
            indicador.classList.remove("active", "done");
        });

        const totalEtapas = quantidadeCriancas + 1;

        for (let etapa = 1; etapa <= totalEtapas; etapa++) {
            const indicador = document.getElementById(
                `step-${etapa}-ind`
            );

            if (!indicador) {
                continue;
            }

            if (etapa < etapaAtual) {
                indicador.classList.add("done");
            }

            if (etapa === etapaAtual) {
                indicador.classList.add("active");
            }
        }
    }

    function obterDadosCrianca(numero) {
        return {
            nome: document
                .getElementById(`nome-crianca-${numero}`)
                .value
                .trim(),

            dataNascimento: document.getElementById(
                `data-nascimento-${numero}`
            ).value,

            cpf: document.getElementById(
                `cpf-crianca-${numero}`
            ).value,

            genero: document.getElementById(
                `genero-${numero}`
            ).value
        };
    }

    function finalizarCadastroFrontend(botao) {
        const criancasParaExibir = dadosCriancas.map(
            (crianca, indice) => ({
                id: `crianca-${indice + 1}`,
                nome: crianca.nome
            })
        );

        mostrarSucesso(criancasParaExibir);

        localStorage.setItem(
            "teko_access_pin",
            dadosResponsavel.pin
        );

        localStorage.setItem(
            "teko_registered_children",
            JSON.stringify(criancasParaExibir)
        );

        botao.disabled = false;

        /*
            Backend depois:
            enviar dadosResponsavel e dadosCriancas
            para POST /register.
        */
    }

    function mostrarSucesso(criancas) {
        const tela =
            document.getElementById("success-screen");

        const opcoes =
            document.getElementById("session-options");

        opcoes.replaceChildren();

        criancaSelecionada = null;

        criancas.forEach((crianca, indice) => {
            const botao = criarOpcaoDeSessao(crianca);

            opcoes.appendChild(botao);

            if (indice === 0) {
                selecionarSessao(botao, crianca);
            }
        });

        reiniciarAnimacaoDoCheck();

        tela.style.display = "flex";

        gsap.to("#app", {
            filter: "blur(3px)",
            duration: 0.3,
            ease: "power2.inOut"
        });

        gsap.fromTo(
            ".success-content",
            {
                opacity: 0,
                scale: 0.9,
                y: 16
            },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.55,
                delay: 0.2,
                ease: "back.out(1.5)"
            }
        );
    }

    function criarOpcaoDeSessao(crianca) {
        const botao = document.createElement("button");
        const avatar = document.createElement("div");
        const icone = document.createElement("i");
        const nome = document.createElement("span");

        botao.type = "button";
        botao.className = "session-option";

        avatar.className = "session-avatar";
        icone.className = "fa-solid fa-child";

        nome.className = "session-name";
        nome.textContent = crianca.nome;

        avatar.appendChild(icone);
        botao.append(avatar, nome);

        botao.addEventListener("click", () => {
            selecionarSessao(botao, crianca);
        });

        return botao;
    }

    function selecionarSessao(botao, crianca) {
        document
            .querySelectorAll(".session-option")
            .forEach(opcao => {
                opcao.classList.remove("selected");
            });

        botao.classList.add("selected");

        criancaSelecionada = crianca;
    }

    function configurarBotaoDeSessao() {
        document
            .getElementById("btn-start-session")
            .addEventListener("click", () => {
                if (!criancaSelecionada) {
                    return;
                }

                localStorage.setItem(
                    "teko_session",
                    JSON.stringify({
                        responsavel: {
                            nome_completo: dadosResponsavel.nome,
                            email: dadosResponsavel.email
                        },
                        crianca: criancaSelecionada
                    })
                );

                window.location.href = "/home";
            });
    }

    function reiniciarAnimacaoDoCheck() {
        document
            .querySelectorAll(
                ".check-circle-path, .check-mark-path"
            )
            .forEach(elemento => {
                elemento.style.animation = "none";

                void elemento.getBoundingClientRect();

                elemento.style.animation = "";
            });
    }

    function validarResponsavel() {
        limparErros(formularios.responsavel);

        let valido = true;
        let primeiroCampo = null;

        const nome =
            document.getElementById("nome");

        const cpf =
            document.getElementById("cpf-responsavel");

        const email =
            document.getElementById("reg-email");

        const senha =
            document.getElementById("reg-senha");

        const confirmarSenha =
            document.getElementById("confirmar-senha");

        const pin =
            document.getElementById("reg-pin");

        const confirmarPin =
            document.getElementById("confirmar-pin");

        const relacao = document.querySelector(
            'input[name="relacao"]:checked'
        );
        if (!nome.value.trim()) {
            primeiroCampo = primeiroCampo || nome;

            marcarErro(
                nome,
                "Informe o nome completo."
            );

            valido = false;
        }

        if (cpf.value.replace(/\D/g, "").length !== 11) {
            primeiroCampo = primeiroCampo || cpf;

            marcarErro(
                cpf,
                "Informe um CPF válido com 11 dígitos."
            );

            valido = false;
        }

        if (
            !email.value.trim() ||
            !email.value.includes("@")
        ) {
            primeiroCampo = primeiroCampo || email;

            marcarErro(
                email,
                "Informe um e-mail válido."
            );

            valido = false;
        }

        if (senha.value.length < 8) {
            primeiroCampo = primeiroCampo || senha;

            marcarErro(
                senha,
                "A senha deve ter no mínimo 8 caracteres."
            );

            valido = false;
        }

        if (confirmarSenha.value !== senha.value) {
            primeiroCampo =
                primeiroCampo || confirmarSenha;

            marcarErro(
                confirmarSenha,
                "As senhas não coincidem."
            );

            valido = false;
        }

        if (!/^\d{4}$/.test(pin.value)) {
            primeiroCampo = primeiroCampo || pin;

            marcarErro(
                pin,
                "Crie um PIN com exatamente 4 números."
            );

            valido = false;
        }

        if (confirmarPin.value !== pin.value) {
            primeiroCampo =
                primeiroCampo || confirmarPin;

            marcarErro(
                confirmarPin,
                "Os PINs não coincidem."
            );

            valido = false;
        }

        if (!relacao) {
            mostrarErroNoGrupo(
                document.getElementById("grupo-relacao"),
                "Selecione sua relação com as crianças."
            );

            valido = false;
        }
        primeiroCampo?.focus();

        return valido;
    }

    function validarCrianca(numero) {
        const formulario = document.getElementById(
            `etapa${numero + 1}`
        );

        limparErros(formulario);

        let valido = true;
        let primeiroCampo = null;

        const nome = document.getElementById(
            `nome-crianca-${numero}`
        );

        const nascimento = document.getElementById(
            `data-nascimento-${numero}`
        );

        const cpf = document.getElementById(
            `cpf-crianca-${numero}`
        );

        const genero = document.getElementById(
            `genero-${numero}`
        );

        if (!nome.value.trim()) {
            primeiroCampo = primeiroCampo || nome;

            marcarErro(
                nome,
                "Informe o nome da criança."
            );

            valido = false;
        }

        if (
            !nascimento.value ||
            !dataDeNascimentoValida(nascimento.value)
        ) {
            primeiroCampo =
                primeiroCampo || nascimento;

            marcarErro(
                nascimento,
                "Informe uma data de nascimento válida."
            );

            valido = false;
        }

        if (cpf.value.replace(/\D/g, "").length !== 11) {
            primeiroCampo = primeiroCampo || cpf;

            marcarErro(
                cpf,
                "Informe um CPF válido com 11 dígitos."
            );

            valido = false;
        }

        if (!genero.value) {
            primeiroCampo = primeiroCampo || genero;

            marcarErro(
                genero,
                "Selecione o gênero da criança."
            );

            valido = false;
        }

        primeiroCampo?.focus();

        return valido;
    }

    function dataDeNascimentoValida(valor) {
        const nascimento =
            new Date(`${valor}T00:00:00`);

        const hoje = new Date();

        if (
            Number.isNaN(nascimento.getTime()) ||
            nascimento > hoje
        ) {
            return false;
        }

        let idade =
            hoje.getFullYear() -
            nascimento.getFullYear();

        const aindaNaoFezAniversario =
            hoje.getMonth() < nascimento.getMonth() ||
            (
                hoje.getMonth() === nascimento.getMonth() &&
                hoje.getDate() < nascimento.getDate()
            );

        if (aindaNaoFezAniversario) {
            idade--;
        }

        return idade <= 18;
    }

    function marcarErro(input, mensagem) {
        const grupo = input.closest(".field");

        grupo.classList.add("campo-erro");

        mostrarErroNoGrupo(grupo, mensagem);
    }

    function mostrarErroNoGrupo(grupo, mensagem) {
        if (grupo.querySelector(".msg-erro")) {
            return;
        }

        const erro = document.createElement("span");

        erro.className = "msg-erro";
        erro.textContent = mensagem;

        grupo.appendChild(erro);
    }

    function limparErros(escopo) {
        escopo
            .querySelectorAll(".campo-erro")
            .forEach(elemento => {
                elemento.classList.remove("campo-erro");
            });

        escopo
            .querySelectorAll(".msg-erro")
            .forEach(elemento => {
                elemento.remove();
            });
    }

    function sacudir(elemento) {
        elemento.classList.remove("sacudir");

        void elemento.offsetWidth;

        elemento.classList.add("sacudir");

        elemento.addEventListener(
            "animationend",
            () => {
                elemento.classList.remove("sacudir");
            },
            {
                once: true
            }
        );
    }

    function configurarSenhas() {
        document
            .querySelectorAll("[data-password-target]")
            .forEach(botao => {
                botao.addEventListener("click", () => {
                    const input = document.getElementById(
                        botao.dataset.passwordTarget
                    );

                    const icone = botao.querySelector("i");
                    const mostrar =
                        input.type === "password";

                    input.type = mostrar
                        ? "text"
                        : "password";

                    icone.classList.toggle(
                        "fa-eye",
                        !mostrar
                    );

                    icone.classList.toggle(
                        "fa-eye-slash",
                        mostrar
                    );

                    botao.setAttribute(
                        "aria-label",
                        mostrar
                            ? "Ocultar senha"
                            : "Mostrar senha"
                    );
                });
            });
    }

    function configurarMascaras() {
        aplicarMascaraCPF("cpf-responsavel");
        aplicarMascaraCPF("cpf-crianca-1");
        aplicarMascaraCPF("cpf-crianca-2");
        aplicarMascaraTelefone("telefone");
        aplicarMascaraPin("reg-pin");
        aplicarMascaraPin("confirmar-pin");
    }

    function aplicarMascaraCPF(inputId) {
        const input =
            document.getElementById(inputId);

        input.addEventListener("input", () => {
            let valor = input.value
                .replace(/\D/g, "")
                .slice(0, 11);

            if (valor.length > 9) {
                valor = valor.replace(
                    /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
                    "$1.$2.$3-$4"
                );
            } else if (valor.length > 6) {
                valor = valor.replace(
                    /(\d{3})(\d{3})(\d{0,3})/,
                    "$1.$2.$3"
                );
            } else if (valor.length > 3) {
                valor = valor.replace(
                    /(\d{3})(\d{0,3})/,
                    "$1.$2"
                );
            }

            input.value = valor;
        });
    }

    function aplicarMascaraTelefone(inputId) {
        const input =
            document.getElementById(inputId);

        input.addEventListener("input", () => {
            const numeros = input.value
                .replace(/\D/g, "")
                .slice(0, 11);

            if (numeros.length <= 2) {
                input.value = numeros;
            } else if (numeros.length <= 7) {
                input.value =
                    `(${numeros.slice(0, 2)}) ` +
                    numeros.slice(2);
            } else {
                input.value =
                    `(${numeros.slice(0, 2)}) ` +
                    `${numeros.slice(2, 7)}-` +
                    numeros.slice(7);
            }
        });
    }

    function aplicarMascaraPin(inputId) {
        const input = document.getElementById(inputId);

        input.addEventListener("input", () => {
            input.value = input.value
                .replace(/\D/g, "")
                .slice(0, 4);
        });
    }
});
