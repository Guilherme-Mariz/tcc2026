/* ═══════════════════════════════════════════════════════
   login.js  —  autenticação TEKO
   Salva responsavel + crianca no localStorage para que
   a home e demais páginas exibam o nome correto.
   ═══════════════════════════════════════════════════════ */

document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("email");
    const senhaInput = document.getElementById("senha");
    const loginCard  = document.querySelector('.cad-login');

    limparErros();

    if (!validarCampos()) {
        sacudir(loginCard);
        return;
    }

    const loading = document.getElementById('loading-screen');
    if (loading) loading.classList.add('ativo');

    try {
        const resposta = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",          // envia/recebe o cookie HttpOnly
            body: JSON.stringify({
                email: emailInput.value.trim(),
                senha: senhaInput.value
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            if (loading) loading.classList.remove('ativo');
            mostrarErroCampo(emailInput, resultado.erro || "E-mail ou senha incorretos.");
            sacudir(loginCard);
            return;
        }

        /* ── persiste sessão no localStorage ──────────────────
           O servidor retorna:
           {
             mensagem: "Login realizado com sucesso",
             responsavel: { id, nome, email, relacao, telefone },
             crianca:     { id, nome, data_nascimento, genero }
           }
           O token JWT fica APENAS no cookie HttpOnly.
           ─────────────────────────────────────────────────── */
        const sessao = {
            responsavel: resultado.responsavel || {},
            crianca:     resultado.crianca     || {},
        };

        localStorage.setItem("teko_session", JSON.stringify(sessao));

        if (!localStorage.getItem("teko_streak")) {
            localStorage.setItem("teko_streak", "1");
        }

        window.location.href = "/home";

    } catch (erro) {
        console.error("Erro no login:", erro);
        if (loading) loading.classList.remove('ativo');
        mostrarErroCampo(emailInput, "Erro de conexão. Tente novamente.");
        sacudir(loginCard);
    }
});

function validarCampos() {
    const email = document.getElementById("email");
    const senha = document.getElementById("senha");
    let valido  = true;

    if (!email.value.trim() || !email.value.includes("@")) {
        mostrarErroCampo(email, "Informe um e-mail válido.");
        valido = false;
    }
    if (senha.value.length < 8) {
        mostrarErroCampo(senha, "A senha deve ter no mínimo 8 caracteres.");
        valido = false;
    }
    return valido;
}

function mostrarErroCampo(input, msg) {
    const grupo = input.closest(".input-group");
    if (!grupo) return;
    grupo.classList.add("campo-erro");
    if (!grupo.querySelector(".msg-erro")) {
        const span = document.createElement("span");
        span.className = "msg-erro";
        span.textContent = msg;
        grupo.appendChild(span);
    }
    input.focus();
}

function limparErros() {
    document.querySelectorAll(".campo-erro").forEach(el => el.classList.remove("campo-erro"));
    document.querySelectorAll(".msg-erro").forEach(el => el.remove());
}

function sacudir(el) {
    if (!el) return;
    el.classList.add("sacudir");
    el.addEventListener("animationend", () => el.classList.remove("sacudir"), { once: true });
}

function toggleSenha() {
    const input = document.getElementById("senha");
    const icone = document.getElementById("icone-olho");
    if (!input || !icone) return;
    const visivel = input.type === "password";
    input.type    = visivel ? "text"     : "password";
    icone.classList.toggle("fa-eye",       !visivel);
    icone.classList.toggle("fa-eye-slash",  visivel);
}
