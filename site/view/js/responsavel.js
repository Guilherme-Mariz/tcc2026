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
let diasExibidos = null;
let accessVersion = 0;
let pinAutorizado = false;

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
    if (btnPin.disabled || pinAutorizado) return;
    const version = requestVersion;
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
            signal: AbortSignal.timeout(15000),
            body: JSON.stringify({ pin })
        });

        const resultado = await resposta.json().catch(() => ({}));
        if (version !== requestVersion) return;

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

        pinAutorizado = true;
        await desbloquearDashboard();
    } catch (erro) {
        console.error("Erro ao validar PIN:", erro);
        erroPin("Não foi possível validar o PIN. Tente novamente.");
    } finally {
        btnPin.disabled = false;
    }
}

async function desbloquearDashboard() {
    if (!pinAutorizado) return;
    const version = ++accessVersion;
    pinOverlay.classList.add("loading-data");
    const status = document.getElementById("pin-loading-status");
    const retry = document.getElementById("pin-loading-retry");
    status.textContent = "Carregando seus dados…";
    retry.hidden = true;
    document.getElementById("pin-loading-spinner").hidden = false;
    respPage.setAttribute("aria-busy", "true");
    status.focus();
    const ready = await carregarDados();
    if (version !== accessVersion) return;
    respPage.setAttribute("aria-busy", "false");
    if (!ready) {
        document.getElementById("pin-loading-spinner").hidden = true;
        status.textContent = document.getElementById("dashboard-status").textContent || "Não foi possível carregar os dados.";
        retry.hidden = false;
        retry.focus();
        return;
    }
    pinOverlay.style.display = "none";
    respPage.inert = false;
    respPage.classList.add("unlocked");
    document.getElementById("resp-heading").focus();
}
document.getElementById("pin-loading-retry").addEventListener("click", desbloquearDashboard);

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
    ++requestVersion;
    ++accessVersion;
    pinAutorizado = false;
    pinOverlay.classList.remove("loading-data");
    respPage.setAttribute("aria-busy", "false");
    diasExibidos = null;
    respPage.inert = true;
    criancasDashboard = [];
    criancaSelecionada = null;
    renderizarSeletor();
    atualizarTexto("dado-nome", "—");
    atualizarTexto("dado-inicial", "—");
    atualizarTexto("resp-nome", "Responsável");
    atualizarTexto("resp-crianca-nome-sub", "sua criança");
    mostrarEstado("");
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
    const response = await fetch(url, { credentials: "include", cache: "no-store", signal: AbortSignal.timeout(15000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) window.location.href = "/login";
        throw new Error(data.error || data.erro || "Não foi possível carregar os dados. Tente novamente.");
    }
    return data;
}

async function carregarDados() {
    const version = ++requestVersion;
    prepararPainel();
    document.getElementById("child-selector").replaceChildren();
    document.getElementById("child-selector").hidden = true;
    try {
        const [children, profile] = await Promise.all([
            buscarJSON("/children"), buscarJSON("/auth/profile")
        ]);
        if (version !== requestVersion) return;
        if (!Array.isArray(children.children)) throw new Error("Não foi possível carregar os perfis. Tente novamente.");
        criancasDashboard = children.children;
        const name = profile.responsavel?.nome_completo || profile.responsavel?.nome || "";
        atualizarTexto("resp-nome", name.trim().split(/\s+/)[0] || "Responsável");
        criancaSelecionada = criancasDashboard.find(c => c.id === criancaSelecionada?.id) || criancasDashboard[0] || null;
        renderizarSeletor();
        return await renderizarPainel(criancaSelecionada);
    } catch (error) {
        if (version === requestVersion) {
            criancasDashboard = [];
            criancaSelecionada = null;
            atualizarTexto("dado-nome", "—");
            atualizarTexto("dado-inicial", "—");
            mostrarEstado(error.name === "TimeoutError" ? "O carregamento demorou demais. Tente novamente." : error.message, true);
        }
        return false;
    }
}

