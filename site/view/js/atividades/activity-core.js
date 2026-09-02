(() => {
    "use strict";

    function shuffle(items) {
        const copy = [...items];

        for (let index = copy.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(
                Math.random() * (index + 1)
            );

            [copy[index], copy[randomIndex]] = [
                copy[randomIndex],
                copy[index]
            ];
        }

        return copy;
    }

    function createScreenTransition(options) {
        const {
            screens,
            stage,
            duration = 220,
            activeScreens = ["jogo", "conclusao"]
        } = options;

        let pendingTimer = null;
        let sequence = 0;
        window.addEventListener("pagehide", () => {
            sequence += 1;
            window.clearTimeout(pendingTimer);
        });

        return function changeScreen(currentName, nextName, onEnter) {
            const currentSequence = ++sequence;
            window.clearTimeout(pendingTimer);
            function showNext() {
                if (currentSequence !== sequence) return;
                Object.keys(screens).forEach(key => {
                    if (key !== nextName) {
                        screens[key].hidden = true;
                        screens[key].classList.remove(
                            "activity-screen-fade-out",
                            "activity-screen-fade-in"
                        );
                    }
                });

                const nextScreen = screens[nextName];

                nextScreen.classList.add("activity-screen-fade-in");
                nextScreen.hidden = false;

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (currentSequence !== sequence) return;
                        nextScreen.classList.remove(
                            "activity-screen-fade-in"
                        );
                    });
                });

                stage.classList.toggle(
                    "activity-stage-active",
                    activeScreens.includes(nextName)
                );

                if (typeof onEnter === "function") {
                    onEnter();
                }
            }

            const currentScreen = screens[currentName];

            if (currentScreen && !currentScreen.hidden) {
                currentScreen.classList.add(
                    "activity-screen-fade-out"
                );

                pendingTimer = window.setTimeout(showNext, duration);
                return;
            }

            showNext();
        };
    }

    function createSuccessPopup(options) {
        const {
            popup,
            message,
            duration = 260
        } = options;

        function show(text) {
            message.textContent = text;
            popup.hidden = false;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    popup.classList.add(
                        "activity-success-popup-visible"
                    );
                });
            });
        }

        function hide(onFinish) {
            popup.classList.remove(
                "activity-success-popup-visible"
            );

            setTimeout(() => {
                popup.hidden = true;

                if (typeof onFinish === "function") {
                    onFinish();
                }
            }, duration);
        }

        return { show, hide };
    }

    function createLevelTransition(options) {
        const {
            container,
            hold = 850,
            duration = 220
        } = options;

        let holdTimer = null;
        let swapTimer = null;
        let sequence = 0;

        function cancel() {
            sequence += 1;
            window.clearTimeout(holdTimer);
            window.clearTimeout(swapTimer);
            holdTimer = null;
            swapTimer = null;
            container.classList.remove(
                "activity-level-leaving",
                "activity-level-entering"
            );
        }

        function run(onSwap, onFinish) {
            cancel();
            const currentSequence = sequence;

            holdTimer = window.setTimeout(() => {
                if (currentSequence !== sequence) {
                    return;
                }

                container.classList.add("activity-level-leaving");

                swapTimer = window.setTimeout(() => {
                    if (currentSequence !== sequence) {
                        return;
                    }

                    if (typeof onSwap === "function") {
                        onSwap();
                    }

                    container.classList.remove("activity-level-leaving");
                    container.classList.add("activity-level-entering");

                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            if (currentSequence !== sequence) {
                                return;
                            }

                            container.classList.remove("activity-level-entering");

                            if (typeof onFinish === "function") {
                                onFinish();
                            }
                        });
                    });
                }, duration);
            }, hold);
        }

        return { run, cancel };
    }

    // Entrada guiada: o jogo é preparado antes do aviso, mas só é
    // liberado depois da contagem. Nenhum cronômetro deve começar no show().
    function createEntryGate({ stage, game, instruction, onStart }) {
        const overlay = document.createElement("div");
        overlay.className = "activity-entry-overlay";
        overlay.hidden = true;
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-labelledby", "activity-entry-instruction");

        const card = document.createElement("div");
        card.className = "activity-entry-card";
        card.tabIndex = -1;
        const title = document.createElement("h2");
        title.id = "activity-entry-instruction";
        title.className = "activity-entry-instruction";
        title.textContent = instruction;
        const start = document.createElement("button");
        start.type = "button";
        start.className = "activity-start-button activity-entry-start";
        start.textContent = "Iniciar";
        const countdown = document.createElement("p");
        countdown.className = "activity-entry-countdown";
        countdown.setAttribute("role", "status");
        countdown.setAttribute("aria-live", "polite");
        countdown.setAttribute("aria-atomic", "true");
        countdown.hidden = true;
        card.append(title, start, countdown);
        overlay.appendChild(card);
        stage.appendChild(overlay);

        let frame = null;
        let previousTime = null;
        let elapsed = 0;
        let counting = false;
        let blocking = false;
        let previousInert = false;
        let previousAriaHidden = null;

        function cancel() {
            window.cancelAnimationFrame(frame);
            frame = null;
            counting = false;
            previousTime = null;
            overlay.hidden = true;
            if (blocking) {
                game.inert = previousInert;
                if (previousAriaHidden === null) game.removeAttribute("aria-hidden");
                else game.setAttribute("aria-hidden", previousAriaHidden);
                game.classList.remove("activity-entry-blocked");
            }
            blocking = false;
        }

        function show() {
            cancel();
            previousInert = game.inert;
            previousAriaHidden = game.getAttribute("aria-hidden");
            blocking = true;
            game.inert = true;
            game.setAttribute("aria-hidden", "true");
            game.classList.add("activity-entry-blocked");
            overlay.hidden = false;
            overlay.removeAttribute("aria-label");
            overlay.setAttribute("aria-labelledby", title.id);
            title.hidden = false;
            start.hidden = false;
            start.disabled = false;
            countdown.hidden = true;
            countdown.textContent = "";
            card.classList.remove("is-counting");
            // O primeiro Tab alcança Iniciar; não realça o botão ao abrir.
            card.focus({ preventScroll: true });
        }

        // Recria somente o número para repetir a animação definida no CSS.
        // O contador e seu tempo continuam sendo controlados pelo tick().
        function renderCountdown(value) {
            const digit = document.createElement("span");
            digit.className = "activity-entry-number";
            digit.textContent = value;
            countdown.replaceChildren(digit);
        }

        function tick(now) {
            if (!counting) return;
            if (!document.hidden) {
                if (previousTime !== null) elapsed += now - previousTime;
                previousTime = now;
            } else previousTime = null;

            if (elapsed >= 3000) {
                cancel();
                onStart?.();
                if (!game.contains(document.activeElement)) {
                    const target = game.querySelector("button:not([disabled]), [tabindex='0']");
                    if (target) target.focus({ preventScroll: true });
                    else {
                        game.tabIndex = -1;
                        game.focus({ preventScroll: true });
                    }
                }
                return;
            }

            const remaining = String(3 - Math.floor(elapsed / 1000));
            if (countdown.textContent !== remaining) renderCountdown(remaining);
            frame = window.requestAnimationFrame(tick);
        }

        start.addEventListener("click", () => {
            if (counting || !blocking) return;
            counting = true;
            elapsed = 0;
            previousTime = null;
            start.disabled = true;
            title.hidden = true;
            start.hidden = true;
            countdown.hidden = false;
            renderCountdown("3");
            card.classList.add("is-counting");
            overlay.removeAttribute("aria-labelledby");
            overlay.setAttribute("aria-label", "Prepare-se para começar");
            card.focus({ preventScroll: true });
            frame = window.requestAnimationFrame(tick);
        });

        // Interrompe também cliques sintéticos durante a instrução.
        const blockInput = event => {
            if (!blocking) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        };
        ["click", "pointerdown", "keydown", "dragstart"].forEach(type => {
            game.addEventListener(type, blockInput, true);
        });
        document.addEventListener("visibilitychange", () => { previousTime = null; });
        window.addEventListener("pagehide", cancel);
        return { show, cancel };
    }

    window.TekoActivityCore = Object.freeze({
        shuffle,
        createScreenTransition,
        createSuccessPopup,
        createLevelTransition,
        createEntryGate
    });
})();
