
/* =========================================================
   TEKOIA - CHAT
   ========================================================= */


/* ── elementos do chat ── */

const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

const chatDisplay =
    document.getElementById("chat-display-text");

const micBtn =
    document.getElementById("mic-btn");


/* ── estado da sessão ── */

let childIdSelecionado = null;

let typingTimer = null;
let gravando = false;
let sending = false;
let chatVersion = 0;
let chatRequest = null;


/* =========================================================
   UTILITÁRIOS
   ========================================================= */


/* ── pegar nome da criança ── */

function obterNomeCrianca(child) {

    return (
        child?.nome ||
        child?.nome_completo ||
        child?.firstName ||
        child?.nomeCrianca ||
        ""
    );
}


/* ── pegar ID da criança ── */

function obterIdCrianca(child) {

    return (
        child?.id ||
        child?.crianca_id ||
        child?.child_id ||
        null
    );
}


/* ── ler teko_session ── */

function obterSessaoLocal() {

    try {

        const sessao = JSON.parse(
            localStorage.getItem("teko_session") || "{}"
        );

        return sessao;

    } catch (error) {

        console.error(
            "Erro ao ler teko_session:",
            error
        );

        return {};
    }
}


/* ── pegar criança ativa do teko_session ── */

function obterCriancaAtivaLocal() {

    const sessao = obterSessaoLocal();

    return sessao?.crianca || null;
}


/* ── carregar exclusivamente a sessão global ativa ── */

function carregarSessaoAtiva(child = obterCriancaAtivaLocal()) {

    ++chatVersion;
    chatRequest?.abort();
    chatRequest = null;
    sending = false;
    chatInput.value = "";
    mostrarAtividade(null);
    const id = obterIdCrianca(child);
    const nome = obterNomeCrianca(child);

    // O TEKO.IA não escolhe nem altera sessões; apenas consome a sessão global.
    childIdSelecionado = id || null;

    if (!childIdSelecionado) {
        chatInput.disabled = true;
        sendBtn.disabled = true;

        digitarMensagem(
            "Nenhuma sessão está ativa. Use “Trocar sessão” no menu para escolher uma criança."
        );

        return;
    }

    chatInput.disabled = false;
    sendBtn.disabled = false;

    digitarMensagem(
        `Oi, ${nome || "amigo"}! 👋 Como você está se sentindo hoje? 😊`
    );
}


/* =========================================================
   ÁREA DA RESPOSTA
   ========================================================= */

function digitarMensagem(texto) {

    clearTimeout(
        typingTimer
    );


    if (!chatDisplay) return;


    chatDisplay.classList.remove(
        "is-loading"
    );


    chatDisplay.textContent =
        "";


    let i = 0;


    (function passo() {

        if (i < texto.length) {

            chatDisplay.textContent +=
                texto.charAt(i);


            i++;


            typingTimer =
                setTimeout(
                    passo,
                    22
                );

        }

    })();

}


/* =========================================================
   CARREGANDO
   ========================================================= */

function mostrarCarregando() {

    clearTimeout(
        typingTimer
    );


    if (!chatDisplay) return;


    chatDisplay.classList.add(
        "is-loading"
    );


    chatDisplay.innerHTML = `
        <span class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </span>
    `;

}


/* =========================================================
   MICROFONE
   ========================================================= */

if (micBtn) {

    micBtn.addEventListener(
        "click",
        () => {

            gravando =
                !gravando;


            micBtn.classList.toggle(
                "recording",
                gravando
            );


            micBtn.setAttribute(
                "aria-pressed",
                String(gravando)
            );


            // Futuramente:
            // SpeechRecognition

        }
    );

}


/* =========================================================
   ENVIAR MENSAGEM
   ========================================================= */

