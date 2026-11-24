/* abre sec-visual por padrão */
        document.getElementById('sec-visual').classList.add('open');

        function toggleSection(id) {
            const card = document.getElementById(id);
            const isOpen = card.classList.contains('open');
            const btn = card.querySelector('.cfg-card-header');

            /* fecha todos */
            document.querySelectorAll('.cfg-card').forEach(c => {
                c.classList.remove('open');
                c.querySelector('.cfg-card-header').setAttribute('aria-expanded','false');
                const body = c.querySelector('.cfg-card-body');
                body.style.maxHeight = '0';
            });

            /* abre o clicado se estava fechado */
            if (!isOpen) {
                card.classList.add('open');
                btn.setAttribute('aria-expanded','true');
                const body = card.querySelector('.cfg-card-body');
                body.style.maxHeight = body.scrollHeight + 40 + 'px';
            }
        }

        /* inicializa altura do aberto */
        function initAccordions() {
            document.querySelectorAll('.cfg-card').forEach(card => {
                const body = card.querySelector('.cfg-card-body');
                if (card.classList.contains('open')) {
                    body.style.maxHeight = body.scrollHeight + 40 + 'px';
                } else {
                    body.style.maxHeight = '0';
                }
            });
        }

        /* ── font slider ── */
        document.getElementById('font-slider').addEventListener('input', function () {
            aplicarFonte(this.value);

        });

        function aplicarFonte(scale) {
            document.documentElement.style.setProperty('--font-scale', scale);
            const labels = { 0.9:'Pequeno', 1:'Normal', 1.1:'Um pouco maior', 1.2:'Maior', 1.3:'Grande', 1.4:'Bem grande', 1.5:'Gigante' };
            const preview = document.getElementById('font-preview');
            preview.style.fontSize = parseFloat(scale) + 'rem';
            preview.textContent = (labels[parseFloat(scale)] || 'Personalizado') + ' — Olá! Estou aprendendo com o TEKO!';
        }

        /* ── volume slider ── */
        document.getElementById('vol-narracao').addEventListener('input', function () {
            document.getElementById('vol-narracao-pct').textContent = this.value + '%';

        });

        /* ── toggles ── */


        /* ── speed ── */
        function setSpeed(btn) {
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

        }

        /* ── salvar ── */
        function valoresAtuais() {
            const cfg = {
                fontScale:  document.getElementById('font-slider').value,
                volNarracao: document.getElementById('vol-narracao').value,
                speed: document.querySelector('.speed-btn.active')?.dataset.speed || 'normal',
            };
            ['reduced-motion','cursor','narracao','efeitos'].forEach(id => {
                const el = document.getElementById('toggle-' + id);
                if (el) cfg['toggle_' + id] = el.checked;
            });
            return {...cfg, volNarracao:Number(cfg.volNarracao), fontScale:Number(cfg.fontScale)};
        }

        let pronto = false;
        let gravando = false;
        let perfilCarregado;
        async function salvar(reset = false) {
            if (!pronto || gravando || perfilCarregado !== TekoPreferencias.perfil()) return mostrarToast('Recarregue as configurações da criança.');
            gravando = true;
            try {
                await TekoPreferencias.consultar('PUT', reset ? {} : valoresAtuais());
                if (reset) location.reload();
                else mostrarToast('Configurações salvas!');
            } catch { mostrarToast('Falha ao salvar. Tente novamente.'); }
            finally { gravando = false; }
        }
        function resetarConfiguracoes() { return salvar(true); }
        async function carregarConfiguracoes() {
            try {
                perfilCarregado = TekoPreferencias.perfil();
                const cfg = await TekoPreferencias.consultar();
                pronto = true;
                if (cfg.fontScale)   { document.getElementById('font-slider').value = cfg.fontScale; aplicarFonte(cfg.fontScale); }
                if (cfg.volNarracao !== undefined) {
                    document.getElementById('vol-narracao').value = cfg.volNarracao;
                    document.getElementById('vol-narracao-pct').textContent = cfg.volNarracao + '%';
                }
                ['reduced-motion','cursor','narracao','efeitos'].forEach(id => {
                    const el = document.getElementById('toggle-' + id);
                    if (el && cfg['toggle_' + id] !== undefined) el.checked = cfg['toggle_' + id];
                });
                if (cfg.speed) {
                    document.querySelectorAll('.speed-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.speed === cfg.speed);
                    });
                }
            } catch { mostrarToast('Falha ao carregar. Recarregue a página.'); }
        }

        /* ── toast ── */
        function mostrarToast(msg) {
            const toast = document.getElementById('toast');
            document.getElementById('toast-msg').textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2800);
        }

        /* ── btn salvar ── */
        document.querySelector('.btn-save').addEventListener('click', () => salvar());

        /* ── init ── */
        document.addEventListener('DOMContentLoaded', () => {
            carregarConfiguracoes();
            initAccordions();
        });
