import { el, showScreen, showModal } from '../utils.js';
import { send } from '../network.js';
import { renderBoard } from './board.js';
import { renderChat } from './chat.js';
import { renderPlayerInfo } from './game.js';

export function renderVictory(roomState) {
    showScreen('game-screen'); 
    renderBoard(roomState);
    renderPlayerInfo(roomState);
    renderChat('chat-container-game', roomState);

    const winner = roomState.winner;
    el('winner-name').textContent = winner?.name ?? '?';

    const total = Object.keys(roomState.players).length;
    const votes = roomState.playersVotedForReset?.length ?? 0;
    el('reset-vote-status').textContent = `${votes}/${total} jogadores votaram para jogar novamente.`;

    el('play-again-btn').onclick = () => send('voteToReset');
    el('main-menu-btn').onclick  = () => location.reload();

    showModal('victory-screen');
}
