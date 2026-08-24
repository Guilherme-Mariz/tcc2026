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

        return function changeScreen(currentName, nextName, onEnter) {
            function showNext() {
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

                setTimeout(showNext, duration);
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

    window.TekoActivityCore = Object.freeze({
        shuffle,
        createScreenTransition,
        createSuccessPopup,
        createLevelTransition
    });
})();
