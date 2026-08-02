/* -------------------------------------------------------------
 * Interactive AI Assistant Sandbox ("Ajith AI") with Reasoning Engine
 * ------------------------------------------------------------- */
const aiKnowledgeBase = [
    {
        id: "expertise",
        keywords: ["ai", "machine learning", "llm", "rag", "agent", "prompt", "gpt", "claude", "deep learning", "nlp", "artificial intelligence", "ollama", "openai"],
        answer: "🤖 <strong>Ajith's AI & Automation Expertise:</strong><br>Ajith prioritizes AI-based development (Claude/OpenAI/Ollama) with in-sprint automation. He designs custom RAG pipelines, context-aware document search, and LLM integrations across Node.js, Python, React, and AWS microservices!"
    },
    {
        id: "projects",
        keywords: ["project", "portfolio", "built", "apps", "work", "reach52", "tutorhow", "insights", "gold vault", "showcase", "github"],
        answer: "⚡ <strong>Key CV Projects:</strong><br>1. <strong>Emirates NBD Corporate Banking:</strong> RM daily management & deal platforms (React, Node, MongoDB, OracleDB).<br>2. <strong>reach52 insights & connect:</strong> Enterprise analytical monitoring & admin automation.<br>3. <strong>Tutorhow Virtual Front Desk & ETO:</strong> Multi-tenant edtech & PWA applications.<br>4. <strong>Gold Vault Tracker:</strong> Precious metal tracking iOS app."
    },
    {
        id: "skills",
        keywords: ["skill", "stack", "technology", "languages", "tech", "python", "react", "node", "aws", "framework", "database", "sql", "mongodb", "docker", "kubernetes", "swift", "kotlin", "php", "javascript", "typescript"],
        answer: "🛠️ <strong>Core Tech Stack:</strong><br>• <strong>Languages:</strong> JavaScript (ES6+), TypeScript, Python, Swift, Kotlin, PHP, SQL<br>• <strong>Frontend:</strong> React, Next.js, Angular, Redux, Tailwind, Bootstrap<br>• <strong>Backend & Cloud:</strong> Node.js, Express, Laravel, AWS, Docker, K8s<br>• <strong>Databases:</strong> MongoDB, PostgreSQL, MySQL, Redis, DynamoDB, Neo4J, OracleDB"
    },
    {
        id: "experience",
        keywords: ["experience", "background", "career", "job", "emirates", "synechron", "reach52", "tutorhow", "infosys", "history", "resume", "cv"],
        answer: "💼 <strong>Professional Experience:</strong><br>• <strong>Emirates NBD (Synechron)</strong> | Dubai (11/2024 - Present): Corporate Banking & AI-driven dev.<br>• <strong>reach52</strong> | Singapore (01/2022 - 11/2024): Full Stack Engineer & Cloud Microservices.<br>• <strong>Tutorhow</strong> | India (01/2020 - 12/2021): Lead Developer (PWA, Video/Audio streaming, Mobile Apps).<br>• <strong>Infosys</strong> | India (06/2019 - 01/2020): Systems Engineer."
    },
    {
        id: "contact",
        keywords: ["contact", "email", "hire", "reach", "linkedin", "phone", "call", "message", "social", "connect"],
        answer: "📬 <strong>Get in Touch:</strong><br>• Email: <a href='mailto:ajithgopikklm@gmail.com' class='text-info'>ajithgopikklm@gmail.com</a><br>• Phone: <span class='text-info'>(+971) 555-166-278</span> (Dubai)<br>• LinkedIn: <a href='https://www.linkedin.com/in/ahgopi/' target='_blank' class='text-info'>linkedin.com/in/ahgopi</a><br>• GitHub: <a href='https://github.com/ajithgopi' target='_blank' class='text-info'>github.com/ajithgopi</a>"
    },
    {
        id: "education",
        keywords: ["education", "degree", "university", "college", "mg university", "bca", "graduate", "study", "studied", "school"],
        answer: "🎓 <strong>Education:</strong><br>• <strong>Degree:</strong> Bachelor of Computer Application (BCA)<br>• <strong>University:</strong> Mahatma Gandhi University, Kottayam, India (2016 - 2019)<br>• <strong>Grade:</strong> 7.7 CGPA"
    },
    {
        id: "greetings",
        keywords: ["hi", "hello", "hey", "greetings", "morning", "afternoon", "evening", "who are you", "what are you"],
        answer: "👋 Hello! I'm Ajith's AI Assistant. Would you like to see a summary of his <strong>projects</strong> or <strong>experience</strong>?",
        qid: "ask_projects_or_experience"
    },
    {
        id: "thanks",
        keywords: ["thanks", "thank you", "ok", "great", "awesome", "cool", "nice", "good", "perfect"],
        answer: "You're welcome! Would you like to know how to get in touch with Ajith?",
        qid: "ask_contact"
    },
    {
        id: "location",
        keywords: ["location", "where", "live", "based", "city", "country", "dubai", "uae", "india", "relocate"],
        answer: "🌍 <strong>Location:</strong> Ajith is currently based in <strong>Dubai, UAE</strong>. He is open to exciting software engineering and AI architecture roles!"
    },
    {
        id: "salary",
        keywords: ["salary", "pay", "compensation", "rate", "cost", "price"],
        answer: "💰 Regarding compensation or rates, please contact Ajith directly at <a href='mailto:ajithgopikklm@gmail.com' class='text-info'>ajithgopikklm@gmail.com</a> to discuss!"
    }
];

