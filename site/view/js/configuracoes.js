const cards = [...document.querySelectorAll(".cfg-card")];
const saveButton = document.querySelector(".btn-save");
const resetButton = document.getElementById("cfg-reset");
const retryButton = document.getElementById("cfg-retry");
const statusText = document.getElementById("cfg-status");
const font = document.getElementById("font-slider");
const volume = document.getElementById("vol-narracao");
const toggles = {
    darkMode: "darkMode", toggle_cursor: "toggle-cursor", "toggle_reduced-motion": "toggle-reduced-motion",
    toggle_narracao: "toggle-narracao", toggle_efeitos: "toggle-efeitos"
};
let saving = false;

function toggleSection(id) {
    const selected = document.getElementById(id);
    const open = !selected.classList.contains("open");
    for (const card of cards) {
        const active = card === selected && open;
        card.classList.toggle("open", active);
        card.querySelector(".cfg-card-header").setAttribute("aria-expanded", active);
        card.querySelector(".cfg-card-body").hidden = !active;
    }
}

function setSpeed(selected) {
    for (const btn of document.querySelectorAll(".speed-btn")) {
        btn.classList.toggle("active", btn === selected);
        btn.setAttribute("aria-pressed", btn === selected);
    }
}

function values() {
    const cfg = { fontScale: Number(font.value), volNarracao: Number(volume.value),
        speed: document.querySelector(".speed-btn.active").dataset.speed };
    for (const [key, id] of Object.entries(toggles)) cfg[key] = document.getElementById(id).checked;
    return cfg;
}

function preview() {
    const cfg = values();
    TekoPreferencias.aplicar(cfg);
    document.getElementById("font-preview").textContent = "Olá! Estou aprendendo com o TEKO!";
    volume.style.setProperty("--volume", cfg.volNarracao + "%");
    document.getElementById("vol-narracao-pct").textContent = cfg.volNarracao + "%";
}

function lock(locked) {
    for (const card of cards) card.inert = locked;
    saveButton.disabled = resetButton.disabled = locked;
}

function render() {
    const cfg = TekoPreferencias.atual;
    lock(!cfg || saving);
    retryButton.hidden = true;
    if (!cfg) {
        statusText.textContent = TekoPreferencias.perfil() ? "Carregando preferências…" : "Escolha uma criança em Trocar sessão.";
        return;
    }
    font.value = cfg.fontScale;
    volume.value = cfg.volNarracao;
    for (const [key, id] of Object.entries(toggles)) document.getElementById(id).checked = cfg[key];
    setSpeed(document.querySelector('.speed-btn[data-speed="' + cfg.speed + '"]'));
    preview();
    statusText.textContent = "As escolhas ficam salvas no perfil desta criança.";
}

async function salvar(reset = false) {
    if (saving || !TekoPreferencias.atual) return;
    saving = true;
    lock(true);
    const id = TekoPreferencias.perfil();
    try {
        await TekoPreferencias.salvar(reset ? {} : values());
        statusText.textContent = reset ? "Preferências padrão restauradas." : "Preferências salvas.";
    } catch {
        if (id === TekoPreferencias.perfil()) statusText.textContent = "Falha ao salvar. Tente novamente.";
    } finally {
        saving = false;
        lock(!TekoPreferencias.atual);
    }
}

function resetarConfiguracoes() { return salvar(true); }
function loadError() {
    statusText.textContent = "Não foi possível carregar as preferências.";
    retryButton.hidden = false;
}
window.addEventListener("teko:preferencias", render);
window.addEventListener("teko:preferencias-erro", loadError);
document.querySelector(".cfg-page").addEventListener("input", preview);
retryButton.addEventListener("click", TekoPreferencias.carregar);
saveButton.addEventListener("click", () => salvar());
toggleSection("sec-visual");
render();
if (TekoPreferencias.falhou) loadError();
