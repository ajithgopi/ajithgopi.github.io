$(document).ready(function() {
    initThemeToggle();
    initHeroTyping();
    initSkillFilter();
    initProjectFilter();
    initAIAssistant();
    initSmoothScroll();
    initCounters();
});

/* -------------------------------------------------------------
 * 0. Theme Toggle Switcher (Default Light, Optional Dark)
 * ------------------------------------------------------------- */
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    // Check saved theme or default to light
    const savedTheme = localStorage.getItem('portfolio-theme') || 'light';
    setTheme(savedTheme);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    function setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.className = 'fas fa-sun text-warning';
            if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to Light Mode');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.className = 'fas fa-moon text-primary';
            if (toggleBtn) toggleBtn.setAttribute('title', 'Switch to Dark Mode');
        }
        localStorage.setItem('portfolio-theme', theme);
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
 * 2. Interactive AI Assistant Sandbox ("Ajith AI")
 * ------------------------------------------------------------- */
const aiKnowledgeBase = [
    {
        keywords: ["ai", "machine learning", "llm", "rag", "agent", "prompt", "gpt", "claude", "deep learning"],
        answer: "🤖 <strong>Ajith's AI & Automation Expertise:</strong><br>Ajith prioritizes AI-based development (Claude/OpenAI/Ollama) with in-sprint automation. He designs custom RAG pipelines, context-aware document search, and LLM integrations across Node.js, Python, React, and AWS microservices!"
    },
    {
        keywords: ["project", "portfolio", "built", "apps", "work", "reach52", "tutorhow", "insights", "gold vault"],
        answer: "⚡ <strong>Key CV Projects:</strong><br>1. <strong>Emirates NBD Corporate Banking:</strong> RM daily management & deal platforms (React, Node, MongoDB, OracleDB).<br>2. <strong>reach52 insights & connect:</strong> Enterprise analytical monitoring & admin automation (Node, React, Angular, AWS EKS, PostgreSQL).<br>3. <strong>Tutorhow Virtual Front Desk & ETO:</strong> Multi-tenant edtech & PWA applications (Next.js, Golang, Laravel, Redis, Neo4J).<br>4. <strong>Gold Vault Tracker:</strong> Precious metal tracking iOS/Android app."
    },
    {
        keywords: ["skill", "stack", "technology", "languages", "tech", "python", "react", "node", "aws"],
        answer: "🛠️ <strong>Core Tech Stack from CV:</strong><br>• <strong>Languages:</strong> JavaScript (ES6+), TypeScript, Python, Swift, Kotlin, PHP, SQL<br>• <strong>Frontend:</strong> React, Next.js, Angular, Redux, Tailwind CSS, Bootstrap, HTML5/CSS3<br>• <strong>Backend & Cloud:</strong> Node.js, Express, Laravel, AWS (EKS, EC2, Lambda, S3, RDS, ElastiCache), Docker, K8s<br>• <strong>Databases:</strong> MongoDB, PostgreSQL, MySQL, MariaDB, Redis, DynamoDB, Neo4J, OracleDB"
    },
    {
        keywords: ["experience", "background", "career", "work", "job", "emirates", "synechron", "reach52", "tutorhow", "infosys", "dubai"],
        answer: "💼 <strong>Professional Experience:</strong><br>• <strong>Emirates NBD (Synechron)</strong> | Dubai, UAE (11/2024 - Present): Corporate Banking Applications & AI-driven dev.<br>• <strong>reach52 Pte. Ltd.</strong> | Singapore (01/2022 - 11/2024): Full Stack Engineer & Cloud Microservices.<br>• <strong>Tutorhow Scientific Edutech</strong> | India (01/2020 - 12/2021): Lead Developer (PWA, Video/Audio streaming, Mobile Apps).<br>• <strong>Infosys Ltd.</strong> | India (06/2019 - 01/2020): Systems Engineer (Python & ServiceNow)."
    },
    {
        keywords: ["contact", "email", "hire", "hire me", "reach", "linkedin", "github", "phone", "dubai"],
        answer: "📬 <strong>Get in Touch:</strong><br>• Email: <a href='mailto:ajithgopikklm@gmail.com' class='text-info'>ajithgopikklm@gmail.com</a> / <a href='mailto:me@agopi.in' class='text-info'>me@agopi.in</a><br>• Phone: <span class='text-light'>(+971) 555-166-278</span> (Dubai, UAE)<br>• LinkedIn: <a href='https://www.linkedin.com/in/ahgopi/' target='_blank' class='text-info'>linkedin.com/in/ahgopi</a><br>• GitHub: <a href='https://github.com/ajithgopi' target='_blank' class='text-info'>github.com/ajithgopi</a>"
    },
    {
        keywords: ["education", "degree", "university", "college", "mg university"],
        answer: "🎓 <strong>Education:</strong><br>• <strong>Degree:</strong> Bachelor of Computer Application (BCA)<br>• <strong>University:</strong> Mahatma Gandhi University, Kottayam, India (2016 - 2019)<br>• <strong>Grade:</strong> 7.7 CGPA"
    }
];

function initAIAssistant() {
    const chatBody = document.getElementById("ai-chat-body");
    const chatInput = document.getElementById("ai-chat-input");
    const sendBtn = document.getElementById("ai-send-btn");

    if (!chatBody || !chatInput || !sendBtn) return;

    window.sendAIPrompt = function(text) {
        appendUserMessage(text);
        processAIResponse(text);
    };

    sendBtn.addEventListener("click", function() {
        const text = chatInput.value.trim();
        if (text) {
            appendUserMessage(text);
            chatInput.value = "";
            processAIResponse(text);
        }
    });

    chatInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            sendBtn.click();
        }
    });

    function appendUserMessage(text) {
        const userMsgHtml = `
            <div class="chat-msg user">
                <div class="chat-bubble">${escapeHtml(text)}</div>
            </div>
        `;
        chatBody.insertAdjacentHTML("beforeend", userMsgHtml);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function processAIResponse(query) {
        // Show typing indicator
        const typingId = "typing-" + Date.now();
        const typingHtml = `
            <div class="chat-msg bot" id="${typingId}">
                <div class="chat-avatar"><i class="fas fa-robot"></i></div>
                <div class="chat-bubble text-muted"><i class="fas fa-ellipsis-h fa-spin"></i> AI is thinking...</div>
            </div>
        `;
        chatBody.insertAdjacentHTML("beforeend", typingHtml);
        chatBody.scrollTop = chatBody.scrollHeight;

        setTimeout(() => {
            document.getElementById(typingId)?.remove();

            const queryLower = query.toLowerCase();
            let matchedAnswer = null;

            for (const item of aiKnowledgeBase) {
                if (item.keywords.some(kw => queryLower.includes(kw))) {
                    matchedAnswer = item.answer;
                    break;
                }
            }

            if (!matchedAnswer) {
                matchedAnswer = "🚀 Ajith is a full-stack engineer and AI developer! Try asking about his <strong>AI expertise</strong>, <strong>core tech stack</strong>, <strong>projects</strong>, or <strong>contact info</strong>.";
            }

            const botMsgHtml = `
                <div class="chat-msg bot">
                    <div class="chat-avatar"><i class="fas fa-robot"></i></div>
                    <div class="chat-bubble">${matchedAnswer}</div>
                </div>
            `;
            chatBody.insertAdjacentHTML("beforeend", botMsgHtml);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 600);
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
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
        const target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 80
            }, 500);
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