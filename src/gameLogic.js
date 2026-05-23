'use strict';

const { WINNING_POSITION } = require('./constants');

/**
 * Advances the turn to the next player in the turn order.
 * Resets turn-specific state on the room.
 * @param {Object} room
 */
function passTurn(room) {
    const { turnOrder } = room;
    if (!turnOrder || turnOrder.length === 0) return;

    const currentIndex     = turnOrder.indexOf(room.currentPlayerTurn);
    const nextIndex        = (currentIndex + 1) % turnOrder.length;
    room.currentPlayerTurn = turnOrder[nextIndex];
    room.turnState         = 'start_of_turn';
    room.currentQuestion   = null;
    room.lastCardDrawn     = null;
}

/**
 * Checks whether any player or team has reached the winning position.
 * @param {Object} room
 * @returns {{ name: string, color: string } | { id: string, name: string, color: string } | null}
 */
function checkForWinner(room) {
    const teamsPlaying = Object.keys(room.teams).length > 0;

    if (teamsPlaying) {
        for (const [teamName, teamData] of Object.entries(room.teams)) {
            if (teamData.position >= WINNING_POSITION) {
                return { name: teamName, color: teamData.color };
            }
        }
    } else {
        for (const player of Object.values(room.players)) {
            if (player.position >= WINNING_POSITION) {
                return { id: player.id, name: player.name, color: player.color };
            }
        }
    }
    return null;
}

/**
 * Resets the room back to lobby state, preserving connected players.
 * @param {Object} room
 */
function resetRoomToLobby(room) {
    room.gameState            = 'lobby';
    room.teams                = {};
    room.currentPlayerTurn    = null;
    room.turnOrder            = [];
    room.diceValue            = 0;
    room.questionDeck         = [];
    room.currentQuestion      = null;
    room.turnState            = 'start_of_turn';
    room.winner               = null;
    room.playersVotedForReset = [];
    room.lastCardDrawn        = null;

    Object.values(room.players).forEach(p => {
        p.position = 0;
        p.team     = null;
    });

    room.messages.push({
        senderId:   'system',
        senderName: 'Sistema',
        text:       'Todos concordaram! A preparar para uma nova partida!',
    });
}

module.exports = { passTurn, checkForWinner, resetRoomToLobby };