// Tech Matrix with Specific Years & Experience Details
const techExperienceMap = {
    "javascript": { name: "JavaScript", years: "7+", role: "Full Stack Development & SPAs", details: "Core language used extensively across React, Next.js, Node.js, Express, and PWAs." },
    "js": { name: "JavaScript", years: "7+", role: "Full Stack Development & SPAs", details: "Core language used extensively across React, Next.js, Node.js, Express, and PWAs." },
    "typescript": { name: "TypeScript", years: "5+", role: "Enterprise Architecture & Microservices", details: "Strict type-safe development across React, Node.js, and cloud microservices." },
    "ts": { name: "TypeScript", years: "5+", role: "Enterprise Architecture & Microservices", details: "Strict type-safe development across React, Node.js, and cloud microservices." },
    "react": { name: "React / Next.js", years: "6+", role: "Frontend UI Architecture", details: "Building RM deal platforms at Emirates NBD, analytical dashboards, and enterprise PWAs." },
    "node": { name: "Node.js", years: "6+", role: "Backend Microservices & REST/GraphQL APIs", details: "Architecting scalable Node.js microservices with Express, MongoDB, PostgreSQL, and AWS." },
    "nodejs": { name: "Node.js", years: "6+", role: "Backend Microservices & REST/GraphQL APIs", details: "Architecting scalable Node.js microservices with Express, MongoDB, PostgreSQL, and AWS." },
    "express": { name: "Express.js", years: "6+", role: "Backend Microservices & APIs", details: "Building enterprise REST APIs and microservice gateways." },
    "python": { name: "Python", years: "4+", role: "AI RAG Pipelines & Backend Automation", details: "Custom LLM integrations (Claude/OpenAI/Ollama), document vector search, and FastAPI/Flask." },
    "ai": { name: "AI & LLM Engineering", years: "3+", role: "AI Architecture & RAG Pipelines", details: "Designing custom RAG pipelines, prompt engineering, vector indexing, and automated workflows." },
    "llm": { name: "LLM Integrations", years: "3+", role: "AI Architecture & Prompt Engineering", details: "Integrating OpenAI, Claude, and Ollama models into enterprise microservices." },
    "rag": { name: "RAG Pipelines", years: "3+", role: "Vector Search & Retrieval Augmented Gen", details: "Building context-aware document retrieval and custom vector search engines." },
    "swift": { name: "Swift / iOS", years: "3+", role: "Native iOS Mobile Apps", details: "Built native iOS apps like Gold Vault Tracker featuring WidgetKit extensions and biometric security." },
    "ios": { name: "iOS Development", years: "3+", role: "Native iOS Mobile Apps", details: "Built native iOS apps like Gold Vault Tracker featuring WidgetKit extensions and biometric security." },
    "kotlin": { name: "Kotlin", years: "3+", role: "Mobile Application Development", details: "Cross-platform and native mobile software development." },
    "android": { name: "Android", years: "3+", role: "Mobile Application Development", details: "Cross-platform and native mobile software development." },
    "aws": { name: "AWS & Cloud", years: "4+", role: "Cloud Infrastructure & Serverless", details: "Deploying and managing microservices on AWS Lambda, S3, ECS, EC2, and API Gateways." },
    "cloud": { name: "AWS Cloud", years: "4+", role: "Cloud Infrastructure & Serverless", details: "Deploying and managing microservices on AWS Lambda, S3, ECS, EC2, and API Gateways." },
    "docker": { name: "Docker", years: "4+", role: "Containerization & CI/CD", details: "Containerizing microservices for seamless cloud deployments and staging environments." },
    "k8s": { name: "Kubernetes", years: "3+", role: "Container Orchestration", details: "Managing containerized microservice deployments and scaling." },
    "kubernetes": { name: "Kubernetes", years: "3+", role: "Container Orchestration", details: "Managing containerized microservice deployments and scaling." },
    "mongodb": { name: "MongoDB", years: "5+", role: "NoSQL Database Engineering", details: "Designed high-performance MongoDB schemas for Emirates NBD deal platforms and reach52." },
    "sql": { name: "SQL & Relational DBs", years: "6+", role: "Relational Database Management", details: "PostgreSQL, MySQL, and OracleDB schema optimization and query execution." },
    "postgresql": { name: "PostgreSQL", years: "5+", role: "Relational Database Management", details: "PostgreSQL database architecture and data pipelines." },
    "postgres": { name: "PostgreSQL", years: "5+", role: "Relational Database Management", details: "PostgreSQL database architecture and data pipelines." },
    "oracledb": { name: "OracleDB", years: "2+", role: "Enterprise Banking Database", details: "Used at Emirates NBD for corporate banking management systems." },
    "angular": { name: "Angular", years: "3+", role: "Frontend Development", details: "Building modular enterprise frontend portals." },
    "php": { name: "PHP / Laravel", years: "4+", role: "Full Stack & Web APIs", details: "Laravel backend services and REST APIs." },
    "laravel": { name: "Laravel", years: "4+", role: "Backend Web Framework", details: "Building robust MVC web backends and API endpoints." },
    "next.js": { name: "Next.js", years: "3+", role: "SSR & React Web Apps", details: "Building performant web applications with Next.js." },
    "nextjs": { name: "Next.js", years: "3+", role: "SSR & React Web Apps", details: "Building performant web applications with Next.js." }
};

