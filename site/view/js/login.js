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

        setTimeout(() => {
            const carregamento =
                document.getElementById("loading-screen");

            carregamento.classList.add("ativo");

            setTimeout(() => {
                window.location.href = ("/home");
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
    // Backend do login com Google depois
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