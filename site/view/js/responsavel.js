/* ════════════════════════════════════════
   ACESSO POR PIN
════════════════════════════════════════ */
const pinInput = document.getElementById("pin-input");
const pinOverlay = document.getElementById("pin-overlay");
const respPage = document.getElementById("resp-page");
const btnPin = document.getElementById("btn-pin");
const pinError = document.getElementById("pin-error");

let criancasDashboard = [];
let criancaSelecionada = null;

window.addEventListener("load", () => {
    pinInput?.focus();
});

pinInput?.addEventListener("keydown", evento => {
    if (evento.key === "Enter") verificarPin();
    pinError.textContent = "";
    pinInput.classList.remove("error");
});

pinInput?.addEventListener("input", () => {
    pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 4);
});

async function verificarPin() {
    const pin = pinInput.value.trim();

    if (pin.length !== 4) {
        pinInput.classList.add("error");
        pinError.textContent = "Digite os 4 dígitos do PIN.";
        setTimeout(() => pinInput.classList.remove("error"), 600);
        return;
    }

    try {
        btnPin.disabled = true;
        pinError.textContent = "";

        const resposta = await fetch("/verify-pin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ pin })
        });

        const resultado = await resposta.json().catch(() => ({}));

        if (!resposta.ok || resultado.valid !== true) {
            if (resposta.status === 401) {
                pinError.textContent = "Sua sessão expirou. Entre novamente.";
                setTimeout(() => {
                    window.location.href = "/login";
                }, 1200);
                return;
            }

            if (resposta.status === 429) {
                pinError.textContent = "Muitas tentativas. Aguarde alguns minutos.";
                pinInput.value = "";
                return;
            }

            erroPin(resultado.error || "PIN incorreto. Tente novamente.");
            return;
        }

        desbloquearDashboard();
    } catch (erro) {
        console.error("Erro ao validar PIN:", erro);
        erroPin("Não foi possível validar o PIN. Tente novamente.");
    } finally {
        btnPin.disabled = false;
    }
}

function desbloquearDashboard() {
    btnPin.classList.add("success");

    setTimeout(() => {
        pinOverlay.classList.add("hiding");
        respPage.classList.add("unlocked");
        carregarDados();

    }, 700);

    setTimeout(() => {
        pinOverlay.style.display = "none";
    }, 1250);
}

function erroPin(mensagem = "PIN incorreto. Tente novamente.") {
    pinInput.classList.add("error");
    pinError.textContent = mensagem;
    pinInput.value = "";

    setTimeout(() => {
        pinInput.classList.remove("error");
        pinInput.focus();
    }, 700);
}

function bloquearDashboard() {
    pinOverlay.style.display = "flex";
    pinOverlay.classList.remove("hiding");
    respPage.classList.remove("unlocked");
    pinInput.value = "";
    pinError.textContent = "";
    btnPin.classList.remove("success");
    setTimeout(() => pinInput.focus(), 100);
}

/* ════════════════════════════════════════
   DADOS E SELEÇÃO DE CRIANÇAS
════════════════════════════════════════ */
let requestVersion = 0;
async function buscarJSON(url) {
    const response = await fetch(url, { credentials: "include", cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) window.location.href = "/login";
        throw new Error(data.error || data.erro || "Não foi possível carregar os dados. Tente novamente.");
    }
    return data;
}

async function carregarDados() {
    const version = ++requestVersion;
    mostrarEstado("Carregando dados…");
    try {
        const [children, profile] = await Promise.all([
            buscarJSON("/children"), buscarJSON("/auth/profile")
        ]);
        if (version !== requestVersion) return;
        const list = children.children || children.criancas || [];
        criancasDashboard = Array.isArray(list) ? list : [list];
        const name = profile.responsavel?.nome_completo || profile.responsavel?.nome || "";
        atualizarTexto("resp-nome", name.trim().split(/\s+/)[0] || "Responsável");
        criancaSelecionada = criancasDashboard.find(c => c.id === criancaSelecionada?.id) || criancasDashboard[0] || null;
        renderizarSeletor();
        await renderizarPainel(criancaSelecionada);
    } catch (error) {
        if (version === requestVersion) mostrarEstado(error.message, true);
    }
}

function mostrarEstado(message, failed = false) {
    atualizarTexto("dashboard-status", message);
    document.getElementById("dashboard-retry").hidden = !failed;
    for (const id of ["stat-modulos", "stat-atividades", "stat-sequencia", "chart-total"]) atualizarTexto(id, "—");
    document.getElementById("daily-chart").hidden = true;
}
document.getElementById("dashboard-retry").addEventListener("click", carregarDados);

function obterNome(crianca) {
    return String(
        crianca?.nome ||
        crianca?.nome_completo ||
        crianca?.firstName ||
        crianca?.nomeCrianca ||
        ""
    ).trim();
}

function obterId(crianca) {
    return crianca?.id ?? null;
}

function idsIguais(idA, idB) {
    if (idA == null || idB == null) return false;
    return String(idA) === String(idB);
}

function obterChaveCrianca(crianca, indice) {
    return obterId(crianca) != null
        ? `id:${obterId(crianca)}`
        : `nome:${obterNome(crianca).toLocaleLowerCase("pt-BR")}:${indice}`;
}

