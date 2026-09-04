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
        mostrarToast("Área desbloqueada!");
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
async function carregarDados() {
    const sessao = lerJsonLocal("teko_session", {});
    atualizarNomeResponsavel(sessao?.responsavel);

    const criancaAtiva = sessao?.crianca || null;
    const criancasLocais = lerJsonLocal("teko_registered_children", []);
    const [criancasRemotas, responsavelRemoto] = await Promise.all([
        buscarCriancas(),
        buscarPerfilResponsavel()
    ]);

    atualizarNomeResponsavel(responsavelRemoto);

    criancasDashboard = fundirCriancas(
        Array.isArray(criancasRemotas) ? criancasRemotas : [],
        Array.isArray(criancasLocais) ? criancasLocais : [],
        criancaAtiva ? [criancaAtiva] : []
    );

    const idAtivo = obterId(criancaAtiva);
    criancaSelecionada =
        criancasDashboard.find(crianca => idsIguais(obterId(crianca), idAtivo)) ||
        criancasDashboard[0] ||
        null;

    renderizarSeletor();
    renderizarPainel(criancaSelecionada);
}

function atualizarNomeResponsavel(responsavel) {
    const nomeCompleto = String(
        responsavel?.nome_completo ||
        responsavel?.nome ||
        ""
    ).trim();

    if (!nomeCompleto) return;

    atualizarTexto("resp-nome", nomeCompleto.split(/\s+/)[0]);
}

async function buscarPerfilResponsavel() {
    try {
        const resposta = await fetch("/auth/profile", {
            credentials: "include",
            cache: "no-store"
        });

        const resultado = await resposta.json().catch(() => ({}));

        if (resposta.status === 401) {
            window.location.href = "/login";
            return null;
        }

        if (!resposta.ok) {
            throw new Error(
                resultado.erro ||
                "Não foi possível buscar o perfil do responsável."
            );
        }

        return resultado.responsavel || null;
    } catch (erro) {
        console.warn("Não foi possível atualizar o nome do responsável:", erro);
        return null;
    }
}

async function buscarCriancas() {
    try {
        const resposta = await fetch("/children", {
            credentials: "include"
        });

        const resultado = await resposta.json().catch(() => ({}));

        if (resposta.status === 401) {
            window.location.href = "/login";
            return [];
        }

        if (!resposta.ok) {
            throw new Error(resultado.error || "Não foi possível buscar as crianças.");
        }

        const lista = resultado.children || resultado.criancas || resultado;
        return Array.isArray(lista) ? lista.filter(Boolean) : lista ? [lista] : [];
    } catch (erro) {
        console.warn("Não foi possível atualizar as crianças do painel:", erro);
        return [];
    }
}

function lerJsonLocal(chave, fallback) {
    try {
        const valor = JSON.parse(localStorage.getItem(chave));
        return valor ?? fallback;
    } catch (erro) {
        return fallback;
    }
}

function fundirCriancas(...listas) {
    const resultado = [];

    listas.flat().filter(Boolean).forEach(crianca => {
        const id = obterId(crianca);
        const nome = obterNome(crianca).toLocaleLowerCase("pt-BR");

        const indice = resultado.findIndex(item => {
            const mesmoId = id && idsIguais(obterId(item), id);
            const mesmoNome = nome &&
                obterNome(item).toLocaleLowerCase("pt-BR") === nome;
            return mesmoId || mesmoNome;
        });

        const normalizada = {
            ...crianca,
            nome: obterNome(crianca) || "Criança"
        };

        if (indice >= 0) {
            resultado[indice] = {
                ...resultado[indice],
                ...normalizada,
                nome: obterNome(normalizada) || obterNome(resultado[indice])
            };
        } else {
            resultado.push(normalizada);
        }
    });

    return resultado.slice(0, 2);
}

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
    mostrarToast(`Exibindo os dados de ${obterNome(crianca)}.`);
}

function renderizarPainel(crianca) {
    if (!crianca) {
        atualizarTexto("resp-crianca-nome-sub", "sua criança");
        atualizarTexto("dado-nome", "Nenhuma criança cadastrada");
        atualizarTexto("dado-inicial", "—");
        renderizarProgresso(criarProgressoVazio(), "");
        return;
    }

    const nome = obterNome(crianca) || "Criança";

    atualizarTexto("resp-crianca-nome-sub", nome);
    atualizarTexto("dado-nome", nome);
    atualizarTexto("dado-inicial", obterInicial(nome));

    renderizarProgresso(obterProgresso(crianca), nome);
}

function atualizarTexto(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
}

function obterInicial(nome) {
    return nome?.trim().charAt(0).toLocaleUpperCase("pt-BR") || "—";
}

/* ════════════════════════════════════════
   PROGRESSO — pronto para integração futura
════════════════════════════════════════ */
function criarDiasPadrao() {
    const hoje = new Date();

    return Array.from({ length: 7 }, (_, indice) => {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - (6 - indice));

        const rotulo = data
            .toLocaleDateString("pt-BR", { weekday: "short" })
            .replace(".", "");

        return {
            label: rotulo.charAt(0).toLocaleUpperCase("pt-BR") + rotulo.slice(1),
            value: 0
        };
    });
}

function criarProgressoVazio() {
    return {
        dias: criarDiasPadrao(),
        total: 0,
        modulosConcluidos: 0,
        diasAtivos: 0,
        tentativas: 0,
        erros: 0,
        taxaAcerto: 0,
        areas: {
            emocoes: 0,
            comunicacao: 0,
            comportamento: 0
        }
    };
}