function mostrarEstado(message, failed = false) {
    atualizarTexto("dashboard-status", message);
    document.getElementById("dashboard-retry").hidden = !failed;
    for (const id of ["stat-modulos", "stat-atividades", "stat-sequencia", "chart-total"]) atualizarTexto(id, "—");
    document.getElementById("daily-chart").hidden = true;
    document.getElementById("download-report").disabled = true;
}

function prepararPainel() {
    atualizarTexto("dashboard-status", "");
    document.getElementById("dashboard-retry").hidden = true;
    for (const id of ["stat-modulos", "stat-atividades", "stat-sequencia", "chart-total"]) atualizarTexto(id, "—");
    document.getElementById("daily-chart").hidden = true;
    document.getElementById("download-report").disabled = true;
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
        if (crianca.avatarUrl) {
            const imagem = document.createElement("img");
            imagem.src = crianca.avatarUrl;
            imagem.alt = "";
            avatar.appendChild(imagem);
        } else {
            avatar.textContent = obterInicial(nome);
        }

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
    if (crianca) prepararPainel();
    else mostrarEstado("Nenhuma criança cadastrada.");
    const nome = obterNome(crianca) || "Nenhuma criança cadastrada";
    atualizarTexto("resp-crianca-nome-sub", nome);
    atualizarTexto("dado-nome", nome);
    atualizarTexto("dado-inicial", obterInicial(nome));
    renderizarAvatar(crianca);
    if (!crianca) return true;
    try {
        const progresso = await buscarJSON("/api/activities/progress/" + encodeURIComponent(crianca.id));
        if (version !== requestVersion) return;
        atualizarTexto("dashboard-status", "");
        document.getElementById("daily-chart").hidden = false;
        atualizarTexto("stat-modulos", progresso.completedModules);
        atualizarTexto("stat-atividades", progresso.totalRealizations);
        atualizarTexto("stat-sequencia", progresso.streak.current + (progresso.streak.current === 1 ? " dia" : " dias"));
        const dias = progresso.daily.map(day => ({
            label: new Date(day.date + "T12:00:00Z").toLocaleDateString("pt-BR", {
                weekday: "short", timeZone: progresso.timeZone
            }).replace(".", ""),
            value: day.count
        }));
        const total = dias.reduce((sum, day) => sum + day.value, 0);
        atualizarTexto("chart-total", total + (total === 1 ? " atividade" : " atividades"));
        renderizarGrafico(dias);
        document.getElementById("download-report").disabled = false;
        return true;
    } catch (error) {
        if (version === requestVersion) mostrarEstado(error.name === "TimeoutError" ? "O carregamento demorou demais. Tente novamente." : error.message, true);
        return false;
    }
}

function renderizarAvatar(crianca) {
    const imagem = document.getElementById("child-avatar-image");
    const inicial = document.getElementById("dado-inicial");
    const botao = document.getElementById("child-avatar-edit");
    const possuiFoto = Boolean(crianca?.avatarUrl);
    imagem.hidden = !possuiFoto;
    imagem.src = possuiFoto ? crianca.avatarUrl : "";
    imagem.alt = possuiFoto ? `Foto de ${obterNome(crianca)}` : "";
    inicial.hidden = possuiFoto;
    botao.disabled = !crianca;
    botao.setAttribute("aria-label", possuiFoto ? "Alterar foto da criança" : "Adicionar foto da criança");
    atualizarTexto("child-avatar-status", "");
}

const avatarDialog = document.getElementById("avatar-dialog");
const avatarInput = document.getElementById("child-avatar-input");
const avatarButton = document.getElementById("child-avatar-edit");

avatarButton.addEventListener("click", () => {
    if (!criancaSelecionada) return;
    if (typeof avatarDialog.showModal === "function") avatarDialog.showModal();
    else avatarInput.click();
});

document.getElementById("avatar-dialog-confirm").addEventListener("click", () => {
    avatarInput.click();
});

