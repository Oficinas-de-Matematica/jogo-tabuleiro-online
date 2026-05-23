'use strict';

/**
 * Broadcasts the full room state to every connected player in the room.
 * Strips sensitive/internal fields before sending:
 *   - player WebSocket references (ws)
 *   - the question deck (to avoid leaking upcoming questions)
 *   - the correct answer of the current question
 *
 * @param {Object} rooms  - The global rooms map
 * @param {string} roomId
 */
function broadcastRoomState(rooms, roomId) {
    const room = rooms[roomId];
    if (!room) return;

    // Build a serialisable snapshot (strip non-serialisable / sensitive fields)
    const payload = { ...room, players: {}, questionDeck: undefined };

    for (const playerId in room.players) {
        const { ws, ...playerData } = room.players[playerId];
        payload.players[playerId]   = playerData;
    }

    // Hide the correct answer from clients
    if (payload.currentQuestion) {
        payload.currentQuestion = { ...room.currentQuestion };
        delete payload.currentQuestion.correctAnswer;
    }

    const message = JSON.stringify({ type: 'roomUpdate', payload });

    for (const player of Object.values(room.players)) {
        if (player.ws && player.ws.readyState === player.ws.OPEN) {
            player.ws.send(message);
        }
    }
}

module.exports = { broadcastRoomState };
