function irParaIndex() {
    window.location.href = "/";
}

function irParaRegister() {
    window.location.href = "/register";
}

const formularioLogin = document.getElementById("form-login");
const botaoGoogle = document.getElementById("btn-google");

formularioLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    esconderAlerta();
    limparErros();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const login = document.querySelector(".cad-login");

    if (!validarLogin()) {
        mostrarAlerta(
            "Confira os campos e tente novamente.",
            "erro"
        );

        sacudirLogin(login);
        return;
    }

    try {
        const resposta = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                senha
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            mostrarAlerta(
                resultado.erro || "E-mail ou senha incorretos.",
                "erro"
            );

            sacudirLogin(login);
            return;
        }

        mostrarAlerta(
            "Login realizado com sucesso!",
            "sucesso"
        );

        localStorage.removeItem("teko_session");
        sessionStorage.setItem("teko_iniciar_sessao", "true");

        setTimeout(() => {
            const carregamento =
                document.getElementById("loading-screen");

            carregamento.classList.add("ativo");

            setTimeout(() => {
                window.location.href = "/home";
            }, 600);
        }, 700);

    } catch (erro) {
        console.error(erro);

        mostrarAlerta(
            "Não foi possível conectar ao servidor.",
            "erro"
        );

        sacudirLogin(login);
    }
});

botaoGoogle.addEventListener("click", () => {
    esconderAlerta();
    botaoGoogle.disabled = true;
    botaoGoogle.setAttribute("aria-busy", "true");

    // O redirecionamento começa no backend para manter o fluxo PKCE
    // e os tokens fora do localStorage.
    window.location.assign("/auth/google");
});

function validarLogin() {
    const email = document.getElementById("email");
    const senha = document.getElementById("senha");

    let valido = true;
    let primeiroCampoInvalido = null;

    if (
        !email.value.trim() ||
        !email.value.includes("@")
    ) {
        marcarErro(
            email,
            "Informe um e-mail válido."
        );

        primeiroCampoInvalido = email;
        valido = false;
    }

    if (senha.value.length < 8) {
        marcarErro(
            senha,
            "A senha deve ter no mínimo 8 caracteres."
        );

        if (!primeiroCampoInvalido) {
            primeiroCampoInvalido = senha;
        }

        valido = false;
    }

    if (primeiroCampoInvalido) {
        primeiroCampoInvalido.focus();
    }

    return valido;
}

function mostrarAlerta(mensagem, tipo) {
    const caixa = document.getElementById("login-alert");
    const texto = document.getElementById("login-alert-text");
    const icone = document.getElementById("login-alert-icon");

    texto.textContent = mensagem;

    caixa.className = `login-alert visivel ${tipo}`;
    caixa.setAttribute("aria-hidden", "false");

    if (tipo === "sucesso") {
        icone.className = "fa-solid fa-circle-check";
    } else {
        icone.className =
            "fa-solid fa-circle-exclamation";
    }
}

function esconderAlerta() {
    const caixa = document.getElementById("login-alert");

    caixa.className = "login-alert";
    caixa.setAttribute("aria-hidden", "true");
}

function sacudirLogin(login) {
    login.classList.remove("sacudir");

    void login.offsetWidth;

    login.classList.add("sacudir");

    login.addEventListener(
        "animationend",
        () => {
            login.classList.remove("sacudir");
        },
        { once: true }
    );
}

function limparErros() {
    document
        .querySelectorAll(".campo-erro")
        .forEach(elemento => {
            elemento.classList.remove("campo-erro");
        });

    document
        .querySelectorAll(".msg-erro")
        .forEach(elemento => {
            elemento.remove();
        });
}

function marcarErro(input, mensagem) {
    const grupo = input.closest(".input-group");

    grupo.classList.add("campo-erro");

    if (!grupo.querySelector(".msg-erro")) {
        const erro = document.createElement("span");

        erro.className = "msg-erro";
        erro.textContent = mensagem;

        grupo.appendChild(erro);
    }
}

function toggleSenha() {
    const input = document.getElementById("senha");
    const icone = document.getElementById("icone-olho");

    if (input.type === "password") {
        input.type = "text";

        icone.classList.replace(
            "fa-eye",
            "fa-eye-slash"
        );

        return;
    }

    input.type = "password";

    icone.classList.replace(
        "fa-eye-slash",
        "fa-eye"
    );
}

function limparCarregamentoLogin() {
    const carregamento =
        document.getElementById("loading-screen");

    if (carregamento) {
        carregamento.classList.remove("ativo");
    }
}

window.addEventListener(
    "pagehide",
    limparCarregamentoLogin
);

window.addEventListener(
    "pageshow",
    limparCarregamentoLogin
);


function processarRetornoGoogle() {
    const parametros = new URLSearchParams(window.location.search);
    const sucessoGoogle = parametros.get("google") === "success";
    const erroGoogle = parametros.get("google_error");

    if (!sucessoGoogle && !erroGoogle) {
        return;
    }

    window.history.replaceState({}, document.title, "/login");

    if (erroGoogle) {
        const mensagens = {
            cancelled: "O login com Google foi cancelado.",
            unavailable: "O login com Google ainda não está disponível.",
            invalid_callback: "O retorno do Google não pôde ser validado.",
            callback_failed: "Não foi possível concluir o login com Google.",
            session_expired: "A sessão do Google expirou. Tente novamente.",
            profile_failed: "Não foi possível abrir o cadastro da conta Google."
        };

        mostrarAlerta(
            mensagens[erroGoogle] ||
            "Não foi possível entrar com Google.",
            "erro"
        );

        botaoGoogle.disabled = false;
        botaoGoogle.removeAttribute("aria-busy");
        return;
    }

    mostrarAlerta(
        "Login com Google realizado com sucesso!",
        "sucesso"
    );

    localStorage.removeItem("teko_session");
    sessionStorage.setItem("teko_iniciar_sessao", "true");

    window.setTimeout(() => {
        const carregamento = document.getElementById("loading-screen");

        carregamento?.classList.add("ativo");

        window.setTimeout(() => {
            window.location.href = "/home";
        }, 600);
    }, 500);
}

processarRetornoGoogle();