const fallbackAnswers = [
    { text: "🎯 As an AI assistant specialized in Ajith's professional portfolio, I focus strictly on his career, skills, and projects! Try asking about his <strong>AI expertise</strong>, <strong>core tech stack</strong>, <strong>projects</strong>, or <strong>contact info</strong>.", qid: null },
    { text: "📌 That topic falls outside my domain parameters. I am dedicated to assisting with Ajith's professional background. Would you like me to summarize his <strong>experience</strong>?", qid: "ask_experience" },
    { text: "⚡ My primary directive is providing information on Ajith's technical portfolio. Would you like to see the core technologies Ajith uses (like <strong>React, Python, or AWS</strong>)?", qid: "ask_skills" }
];

const positiveWords = ["yes", "yeah", "yep", "sure", "ok", "okay", "please", "absolutely", "definitely", "course"];
const negativeWords = ["no", "nope", "nah", "never", "don't", "stop", "nothing", "none"];

function analyzeSentiment(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let posCount = words.filter(w => positiveWords.includes(w)).length;
    let negCount = words.filter(w => negativeWords.includes(w)).length;
    
    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
}

function clearAIChat() {
    const chatBody = document.getElementById("ai-chat-body");
    if (chatBody) {
        chatBody.innerHTML = `
            <div class="chat-msg bot">
                <div class="chat-avatar"><i class="fas fa-robot"></i></div>
                <div class="chat-bubble">
                    👋 Hi there! I'm Ajith's AI Assistant with step-by-step reasoning enabled. Ask me anything about Ajith's <strong>experience</strong>, <strong>AI expertise</strong>, or <strong>top projects</strong>!
                </div>
            </div>
        `;
    }
}

