document.addEventListener("DOMContentLoaded", () => {
    const moduleButtons = [...document.querySelectorAll(".module-btn")];
    const grids = [...document.querySelectorAll(".atv-grid")];

    function animateGrid(id) {
        const cards = document.querySelectorAll(`#${id} .atv-card`);

        gsap.fromTo(
            cards,
            { opacity: 0, y: 22, scale: 0.97 },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.45,
                ease: "power2.out",
                stagger: 0.055,
                clearProps: "transform"
            }
        );
    }

    function selectModule(category) {
        const button = moduleButtons.find(
            item => item.dataset.cat === category
        );

        const target = document.getElementById(`grid-${category}`);

        if (!button || !target) {
            return false;
        }

        moduleButtons.forEach(item => {
            const isActive = item === button;

            item.classList.toggle("active", isActive);
            item.setAttribute("aria-checked", String(isActive));
        });

        grids.forEach(grid => {
            const isActive = grid === target;

            grid.classList.toggle("active", isActive);
            grid.toggleAttribute("hidden", !isActive);
        });

        requestAnimationFrame(() => {
            target.classList.add("active");
            animateGrid(target.id);
        });

        return true;
    }

    moduleButtons.forEach(button => {
        button.addEventListener("click", () => {
            selectModule(button.dataset.cat);
        });
    });

    document.querySelectorAll('.atv-card[href="#"]').forEach(card => {
        card.setAttribute("aria-disabled", "true");

        card.addEventListener("click", event => {
            event.preventDefault();
        });
    });

    const requestedModule = new URLSearchParams(
        window.location.search
    ).get("modulo");

    if (!selectModule(requestedModule)) {
        selectModule("emocoes");
    }

    document.body.style.opacity = "1";
});

// As marcas vêm do servidor para a criança ativa, nunca de flags no navegador.
document.addEventListener("DOMContentLoaded", () => {
    const cards = [...document.querySelectorAll(".atv-card[data-activity-id]")];
    const status = document.getElementById("activity-progress-status");
    const api = window.TekoActivityProgress;
    let requestSequence = 0;

    function clearMarks() {
        cards.forEach(card => {
            card.classList.remove("is-completed");
            card.querySelector(".atv-completed-badge")?.remove();
        });
    }

    async function refreshCompletions() {
        const sequence = ++requestSequence;
        const childId = api.readChildId();
        clearMarks();
        if (!childId) {
            status.textContent = "Selecione uma criança para consultar as atividades concluídas.";
            return;
        }
        status.textContent = "Carregando atividades concluídas…";
        try {
            const data = await api.loadCompleted(childId);
            // Uma resposta antiga nunca pode marcar os cards de outra criança.
            if (sequence !== requestSequence || api.readChildId() !== childId) return;
            const completed = new Set(data.completedActivityIds);
            cards.forEach(card => {
                if (!completed.has(card.dataset.activityId)) return;
                const badge = document.createElement("span");
                badge.className = "atv-completed-badge";
                badge.setAttribute("role", "img");
                badge.setAttribute("aria-label", "Atividade concluída");
                badge.title = "Atividade concluída — você pode jogar novamente";
                badge.textContent = "✓";
                card.classList.add("is-completed");
                card.appendChild(badge);
            });
            status.textContent = "";
        } catch {
            if (sequence !== requestSequence) return;
            status.textContent = "Não foi possível carregar as conclusões. Recarregue a página para tentar novamente.";
        }
    }

    window.addEventListener("teko:session-changed", refreshCompletions);
    window.addEventListener("teko:activity-saved", refreshCompletions);
    window.addEventListener("pageshow", refreshCompletions);
    window.addEventListener("storage", event => {
        if (event.key === "teko_session" || event.key === null) refreshCompletions();
    });
    void refreshCompletions();
});
