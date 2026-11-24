const TekoPreferencias = (() => {
    const defaults = Object.freeze({
        darkMode: false, fontScale: 1, speed: "normal", volNarracao: 80,
        toggle_cursor: false, "toggle_reduced-motion": true, toggle_narracao: true, toggle_efeitos: false
    });
    let current = null;
    let loadedChild = null;
    let generation = 0;
    let falhou = false;
    function perfil() {
        try { return JSON.parse(localStorage.getItem("teko_session"))?.crianca?.id || null; }
        catch { return null; }
    }
    function aplicar(cfg) {
        const root = document.documentElement;
        root.classList.toggle("tema-escuro", cfg.darkMode);
        root.classList.toggle("cursor-grande", cfg.toggle_cursor);
        // A chave histórica representa a caixa “Animações e efeitos” marcada.
        root.classList.toggle("menos-movimento", !cfg["toggle_reduced-motion"]);
        root.style.fontSize = (cfg.fontScale * 100) + "%";
    }
    async function request(id, method, value) {
        const response = await fetch("/children/" + encodeURIComponent(id) + "/preferencias", {
            method, cache: "no-store", credentials: "same-origin",
            headers: {"Content-Type": "application/json"}, body: JSON.stringify(value)
        });
        if (!response.ok) throw Error("Falha ao acessar as preferências.");
        return { ...defaults, ...await response.json() };
    }
    function notify() {
        window.dispatchEvent(new Event("teko:preferencias"));
    }
    async function carregar() {
        const version = ++generation;
        falhou = false;
        const id = perfil();
        loadedChild = null;
        current = null;
        aplicar(defaults);
        notify();
        if (!id) return;
        try {
            const cfg = await request(id, "GET");
            if (version !== generation || id !== perfil()) return;
            loadedChild = id;
            current = cfg;
            aplicar(cfg);
            notify();
        } catch {
            if (version !== generation) return;
            falhou = true;
            window.dispatchEvent(new Event("teko:preferencias-erro"));
        }
    }
    async function salvar(value) {
        const id = perfil();
        const version = generation;
        if (!id || loadedChild !== id) throw Error("Selecione a criança novamente.");
        const cfg = await request(id, "PUT", value);
        if (generation !== version || perfil() !== id) throw Error("O perfil foi alterado.");
        current = cfg;
        aplicar(cfg);
        notify();
        channel?.postMessage(id);
    }
    const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("teko-preferencias") : null;
    if (channel) channel.onmessage = event => { if (event.data === perfil()) carregar(); };
    window.addEventListener("teko:session-changed", carregar);
    window.addEventListener("storage", e => { if (e.key === "teko_session" || e.key === null) carregar(); });
    window.addEventListener("pageshow", e => { if (e.persisted) carregar(); });
    carregar();
    return { perfil, aplicar, carregar, salvar, defaults, get falhou() { return falhou; }, get atual() { return loadedChild === perfil() ? current : null; } };
})();
