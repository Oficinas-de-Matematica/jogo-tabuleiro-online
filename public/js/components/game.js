import { el, escHtml, showScreen, hideModal } from '../utils.js';
import { state } from '../state.js';
import { send } from '../network.js';
import { renderBoard } from './board.js';
import { renderChat } from './chat.js';
import { showQuestionModal, showSpecialCardModal } from './modals.js';

export function renderGame(roomState) {
    showScreen('game-screen');

    const isMyTurn    = roomState.currentPlayerTurn === state.myUserId;
    const currentName = roomState.players[roomState.currentPlayerTurn]?.name ?? '?';

    el('dice-value').textContent     = roomState.diceValue || '-';
    el('current-player').textContent = currentName;

    renderBoard(roomState);
    renderDeck(roomState, isMyTurn);
    renderPlayerInfo(roomState);
    renderChat('chat-container-game', roomState);

    // Question modal
    if (roomState.turnState === 'awaiting_answer' && roomState.currentQuestion) {
        showQuestionModal(roomState, isMyTurn);
    } else {
        hideModal('question-modal');
    }

    // Special card modal
    if (roomState.turnState === 'awaiting_special_card_confirmation' && roomState.lastCardDrawn) {
        showSpecialCardModal(roomState, isMyTurn);
    } else {
        hideModal('special-card-modal');
    }
}

function renderDeck(roomState, isMyTurn) {
    const container = el('card-deck-container');
    container.innerHTML = '';

    const canDraw = isMyTurn && roomState.turnState === 'start_of_turn';

    if (canDraw) {
        const prompt       = document.createElement('div');
        prompt.className   = 'deck-action-prompt';
        prompt.textContent = 'Comprar carta!';
        container.appendChild(prompt);
    }

    const deck       = document.createElement('div');
    deck.className   = 'card-deck' + (canDraw ? ' clickable' : '');
    deck.title       = canDraw ? 'Clique para comprar uma carta' : 'Aguardando a sua vez…';
    
    if (canDraw) {
        deck.addEventListener('click', () => {
            deck.style.pointerEvents = 'none'; // Previne múltiplos cliques acidentais
            if (container.querySelector('.deck-action-prompt')) {
                container.querySelector('.deck-action-prompt').style.display = 'none';
            }
            deck.style.transition = 'transform 0.2s';
            deck.style.transform = 'scale(0.9)'; // Apenas um pequeno "clique" visual
            send('drawQuestion');
        });
    }
    container.appendChild(deck);
}

export function renderPlayerInfo(roomState) {
    const container    = el('player-info-game');
    const teamsPlaying = Object.keys(roomState.teams).length > 0;
    container.innerHTML = '';

    if (teamsPlaying) {
        Object.entries(roomState.teams).forEach(([name, data]) => {
            const members = Object.values(roomState.players)
                .filter(p => p.team === name)
                .map(p => escHtml(p.name))
                .join(' & ');
            container.innerHTML += `
                <div class="team-${data.color} border rounded-lg px-3 py-1 text-sm text-center">
                    <span class="font-bold text-white">${escHtml(name)}</span>
                    <span class="text-gray-300 text-xs block">${members}</span>
                    <span class="text-yellow-300">Casa ${data.position + 1}</span>
                </div>`;
        });
    } else {
        Object.values(roomState.players).forEach(p => {
            const isActive = p.id === roomState.currentPlayerTurn;
            container.innerHTML += `
                <div class="border border-${p.color}-500 rounded-lg px-3 py-1 text-sm text-center
                            ${isActive ? 'bg-' + p.color + '-900/40' : ''}">
                    <div class="inline-block w-3 h-3 rounded-full token-${p.color} mr-1 align-middle"></div>
                    <span class="text-white">${escHtml(p.name)}</span>
                    <span class="text-gray-400 ml-1">Casa ${p.position + 1}</span>
                    ${isActive ? ' <span class="text-yellow-400">▶</span>' : ''}
                </div>`;
        });
    }
}
