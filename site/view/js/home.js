document.addEventListener("DOMContentLoaded", () => {
    const welcomeName = document.getElementById("child-name");
    const profileName = document.getElementById("profile-child-name");
    const profileCard = document.querySelector(".profile-summary");
    const colorPicker = document.getElementById("profile-color");

    function getName(child) {
        return (
            child?.nome ||
            child?.nome_completo ||
            child?.firstName ||
            child?.nomeCrianca ||
            ""
        );
    }

    function getId(child) {
        return (
            child?.id ||
            child?.crianca_id ||
            child?.child_id ||
            getName(child)
        );
    }

    function getActiveChild() {
        try {
            const session = JSON.parse(
                localStorage.getItem("teko_session") || "{}"
            );

            return session?.crianca || null;
        } catch (error) {
            return null;
        }
    }

    function updateNames(child) {
        const fullName = getName(child);
        const firstName = fullName
            ? fullName.trim().split(" ")[0]
            : "amigo";

        if (welcomeName) welcomeName.textContent = firstName;
        if (profileName) {
            profileName.textContent = fullName
                ? firstName
                : "Criança";
        }
    }

    function applySavedColor() {
        if (!profileCard || !colorPicker) return;

        const savedColor = localStorage.getItem("teko_profile_color");

        if (savedColor) {
            profileCard.style.setProperty("--profile-color", savedColor);
            colorPicker.value = savedColor;
        }

        colorPicker.addEventListener("input", () => {
            profileCard.style.setProperty(
                "--profile-color",
                colorPicker.value
            );

            localStorage.setItem(
                "teko_profile_color",
                colorPicker.value
            );
        });
    }

    async function loadChildren() {
        const activeChild = getActiveChild();
        updateNames(activeChild);

        try {
            const response = await fetch("/children", {
                credentials: "include"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    result.erro ||
                    "Erro ao buscar crianças"
                );
            }

            const received =
                result.children ||
                result.criancas ||
                result;

            const children = (
                Array.isArray(received)
                    ? received
                    : [received]
            ).filter(Boolean);

            const activeId = getId(activeChild);
            const selected =
                children.find(child => getId(child) === activeId) ||
                children[0] ||
                activeChild;

            updateNames(selected);
        } catch (error) {
            console.error("Erro ao carregar o nome:", error);
            updateNames(activeChild);
        }
    }

    applySavedColor();
    loadChildren();

    window.addEventListener("teko:session-changed", event => {
        updateNames(event.detail?.child || getActiveChild());
    });
});
