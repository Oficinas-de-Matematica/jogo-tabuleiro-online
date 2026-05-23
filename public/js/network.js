import { setStatus } from './utils.js';
import { setMyUserId } from './state.js';

const WS_URL = `ws://${location.host}`;
export let ws = null;

export function connect(onRoomUpdate, onError) {
    ws = new WebSocket(WS_URL);

    ws.addEventListener('open', () => {
        setStatus('Conectado! Insira o seu nome para continuar.');
        document.getElementById('create-room-btn').disabled = false;
        document.getElementById('join-room-btn').disabled   = false;
    });

    ws.addEventListener('message', ({ data }) => {
        const { type, payload } = JSON.parse(data);
        if (type === 'connected')  { setMyUserId(payload.userId); }
        if (type === 'roomUpdate') { onRoomUpdate(payload); }
        if (type === 'error')      { onError(payload); }
    });

    ws.addEventListener('close', () => {
        setStatus('Desconectado. Por favor, recarregue a página.');
        document.getElementById('create-room-btn').disabled = true;
        document.getElementById('join-room-btn').disabled   = true;
    });

    ws.addEventListener('error', () => {
        setStatus('Erro de ligação ao servidor.');
    });
}

export function send(type, payload = {}) {
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, payload }));
    }
}