function mostrarAtividade(activity) {
    const panel = document.getElementById("chat-activity");
    panel.replaceChildren();
    panel.hidden = true;
    if (!activity || typeof activity.title !== "string" ||
        typeof activity.url !== "string" || !/^\/atividades\/[a-z0-9-]+$/.test(activity.url)) return;
    const link = document.createElement("a");
    link.className = "chat-activity-link";
    link.href = activity.url;
    link.textContent = "Abrir: " + activity.title;
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = "Agora não";
    dismiss.addEventListener("click", () => {
        mostrarAtividade(null);
        // A recusa passa pela conversa para orientar as sugestões seguintes.
        chatInput.value = "Agora não quero uma atividade. Quero continuar conversando.";
        enviarMensagem();
    });
    panel.append(link, dismiss);
    panel.hidden = false;
}

async function enviarMensagem() {
    if (!chatInput || sending) return;
    const texto = chatInput.value.trim();
    if (!texto) return;
    if (!childIdSelecionado) {
        digitarMensagem('Use “Trocar sessão” no menu para escolher uma criança antes de conversar.');
        return;
    }
    if (texto.length > 2000) {
        digitarMensagem("Vamos conversar em partes? Escreva uma mensagem um pouco menor.");
        return;
    }
    const version = ++chatVersion;
    chatRequest = new AbortController();
    sending = true;
    sendBtn.disabled = true;
    mostrarAtividade(null);
    mostrarCarregando();
    try {
        const resposta = await fetch("/api/ai/chat", {
            method: "POST", headers: { "Content-Type": "application/json" },
            credentials: "include",
            signal: AbortSignal.any([chatRequest.signal, AbortSignal.timeout(30000)]),
            body: JSON.stringify({ childId: childIdSelecionado, message: texto })
        });
        const dados = await resposta.json();
        if (version !== chatVersion) return;
        if (!resposta.ok) {
            if (resposta.status === 401) {
                digitarMensagem("Sua sessão expirou. Faça login novamente.");
            } else if (resposta.status === 403) {
                digitarMensagem("Essa criança não está disponível nesta conta. Peça ajuda ao responsável.");
            } else {
                const errors = {
                    AI_UNAVAILABLE: "Não consigo conversar agora. Peça ajuda ao responsável e tente mais tarde.",
                    AI_BUSY: "Preciso de uma pequena pausa. Tente novamente em um minuto.",
                    AI_TIMEOUT: "Demorei para responder. Você pode tentar de novo.",
                    CHAT_PENDING: "Espere minha resposta antes de enviar outra mensagem.",
                    AI_INVALID_RESPONSE: "Não consegui preparar a resposta. Você pode tentar de novo."
                };
                digitarMensagem(errors[dados.code] || "Não consegui concluir a conversa agora. Você pode tentar de novo.");
            }
            return;
        }
        if (typeof dados.response !== "string" || !dados.response.trim()) throw new Error("Resposta vazia.");
        if (chatInput.value.trim() === texto) chatInput.value = "";
        digitarMensagem(dados.response);
        mostrarAtividade(dados.activity);
    } catch (error) {
        if (version !== chatVersion) return;
        digitarMensagem(error.name === "TimeoutError"
            ? "Demorei para responder. Você pode tentar de novo."
            : "Não consegui me conectar agora. Sua mensagem continua aqui para tentar novamente.");
    } finally {
        if (version === chatVersion) {
            sending = false;
            chatRequest = null;
            sendBtn.disabled = !childIdSelecionado;
            chatInput.focus();
        }
    }
}

/* ── botão enviar ── */

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        enviarMensagem
    );

}


/* ── Enter ── */

if (chatInput) {

    chatInput.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Enter" &&
                !evento.shiftKey
            ) {

                evento.preventDefault();

                enviarMensagem();

            }

        }
    );

}


/* =========================================================
   SINCRONIZAÇÃO COM TROCA DE SESSÃO
   ========================================================= */

window.addEventListener(
    "teko:session-changed",
    evento => {

        const child =
            evento.detail?.child ||
            obterCriancaAtivaLocal();


        carregarSessaoAtiva(child);

    }
);


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        /* ── avatar ── */

        if (
            typeof carregarAvatar ===
            "function"
        ) {

            carregarAvatar();

        }


        // A criança já foi definida no login ou no fluxo global de troca de sessão.
        carregarSessaoAtiva();

    }
);
