/* ── fade in ── */
            document.addEventListener('DOMContentLoaded', () => {
                document.body.style.opacity = '1';
                animarGrid('grid-emocoes');
            });

            /* ── módulos ── */
            const modBtns = document.querySelectorAll('.module-btn');
            const grids   = document.querySelectorAll('.atv-grid');

            modBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const cat = btn.dataset.cat;

                    modBtns.forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-checked', 'false');
                    });
                    btn.classList.add('active');
                    btn.setAttribute('aria-checked', 'true');

                    grids.forEach(g => {
                        g.classList.remove('active');
                        g.setAttribute('hidden', '');
                    });

                    const target = document.getElementById('grid-' + cat);
                    target.removeAttribute('hidden');

                    requestAnimationFrame(() => {
                        target.classList.add('active');
                        animarGrid('grid-' + cat);
                    });
                });
            });

            /* ── slideshow de imagens nos cards ── */
            document.querySelectorAll('.atv-card-slideshow').forEach(wrap => {
                const imgs = wrap.querySelectorAll('img');
                if (imgs.length < 2) return;
                let i = 0;
                setInterval(() => {
                    imgs[i].classList.remove('active');
                    i = (i + 1) % imgs.length;
                    imgs[i].classList.add('active');
                }, 5000);
            });

            document.querySelectorAll('.atv-card[href="#"]').forEach(card => {
                card.setAttribute('aria-disabled', 'true');
                card.addEventListener('click', event => {
                    event.preventDefault();
                });
            });

            /* ── animação dos cards com GSAP ── */
            function animarGrid(id) {
                const cards = document.querySelectorAll('#' + id + ' .atv-card');
                gsap.fromTo(cards,
                    { opacity: 0, y: 22, scale: 0.97 },
                    {
                        opacity: 1, y: 0, scale: 1,
                        duration: 0.45,
                        ease: 'power2.out',
                        stagger: 0.055,
                        clearProps: 'transform'
                    }
                );
            }
