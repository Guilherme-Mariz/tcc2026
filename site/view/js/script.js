// ROTAS DE NAVEGAÇÃO 

function irParaLogin() {
  window.location.href = "/login";
}

function irParaRegister() {
  window.location.href = "/register";
}

function irParaIndex() {
  window.location.href = "/";
}


// ─── NAVBAR: sombra ao rolar ───────────────────────────
const header = document.getElementById('header');

if (header) {
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
    });
}

// ─── SCROLL SUAVE PARA ÂNCORAS ────────────────────────
function smoothScrollTo(targetId) {
    const target = document.querySelector(targetId);
    if (!target) return;

    const headerEl = document.getElementById('header');
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;
    const startY = window.scrollY;
    const distance = targetTop - startY;
    const duration = 800;
    let startTime = null;

    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// Intercepta todos os links âncora da página
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        smoothScrollTo(href);
        if (href === '#contato') destacarContato();
    });
});

// ─── DESTAQUE NA SEÇÃO CONTATO ────────────────────────
function destacarContato() {
    const contato = document.getElementById('contato');
    if (!contato) return;
    contato.classList.remove('contato-destaque');
    void contato.offsetWidth;
    contato.classList.add('contato-destaque');
    contato.addEventListener('animationend', () => {
        contato.classList.remove('contato-destaque');
    }, { once: true });
}

// ─── MENU MOBILE ──────────────────────────────────────
const mobileBtn      = document.getElementById('mobile_btn');
const mobileCloseBtn = document.getElementById('mobile_close_btn');
const mobileMenu     = document.getElementById('mobile_menu');
const mobileOverlay  = document.getElementById('mobile_overlay');

if (mobileBtn) {
    const mobileLinks = document.querySelectorAll('#mobile_nav_list .nav_item a, .mobile-cta');

    function openMenu() {
        mobileMenu.classList.add('active');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenu.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    mobileBtn.addEventListener('click', openMenu);
    mobileCloseBtn.addEventListener('click', closeMenu);
    mobileOverlay.addEventListener('click', closeMenu);
    mobileLinks.forEach(link => link.addEventListener('click', closeMenu));
}

// ─── ACTIVE NAV ITEM ao rolar ─────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('#nav_list .nav_item a');

if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.parentElement.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.parentElement.classList.add('active');
                    }
                });
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(section => observer.observe(section));
}

// ─── FADE-IN DAS SEÇÕES (exceto #contato) ─────────────
const fadeEls = document.querySelectorAll('.section-fade');

if (fadeEls.length) {
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeEls.forEach(el => {
        // #contato e footer ficam estáticos
        if (el.closest('#contato') || el.id === 'contato') {
            el.classList.add('visible');
        } else {
            fadeObserver.observe(el);
        }
    });
}

// footer: sem animação de entrada
