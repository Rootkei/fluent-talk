// Polish Features - Empty State, Time Separators, Message Grouping
(function () {
    'use strict';

    // Wait for controller to be ready
    setTimeout(() => {
        const controller = window.voiceController;
        if (!controller) return;

        const chatMessages = document.getElementById('chatMessages');
        const emptyState = document.getElementById('emptyState');
        let lastMessageDate = null;
        let lastMessageSender = null;

        // Hide empty state when first message arrives
        const originalAddMessage = controller.addMessage.bind(controller);
        controller.addMessage = function (type, text) {
            // Hide empty state on first real message (not system)
            if (emptyState && emptyState.style.display !== 'none') {
                emptyState.style.display = 'none';
            }

            // Add time separator if needed
            const now = new Date();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (!lastMessageDate || !isSameDay(lastMessageDate, now)) {
                addTimeSeparator(now, today, yesterday);
                lastMessageDate = now;
                lastMessageSender = null; // Reset grouping on new day
            }

            // Check if should group with previous message
            const shouldGroup = lastMessageSender === type && type !== 'system';

            // Call original addMessage
            originalAddMessage(type, text);

            // Add grouping class if needed
            if (shouldGroup) {
                const lastBubble = chatMessages.lastElementChild;
                if (lastBubble && lastBubble.classList.contains('message-bubble')) {
                    lastBubble.classList.add('grouped');
                }
            }

            // Add sent animation
            const lastBubble = chatMessages.lastElementChild;
            if (lastBubble && lastBubble.classList.contains('message-bubble')) {
                lastBubble.classList.add('sending');
                setTimeout(() => {
                    lastBubble.classList.remove('sending');
                    lastBubble.classList.add('sent');
                    setTimeout(() => {
                        lastBubble.classList.remove('sent');
                    }, 400);
                }, 100);
            }

            lastMessageSender = type;
        };

        // Add time separator
        function addTimeSeparator(date, today, yesterday) {
            const separator = document.createElement('div');
            separator.className = 'time-separator';

            let label;
            if (isSameDay(date, today)) {
                label = 'Today';
            } else if (isSameDay(date, yesterday)) {
                label = 'Yesterday';
            } else {
                label = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                });
            }

            separator.innerHTML = `<span>${label}</span>`;
            chatMessages.appendChild(separator);
        }

        // Check if same day
        function isSameDay(date1, date2) {
            return date1.getDate() === date2.getDate() &&
                date1.getMonth() === date2.getMonth() &&
                date1.getFullYear() === date2.getFullYear();
        }

        // Show loading skeleton
        controller.showLoadingSkeleton = function () {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-message ai';
            skeleton.id = 'loadingSkeleton';
            skeleton.innerHTML = `
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                </div>
            `;
            chatMessages.appendChild(skeleton);
            controller.scrollToBottom();
        };

        // Hide loading skeleton
        controller.hideLoadingSkeleton = function () {
            const skeleton = document.getElementById('loadingSkeleton');
            if (skeleton) {
                skeleton.remove();
            }
        };

        // Enhanced typing indicator
        const originalShowTyping = controller.showTypingIndicator?.bind(controller);
        if (originalShowTyping) {
            controller.showTypingIndicator = function () {
                // Hide empty state
                if (emptyState) {
                    emptyState.style.display = 'none';
                }
                originalShowTyping();
            };
        }

        // Show empty state initially
        setTimeout(() => {
            const messageCount = chatMessages.querySelectorAll('.message-bubble').length;
            if (messageCount === 0 && emptyState) {
                emptyState.style.display = 'flex';
            }
        }, 100);

        console.log('✨ Polish features loaded!');
    }, 2000);
})();