function obterProgresso(crianca) {
    const origem = crianca?.progresso || crianca?.progress || {};
    const diario =
        origem.diario ||
        origem.ultimos7Dias ||
        origem.daily ||
        [];

    const diasPadrao = criarDiasPadrao();
    const dias = diasPadrao.map((dia, indice) => {
        const registro = diario[indice];
        const valor = typeof registro === "object"
            ? registro?.value ?? registro?.valor ?? registro?.atividades ?? registro?.total
            : registro;

        return {
            label: dia.label,
            value: Math.max(0, Number(valor) || 0)
        };
    });

    const somaPeriodo = dias.reduce((total, dia) => total + dia.value, 0);
    const areasOrigem = origem.areas || {};
    const tentativas = Math.max(
        0,
        Number(origem.tentativas ?? origem.totalTentativas ?? 0) || 0
    );
    const erros = Math.min(
        tentativas,
        Math.max(0, Number(origem.erros ?? origem.totalErros ?? 0) || 0)
    );
    const taxaAcertoInformada =
        origem.taxaAcerto ?? origem.taxa_acerto ?? origem.acertos;

    return {
        dias,
        total: Math.max(
            0,
            Number(
                origem.total ??
                origem.atividadesConcluidas ??
                origem.atividades_feitas ??
                somaPeriodo
            ) || 0
        ),
        modulosConcluidos: Math.max(
            0,
            Number(
                origem.modulosConcluidos ??
                origem.modulos_concluidos ??
                0
            ) || 0
        ),
        diasAtivos: Math.max(
            0,
            Number(
                origem.diasAtivos ??
                origem.dias_ativos ??
                origem.diasSeguidos ??
                origem.dias_seguidos ??
                dias.filter(dia => dia.value > 0).length
            ) || 0
        ),
        tentativas,
        erros,
        taxaAcerto: limitarPercentual(
            taxaAcertoInformada ??
            (tentativas > 0
                ? ((tentativas - erros) / tentativas) * 100
                : 0)
        ),
        areas: {
            emocoes: limitarPercentual(areasOrigem.emocoes ?? 0),
            comunicacao: limitarPercentual(areasOrigem.comunicacao ?? 0),
            comportamento: limitarPercentual(areasOrigem.comportamento ?? 0)
        }
    };
}

function limitarPercentual(valor) {
    return Math.min(100, Math.max(0, Number(valor) || 0));
}

function calcularDificuldade(erros, tentativas) {
    if (!tentativas) return "Sem dados";

    const taxaDeErro = erros / tentativas;

    if (taxaDeErro <= 0.2) return "Baixa";
    if (taxaDeErro <= 0.5) return "Moderada";
    return "Alta";
}

function renderizarProgresso(progresso, nomeCrianca) {
    const totalPeriodo = progresso.dias.reduce(
        (total, dia) => total + dia.value,
        0
    );

    atualizarTexto("stat-modulos", progresso.modulosConcluidos);
    atualizarTexto("stat-atividades", progresso.total);
    atualizarTexto(
        "stat-dificuldade",
        calcularDificuldade(progresso.erros, progresso.tentativas)
    );
    atualizarTexto(
        "chart-total",
        `${totalPeriodo} ${totalPeriodo === 1 ? "atividade" : "atividades"}`
    );

    renderizarGrafico(progresso.dias);
    renderizarAnalise(progresso, nomeCrianca);
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

function renderizarAnalise(progresso, nomeCrianca) {
    const semDados = progresso.total === 0 &&
        progresso.dias.every(dia => dia.value === 0);

    if (semDados) {
        atualizarTexto("analysis-kicker", "Começando agora");
        atualizarTexto("analysis-headline", "Ainda não há atividades registradas");
        atualizarTexto("analysis-frequency", "Sem dados suficientes");
        atualizarTexto("analysis-area", "Aguardando atividades");
        atualizarTexto("analysis-next", "Realizar a primeira atividade");
        atualizarTexto(
            "teko-summary-text",
            `Quando as atividades de ${nomeCrianca || "sua criança"} forem registradas, o TEKO.IA reunirá aqui uma leitura simples do progresso para apoiar o acompanhamento do responsável.`
        );
        return;
    }

    const nomesAreas = {
        emocoes: "Emoções",
        comunicacao: "Comunicação",
        comportamento: "Comportamento"
    };

    const areasOrdenadas = Object.entries(progresso.areas)
        .sort(([, valorA], [, valorB]) => valorB - valorA);

    const melhorArea = areasOrdenadas[0];
    const proximaArea = areasOrdenadas[areasOrdenadas.length - 1];
    const nome = nomeCrianca || "A criança";

    atualizarTexto(
        "analysis-kicker",
        progresso.diasAtivos >= 4 ? "Boa participação" : "Progresso em construção"
    );
    atualizarTexto(
        "analysis-headline",
        `${nome} participou em ${progresso.diasAtivos} ${progresso.diasAtivos === 1 ? "dia" : "dias"} neste período`
    );
    atualizarTexto(
        "analysis-frequency",
        progresso.diasAtivos >= 4 ? "Participação frequente" : "Participação inicial"
    );
    atualizarTexto(
        "analysis-area",
        melhorArea?.[1] > 0 ? nomesAreas[melhorArea[0]] : "Em construção"
    );
    atualizarTexto(
        "analysis-next",
        proximaArea?.[1] > 0
            ? `Explorar mais atividades de ${nomesAreas[proximaArea[0]]}`
            : "Continuar experimentando novas atividades"
    );
    atualizarTexto(
        "teko-summary-text",
        `${nome} concluiu ${progresso.total} ${progresso.total === 1 ? "atividade" : "atividades"} e esteve presente em ${progresso.diasAtivos} ${progresso.diasAtivos === 1 ? "dia" : "dias"}. O acompanhamento deve respeitar seu ritmo e valorizar cada pequena conquista.`
    );
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
