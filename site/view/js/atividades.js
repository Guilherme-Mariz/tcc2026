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

    function focusReturnedActivity() {
        if (!window.location.hash) {
            return;
        }

        const activity = document.getElementById(
            window.location.hash.slice(1)
        );

        if (!activity || !activity.classList.contains("atv-card")) {
            return;
        }

        requestAnimationFrame(() => {
            activity.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? "auto"
                    : "smooth",
                block: "center"
            });

            activity.focus({ preventScroll: true });
        });
    }

    moduleButtons.forEach(button => {
        button.addEventListener("click", () => {
            selectModule(button.dataset.cat);
        });
    });

    document.querySelectorAll(".atv-card-slideshow").forEach(wrapper => {
        const images = wrapper.querySelectorAll("img");

        if (images.length < 2) {
            return;
        }

        let current = 0;

        window.setInterval(() => {
            images[current].classList.remove("active");
            current = (current + 1) % images.length;
            images[current].classList.add("active");
        }, 5000);
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

    const initialModule = selectModule(requestedModule)
        ? requestedModule
        : "emocoes";

    if (initialModule === "emocoes" && requestedModule !== "emocoes") {
        selectModule("emocoes");
    }

    document.body.style.opacity = "1";
    focusReturnedActivity();
});
