(() => {
    const list = document.getElementById('recommendations-list');
    const empty = document.getElementById('recommendations-empty');
    const status = document.getElementById('recommendations-status');
    const retry = document.getElementById('recommendations-retry');
    const notification = document.getElementById('recommendations-notification');
    const panel = document.getElementById('home-recommendations');
    if (!list) return;
    let version = 0;
    let controller = null;
    function activeChild() {
        try { return JSON.parse(localStorage.getItem('teko_session') || '{}')?.crianca?.id || null; }
        catch { return null; }
    }
    function clear() {
        list.replaceChildren();
        empty.hidden = true;
        notification.hidden = true;
        notification.textContent = '';
        status.textContent = '';
        retry.hidden = true;
    }
    async function load() {
        const request = ++version;
        controller?.abort();
        controller = new AbortController();
        const childId = activeChild();
        clear();
        if (!childId) {
            status.textContent = 'Escolha uma criança em Trocar sessão para ver suas recomendações.';
            panel.setAttribute('aria-busy', 'false');
            return;
        }
        panel.setAttribute('aria-busy', 'true');
        try {
            const response = await fetch(`/api/recommendations/${encodeURIComponent(childId)}`, {
                credentials: 'include', cache: 'no-store',
                signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)])
            });
            const data = await response.json().catch(() => ({}));
            if (request !== version || childId !== activeChild()) return;
            if (!response.ok) throw new Error(response.status === 401 ? 'Sua sessão expirou. Entre novamente.' : 'Não foi possível carregar as recomendações. Tente novamente.');
            if (!Array.isArray(data.recommendations)) throw new Error('Não foi possível carregar as recomendações.');
            const items = data.recommendations.filter(item => typeof item.title === 'string' && /^\/atividades\/[a-z0-9-]+$/.test(item.url)).slice(0, 3);
            for (const item of items) {
                const link = document.createElement('a');
                link.className = 'recommendation-item';
                link.href = item.url;
                const copy = document.createElement('span');
                const title = document.createElement('strong');
                title.textContent = item.title;
                const action = document.createElement('small');
                action.textContent = 'Começar atividade';
                const arrow = document.createElement('span');
                arrow.className = 'recommendation-arrow';
                arrow.setAttribute('aria-hidden', 'true');
                arrow.textContent = '→';
                copy.append(title, action);
                link.append(copy, arrow);
                list.append(link);
            }
            empty.hidden = items.length > 0;
            if (items.length) {
                notification.textContent = items.length === 1
                    ? 'O Teko deixou uma atividade para você!'
                    : `O Teko deixou ${items.length} atividades para você!`;
                notification.hidden = false;
            }
        } catch (error) {
            if (request !== version) return;
            status.textContent = error.name === 'TimeoutError' ? 'O carregamento demorou. Tente novamente.' : error.message;
            retry.hidden = false;
        } finally {
            if (request === version) panel.setAttribute('aria-busy', 'false');
        }
    }
    retry.addEventListener('click', load);
    window.addEventListener('teko:session-changed', load);
    window.addEventListener('focus', load);
    window.addEventListener('pageshow', event => { if (event.persisted) load(); });
    window.addEventListener('storage', event => {
        if (event.key === 'teko_recommendations_changed' || event.key === 'teko_session') load();
    });
    load();
})();
