import { el, escHtml, showScreen, hideModal, makeBtn } from '../utils.js';
import { send } from '../network.js';
import { state } from '../state.js';
import { renderChat } from './chat.js';

export function renderLobby(roomState) {
    showScreen('room-screen');
    hideModal('victory-screen');

    const players     = Object.values(roomState.players);
    const playerCount = players.length;
    const isHost      = players[0]?.id === state.myUserId;
    const hasTeams    = Object.keys(roomState.teams).length > 0;

    el('room-id-display').textContent = roomState.id;
    el('player-count').textContent    = `${playerCount}/4 Jogadores`;

    // Player orbit slots
    for (let i = 0; i < 4; i++) {
        const slot   = el(`player-slot-${i}`);
        const player = players[i];
        if (player) {
            slot.innerHTML = `
                <div class="flex flex-col items-center gap-1 p-2 bg-black/60 rounded-xl border border-cyan-700">
                    <div class="w-10 h-10 rounded-full border-2 border-white token-${player.color}"></div>
                    <span class="text-xs text-white whitespace-nowrap max-w-[80px] truncate">${escHtml(player.name)}</span>
                    ${player.team && roomState.teams[player.team]
                        ? `<span class="text-xs text-${roomState.teams[player.team].color}-400 whitespace-nowrap max-w-[80px] truncate">${escHtml(player.team)}</span>`
                        : ''}
                </div>`;
        } else {
            slot.innerHTML = `
                <div class="w-12 h-12 rounded-full bg-gray-800 border-2 border-dashed border-gray-600
                            flex items-center justify-center text-gray-600 text-xl">?</div>`;
        }
    }

    // Host controls
    const controls = el('lobby-controls');
    controls.innerHTML = '';

    if (!hasTeams && playerCount === 4 && isHost) {
        const btn = makeBtn('Formar Equipas', 'bg-purple-600 hover:bg-purple-500 text-white');
        btn.addEventListener('click', () => send('formTeams'));
        controls.appendChild(btn);
    }

    if (playerCount >= 2 && isHost) {
        const btn = makeBtn('Iniciar Jogo ▶', 'bg-green-600 hover:bg-green-500 text-black font-bold mt-2');
        btn.addEventListener('click', () => send('startGame'));
        controls.appendChild(btn);
    }

    renderChat('chat-container', roomState);
}
