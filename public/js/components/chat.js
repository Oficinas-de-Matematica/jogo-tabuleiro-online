import { el, escHtml } from '../utils.js';
import { send } from '../network.js';
import { state } from '../state.js';

export function renderChat(containerId, roomState) {
    const container = el(containerId);
    if (!container) return;

    if (!container.dataset.built) {
        container.dataset.built = '1';
        container.innerHTML = `
            <div class="p-3 border-b border-cyan-800 shrink-0">
                <h3 class="orbitron text-cyan-400 text-sm tracking-widest">COMUNICAÇÕES</h3>
            </div>
            <div class="chat-messages flex-1 overflow-y-auto p-3 space-y-2 min-h-0"></div>
            <div class="p-3 border-t border-cyan-800 flex gap-2 shrink-0">
                <input type="text" placeholder="Mensagem..."
                    class="chat-input flex-1 bg-gray-900 border border-cyan-700 rounded-lg px-3 py-1
                           text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400">
                <button class="chat-send neon-button bg-cyan-600 hover:bg-cyan-500 text-black
                               font-bold px-3 py-1 rounded-lg text-sm">▶</button>
            </div>`;

        const input   = container.querySelector('.chat-input');
        const sendBtn = container.querySelector('.chat-send');
        const sendMsg = () => {
            const text = input.value.trim();
            if (text) { send('sendMessage', { text }); input.value = ''; }
        };
        sendBtn.addEventListener('click', sendMsg);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
    }

    const msgArea  = container.querySelector('.chat-messages');
    const atBottom = msgArea.scrollHeight - msgArea.clientHeight <= msgArea.scrollTop + 20;

    msgArea.innerHTML = (roomState.messages ?? []).slice(-80).map(m => {
        if (m.senderId === 'system') {
            return `<p class="text-center text-xs text-gray-400 italic py-0.5">${escHtml(m.text)}</p>`;
        }
        const isMe    = m.senderId === state.myUserId;
        const color   = m.senderColor ?? 'cyan';
        const align   = isMe ? 'items-end' : 'items-start';
        const bgColor = isMe ? 'bg-cyan-900/50' : 'bg-gray-800';
        return `
            <div class="flex flex-col ${align}">
                <span class="text-xs text-${color}-400 mb-0.5 px-1">${escHtml(m.senderName)}</span>
                <div class="${bgColor} rounded-lg px-3 py-1.5 text-sm text-white max-w-[85%] break-words">
                    ${escHtml(m.text)}
                </div>
            </div>`;
    }).join('');

    if (atBottom) msgArea.scrollTop = msgArea.scrollHeight;
}
