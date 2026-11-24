const TekoPreferencias = (() => {
    const perfil = () => JSON.parse(localStorage.getItem("teko_session") || "{}")?.crianca?.id;
    async function consultar(method = "GET", valores) {
        const id = perfil();
        if (!id) throw Error("Selecione uma criança.");
        const resposta = await fetch("/children/" + encodeURIComponent(id) + "/preferencias", {
            method, cache: "no-store", headers: {"Content-Type":"application/json"},
            body: JSON.stringify(valores)
        });
        if (!resposta.ok || perfil() !== id) throw Error("Não foi possível acessar as preferências.");
        return resposta.json();
    }
    return { consultar, perfil };
})();
