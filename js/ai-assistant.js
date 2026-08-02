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

    function generateReasoningSteps(query, matchedItem, isContextMatch, matchedScore) {
        const queryShort = query.length > 32 ? query.substring(0, 32) + '...' : query;
        const steps = [];

        // 1. NLP & Token Analysis
        steps.push(`Tokenizing query: "${queryShort}" & evaluating domain scope...`);

        // Add dynamic extra reasoning step for longer or multi-word queries
        if (query.length > 20 || query.includes(" ")) {
            steps.push(`Running intent classifier & embedding distance check...`);
        }

        // 2. Knowledge Retrieval & Vector Search
        if (isContextMatch) {
            steps.push(`Context memory active -> Evaluating conversational sentiment & thread state...`);
        } else if (matchedItem) {
            steps.push(`Querying CV Knowledge Base -> Matched entity: [${matchedItem.id}] (Relevance Score: ${matchedScore || 3})`);
        } else {
            steps.push(`Querying Knowledge Base -> Query identified as out of domain parameters. Steering conversation back to Ajith's portfolio.`);
        }

        // 3. Response Generation
        steps.push(`Formulating structured response & applying output formatting...`);

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

        // 1. Check pending context
        if (pendingQuestion) {
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

        const reasoningSteps = generateReasoningSteps(query, matchedItem, isContextMatch, matchedScore);

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

        // Dynamic step-by-step thinking animation with randomized per-step timing
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
                // Dynamic randomized delay per step (120ms - 320ms)
                const nextDelay = Math.floor(Math.random() * 200) + 120;
                setTimeout(unfoldNextStep, nextDelay);
            } else {
                // Finalize thinking block with dynamic completion delay
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

        // Start unfolding first step after brief initial delay
        setTimeout(unfoldNextStep, Math.floor(Math.random() * 150) + 100);
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
}
