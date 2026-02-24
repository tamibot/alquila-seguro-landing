document.addEventListener('DOMContentLoaded', () => {
    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) {
            return;
        }

        question.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // Smooth Scolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetSelector = this.getAttribute('href');
            if (!targetSelector || targetSelector === '#') {
                return;
            }

            const targetElement = document.querySelector(targetSelector);
            if (!targetElement) {
                return;
            }

            e.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Advanced Scroll Animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Stop observing once visible to allow hover effects to work cleanly without conflict
                // mostly relevant if we were using inline styles, but with classes it's safer to keep observing or stop?
                // For "reveal once" animations, stopping observation is better performance.
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select elements to animate
    const animatedElements = document.querySelectorAll('.service-card, .step, .stat-item, .testimonial-video-placeholder, .faq-item');

    animatedElements.forEach((el, index) => {
        el.classList.add('fade-up');

        // Add stagger effect based on child index if possible, or just random
        // Simple heuristic: if it's in a grid, try to stagger
        if (el.parentElement.classList.contains('services-grid') ||
            el.parentElement.classList.contains('process-steps') ||
            el.parentElement.classList.contains('stats-container') ||
            el.parentElement.classList.contains('testimonials-grid') ||
            el.parentElement.classList.contains('testimonials-grid-flat')) {

            // Calculate index within parent
            const indexInParent = Array.from(el.parentElement.children).indexOf(el);
            const delay = (indexInParent % 4) * 100; // 0ms, 100ms, 200ms, 300ms
            el.style.transitionDelay = `${delay}ms`;
        }

        observer.observe(el);
    });
    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');

            // Toggle icon
            const icon = mobileBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileBtn.querySelector('i').classList.remove('fa-times');
                mobileBtn.querySelector('i').classList.add('fa-bars');
            }
        });
    });

    // Scrollspy.
    const sectionIds = ['inicio', 'servicios', 'proceso', 'testimonios', 'faq'];
    const sectionElements = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);
    const navAnchors = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));

    function updateScrollState() {
        const scrollY = window.scrollY + 130;
        let activeId = sectionIds[0];

        sectionElements.forEach((section) => {
            if (scrollY >= section.offsetTop) {
                activeId = section.id;
            }
        });

        navAnchors.forEach((anchor) => {
            const href = anchor.getAttribute('href');
            anchor.classList.toggle('active', href === `#${activeId}`);
        });
    }

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });

    // Hero video popup modal
    const heroVideoTrigger = document.getElementById('hero-video-trigger');
    const videoModal = document.getElementById('video-modal');
    const videoModalDialog = videoModal?.querySelector('.video-modal-dialog');
    const videoModalClose = document.getElementById('video-modal-close');
    const heroVideoIframe = document.getElementById('hero-video-iframe');
    const testimonialIframes = document.querySelectorAll('.testimonial-iframe[data-video-id]');

    function buildYouTubeEmbedUrl(videoId, autoplay = false) {
        const safeOrigin = window.location.origin && window.location.origin !== 'null'
            ? window.location.origin
            : 'https://www.alquilaseguro.com.pe';

        const params = new URLSearchParams({
            rel: '0',
            modestbranding: '1',
            playsinline: '1',
            enablejsapi: '1',
            origin: safeOrigin
        });

        if (autoplay) {
            params.set('autoplay', '1');
        }

        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }

    function closeVideoModal() {
        if (!videoModal || !heroVideoIframe) {
            return;
        }

        videoModal.classList.remove('active');
        videoModal.setAttribute('aria-hidden', 'true');
        heroVideoIframe.src = '';
        document.body.classList.remove('modal-open');
    }

    if (heroVideoTrigger && videoModal && heroVideoIframe) {
        heroVideoTrigger.addEventListener('click', () => {
            const videoId = heroVideoTrigger.dataset.videoId || 'SNKy5ZK891A';
            heroVideoIframe.src = buildYouTubeEmbedUrl(videoId, true);
            videoModal.classList.add('active');
            videoModal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
        });
    }

    testimonialIframes.forEach((iframe) => {
        const videoId = iframe.dataset.videoId;
        if (!videoId) {
            return;
        }
        iframe.src = buildYouTubeEmbedUrl(videoId, false);
    });

    if (videoModalClose) {
        videoModalClose.addEventListener('click', closeVideoModal);
    }

    if (videoModal) {
        videoModal.addEventListener('click', (event) => {
            if (!videoModalDialog) {
                return;
            }

            if (!videoModalDialog.contains(event.target)) {
                closeVideoModal();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && videoModal?.classList.contains('active')) {
            closeVideoModal();
        }
    });

    // Analytics events for GTM/GA4
    function pushDataLayerEvent(payload) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(payload);
    }

    function sendAnalyticsEvent(eventName, params = {}) {
        const payload = { event: eventName, ...params };
        pushDataLayerEvent(payload);

        // Direct GA4 delivery for immediate tracking, even before GTM event tags are configured.
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        }
    }

    const ctaSelectors = [
        'a.btn',
        'a.learn-more',
        '.whatsapp-float',
        '.logo',
        '.nav-links a'
    ];

    document.querySelectorAll(ctaSelectors.join(',')).forEach((element) => {
        element.addEventListener('click', () => {
            const href = element.getAttribute('href') || '';
            const text = (element.textContent || '').trim().replace(/\s+/g, ' ');
            const section = element.closest('section')?.id || 'header_or_footer';
            const isFloatingWhatsapp = element.classList.contains('whatsapp-float');
            const isWhatsapp = href.includes('wa.me');
            const ctaOrigin = isFloatingWhatsapp
                ? 'floating_whatsapp'
                : isWhatsapp
                    ? 'landing_whatsapp'
                    : 'navigation';

            sendAnalyticsEvent('cta_click', {
                cta_text: text,
                cta_href: href,
                cta_section: section,
                cta_type: isWhatsapp ? 'whatsapp' : 'navigation',
                cta_origin: ctaOrigin
            });

            if (isFloatingWhatsapp) {
                sendAnalyticsEvent('whatsapp_floating_click', {
                    cta_text: text,
                    cta_href: href,
                    cta_section: section,
                    cta_origin: ctaOrigin
                });
            } else if (isWhatsapp) {
                sendAnalyticsEvent('whatsapp_landing_click', {
                    cta_text: text,
                    cta_href: href,
                    cta_section: section,
                    cta_origin: ctaOrigin
                });
            }
        });
    });

    if (heroVideoTrigger) {
        heroVideoTrigger.addEventListener('click', () => {
            sendAnalyticsEvent('video_open', {
                video_id: heroVideoTrigger.dataset.videoId || 'SNKy5ZK891A',
                video_context: 'hero'
            });
        });
    }
});

// --- Loader Fade Out Logic ---
// We place this outside DOMContentLoaded to wait for images and resources
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
        // Keep loader short so first paint is not blocked.
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 800); // Matches CSS transition time
        }, 900);
    }
});
