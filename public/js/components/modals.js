import { el, hideModal, showModal } from '../utils.js';
import { send } from '../network.js';

export function showNotification(msg) {
    el('notification-message').textContent = msg;
    showModal('notification-modal');
}

export function showQuestionModal(roomState, isMyTurn) {
    const q = roomState.currentQuestion;
    const modal = el('question-modal');
    
    const isNewQuestion = modal.dataset.questionId !== q.question;
    modal.dataset.questionId = q.question;

    el('question-text').textContent = q.question;

    const opts = el('question-options');
    opts.innerHTML = '';
    const waitingEl = el('question-waiting');
    if (waitingEl) waitingEl.classList.toggle('hidden', isMyTurn);

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className   = 'option-button neon-button rounded-lg px-4 py-3 text-left w-full';
        btn.textContent = opt;
        btn.disabled    = !isMyTurn;
        btn.addEventListener('click', () => {
            opts.querySelectorAll('button').forEach(b => b.disabled = true);
            send('submitAnswer', { answerIndex: i });
            hideModal('question-modal');
        });
        opts.appendChild(btn);
    });

    const modalInner = modal.firstElementChild;

    if (isNewQuestion) {
        // Descobrir onde está o baralho no ecrã para servir de ponto de partida
        const deckEl = document.querySelector('.card-deck');
        let startX = 0, startY = 300;
        if (deckEl) {
            const rect = deckEl.getBoundingClientRect();
            startX = (rect.left + rect.width / 2) - (window.innerWidth / 2);
            startY = (rect.top + rect.height / 2) - (window.innerHeight / 2);
        }

        opts.style.display = 'none';
        if (waitingEl) waitingEl.style.display = 'none';
        
        modalInner.style.transition = 'none';
        modalInner.style.transform = `translate(${startX}px, ${startY}px) scale(0.2) rotateY(-180deg)`;
        modalInner.style.opacity = '0';
        
        showModal('question-modal');
        void modalInner.offsetWidth; // Forçar o reflow
        
        // Fase 1
        modalInner.style.transition = 'all 2s cubic-bezier(0.25, 1, 0.5, 1)';
        modalInner.style.transform = 'translate(0px, 0px) scale(0.5) rotateY(0deg)';
        modalInner.style.opacity = '1';
        
        // Fase 2
        setTimeout(() => {
            modalInner.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            modalInner.style.transform = 'translate(0px, 0px) scale(1) rotateY(0deg)';
            
            setTimeout(() => {
                opts.style.display = '';
                if (waitingEl && !waitingEl.classList.contains('hidden')) waitingEl.style.display = '';
                opts.style.opacity = '0';
                opts.style.transition = 'opacity 0.4s ease-in';
                void opts.offsetWidth;
                opts.style.opacity = '1';
            }, 100);
        }, 2000); 

    } else {
        // Fallback
        modalInner.style.transition = 'none';
        modalInner.style.transform = 'none';
        modalInner.style.opacity = '1';
        opts.style.display = '';
        opts.style.opacity = '1';
        if (waitingEl && !waitingEl.classList.contains('hidden')) waitingEl.style.display = '';
        showModal('question-modal');
    }
}

export function showSpecialCardModal(roomState, isMyTurn) {
    const card = roomState.lastCardDrawn;
    el('special-card-message').textContent = card.text;
    el('special-card-confirm-btn').classList.toggle('hidden', !isMyTurn);
    el('special-card-waiting').classList.toggle('hidden', isMyTurn);

    if (isMyTurn) {
        const btn   = el('special-card-confirm-btn');
        const fresh = btn.cloneNode(true); 
        btn.parentNode.replaceChild(fresh, btn);
        fresh.addEventListener('click', () => {
            hideModal('special-card-modal');
            send('confirmSpecialCard');
        });
    }

    showModal('special-card-modal');
}
