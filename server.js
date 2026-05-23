'use strict';

const express             = require('express');
const http                = require('http');
const path                = require('path');
const fs                  = require('fs');
const { WebSocketServer } = require('ws');

const { handleMessage }              = require('./src/messageHandlers');
const { broadcastRoomState }         = require('./src/roomManager');
const { passTurn, resetRoomToLobby } = require('./src/gameLogic');

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });
const PORT   = process.env.PORT || 8080;

// Load question bank
let ALL_QUESTIONS = [];
try {
    const raw     = fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8');
    ALL_QUESTIONS = JSON.parse(raw);
    console.log(`✅ ${ALL_QUESTIONS.length} perguntas carregadas do questions.json.`);
} catch (err) {
    console.error('❌ Erro ao carregar questions.json:', err);
}

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// In-memory room store
const rooms = {};

// ─── WebSocket ────────────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
    ws.userId        = Math.random().toString(36).substring(2, 11);
    ws.currentRoomId = null;

    ws.send(JSON.stringify({ type: 'connected', payload: { userId: ws.userId } }));

    ws.on('message', (raw) => handleMessage(ws, raw, rooms, ALL_QUESTIONS));
    ws.on('close',   ()    => _handleDisconnect(ws, rooms));
});

// ─── Disconnect handler ───────────────────────────────────────────────────────

function _handleDisconnect(ws, rooms) {
    const { userId, currentRoomId } = ws;
    if (!currentRoomId || !rooms[currentRoomId]) return;

    const room            = rooms[currentRoomId];
    const departingPlayer = room.players[userId];
    const departingName   = departingPlayer ? departingPlayer.name : 'Um jogador';
    const wasCurrentTurn  = room.gameState === 'in-game' && room.currentPlayerTurn === userId;

    // Remove player from vote list
    const voteIdx = room.playersVotedForReset.indexOf(userId);
    if (voteIdx > -1) room.playersVotedForReset.splice(voteIdx, 1);

    // Remove player and clean up turn order
    delete room.players[userId];
    const turnIdx = room.turnOrder.indexOf(userId);
    if (turnIdx > -1) room.turnOrder.splice(turnIdx, 1);

    // Clean up empty rooms
    if (Object.keys(room.players).length === 0) {
        delete rooms[currentRoomId];
        return;
    }

    room.messages.push({
        senderId:   'system',
        senderName: 'Sistema',
        text:       `${departingName} desconectou-se.`,
    });

    if (room.gameState === 'finished') {
        const total = Object.keys(room.players).length;
        if (room.playersVotedForReset.length >= total && total > 0) {
            resetRoomToLobby(room);
        }
    } else if (wasCurrentTurn) {
        passTurn(room);
    }

    broadcastRoomState(rooms, currentRoomId);
}

// ─── Start ────────────────────────────────────────────────────────────────────

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌  Porta ${PORT} já está em uso.`);
        console.error(`   Encerre o processo antigo ou escolha outra porta:\n`);
        console.error(`   PORT=3000 npm start\n`);
    } else {
        console.error('❌  Erro no servidor:', err);
    }
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor Lobby Espacial em http://localhost:${PORT}`);
});
