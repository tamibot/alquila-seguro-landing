document.addEventListener('DOMContentLoaded', () => {
    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

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
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
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
    const animatedElements = document.querySelectorAll('.service-card, .step, .stat-item, .testimonial-video-card, .feature-image, .feature-content');

    animatedElements.forEach((el, index) => {
        el.classList.add('fade-up');

        // Add stagger effect based on child index if possible, or just random
        // Simple heuristic: if it's in a grid, try to stagger
        if (el.parentElement.classList.contains('services-grid') ||
            el.parentElement.classList.contains('process-steps') ||
            el.parentElement.classList.contains('stats-container') ||
            el.parentElement.classList.contains('testimonials-grid')) {

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
});