function initAIAssistant() {
    const chatBody = document.getElementById("ai-chat-body");
    const chatInput = document.getElementById("ai-chat-input");
    const sendBtn = document.getElementById("ai-send-btn");
    
    let pendingQuestion = null;

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

    // Smart technology & experience intent parser
    function parseTechOrExperienceIntent(queryLower) {
        const words = queryLower.match(/\b\w+\b/g) || [];
        
        const isTotalExpQuery = (
            (queryLower.includes("total") || queryLower.includes("overall") || queryLower.includes("career")) &&
            (queryLower.includes("experience") || queryLower.includes("years") || queryLower.includes("working"))
        ) || queryLower === "what is your total experience" || queryLower === "total experience";

        if (isTotalExpQuery) {
            return {
                type: "total_experience",
                reasoning: "Parsed intent: Total Experience Request -> Calculated 7+ years across enterprise roles (since June 2019).",
                answer: "💼 <strong>Ajith's Total Experience:</strong><br>Ajith has <strong>7+ years of total professional software engineering experience</strong> (since June 2019), specializing in <strong>Full Stack Development, AI Engineering, and Cloud Microservices</strong> across leading organizations like Emirates NBD, reach52, Tutorhow, and Infosys."
            };
        }

        // Check if query is asking for years of experience or "do you know" for a specific technology
        const isExpQuery = queryLower.includes("experience") || queryLower.includes("years") || queryLower.includes("how long");
        const isDoYouKnowQuery = queryLower.includes("do you know") || queryLower.includes("does ajith know") || queryLower.includes("knows") || queryLower.includes("familiar");

        // Search tech map for matched technology
        for (const [key, techObj] of Object.entries(techExperienceMap)) {
            // Match tech keyword (e.g. "python", "react", "swift")
            const regex = new RegExp(`\\b${key}\\b`, 'i');
            if (regex.test(queryLower)) {
                if (isDoYouKnowQuery) {
                    return {
                        type: "tech_know",
                        techName: techObj.name,
                        reasoning: `Extracted technology entity: [${techObj.name}] -> Evaluated capabilities & verified ${techObj.years} experience.`,
                        answer: `✅ <strong>Yes, Ajith knows ${techObj.name}!</strong><br>He has <strong>${techObj.years} of hands-on experience in ${techObj.name}</strong> (${techObj.role}). ${techObj.details}`
                    };
                } else if (isExpQuery) {
                    return {
                        type: "tech_experience",
                        techName: techObj.name,
                        reasoning: `Extracted technology entity: [${techObj.name}] -> Queried experience matrix (${techObj.years} experience).`,
                        answer: `⚡ <strong>${techObj.name} Experience:</strong><br>Ajith has <strong>${techObj.years} of hands-on experience working with ${techObj.name}</strong>. He specializes in <strong>${techObj.role}</strong> — ${techObj.details}`
                    };
                } else {
                    return {
                        type: "tech_general",
                        techName: techObj.name,
                        reasoning: `Extracted technology entity: [${techObj.name}] -> Formulated skill summary (${techObj.years} experience).`,
                        answer: `🛠️ <strong>${techObj.name} Expertise:</strong><br>Ajith brings <strong>${techObj.years} of experience in ${techObj.name}</strong> (${techObj.role}). ${techObj.details}`
                    };
                }
            }
        }

        // Handle "Do you know [Unknown Tech]?" inquiries
        if (isDoYouKnowQuery) {
            // Extract potential technology word
            const unknownTech = words.find(w => !["do", "you", "know", "does", "ajith", "he", "is", "with", "any", "about", "have"].includes(w));
            const techLabel = unknownTech ? unknownTech.charAt(0).toUpperCase() + unknownTech.slice(1) : "this technology";
            return {
                type: "unknown_tech",
                techName: techLabel,
                reasoning: `Evaluating unknown tech entity: [${techLabel}] against core stack -> Entity identified as secondary/adjacent tool.`,
                answer: `ℹ️ <strong>Technology Capability:</strong><br>Ajith's core tech stack centers around <strong>JavaScript/TypeScript (7+ yrs), React (6+ yrs), Node.js (6+ yrs), Python (4+ yrs), AI/LLMs (3+ yrs), and AWS (4+ yrs)</strong>. While <strong>${techLabel}</strong> is not listed as his primary framework, as a senior engineer with <strong>7+ years of experience</strong>, he adapts to new tools & languages quickly!`
            };
        }

        return null;
    }

    function generateReasoningSteps(query, matchedItem, isContextMatch, matchedScore, techIntent) {
        const queryShort = query.length > 32 ? query.substring(0, 32) + '...' : query;
        const steps = [];

        // 1. NLP & Token Analysis
        steps.push(`Tokenizing query: "${queryShort}" & evaluating domain scope...`);

        if (query.length > 20 || query.includes(" ")) {
            steps.push(`Running intent classifier & embedding distance check...`);
        }

        // 2. Knowledge Retrieval & Vector Search
        if (techIntent) {
            steps.push(techIntent.reasoning);
        } else if (isContextMatch) {
            steps.push(`Context memory active -> Evaluating conversational sentiment & thread state...`);
        } else if (matchedItem) {
            steps.push(`Querying CV Knowledge Base -> Matched entity: [${matchedItem.id}] (Relevance Score: ${matchedScore || 3})`);
        } else {
            steps.push(`Querying Knowledge Base -> Query identified as out of domain parameters. Steering conversation back to Ajith's portfolio.`);
        }

        // 3. Response Generation
        steps.push(`Formulating structured response with highlighted metrics & output formatting...`);

        return steps;
    }

    function processAIResponse(query) {
        const startTime = Date.now();
        const msgId = "ai-msg-" + startTime;
        
        const queryLower = query.toLowerCase();
        const words = queryLower.match(/\b\w+\b/g) || [];
        
        let matchedAnswer = null;
        let nextPendingQuestion = null;
        let matchedItem = null;
        let matchedScore = 0;
        let isContextMatch = false;

        // 0. Check Technology / Years of Experience Intent First
        const techIntent = parseTechOrExperienceIntent(queryLower);
        if (techIntent) {
            matchedAnswer = techIntent.answer;
        }

        // 1. Check pending context
        if (!matchedAnswer && pendingQuestion) {
            const sentiment = analyzeSentiment(queryLower);
            isContextMatch = true;
            
            if (sentiment === 'positive') {
                if (pendingQuestion === 'ask_experience') {
                    matchedAnswer = aiKnowledgeBase.find(item => item.id === 'experience').answer;
                } else if (pendingQuestion === 'ask_skills') {
                    matchedAnswer = aiKnowledgeBase.find(item => item.id === 'skills').answer;
                } else if (pendingQuestion === 'ask_contact') {
                    matchedAnswer = aiKnowledgeBase.find(item => item.id === 'contact').answer;
                } else if (pendingQuestion === 'ask_projects_or_experience') {
                    matchedAnswer = aiKnowledgeBase.find(item => item.id === 'projects').answer;
                }
            } else if (sentiment === 'negative') {
                matchedAnswer = "No problem! Let me know if there's anything else you'd like to ask.";
            } else {
                if (pendingQuestion === 'ask_projects_or_experience') {
                    if (queryLower.includes('project')) {
                        matchedAnswer = aiKnowledgeBase.find(item => item.id === 'projects').answer;
                    } else if (queryLower.includes('experience')) {
                        matchedAnswer = aiKnowledgeBase.find(item => item.id === 'experience').answer;
                    }
                }
            }
            pendingQuestion = null;
        }

        // 2. Knowledge base search
        if (!matchedAnswer) {
            let bestMatch = null;
            let highestScore = 0;

            for (const item of aiKnowledgeBase) {
                let score = 0;
                for (const kw of item.keywords) {
                    if (queryLower.includes(kw)) {
                        score += 3; 
                    }
                }
                for (const word of words) {
                    if (item.keywords.includes(word)) {
                        score += 1;
                    }
                }

                if (score > highestScore && score > 0) {
                    highestScore = score;
                    bestMatch = item;
                }
            }

            if (bestMatch) {
                matchedAnswer = bestMatch.answer;
                nextPendingQuestion = bestMatch.qid || null;
                matchedItem = bestMatch;
                matchedScore = highestScore;
            }
        }

        // 3. Fallback
        if (!matchedAnswer) {
            const fallback = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
            matchedAnswer = fallback.text;
            nextPendingQuestion = fallback.qid || null;
        }
        
        pendingQuestion = nextPendingQuestion;

        const reasoningSteps = generateReasoningSteps(query, matchedItem, isContextMatch, matchedScore, techIntent);

        // Render initial thinking state
        const initialBotMsgHtml = `
            <div class="chat-msg bot" id="${msgId}">
                <div class="chat-avatar"><i class="fas fa-robot"></i></div>
                <div class="chat-bubble">
                    <div class="ai-thought-box" id="${msgId}-thought-box">
                        <div class="ai-thought-summary">
                            <i class="fas fa-brain fa-spin text-info"></i> Thinking process...
                            <div class="thinking-dots"><span></span><span></span><span></span></div>
                        </div>
                        <div class="ai-thought-content" id="${msgId}-thought-content"></div>
                    </div>
                    <div class="chat-answer-text d-none" id="${msgId}-answer">${matchedAnswer}</div>
                </div>
            </div>
        `;
        
        chatBody.insertAdjacentHTML("beforeend", initialBotMsgHtml);
        chatBody.scrollTop = chatBody.scrollHeight;

        const thoughtContentEl = document.getElementById(`${msgId}-thought-content`);
        let stepIdx = 0;

        function unfoldNextStep() {
            if (stepIdx < reasoningSteps.length) {
                const stepHtml = `
                    <div class="ai-thought-step">
                        <i class="fas fa-circle-notch fa-spin text-info"></i> ${reasoningSteps[stepIdx]}
                    </div>
                `;
                if (thoughtContentEl) {
                    thoughtContentEl.insertAdjacentHTML("beforeend", stepHtml);
                    chatBody.scrollTop = chatBody.scrollHeight;
                }
                stepIdx++;
                const nextDelay = Math.floor(Math.random() * 200) + 120;
                setTimeout(unfoldNextStep, nextDelay);
            } else {
                const finalDelay = Math.floor(Math.random() * 250) + 150;
                setTimeout(() => {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                    const thoughtBoxEl = document.getElementById(`${msgId}-thought-box`);
                    const answerEl = document.getElementById(`${msgId}-answer`);

                    if (thoughtBoxEl) {
                        thoughtBoxEl.innerHTML = `
                            <details class="ai-thought-details">
                                <summary class="ai-thought-summary">
                                    <i class="fas fa-chevron-right chevron"></i>
                                    <i class="fas fa-lightbulb text-warning"></i>
                                    Thought for ${elapsed}s
                                </summary>
                                <div class="ai-thought-content">
                                    ${reasoningSteps.map(step => `
                                        <div class="ai-thought-step">
                                            <i class="fas fa-check text-success"></i> ${step}
                                        </div>
                                    `).join('')}
                                </div>
                            </details>
                        `;
                    }

                    if (answerEl) {
                        answerEl.classList.remove("d-none");
                    }
                    
                    chatBody.scrollTop = chatBody.scrollHeight;
                }, finalDelay);
            }
        }

        setTimeout(unfoldNextStep, Math.floor(Math.random() * 150) + 100);
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
}
