// Advanced Features Extension for PremiumVoiceController
// This file extends the main controller with advanced features

// Extend the controller with advanced features
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const controller = window.voiceController;
        if (!controller) return;

        // Initialize advanced features
        controller.messages = [];
        controller.autoScroll = true;
        controller.soundEffectsEnabled = true;
        controller.speechRate = 1.0;

        // Get elements
        const searchBtn = document.getElementById('searchBtn');
        const exportBtn = document.getElementById('exportBtn');
        const clearBtn = document.getElementById('clearBtn');
        const themeBtn = document.getElementById('themeBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const searchBar = document.getElementById('searchBar');
        const searchInput = document.getElementById('searchInput');
        const searchClose = document.getElementById('searchClose');
        const settingsPanel = document.getElementById('settingsPanel');
        const settingsClose = document.getElementById('settingsClose');
        const speechRateSlider = document.getElementById('speechRateSlider');
        const autoScrollToggle = document.getElementById('autoScrollToggle');
        const soundEffectsToggle = document.getElementById('soundEffectsToggle');
        const topicSelect = document.getElementById('topicSelect');
        const levelSelect = document.getElementById('levelSelect');

        // Initialize topic and level
        controller.conversationTopic = 'general';
        controller.englishLevel = 'B2';
        controller.voiceGender = 'female'; // Default to female voice

        // Clear chat with custom modal
        const clearChat = () => {
            showConfirmModal(
                'Clear Chat History?',
                'This will delete all messages in the conversation. This action cannot be undone.',
                () => {
                    const chatMessages = document.getElementById('chatMessages');
                    const emptyState = document.getElementById('emptyState');

                    // Remove all message bubbles
                    const messages = chatMessages.querySelectorAll('.message-bubble, .time-separator, .skeleton-message');
                    messages.forEach(msg => msg.remove());

                    // Show empty state
                    if (emptyState) {
                        emptyState.style.display = 'flex';
                    }

                    showToast('Chat cleared');
                }
            );
        };

        // Custom confirmation modal
        const showConfirmModal = (title, message, onConfirm) => {
            const modal = document.getElementById('confirmModal');
            const modalTitle = modal.querySelector('.modal-title');
            const modalMessage = modal.querySelector('.modal-message');
            const confirmBtn = document.getElementById('modalConfirm');
            const cancelBtn = document.getElementById('modalCancel');

            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modal.style.display = 'flex';

            // Handle confirm
            const handleConfirm = () => {
                modal.style.display = 'none';
                onConfirm();
                cleanup();
            };

            // Handle cancel
            const handleCancel = () => {
                modal.style.display = 'none';
                cleanup();
            };

            // Cleanup listeners
            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                modal.removeEventListener('click', handleOverlayClick);
            };

            // Close on overlay click
            const handleOverlayClick = (e) => {
                if (e.target === modal) {
                    handleCancel();
                }
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            modal.addEventListener('click', handleOverlayClick);
        };

        // Update status bar
        const updateStatusBar = () => {
            const topicInfo = document.getElementById('topicInfo');
            const levelInfo = document.getElementById('levelInfo');
            const statusDot = document.getElementById('statusDot');

            if (topicInfo) {
                const topicNames = {
                    'general': 'General',
                    'daily': 'Daily Life',
                    'work': 'Work',
                    'travel': 'Travel',
                    'food': 'Food',
                    'technology': 'Tech',
                    'health': 'Health',
                    'education': 'Education',
                    'entertainment': 'Entertainment',
                    'sports': 'Sports',
                    'family': 'Family',
                    'hobbies': 'Hobbies'
                };
                topicInfo.textContent = topicNames[controller.conversationTopic] || 'General';
            }

            if (levelInfo) {
                levelInfo.textContent = controller.englishLevel || 'B2';
            }

            // Update connection status
            if (statusDot && controller.wsClient?.isConnected) {
                statusDot.classList.add('connected');
            }
        };

        // Call initially
        updateStatusBar();

        // === Search Feature ===
        const toggleSearch = () => {
            const isVisible = searchBar.style.display !== 'none';
            searchBar.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                searchInput.focus();
            } else {
                searchInput.value = '';
                clearSearchHighlights();
            }
        };

        const searchMessages = (query) => {
            clearSearchHighlights();
            if (!query) return;

            const messages = controller.chatMessages.querySelectorAll('.message-content');
            messages.forEach(msg => {
                const timestamp = msg.querySelector('.message-timestamp');
                const text = timestamp ? msg.textContent.replace(timestamp.textContent, '') : msg.textContent;

                if (text.toLowerCase().includes(query.toLowerCase())) {
                    const regex = new RegExp(`(${query})`, 'gi');
                    const parts = text.split(regex);
                    msg.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            const span = document.createElement('span');
                            span.innerHTML = node.textContent.replace(regex, '<span class="search-highlight">$1</span>');
                            node.replaceWith(span);
                        }
                    });
                }
            });
        };

        const clearSearchHighlights = () => {
            const highlights = controller.chatMessages.querySelectorAll('.search-highlight');
            highlights.forEach(highlight => {
                const text = highlight.textContent;
                highlight.replaceWith(document.createTextNode(text));
            });
        };

        // === Export Feature ===
        const exportConversation = () => {
            const data = {
                exportDate: new Date().toISOString(),
                messages: controller.messages || []
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conversation-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            showToast('Conversation exported!');
        };

        // === Theme Toggle ===
        const toggleTheme = () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            showToast(`Switched to ${isLight ? 'light' : 'dark'} theme`);
        };

        // === Settings ===
        const toggleSettings = () => {
            const isVisible = settingsPanel.style.display !== 'none';
            settingsPanel.style.display = isVisible ? 'none' : 'block';
        };

        const updateRateButtons = () => {
            document.querySelectorAll('.rate-btn').forEach(btn => {
                const rate = parseFloat(btn.dataset.rate);
                btn.classList.toggle('active', Math.abs(rate - controller.speechRate) < 0.01);
            });
        };

        // === Toast Notification - Enhanced ===
        const showToast = (message) => {
            const toast = document.createElement('div');
            toast.className = 'toast show';
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.classList.remove('show');
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        };

        // === Event Listeners ===
        searchBtn.addEventListener('click', toggleSearch);
        searchClose.addEventListener('click', toggleSearch);
        searchInput.addEventListener('input', (e) => searchMessages(e.target.value));

        clearBtn.addEventListener('click', clearChat);
        themeBtn.addEventListener('click', toggleTheme);

        settingsBtn.addEventListener('click', toggleSettings);
        settingsClose.addEventListener('click', toggleSettings);

        // Topic selection
        topicSelect.addEventListener('change', (e) => {
            controller.conversationTopic = e.target.value;
            const topicNames = {
                'general': 'General Conversation',
                'daily': 'Daily Life',
                'work': 'Work & Business',
                'travel': 'Travel & Tourism',
                'food': 'Food & Cooking',
                'technology': 'Technology',
                'health': 'Health & Fitness',
                'education': 'Education',
                'entertainment': 'Entertainment',
                'sports': 'Sports',
                'family': 'Family & Relationships',
                'hobbies': 'Hobbies & Interests'
            };
            showToast(`Topic: ${topicNames[e.target.value]}`);
            updateStatusBar();
        });

        // Level selection
        levelSelect.addEventListener('change', (e) => {
            controller.englishLevel = e.target.value;
            const levelNames = {
                'A1': 'Beginner',
                'A2': 'Elementary',
                'B1': 'Intermediate',
                'B2': 'Upper Intermediate',
                'C1': 'Advanced',
                'C2': 'Proficient'
            };
            showToast(`Level: ${e.target.value} - ${levelNames[e.target.value]}`);
            updateStatusBar();
        });

        // Voice gender selection
        document.querySelectorAll('.gender-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const gender = btn.dataset.gender;
                controller.voiceGender = gender;

                // Update active state
                document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                showToast(`Voice: ${gender === 'female' ? '👩 Female' : '👨 Male'}`);
            });
        });

        // Speech rate
        speechRateSlider.addEventListener('input', (e) => {
            controller.speechRate = parseFloat(e.target.value);
            CONFIG.SPEECH_RATE = controller.speechRate;
            document.querySelector('.rate-value').textContent = controller.speechRate.toFixed(1) + 'x';
            updateRateButtons();
        });

        document.querySelectorAll('.rate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const rate = parseFloat(btn.dataset.rate);
                controller.speechRate = rate;
                CONFIG.SPEECH_RATE = rate;
                speechRateSlider.value = rate;
                document.querySelector('.rate-value').textContent = rate.toFixed(1) + 'x';
                updateRateButtons();
            });
        });

        // Settings toggles
        autoScrollToggle.addEventListener('change', (e) => {
            controller.autoScroll = e.target.checked;
        });

        soundEffectsToggle.addEventListener('change', (e) => {
            controller.soundEffectsEnabled = e.target.checked;
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                toggleSearch();
            }
        });

        // Offline detection
        window.addEventListener('offline', () => {
            const indicator = document.createElement('div');
            indicator.id = 'offlineIndicator';
            indicator.className = 'offline-indicator';
            indicator.innerHTML = `
                ⚠️ You're offline
                <button onclick="location.reload()">Retry</button>
            `;
            document.body.appendChild(indicator);
        });

        window.addEventListener('online', () => {
            const indicator = document.getElementById('offlineIndicator');
            if (indicator) indicator.remove();
        });

        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }

        // Enhance addMessage to store messages and add actions
        const originalAddMessage = controller.addMessage.bind(controller);
        controller.addMessage = function (type, text) {
            originalAddMessage(type, text);

            // Store message
            const messageId = Date.now();
            controller.messages.push({
                id: messageId,
                type,
                text,
                timestamp: new Date().toISOString()
            });

            // Add message actions for user and AI messages
            if (type === 'user' || type === 'ai') {
                const lastBubble = controller.chatMessages.lastElementChild;
                if (lastBubble) {
                    lastBubble.dataset.messageId = messageId;

                    const actions = document.createElement('div');
                    actions.className = 'message-actions';
                    actions.innerHTML = `
                        <button class="action-btn copy" title="Copy">📋</button>
                        <button class="action-btn delete" title="Delete">🗑️</button>
                    `;
                    lastBubble.appendChild(actions);

                    // Copy button
                    actions.querySelector('.copy').addEventListener('click', () => {
                        navigator.clipboard.writeText(text);
                        showToast('Copied to clipboard!');
                    });

                    // Delete button
                    actions.querySelector('.delete').addEventListener('click', () => {
                        lastBubble.remove();
                        controller.messages = controller.messages.filter(m => m.id !== messageId);
                    });
                }
            }

            // Use auto-scroll setting
            if (controller.autoScroll && !controller.userScrolled) {
                controller.scrollToBottom();
            }
        };

        // Override handleUserSpeech to include topic and level
        const originalHandleUserSpeech = controller.handleUserSpeech.bind(controller);
        controller.handleUserSpeech = function (text) {
            // Add context prefix for AI
            const topic = controller.conversationTopic || 'general';
            const level = controller.englishLevel || 'B2';

            const contextPrefix = `[Topic: ${topic}, Level: ${level}] `;
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

        console.log('✨ Advanced features loaded!');
    }, 1500);
});
