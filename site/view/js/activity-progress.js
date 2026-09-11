(() => {
    "use strict";

    function readChildId() {
        try {
            return JSON.parse(localStorage.getItem("teko_session") || "{}")?.crianca?.id || null;
        } catch {
            return null;
        }
    }

    async function request(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            cache: "no-store",
            ...options
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success !== true) {
            throw new Error(response.status === 401
                ? "Sua sessão expirou. Entre novamente para salvar."
                : data.error || "Não foi possível salvar agora. Tente novamente.");
        }
        return data;
    }

    function createId() {
        if (window.crypto.randomUUID) return window.crypto.randomUUID();
        const bytes = window.crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 15) | 64;
        bytes[8] = (bytes[8] & 63) | 128;
        const hex = [...bytes].map(value => value.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    let attempt = null;
    function beginAttempt() {
        attempt = {
            childId: readChildId(),
            activityId: document.body.dataset.activityId,
            realizationId: createId(),
            pending: false,
            saved: false,
            payload: null
        };
    }

    function invalidateAttempt() { attempt = null; }
    window.addEventListener("teko:session-changed", invalidateAttempt);
    window.addEventListener("storage", event => {
        if (event.key === "teko_session" || event.key === null) invalidateAttempt();
    });

    function showCompletion(screen) {
        if (!screen) return;
        const current = attempt;

        function removeStatus() {
            screen.querySelector(".activity-save-status")?.remove();
        }

        function showFailure(message, canRetry = false) {
            let status = screen.querySelector(".activity-save-status");
            if (!status) {
                status = document.createElement("div");
                status.className = "activity-save-status";
                const text = document.createElement("p");
                text.setAttribute("role", "alert");
                const retry = document.createElement("button");
                retry.type = "button";
                retry.className = "activity-save-retry";
                retry.textContent = "Tentar salvar novamente";
                status.append(text, retry);
                screen.appendChild(status);
            }
            status.querySelector("p").textContent = message;
            const retry = status.querySelector("button");
            retry.hidden = !canRetry;
            retry.onclick = save;
        }

        async function save() {
            if (!current?.childId || attempt !== current || readChildId() !== current.childId) {
                showFailure("Selecione seu perfil e inicie a atividade novamente para registrar a conclusão.");
                return;
            }
            if (current.saved) return;
            if (current.pending) return;
            current.pending = true;
            removeStatus();
            // Só congela o resultado ao concluir, nunca ao abrir/iniciar a atividade.
            current.payload ||= {
                childId: current.childId,
                activityId: current.activityId,
                realizationId: current.realizationId,
                resultado: { concluida: true }
            };
            try {
                await request("/api/activities/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(current.payload),
                    keepalive: true,
                    signal: AbortSignal.timeout(15000)
                });
                current.saved = true;
                if (attempt !== current) return;
                removeStatus();
                window.dispatchEvent(new CustomEvent("teko:activity-saved", {
                    detail: { childId: current.childId, activityId: current.activityId }
                }));
            } catch (error) {
                if (attempt !== current) return;
                showFailure(`Você concluiu a atividade, mas o registro ainda não foi confirmado. ${error.message}`, true);
            } finally {
                current.pending = false;
            }
        }
        void save();
    }

    document.addEventListener("teko:activity-started", beginAttempt);
    document.addEventListener("teko:activity-completed", event => showCompletion(event.detail?.screen));

    window.TekoActivityProgress = Object.freeze({
        readChildId,
        async loadCompleted(childId) {
            return request(`/api/activities/progress/${encodeURIComponent(childId)}`);
        }
    });
})();
