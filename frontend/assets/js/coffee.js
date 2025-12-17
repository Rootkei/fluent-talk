// Buy Me a Coffee Modal Handler

(function () {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function () {
        const coffeeBtn = document.getElementById('coffeeBtn');
        const coffeeModal = document.getElementById('coffeeModal');
        const coffeeModalClose = document.getElementById('coffeeModalClose');

        if (!coffeeBtn || !coffeeModal || !coffeeModalClose) {
            console.warn('Coffee modal elements not found');
            return;
        }

        // Open modal
        coffeeBtn.addEventListener('click', function () {
            coffeeModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        });

        // Close modal
        function closeModal() {
            coffeeModal.classList.remove('show');
            document.body.style.overflow = ''; // Restore scroll
        }

        coffeeModalClose.addEventListener('click', closeModal);

        // Close on outside click
        coffeeModal.addEventListener('click', function (e) {
            if (e.target === coffeeModal) {
                closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && coffeeModal.classList.contains('show')) {
                closeModal();
            }
        });
    });
})();
