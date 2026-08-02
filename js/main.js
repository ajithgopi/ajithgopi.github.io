$(document).ready(function() {
    initThemeToggle();
    initHeroTyping();
    initSkillFilter();
    initProjectFilter();
    initAIAssistant();
    initSmoothScroll();
    initCounters();
    initScrollReveal();
});

/* -------------------------------------------------------------
 * 0. Theme Toggle Switcher (Default Light, Optional Dark)
 * ------------------------------------------------------------- */
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    // Check saved theme or default based on time of day (Light 6am-6pm, Dark 6pm-6am)
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme) {
        setTheme(savedTheme, false);
    } else {
        const hour = new Date().getHours();
        const timeTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
        setTheme(timeTheme, false);
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme, true);
        });
    }

    function setTheme(theme, save = true) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.className = 'fas fa-sun text-warning';
            if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to Light Mode');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.className = 'fas fa-moon text-primary';
            if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to Dark Mode');
        }
        if (save) {
            localStorage.setItem('portfolio-theme', theme);
        }
    }
}

/* -------------------------------------------------------------
 * 1. Hero Dynamic Typing Animation
 * ------------------------------------------------------------- */
const typingRoles = [
    "AI & Autonomous Agent Developer",
    "LLM & RAG Architect",
    "Full Stack Software Engineer",
    "FinTech & Mobile Developer",
    "Passionate Musician"
];

function initHeroTyping() {
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingElement = document.getElementById("typing-text");

    if (!typingElement) return;

    function type() {
        const currentRole = typingRoles[roleIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
        }

        let speed = isDeleting ? 40 : 80;

        if (!isDeleting && charIndex === currentRole.length) {
            speed = 2000; // Pause at end of text
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % typingRoles.length;
            speed = 500; // Pause before starting next word
        }

        setTimeout(type, speed);
    }

    type();
}


/* -------------------------------------------------------------
 * 3. Skill Matrix Category & Search Filtering
 * ------------------------------------------------------------- */
function initSkillFilter() {
    const searchInput = document.getElementById("skill-search");
    const filterTabs = document.querySelectorAll(".filter-tab");
    const skillCards = document.querySelectorAll(".skill-item");

    if (!skillCards.length) return;

    let activeCategory = "all";
    let searchQuery = "";

    function filterSkills() {
        let visibleCount = 0;
        skillCards.forEach(card => {
            const tags = (card.getAttribute("data-category") || "").toLowerCase();
            const name = card.textContent.toLowerCase();

            const matchesTab = (activeCategory === "all" || tags.includes(activeCategory));
            const matchesSearch = (searchQuery === "" || name.includes(searchQuery) || tags.includes(searchQuery));

            if (matchesTab && matchesSearch) {
                $(card).fadeIn(200);
                visibleCount++;
            } else {
                $(card).fadeOut(200);
            }
        });

        const noMatch = document.getElementById("skills-no-match");
        if (noMatch) {
            if (visibleCount === 0) $(noMatch).fadeIn(200);
            else $(noMatch).fadeOut(200);
        }
    }

    filterTabs.forEach(tab => {
        tab.addEventListener("click", function() {
            filterTabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");
            activeCategory = this.getAttribute("data-filter");
            filterSkills();
        });
    });

    const clearBtn = document.getElementById("skill-search-clear");

    if (searchInput) {
        searchInput.addEventListener("input", function() {
            searchQuery = this.value.trim().toLowerCase();
            if (clearBtn) {
                clearBtn.style.display = searchQuery ? "flex" : "none";
            }
            filterSkills();
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener("click", function() {
            searchInput.value = "";
            searchQuery = "";
            clearBtn.style.display = "none";
            filterSkills();
            searchInput.focus();
        });
    }
}

/* -------------------------------------------------------------
 * 4. Project Showcase Tab Filter
 * ------------------------------------------------------------- */
function initProjectFilter() {
    const projectTabs = document.querySelectorAll(".project-tab");
    const projectCards = document.querySelectorAll(".project-item");

    if (!projectCards.length) return;

    projectTabs.forEach(tab => {
        tab.addEventListener("click", function() {
            projectTabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");

            const filter = this.getAttribute("data-filter");

            projectCards.forEach(card => {
                const cat = card.getAttribute("data-category") || "";
                if (filter === "all" || cat.includes(filter)) {
                    $(card).fadeIn(300);
                } else {
                    $(card).fadeOut(300);
                }
            });
        });
    });
}

/* -------------------------------------------------------------
 * 5. Smooth Scroll Navigation
 * ------------------------------------------------------------- */
function initSmoothScroll() {
    $('a[href^="#"]').on('click', function(event) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        
        const target = $(href);
        if (target.length) {
            event.preventDefault();
            const navbarHeight = $('.navbar-custom').outerHeight() || 75;
            const targetOffset = target.offset().top - navbarHeight - 15;

            $('html, body').stop().animate({
                scrollTop: targetOffset
            }, 500, function() {
                if (href === '#ai-assistant') {
                    $('#ai-chat-input').focus();
                }
            });
        }
    });
}

/* -------------------------------------------------------------
 * 6. Animated Counter Stats
 * ------------------------------------------------------------- */
function initCounters() {
    const counters = document.querySelectorAll('.counter-val');
    let animated = false;

    function checkScroll() {
        if (counters.length && !animated) {
            const topPos = counters[0].getBoundingClientRect().top;
            if (topPos < window.innerHeight) {
                animated = true;
                counters.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    let count = 0;
                    const step = Math.max(1, Math.ceil(target / 40));
                    const timer = setInterval(() => {
                        count += step;
                        if (count >= target) {
                            counter.innerText = target + "+";
                            clearInterval(timer);
                        } else {
                            counter.innerText = count;
                        }
                    }, 30);
                });
            }
        }
    }

    window.addEventListener('scroll', checkScroll);
    checkScroll();
}

/* -------------------------------------------------------------
 * 7. Scroll-Triggered Reveal Animations
 * ------------------------------------------------------------- */
function initScrollReveal() {
    const selector = '.ai-card, .skill-card, .project-card, .timeline-content, .stat-box, .glass-card, section h2, .section-tag';
    const targetElements = document.querySelectorAll(selector);

    targetElements.forEach(el => {
        el.classList.add('reveal-on-scroll');
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        targetElements.forEach(el => observer.observe(el));
    } else {
        // Fallback for older browsers
        targetElements.forEach(el => el.classList.add('is-visible'));
    }

    // Floating AI FAB button click handler: Focus chat input on click
    const floatingBtn = document.getElementById('floating-ai-btn');
    if (floatingBtn) {
        floatingBtn.addEventListener('click', function(e) {
            setTimeout(() => {
                const chatInput = document.getElementById('ai-chat-input');
                if (chatInput) chatInput.focus();
            }, 550);
        });
    }
}