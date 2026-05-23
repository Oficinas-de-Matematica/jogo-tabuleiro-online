import { el } from '../utils.js';
import { send } from '../network.js';
import { state } from '../state.js';

export function setupLogin() {
    el('create-room-btn').addEventListener('click', () => {
        const username = el('username').value.trim();
        if (!username) return alert('Por favor, insira um nome de piloto.');
        send('createRoom', { username });
    });

    el('join-room-btn').addEventListener('click', () => {
        const username = el('username').value.trim();
        const roomId   = el('room-id-input').value.trim().toUpperCase();
        if (!username) return alert('Por favor, insira um nome de piloto.');
        if (!roomId)   return alert('Por favor, insira o ID da sala.');
        send('joinRoom', { username, roomId });
    });

    el('username').addEventListener('keydown', e => {
        if (e.key === 'Enter') el('create-room-btn').click();
    });
    el('room-id-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') el('join-room-btn').click();
    });
}

export function setupStaticButtons() {
    el('notification-close-btn').addEventListener('click', () => {
        el('notification-modal').classList.add('hidden');
    });
    
    const copyBtn = el('copy-room-id');
    copyBtn.addEventListener('click', () => {
        if (state.roomState?.id) {
            // Feedback visual
            copyBtn.style.transition = 'all 0.2s ease-in-out';
            copyBtn.style.transform = 'scale(1.2)';
            copyBtn.style.color = '#fde047'; // Amarelo
            
            setTimeout(() => {
                copyBtn.style.transform = '';
                copyBtn.style.color = '';
            }, 400);

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(state.roomState.id).catch(() => {});
            } else {
                // Fallback para ambientes sem HTTPS (como redes locais)
                const input = document.createElement('input');
                input.value = state.roomState.id;
                input.style.position = 'absolute';
                input.style.left = '-9999px';
                document.body.appendChild(input);
                input.select();
                try { document.execCommand('copy'); } catch (e) {}
                document.body.removeChild(input);
            }
        }
    });
}
