(() => {
    "use strict";

    if (window.__tekoSiteShellInitialized) return;
    window.__tekoSiteShellInitialized = true;

    const TRANSITION_TIME = 180;

    function getElement(id) {
        return document.getElementById(id);
    }

    function openDrawer() {
        const drawer = getElement("mobile_drawer");
        const overlay = getElement("mobile_overlay");

        if (!drawer || !overlay) return;

        drawer.classList.add("active");
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
        getElement("mobile_drawer")?.classList.remove("active");
        getElement("mobile_overlay")?.classList.remove("active");

        if (!getElement("logout-overlay")?.classList.contains("active")) {
            document.body.style.overflow = "";
        }
    }

    function openLogout() {
        const overlay = getElement("logout-overlay");

        if (!overlay) return;

        overlay.classList.add("active");
        overlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeLogout() {
        const overlay = getElement("logout-overlay");

        if (!overlay) return;

        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    function goTo(href) {
        if (!href || href === "#") return;

        document.body.classList.add("page-leaving");

        window.setTimeout(() => {
            window.location.href = href;
        }, TRANSITION_TIME);
    }

    async function confirmLogout() {
        try {
            await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });
        } catch (error) {
            console.error("Erro ao encerrar sessão:", error);
        } finally {
            localStorage.removeItem("teko_session");
            localStorage.removeItem("teko_streak");
            sessionStorage.removeItem("teko_iniciar_sessao");
            goTo("/login");
        }
    }

    function getActiveName() {
        try {
            const session = JSON.parse(
                localStorage.getItem("teko_session") || "{}"
            );

            return (
                session?.crianca?.nome ||
                session?.crianca?.nome_completo ||
                session?.responsavel?.nome_completo ||
                session?.user?.email?.split("@")[0] ||
                "T"
            );
        } catch (error) {
            return "T";
        }
    }

    function updateAvatars() {
        const initial = getActiveName().trim().charAt(0).toUpperCase() || "T";

        document
            .querySelectorAll("#user-avatar, #user-avatar-mobile")
            .forEach(element => {
                element.textContent = initial;
            });
    }

    function bindNavigation() {
        document.querySelectorAll("[data-nav]").forEach(link => {
            link.addEventListener("click", event => {
                const href = link.getAttribute("href");

                if (!href || href === "#") {
                    event.preventDefault();
                    return;
                }

                event.preventDefault();
                goTo(href);
            });
        });
    }

    function bindDrawer() {
        getElement("mobile_btn")?.addEventListener("click", openDrawer);
        getElement("mobile_close")?.addEventListener("click", closeDrawer);
        getElement("mobile_overlay")?.addEventListener("click", closeDrawer);

        getElement("mobile_drawer")
            ?.querySelectorAll("a")
            .forEach(link => {
                link.addEventListener("click", closeDrawer);
            });
    }

    function bindLogout() {
        document.querySelectorAll("[data-logout-open]").forEach(button => {
            button.addEventListener("click", openLogout);
        });

        getElement("logout-cancel")?.addEventListener("click", closeLogout);
        getElement("logout-confirm")?.addEventListener("click", confirmLogout);

        getElement("logout-overlay")?.addEventListener("click", event => {
            if (event.target === event.currentTarget) {
                closeLogout();
            }
        });
    }

    function init() {
        bindNavigation();
        bindDrawer();
        bindLogout();
        updateAvatars();

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeDrawer();
                closeLogout();
            }
        });

        window.addEventListener("teko:session-changed", updateAvatars);
    }

    window.abrirLogout = openLogout;
    window.fecharLogout = closeLogout;
    window.confirmarLogout = confirmLogout;
    window.abrirMenu = openDrawer;
    window.fecharMenu = closeDrawer;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
