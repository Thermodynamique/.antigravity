/**
 * Aquaterra Agri — Main JS
 * Interactions, catalog filter, cart, ripple, form & scroll reveal
 */

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initHeader();
    initMobileMenu();
    initRipple();
    initCatalogFilter();
    initCart();
    initProductModal();
    initContactForm();
    initScrollReveal();
});

/* ===== PRODUCT MODAL ===== */
function initProductModal() {
    const modal = document.getElementById('product-modal');
    const close = document.querySelector('.modal-close');
    const catalogItems = document.querySelectorAll('.catalog-item');

    if (!modal) return;

    catalogItems.forEach(item => {
        const img = item.querySelector('.catalog-item-img');
        img.addEventListener('click', () => {
            const title = item.querySelector('h3').innerText;
            const price = item.querySelector('.cat-price').innerText;
            const desc = item.querySelector('p').innerText;
            const cat = item.querySelector('.cat-tag').innerText;
            const imgSrc = item.querySelector('img').src;

            document.getElementById('modal-title').innerText = title;
            document.getElementById('modal-price').innerText = price;
            document.getElementById('modal-desc').innerText = desc;
            document.getElementById('modal-cat').innerText = cat;
            document.getElementById('modal-img-tag').src = imgSrc;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scroll
        });
    });

    close.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Modal Tabs
    const tabs = document.querySelectorAll('.modal-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const contentId = 'tab-' + tab.getAttribute('data-tab');
            document.getElementById(contentId).classList.add('active');
        });
    });

    // Add to cart from modal
    const modalAddBtn = document.querySelector('.add-to-cart-modal');
    modalAddBtn.addEventListener('click', () => {
        const cartCountDesktop = document.querySelector('.cart-count');
        const cartCountMobile = document.querySelector('.cart-count-mobile');

        let count = parseInt(cartCountMobile.innerText) + 1;

        if (cartCountDesktop) cartCountDesktop.innerText = count;
        if (cartCountMobile) cartCountMobile.innerText = count;

        showToast('Produit ajouté au panier !');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });
}

/* ===== LOADER ===== */
function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }, 600);
    });
}

/* ===== HEADER SCROLL & NAV STATES ===== */
function initHeader() {
    const header = document.getElementById('main-header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Header effects
        header.classList.toggle('scrolled', currentScroll > 50);

        // Hide/Show header on mobile scroll for better immersion
        if (window.innerWidth < 768) {
            if (currentScroll > lastScroll && currentScroll > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        }
        lastScroll = currentScroll;
    });

    // Active nav link tracking (Desktop & Mobile Bottom Nav)
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-item'); // Include mobile links

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(sec => {
            const sectionTop = sec.offsetTop;
            const sectionHeight = sec.clientHeight;
            if (pageYOffset >= sectionTop - 300) { // Adjusted offset
                current = sec.getAttribute('id');
            }
        });

        // Special case for bottom
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
            current = 'contact';
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href.includes(current)) {
                link.classList.add('active');
            }
        });
    });
}

/* ===== CART ===== */
function initCart() {
    const cartCountDesktop = document.querySelector('.cart-count');
    const cartCountMobile = document.querySelector('.cart-count-mobile');
    const addBtns = document.querySelectorAll('.add-to-cart');

    // Also attach listener to mobile cart icon to scroll/open cart (simulated)
    const mobileCartTrigger = document.getElementById('mobile-cart-trigger');
    if (mobileCartTrigger) {
        mobileCartTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Votre panier contient ' + cartCountMobile.innerText + ' articles');
        });
    }

    let count = 0;

    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            count++;

            // Update both counters
            if (cartCountDesktop) {
                cartCountDesktop.innerText = count;
                cartCountDesktop.style.transform = 'scale(1.5)';
                setTimeout(() => cartCountDesktop.style.transform = 'scale(1)', 300);
            }
            if (cartCountMobile) {
                cartCountMobile.innerText = count;
                cartCountMobile.parentElement.classList.add('bump'); // Add animation class if you had CSS for it
                // Or manual style
                cartCountMobile.style.transform = 'scale(1.5)';
                setTimeout(() => cartCountMobile.style.transform = 'scale(1)', 300);
            }

            // Button feedback
            const original = btn.innerText;
            btn.innerText = '✓ Ajouté';
            btn.style.background = 'var(--accent)';
            setTimeout(() => {
                btn.innerText = original;
                btn.style.background = '';
            }, 1200);

            showToast('Produit ajouté au panier !');
        });
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ===== CONTACT FORM ===== */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const successMsg = document.getElementById('form-success');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'Envoi en cours...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerText = '✓ Envoyé !';
            successMsg.style.display = 'block';
            form.reset();
            setTimeout(() => {
                btn.innerText = originalText;
                btn.disabled = false;
                successMsg.style.display = 'none';
            }, 5000);
        }, 1500);
    });
}

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px' });

    elements.forEach(el => observer.observe(el));
}
