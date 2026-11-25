(() => {
    const el = id => document.getElementById(id);
    const dialog = el("recuperacao"), form = el("rec-form"), fields = el("rec-dados");
    const email = el("rec-email"), submit = el("rec-enviar"), status = el("rec-status");
    const restart = el("rec-reiniciar");
    let version = 0;
    function start() {
        version++;
        form.reset();
        email.readOnly = false;
        fields.disabled = fields.hidden = restart.hidden = true;
        submit.hidden = submit.disabled = false;
        submit.textContent = "Enviar código";
        status.textContent = "";
        email.focus();
    }
    el("abrir-recuperacao").onclick = () => {
        dialog.showModal();
        start();
        email.value = el("email").value;
    };
    restart.onclick = () => { const address = email.value; start(); email.value = address; };
    el("rec-fechar").onclick = () => dialog.close();
    dialog.addEventListener("close", start);
    form.onsubmit = async event => {
        event.preventDefault();
        if (submit.disabled || submit.hidden) return;
        const confirm = !fields.hidden, current = version;
        if (confirm && el("rec-senha").value !== el("rec-confirmacao").value) {
            status.textContent = "As senhas precisam ser iguais.";
            el("rec-confirmacao").focus();
            return;
        }
        submit.disabled = true;
        email.readOnly = true;
        status.textContent = confirm ? "Atualizando senha…" : "Solicitando código…";
        const body = { email: email.value.trim() };
        if (confirm) Object.assign(body, { codigo: el("rec-codigo").value, senha: el("rec-senha").value });
        try {
            const response = await fetch("/recuperar-senha/" + (confirm ? "confirmar" : "codigo"), {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
            });
            const data = await response.json();
            if (version !== current) return;
            if (!response.ok) throw Error(data.erro || "Tente novamente.");
            status.textContent = data.mensagem;
            fields.disabled = fields.hidden = restart.hidden = confirm;
            submit.hidden = confirm;
            if (confirm) {
                form.reset();
                el("rec-fechar").focus();
            } else {
                submit.textContent = "Salvar nova senha";
                el("rec-codigo").focus();
            }
        } catch (error) {
            if (version === current) {
                status.textContent = error instanceof SyntaxError ? "Serviço indisponível. Tente novamente." : error.message;
                email.readOnly = confirm;
            }
        } finally { if (version === current) submit.disabled = false; }
    };
})();
