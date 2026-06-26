// Common scripts for the Cyber Forensics platform

/**
 * Toast notification system — replaces browser alert()
 */
window.CyberToast = (() => {
    const ICONS = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    const TITLES = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Notice'
    };

    let container = null;

    const getContainer = () => {
        if (!container) {
            container = document.getElementById('cyberToastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'cyberToastContainer';
                container.className = 'cyber-toast-container';
                container.setAttribute('aria-live', 'polite');
                container.setAttribute('aria-atomic', 'true');
                document.body.appendChild(container);
            }
        }
        return container;
    };

    const show = (message, type = 'info', options = {}) => {
        const { title = TITLES[type] || 'Notice', duration = 4500 } = options;
        const toast = document.createElement('div');
        toast.className = `cyber-toast cyber-toast--${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <i class="fa-solid ${ICONS[type] || ICONS.info} cyber-toast__icon" aria-hidden="true"></i>
            <div class="cyber-toast__body">
                <div class="cyber-toast__title">${title}</div>
                <p class="cyber-toast__message">${message}</p>
            </div>
            <button type="button" class="cyber-toast__close" aria-label="Dismiss">&times;</button>
        `;

        const dismiss = () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(24px)';
            toast.style.transition = 'opacity 0.25s, transform 0.25s';
            setTimeout(() => toast.remove(), 250);
        };

        toast.querySelector('.cyber-toast__close').addEventListener('click', dismiss);
        getContainer().appendChild(toast);

        if (duration > 0) {
            setTimeout(dismiss, duration);
        }

        return dismiss;
    };

    return {
        show,
        success: (msg, opts) => show(msg, 'success', opts),
        error: (msg, opts) => show(msg, 'error', opts),
        warning: (msg, opts) => show(msg, 'warning', opts),
        info: (msg, opts) => show(msg, 'info', opts)
    };
})();

/**
 * UI helpers shared across demo pages
 */
window.CyberUI = {
    /** Brief green border flash when sample data loads */
    flashElement(el) {
        if (!el) return;
        el.classList.remove('sample-flash');
        void el.offsetWidth;
        el.classList.add('sample-flash');
        setTimeout(() => el.classList.remove('sample-flash'), 1000);
    },

    /** Reveal export buttons with animation */
    revealExportButtons(selector) {
        let buttons;
        if (selector.includes(',')) {
            buttons = [...document.querySelectorAll(selector)].filter(btn => btn.classList.contains('d-none'));
        } else {
            const container = document.querySelector(selector);
            buttons = container ? container.querySelectorAll('button.d-none') : [];
        }
        buttons.forEach((btn, i) => {
            btn.classList.remove('d-none');
            btn.classList.add('export-reveal');
            btn.style.animationDelay = `${i * 0.08}s`;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("Forensic Platform Session Established.");

    // Navbar scroll shadow
    const navbar = document.getElementById('mainNavbar');
    if (navbar) {
        const onScroll = () => {
            navbar.classList.toggle('navbar-scrolled', window.scrollY > 8);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // CPU/RAM badge animation on dashboard
    const cpuBadge = document.querySelector('.bg-cyber-purple-glow');
    const ramBadge = document.querySelector('.bg-cyber-blue-glow');

    if (cpuBadge || ramBadge) {
        setInterval(() => {
            if (cpuBadge) {
                const randomCPU = Math.floor(Math.random() * (35 - 18 + 1)) + 18;
                cpuBadge.innerHTML = `<i class="fa-solid fa-microchip me-1"></i> CPU: ${randomCPU}%`;
            }
            if (ramBadge) {
                const randomRAM = (4.7 + Math.random() * 0.4).toFixed(1);
                ramBadge.innerHTML = `<i class="fa-solid fa-memory me-1"></i> RAM: ${randomRAM} GB / 16 GB`;
            }
        }, 4000);
    }

    // Smooth in-page anchor navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // About page: sticky anchor nav + scroll spy
    initAboutAnchorNav();
});

function initAboutAnchorNav() {
    const nav = document.querySelector('.about-anchor-nav');
    if (!nav) return;

    const links = nav.querySelectorAll('a[href^="#"]');
    const sections = Array.from(links)
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if (!sections.length) return;

    const navParent = nav.parentElement;
    const navOffset = nav.offsetTop;

    window.addEventListener('scroll', () => {
        nav.classList.toggle('stuck', window.scrollY > navOffset - 70);

        let current = sections[0];
        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 120) {
                current = section;
            }
        });

        links.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
        });
    }, { passive: true });
}