avatarInput.addEventListener("change", async () => {
    const file = avatarInput.files?.[0];
    avatarInput.value = "";
    if (!file || !criancaSelecionada) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        atualizarTexto("child-avatar-status", "Use uma imagem JPEG, PNG ou WebP.");
        return;
    }
    if (file.size > 3 * 1024 * 1024) {
        atualizarTexto("child-avatar-status", "A imagem deve ter no máximo 3 MB.");
        return;
    }

    const childId = criancaSelecionada.id;
    avatarButton.disabled = true;
    atualizarTexto("child-avatar-status", "Salvando foto…");
    try {
        const response = await fetch(`/children/${encodeURIComponent(childId)}/avatar`, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            credentials: "include",
            signal: AbortSignal.timeout(20000),
            body: file,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Não foi possível salvar a foto.");
        const child = criancasDashboard.find(item => item.id === childId);
        if (child) child.avatarUrl = data.avatarUrl;
        if (criancaSelecionada?.id === childId) {
            renderizarAvatar(criancaSelecionada);
            atualizarTexto("child-avatar-status", "Foto atualizada.");
        }
        renderizarSeletor();
    } catch (error) {
        atualizarTexto("child-avatar-status", error.name === "TimeoutError" ? "O envio demorou demais. Tente novamente." : error.message);
    } finally {
        avatarButton.disabled = !criancaSelecionada;
    }
});

function escaparCSV(value) {
    let text = String(value ?? "");
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatarDataRelatorio(value) {
    return value ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
}

document.getElementById("download-report").addEventListener("click", async event => {
    const button = event.currentTarget;
    if (!criancaSelecionada || button.disabled) return;
    const child = criancaSelecionada;
    const original = button.querySelector("span").textContent;
    button.disabled = true;
    button.querySelector("span").textContent = "Preparando…";
    try {
        const report = await buscarJSON(`/api/activities/report/${encodeURIComponent(child.id)}`);
        const rows = [
            ["Relatório de atividades — TEKO"],
            ["Criança", obterNome(child)],
            ["Gerado em", new Date().toLocaleString("pt-BR")],
            ["Total de realizações", report.totalRealizations],
            [],
            ["Atividade", "Quantidade", "Primeira realização", "Última realização"],
            ...report.activities.map(item => [item.title, item.count, formatarDataRelatorio(item.firstCompletedAt), formatarDataRelatorio(item.lastCompletedAt)])
        ];
        const csv = "\ufeff" + rows.map(row => row.map(escaparCSV).join(";")).join("\r\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        const safeName = obterNome(child).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "crianca";
        link.href = url;
        link.download = `relatorio-teko-${safeName}.csv`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
        atualizarTexto("dashboard-status", error.name === "TimeoutError" ? "O relatório demorou demais. Tente novamente." : error.message);
    } finally {
        button.querySelector("span").textContent = original;
        button.disabled = !criancaSelecionada;
    }
});

function atualizarTexto(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
}

function obterInicial(nome) {
    return nome?.trim().charAt(0).toLocaleUpperCase("pt-BR") || "—";
}

function renderizarGrafico(dias) {
    diasExibidos = dias;
    const svg = document.getElementById("daily-chart-svg");
    const vazio = document.getElementById("chart-empty");
    const descricao = dias
        .map(dia => `${dia.label}: ${dia.value}`)
        .join(", ");

    const valores = dias.map(dia => Math.max(0, Number(dia.value) || 0));
    const possuiDados = valores.some(valor => valor > 0);
    const maximo = Math.max(4, ...valores);
    const largura = Math.max(280, svg.clientWidth || 640);
    svg.setAttribute("viewBox", `0 0 ${largura} 230`);
    const esquerda = 30;
    const direita = largura - 30;
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

window.addEventListener("focus", () => {
    if (respPage.classList.contains("unlocked")) carregarDados();
});

window.addEventListener("resize", () => {
    if (diasExibidos && !document.getElementById("daily-chart").hidden) renderizarGrafico(diasExibidos);
});