function renderizarSeletor() {
    const seletor = document.getElementById("child-selector");
    seletor.replaceChildren();

    if (criancasDashboard.length <= 1) {
        seletor.hidden = true;
        return;
    }

    seletor.hidden = false;

    criancasDashboard.forEach((crianca, indice) => {
        const nome = obterNome(crianca) || `Criança ${indice + 1}`;
        const botao = document.createElement("button");
        const ativo = crianca === criancaSelecionada;

        botao.type = "button";
        botao.className = `child-selector-button${ativo ? " active" : ""}`;
        botao.dataset.childKey = obterChaveCrianca(crianca, indice);
        botao.setAttribute("aria-pressed", String(ativo));
        botao.setAttribute("aria-label", `Ver dados de ${nome}`);

        const avatar = document.createElement("span");
        avatar.className = "child-selector-avatar";
        avatar.textContent = obterInicial(nome);

        const copia = document.createElement("span");
        copia.className = "child-selector-copy";

        const rotulo = document.createElement("small");
        rotulo.textContent = ativo ? "Visualizando" : "Ver perfil";

        const nomeElemento = document.createElement("strong");
        nomeElemento.textContent = nome;

        copia.append(rotulo, nomeElemento);
        botao.append(avatar, copia);

        botao.addEventListener("click", () => {
            selecionarCrianca(crianca);
        });

        seletor.appendChild(botao);
    });
}

function selecionarCrianca(crianca) {
    if (!crianca || crianca === criancaSelecionada) return;

    criancaSelecionada = crianca;
    renderizarSeletor();
    renderizarPainel(crianca);

}

async function renderizarPainel(crianca) {
    const version = ++requestVersion;
    mostrarEstado(crianca ? "Carregando progresso…" : "Nenhuma criança cadastrada.");
    const nome = obterNome(crianca) || "Nenhuma criança cadastrada";
    atualizarTexto("resp-crianca-nome-sub", nome);
    atualizarTexto("dado-nome", nome);
    atualizarTexto("dado-inicial", obterInicial(nome));
    if (!crianca) return;
    try {
        const progresso = await buscarJSON("/api/activities/progress/" + encodeURIComponent(crianca.id));
        if (version !== requestVersion) return;
        atualizarTexto("dashboard-status", "");
        document.getElementById("daily-chart").hidden = false;
        atualizarTexto("stat-modulos", progresso.completedModules);
        atualizarTexto("stat-atividades", progresso.totalRealizations);
        atualizarTexto("stat-sequencia", progresso.streak.current + " dias");
        const dias = progresso.daily.map(day => ({
            label: new Date(day.date + "T12:00:00Z").toLocaleDateString("pt-BR", {
                weekday: "short", timeZone: progresso.timeZone
            }).replace(".", ""),
            value: day.count
        }));
        const total = dias.reduce((sum, day) => sum + day.value, 0);
        atualizarTexto("chart-total", total + (total === 1 ? " atividade" : " atividades"));
        renderizarGrafico(dias);
    } catch (error) {
        if (version === requestVersion) mostrarEstado(error.message, true);
    }
}

function atualizarTexto(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
}

function obterInicial(nome) {
    return nome?.trim().charAt(0).toLocaleUpperCase("pt-BR") || "—";
}

function renderizarGrafico(dias) {
    const svg = document.getElementById("daily-chart-svg");
    const vazio = document.getElementById("chart-empty");
    const descricao = dias
        .map(dia => `${dia.label}: ${dia.value}`)
        .join(", ");

    const valores = dias.map(dia => Math.max(0, Number(dia.value) || 0));
    const possuiDados = valores.some(valor => valor > 0);
    const maximo = Math.max(4, ...valores);
    const esquerda = 38;
    const direita = 606;
    const topo = 30;
    const base = 184;
    const passo = (direita - esquerda) / Math.max(1, dias.length - 1);

    const pontos = valores.map((valor, indice) => ({
        x: esquerda + passo * indice,
        y: base - (valor / maximo) * (base - topo),
        valor,
        label: dias[indice].label
    }));

    const linha = pontos.map(ponto => `${ponto.x},${ponto.y}`).join(" ");
    const area = [
        `M ${pontos[0].x} ${base}`,
        ...pontos.map(ponto => `L ${ponto.x} ${ponto.y}`),
        `L ${pontos[pontos.length - 1].x} ${base}`,
        "Z"
    ].join(" ");

    svg.innerHTML = `
        <title id="chart-title">Atividades concluídas nos últimos sete dias</title>
        <desc id="chart-description">${descricao}</desc>
        <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6bb08a" stop-opacity="0.3"></stop>
                <stop offset="100%" stop-color="#6bb08a" stop-opacity="0.02"></stop>
            </linearGradient>
        </defs>
        <path class="chart-area" d="${area}"></path>
        <polyline class="chart-line" points="${linha}"></polyline>
        ${pontos.map(ponto => `
            <circle class="chart-point" cx="${ponto.x}" cy="${ponto.y}" r="5"></circle>
            ${possuiDados ? `<text class="chart-value-label" x="${ponto.x}" y="${ponto.y - 15}">${ponto.valor}</text>` : ""}
            <text class="chart-day-label" x="${ponto.x}" y="218">${ponto.label}</text>
        `).join("")}
    `;

    vazio.hidden = possuiDados;
}

/* ════════════════════════════════════════
   TOAST
════════════════════════════════════════ */
function mostrarToast(mensagem) {
    const toast = document.getElementById("toast");
    atualizarTexto("toast-msg", mensagem);
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2800);
}

window.addEventListener("focus", () => {
    if (respPage.classList.contains("unlocked")) carregarDados();
});
