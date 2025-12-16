// Phrase Highlighter & Scenarios Extension
(function () {
    'use strict';

    setTimeout(() => {
        const controller = window.voiceController;
        if (!controller) return;

        // Initialize
        controller.savedPhrases = JSON.parse(localStorage.getItem('savedPhrases') || '[]');
        controller.activeScenario = null;

        // Get elements
        const phraseBankBtn = document.getElementById('phraseBankBtn');
        const phraseBankPanel = document.getElementById('phraseBankPanel');
        const phraseBankClose = document.getElementById('phraseBankClose');
        const phraseBankContent = document.getElementById('phraseBankContent');
        const phraseSearchInput = document.getElementById('phraseSearchInput');

        const scenariosBtn = document.getElementById('scenariosBtn');
        const scenariosPanel = document.getElementById('scenariosPanel');
        const scenariosClose = document.getElementById('scenariosClose');

        // === Phrase Highlighting ===

        // Parse and highlight phrases in AI messages
        const highlightPhrases = (text) => {
            // Replace **phrase** with highlighted span
            return text.replace(/\*\*(.*?)\*\*/g, (match, phrase) => {
                return `<span class="highlighted-phrase" data-phrase="${phrase}">${phrase}</span>`;
            });
        };

        // Save phrase
        const savePhrase = (phrase, context) => {
            const phraseObj = {
                id: Date.now(),
                phrase: phrase,
                context: context,
                category: categorizePhrase(phrase),
                savedAt: new Date().toISOString(),
                scenario: controller.activeScenario
            };

            controller.savedPhrases.push(phraseObj);
            localStorage.setItem('savedPhrases', JSON.stringify(controller.savedPhrases));

            showToast(`Phrase saved: "${phrase}"`);
            renderPhrases();
        };

        // Categorize phrase - Improved
        const categorizePhrase = (phrase) => {
            const lower = phrase.toLowerCase().trim();

            // Polite forms - modal verbs, please, kindly
            if (
                lower.includes('would you') ||
                lower.includes('could you') ||
                lower.includes('may i') ||
                lower.includes('might i') ||
                lower.includes('please') ||
                lower.includes('kindly') ||
                lower.includes('excuse me') ||
                lower.includes('i was wondering') ||
                lower.includes('would you mind') ||
                lower.includes('if you don\'t mind')
            ) {
                return 'polite';
            }

            // Questions - starts with question words or contains ?
            if (
                lower.includes('?') ||
                lower.startsWith('how') ||
                lower.startsWith('what') ||
                lower.startsWith('where') ||
                lower.startsWith('when') ||
                lower.startsWith('why') ||
                lower.startsWith('who') ||
                lower.startsWith('which') ||
                lower.startsWith('do you') ||
                lower.startsWith('does') ||
                lower.startsWith('did') ||
                lower.startsWith('can you') ||
                lower.startsWith('are you')
            ) {
                return 'questions';
            }

            // Default to expressions
            return 'expressions';
        };

        // Render saved phrases
        const renderPhrases = (filter = 'all', search = '') => {
            let phrases = controller.savedPhrases;

            // Filter by category
            if (filter !== 'all') {
                phrases = phrases.filter(p => p.category === filter);
            }

            // Filter by search
            if (search) {
                phrases = phrases.filter(p =>
                    p.phrase.toLowerCase().includes(search.toLowerCase()) ||
                    p.context.toLowerCase().includes(search.toLowerCase())
                );
            }

            if (phrases.length === 0) {
                phraseBankContent.innerHTML = `
                    <div class="empty-phrases">
                        <div class="empty-phrases-icon">💡</div>
                        <p>No phrases found</p>
                        <small>Try a different filter or search</small>
                    </div>
                `;
                return;
            }

            phraseBankContent.innerHTML = phrases.map(p => `
                <div class="phrase-item" data-id="${p.id}">
                    <div class="phrase-text">${p.phrase}</div>
                    <div class="phrase-context">"${p.context}"</div>
                    <div class="phrase-meta">
                        <span class="phrase-category">${p.category}</span>
                        ${p.scenario ? `<span class="phrase-scenario">${p.scenario}</span>` : ''}
                        <button class="phrase-delete" data-id="${p.id}">🗑️</button>
                    </div>
                </div>
            `).join('');

            // Add delete handlers
            document.querySelectorAll('.phrase-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    controller.savedPhrases = controller.savedPhrases.filter(p => p.id !== id);
                    localStorage.setItem('savedPhrases', JSON.stringify(controller.savedPhrases));
                    renderPhrases(filter, search);
                    showToast('Phrase deleted');
                });
            });
        };

        // Override addMessage to highlight phrases
        const originalAddMessage = controller.addMessage.bind(controller);
        controller.addMessage = function (type, text) {
            if (type === 'ai') {
                // Highlight phrases before adding
                const highlightedText = highlightPhrases(text);
                originalAddMessage(type, highlightedText);

                // Add click handlers to highlighted phrases
                setTimeout(() => {
                    const lastBubble = controller.chatMessages.lastElementChild;
                    if (lastBubble) {
                        const phrases = lastBubble.querySelectorAll('.highlighted-phrase');
                        phrases.forEach(span => {
                            span.addEventListener('click', () => {
                                const phrase = span.dataset.phrase;
                                const context = lastBubble.querySelector('.message-content').textContent;
                                savePhrase(phrase, context);
                                span.classList.add('saved');
                            });
                        });
                    }
                }, 100);
            } else {
                originalAddMessage(type, text);
            }
        };

        // === Scenarios ===

        // Start scenario
        const startScenario = (scenarioType) => {
            controller.activeScenario = scenarioType;

            // Update status bar
            const statusText = document.getElementById('statusText');
            const scenarioIcons = {
                restaurant: '🍽️',
                airport: '✈️',
                interview: '💼',
                shopping: '🛍️',
                hotel: '🏨',
                doctor: '🏥',
                bank: '🏦',
                taxi: '🚕',
                phone: '📞',
                meeting: '👥',
                party: '🎉',
                complaint: '😤'
            };
            const scenarioNames = {
                restaurant: 'Restaurant',
                airport: 'Airport',
                interview: 'Interview',
                shopping: 'Shopping',
                hotel: 'Hotel',
                doctor: 'Doctor',
                bank: 'Bank',
                taxi: 'Taxi',
                phone: 'Phone Call',
                meeting: 'Meeting',
                party: 'Party',
                complaint: 'Complaint'
            };

            if (statusText) {
                statusText.textContent = `${scenarioIcons[scenarioType]} ${scenarioNames[scenarioType]} Scenario`;
            }

            // Close scenarios panel
            scenariosPanel.style.display = 'none';

            // Add scenario intro message
            const intros = {
                restaurant: "Welcome to our restaurant! What can I get you today?",
                airport: "Hello! Welcome to check-in. May I see your passport and booking reference?",
                interview: "Good morning! Thank you for coming. Please, have a seat. Tell me about yourself.",
                shopping: "Hi there! Welcome to our store. How can I help you today?",
                hotel: "Good evening! Welcome to our hotel. Do you have a reservation?",
                doctor: "Hello, please have a seat. What brings you in today?",
                bank: "Good afternoon! How may I assist you with your banking needs?",
                taxi: "Hello! Where would you like to go today?",
                phone: "Good morning, this is Sarah speaking. How can I help you?",
                meeting: "Good morning everyone! Let's begin our meeting. Who would like to start?",
                party: "Hi! I'm glad you could make it! How have you been?",
                complaint: "I understand you have a concern. Please tell me what happened."
            };

            controller.addMessage('ai', intros[scenarioType]);
            showToast(`Started ${scenarioNames[scenarioType]} scenario`);
        };

        // End scenario
        const endScenario = () => {
            controller.activeScenario = null;
            const statusText = document.getElementById('statusText');
            if (statusText) {
                statusText.textContent = 'Click mic to start';
            }
            showToast('Scenario ended');
        };

        // Override handleUserSpeech to include scenario
        const originalHandleUserSpeech = controller.handleUserSpeech?.bind(controller);
        if (originalHandleUserSpeech) {
            controller.handleUserSpeech = function (text) {
                const topic = controller.conversationTopic || 'general';
                const level = controller.englishLevel || 'B2';
                const scenario = controller.activeScenario || '';

                let contextPrefix = `[Topic: ${topic}, Level: ${level}`;
                if (scenario) {
                    contextPrefix += `, Scenario: ${scenario}`;
                }
                contextPrefix += '] ';

                const contextualText = contextPrefix + text;

                // Display original text to user
                controller.addMessage('user', text);

                // Show typing indicator
                const indicator = document.createElement('div');
                indicator.className = 'message-bubble ai typing-bubble';
                indicator.id = 'typingIndicator';
                indicator.innerHTML = `
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                `;
                controller.chatMessages.appendChild(indicator);
                controller.scrollToBottom();

                // Send contextual message to backend
                const message = {
                    type: 'message',
                    content: contextualText,
                    sender: 'user'
                };

                if (!controller.wsClient.send(message)) {
                    showToast('Failed to send message');
                    const typingIndicator = document.getElementById('typingIndicator');
                    if (typingIndicator) typingIndicator.remove();
                }
            };
        }

        // === Event Listeners ===

        // Phrase Bank
        phraseBankBtn.addEventListener('click', () => {
            phraseBankPanel.style.display = 'block';
            renderPhrases();
        });

        phraseBankClose.addEventListener('click', () => {
            phraseBankPanel.style.display = 'none';
        });

        // Category filter
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const category = btn.dataset.category;
                const search = phraseSearchInput.value;
                renderPhrases(category, search);
            });
        });

        // Search
        phraseSearchInput.addEventListener('input', (e) => {
            const activeCategory = document.querySelector('.category-btn.active').dataset.category;
            renderPhrases(activeCategory, e.target.value);
        });

        // Scenarios
        scenariosBtn.addEventListener('click', () => {
            scenariosPanel.style.display = 'block';
        });

        scenariosClose.addEventListener('click', () => {
            scenariosPanel.style.display = 'none';
        });

        // Start scenario buttons
        document.querySelectorAll('.scenario-start-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.scenario-card');
                const scenario = card.dataset.scenario;
                startScenario(scenario);
            });
        });

        // Add end scenario button (optional - can add to UI later)
        controller.endScenario = endScenario;

        console.log('✨ Phrase Highlighter & Scenarios loaded!');
    }, 2500);
})();
