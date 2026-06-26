/**
 * Mobile-First Responsive Design Module
 * Handles touch events, device detection, and mobile-specific features
 */

const MobileModule = (() => {
    let isMobileDevice = false;
    let isTabletDevice = false;
    let currentOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    let touchStartX = 0;
    let touchEndX = 0;

    /**
     * Detect if device is mobile or tablet
     */
    const detectDevice = () => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Mobile detection regex
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        const isSmallScreen = window.innerWidth <= 768;
        
        isMobileDevice = mobileRegex.test(userAgent) && isSmallScreen;
        isTabletDevice = (mobileRegex.test(userAgent) && !isMobileDevice) || 
                        (isSmallScreen && window.innerWidth > 480 && window.innerWidth <= 1024);

        // Add classes to body for CSS targeting
        if (isMobileDevice) {
            document.body.classList.add('is-mobile');
            document.body.classList.remove('is-tablet', 'is-desktop');
        } else if (isTabletDevice) {
            document.body.classList.add('is-tablet');
            document.body.classList.remove('is-mobile', 'is-desktop');
        } else {
            document.body.classList.add('is-desktop');
            document.body.classList.remove('is-mobile', 'is-tablet');
        }

        return { isMobileDevice, isTabletDevice };
    };

    /**
     * Initialize mobile menu toggle
     */
    const initMobileMenu = () => {
        const navbar = document.querySelector('.navbar-collapse');
        const toggler = document.querySelector('.navbar-toggler');

        if (!toggler) return;

        toggler.addEventListener('click', () => {
            navbar?.classList.toggle('show');
            toggler.setAttribute('aria-expanded', 
                toggler.getAttribute('aria-expanded') === 'false' ? 'true' : 'false');
        });

        // Close menu when a link is clicked
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navbar?.classList.remove('show');
                toggler.setAttribute('aria-expanded', 'false');
            });
        });
    };

    /**
     * Handle orientation change
     */
    const handleOrientationChange = () => {
        currentOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        
        // Resize viewport and adjust layout
        detectDevice();
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('orientationChanged', {
            detail: { orientation: currentOrientation }
        }));
    };

    /**
     * Touch event handler - detect swipe
     */
    const handleTouchStart = (event) => {
        touchStartX = event.changedTouches[0].screenX;
    };

    const handleTouchEnd = (event) => {
        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    };

    /**
     * Detect swipe direction
     */
    const handleSwipe = () => {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swiped left
                window.dispatchEvent(new CustomEvent('swipeLeft'));
            } else {
                // Swiped right
                window.dispatchEvent(new CustomEvent('swipeRight'));
            }
        }
    };

    /**
     * Make buttons and links touch-friendly
     */
    const enhanceTouchTargets = () => {
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        
        buttons.forEach(button => {
            // Ensure minimum 48x48px touch area
            const rect = button.getBoundingClientRect();
            if (rect.width < 48 || rect.height < 48) {
                button.style.minWidth = '48px';
                button.style.minHeight = '48px';
                button.style.display = 'inline-flex';
                button.style.alignItems = 'center';
                button.style.justifyContent = 'center';
            }

            // Add touch feedback
            button.addEventListener('touchstart', function() {
                this.style.opacity = '0.8';
            });

            button.addEventListener('touchend', function() {
                this.style.opacity = '1';
            });
        });
    };

    /**
     * Optimize form inputs for mobile
     */
    const optimizeFormInputs = () => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea, select');
        
        inputs.forEach(input => {
            // Set font-size to 16px to prevent zoom on iOS
            input.style.fontSize = '16px';
            
            // Add touch feedback class
            input.addEventListener('focus', function() {
                this.classList.add('input-focused');
            });

            input.addEventListener('blur', function() {
                this.classList.remove('input-focused');
            });

            // Prevent zoom on input
            if (input.type === 'text' || input.type === 'email' || input.type === 'password') {
                input.addEventListener('focus', function() {
                    if (isMobileDevice) {
                        document.body.style.zoom = '100%';
                    }
                });
            }
        });

        // Add CSS for input focus state
        const style = document.createElement('style');
        style.textContent = `
            .input-focused {
                outline: 2px solid var(--color-primary) !important;
            }
        `;
        document.head.appendChild(style);
    };

    /**
     * Handle table horizontal scroll on mobile
     */
    const optimizeTables = () => {
        const tables = document.querySelectorAll('.table-responsive, .cyber-table');
        
        tables.forEach(table => {
            // Add horizontal scroll indicator
            table.addEventListener('scroll', function() {
                if (this.scrollLeft > 0) {
                    this.classList.add('scrolled-left');
                } else {
                    this.classList.remove('scrolled-left');
                }
            });
        });

        // Add scroll hint style
        const style = document.createElement('style');
        style.textContent = `
            .table-responsive.scrolled-left::after {
                content: '';
                position: absolute;
                right: 0;
                top: 0;
                width: 20px;
                height: 100%;
                background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(6,182,212,0.2) 100%);
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    };

    /**
     * Create collapsible sections on mobile
     */
    const initCollapsibleSections = () => {
        const sections = document.querySelectorAll('.cyber-card');
        
        if (isMobileDevice || isTabletDevice) {
            sections.forEach((section, index) => {
                const header = section.querySelector('.card-header');
                const body = section.querySelector('.card-body');
                
                if (header && body) {
                    header.style.cursor = 'pointer';
                    header.setAttribute('aria-expanded', 'true');
                    header.setAttribute('aria-controls', `section-${index}`);
                    body.id = `section-${index}`;
                    
                    header.addEventListener('click', function() {
                        const isExpanded = this.getAttribute('aria-expanded') === 'true';
                        this.setAttribute('aria-expanded', !isExpanded);
                        body.style.display = isExpanded ? 'none' : 'block';
                        
                        // Add smooth animation
                        if (!isExpanded) {
                            body.style.animation = 'slideDown 0.3s ease-out';
                        } else {
                            body.style.animation = 'slideUp 0.3s ease-out';
                        }
                    });
                }
            });

            // Add animation styles
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        max-height: 0;
                    }
                    to {
                        opacity: 1;
                        max-height: 1000px;
                    }
                }
                @keyframes slideUp {
                    from {
                        opacity: 1;
                        max-height: 1000px;
                    }
                    to {
                        opacity: 0;
                        max-height: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };

    /**
     * Handle viewport meta tag optimization
     */
    const optimizeViewport = () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
            document.head.appendChild(meta);
        }
    };

    /**
     * Improve footer on mobile
     */
    const optimizeFooter = () => {
        const footer = document.querySelector('.cyber-footer');
        if (footer && (isMobileDevice || isTabletDevice)) {
            footer.style.fontSize = '0.8125rem';
            footer.style.lineHeight = '1.5';
        }
    };

    /**
     * Add keyboard support for mobile
     */
    const addKeyboardSupport = () => {
        document.addEventListener('keydown', (event) => {
            // Close mobile menu on Escape
            if (event.key === 'Escape') {
                const navbar = document.querySelector('.navbar-collapse');
                if (navbar) {
                    navbar.classList.remove('show');
                }
            }
        });
    };

    /**
     * Initialize lazy loading for images
     */
    const initLazyLoading = () => {
        const images = document.querySelectorAll('img[data-lazy]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.getAttribute('data-lazy');
                        img.removeAttribute('data-lazy');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    };

    /**
     * Add network status indicator
     */
    const monitorNetworkStatus = () => {
        window.addEventListener('online', () => {
            console.log('Back online');
            document.body.classList.remove('offline');
        });

        window.addEventListener('offline', () => {
            console.log('Going offline');
            document.body.classList.add('offline');
        });
    };

    /**
     * Initialize all mobile features
     */
    const init = () => {
        // Optimize viewport
        optimizeViewport();
        
        // Detect device type
        detectDevice();
        
        // Initialize mobile menu
        initMobileMenu();
        
        // Enhance touch targets
        enhanceTouchTargets();
        
        // Optimize form inputs
        optimizeFormInputs();
        
        // Optimize tables
        optimizeTables();
        
        // Initialize collapsible sections
        initCollapsibleSections();
        
        // Improve footer
        optimizeFooter();
        
        // Add keyboard support
        addKeyboardSupport();
        
        // Initialize lazy loading
        initLazyLoading();
        
        // Monitor network status
        monitorNetworkStatus();
        
        // Handle touch and orientation
        document.addEventListener('touchstart', handleTouchStart, false);
        document.addEventListener('touchend', handleTouchEnd, false);
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', detectDevice);
        
        // Log initialization
        console.log('Mobile module initialized:', { isMobileDevice, isTabletDevice, currentOrientation });
    };

    /**
     * Public API
     */
    return {
        init,
        isMobile: () => isMobileDevice,
        isTablet: () => isTabletDevice,
        getOrientation: () => currentOrientation,
        getDeviceInfo: () => ({ isMobileDevice, isTabletDevice, currentOrientation })
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MobileModule.init();
    });
} else {
    MobileModule.init();
}

// Make module accessible globally for debugging
window.MobileModule = MobileModule;
