'use strict';

const { AVAILABLE_COLORS, TEAM_NAMES, WINNING_POSITION } = require('./constants');
const { shuffleArray, getUnusedColor }                   = require('./utils');
const { passTurn, checkForWinner, resetRoomToLobby }     = require('./gameLogic');
const { broadcastRoomState }                             = require('./roomManager');
const { drawCard }                                       = require('./cardManager');

/**
 * Entry point for all incoming WebSocket messages.
 * Parses the raw message and routes it to the appropriate handler.
 *
 * @param {WebSocket} ws
 * @param {string}    rawMessage
 * @param {Object}    rooms
 * @param {Object[]}  allQuestions
 */
function handleMessage(ws, rawMessage, rooms, allQuestions) {
    const { type, payload } = JSON.parse(rawMessage);
    const userId            = ws.userId;
    const room              = rooms[ws.currentRoomId];

    switch (type) {
        case 'createRoom':         return _createRoom(ws, payload, rooms, userId);
        case 'joinRoom':           return _joinRoom(ws, payload, rooms, userId);
        case 'sendMessage':        return _sendMessage(ws, payload, room, userId, rooms);
        case 'formTeams':          return _formTeams(ws, room, rooms, userId);
        case 'startGame':          return _startGame(ws, room, rooms, allQuestions);
        case 'drawQuestion':       return _drawQuestion(ws, room, rooms, allQuestions, userId);
        case 'confirmSpecialCard': return _confirmSpecialCard(ws, room, rooms, userId);
        case 'submitAnswer':       return _submitAnswer(ws, payload, room, rooms, userId);
        case 'voteToReset':        return _voteToReset(ws, room, rooms, userId);
        default: break;
    }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function _createRoom(ws, { username }, rooms, userId) {
    const roomId     = Math.random().toString(36).substring(2, 8).toUpperCase();
    ws.currentRoomId = roomId;

    rooms[roomId] = {
        id:                   roomId,
        gameState:            'lobby',
        players:              { [userId]: _makePlayer(userId, username, AVAILABLE_COLORS[0], ws) },
        messages:             [],
        teams:                {},
        currentPlayerTurn:    null,
        turnOrder:            [],
        diceValue:            0,
        questionDeck:         [],
        currentQuestion:      null,
        turnState:            'start_of_turn',
        winner:               null,
        playersVotedForReset: [],
        lastCardDrawn:        null,
    };

    broadcastRoomState(rooms, roomId);
}

function _joinRoom(ws, { username, roomId }, rooms, userId) {
    const room = rooms[roomId];

    if (!room)                                    return ws.send(_err('Sala não encontrada.'));
    if (room.gameState !== 'lobby')               return ws.send(_err('A partida já começou ou terminou nesta sala.'));
    if (Object.keys(room.players).length >= 4)    return ws.send(_err('Esta sala está cheia.'));

    ws.currentRoomId     = roomId;
    room.players[userId] = _makePlayer(userId, username, getUnusedColor(room), ws);
    broadcastRoomState(rooms, roomId);
}

function _sendMessage(ws, { text }, room, userId, rooms) {
    if (!room) return;

    const player       = room.players[userId];
    const teamsPlaying = Object.keys(room.teams).length > 0;
    const senderColor  = teamsPlaying && player.team
        ? room.teams[player.team].color
        : player.color;

    room.messages.push({
        senderId:   userId,
        senderName: player.name,
        senderTeam: player.team,
        senderColor,
        text,
        timestamp:  new Date(),
    });
    broadcastRoomState(rooms, ws.currentRoomId);
}

function _formTeams(ws, room, rooms) {
    if (!room || Object.keys(room.players).length !== 4) return;

    const shuffledColors         = shuffleArray(AVAILABLE_COLORS);
    const [team1Name, team2Name] = shuffleArray(TEAM_NAMES);

    room.teams = {
        [team1Name]: { color: shuffledColors[0], position: 0 },
        [team2Name]: { color: shuffledColors[1], position: 0 },
    };

    shuffleArray(Object.keys(room.players)).forEach((id, i) => {
        room.players[id].team = i < 2 ? team1Name : team2Name;
    });

    room.messages.push({
        senderId:   'system',
        senderName: 'Sistema',
        text:       `Equipas formadas: ${team1Name} vs ${team2Name}!`,
    });
    broadcastRoomState(rooms, ws.currentRoomId);
}

function _startGame(ws, room, rooms, allQuestions) {
    if (!room || Object.keys(room.players).length < 2) return;

    room.gameState         = 'in-game';
    room.turnOrder         = shuffleArray(Object.keys(room.players));
    room.currentPlayerTurn = room.turnOrder[0];
    room.questionDeck      = shuffleArray(allQuestions);
    room.turnState         = 'start_of_turn';

    Object.values(room.players).forEach(p => { p.position = 0; });
    Object.values(room.teams).forEach(t => { t.position  = 0; });

    room.messages.push({
        senderId:   'system',
        senderName: 'Sistema',
        text:       `A ordem de jogada foi definida! Começa com ${room.players[room.currentPlayerTurn].name}.`,
    });
    broadcastRoomState(rooms, ws.currentRoomId);
}

function _drawQuestion(ws, room, rooms, allQuestions, userId) {
    if (!room
        || room.gameState          !== 'in-game'
        || room.currentPlayerTurn  !== userId
        || room.turnState          !== 'start_of_turn') return;

    drawCard(room, allQuestions);
    broadcastRoomState(rooms, ws.currentRoomId);
}

function _confirmSpecialCard(ws, room, rooms, userId) {
    if (!room
        || room.gameState          !== 'in-game'
        || room.currentPlayerTurn  !== userId
        || room.turnState          !== 'awaiting_special_card_confirmation') return;

    const player       = room.players[userId];
    const card         = room.lastCardDrawn;
    if (!card) return;

    const teamsPlaying = Object.keys(room.teams).length > 0;

    room.messages.push({
        senderId:   'system',
        senderName: 'Sistema',
        text:       `✨ ${player.name} tirou uma carta especial: "${card.text}"`,
    });

    if (card.type === 'advance' || card.type === 'goback') {
        const direction = card.type === 'advance' ? 1 : -1;
        if (teamsPlaying) {
            const team    = room.teams[player.team];
            team.position = Math.max(0, Math.min(WINNING_POSITION, team.position + card.value * direction));
        } else {
            player.position = Math.max(0, Math.min(WINNING_POSITION, player.position + card.value * direction));
        }
    }
    // 'skip' requires no position change

    const winner = checkForWinner(room);
    if (winner) {
        room.winner    = winner;
        room.gameState = 'finished';
    } else {
        passTurn(room);
    }
    broadcastRoomState(rooms, ws.currentRoomId);
}

function _submitAnswer(ws, { answerIndex }, room, rooms, userId) {
    if (!room
        || room.gameState         !== 'in-game'
        || room.currentPlayerTurn !== userId
        || room.turnState         !== 'awaiting_answer') return;

    const player       = room.players[userId];
    const isCorrect    = room.currentQuestion.correctAnswer === answerIndex;
    const teamsPlaying = Object.keys(room.teams).length > 0;

    if (isCorrect) {
        const diceValue = Math.floor(Math.random() * 6) + 1;
        room.diceValue  = diceValue;

        room.messages.push({
            senderId:   'system',
            senderName: 'Sistema',
            text:       `🚀 ${player.name} acertou a pergunta!`,
        });

        if (teamsPlaying) {
            const team    = room.teams[player.team];
            team.position = Math.min(team.position + diceValue, WINNING_POSITION);
            room.messages.push({
                senderId:   'system',
                senderName: 'Sistema',
                text:       `🎲 ${player.name} rolou um ${diceValue} e avançou o peão para a casa ${team.position + 1}!`,
            });
        } else {
            player.position = Math.min(player.position + diceValue, WINNING_POSITION);
            room.messages.push({
                senderId:   'system',
                senderName: 'Sistema',
                text:       `🎲 ${player.name} rolou um ${diceValue} e avançou o peão para a casa ${player.position + 1}!`,
            });
        }

        const winner = checkForWinner(room);
        if (winner) {
            room.winner          = winner;
            room.gameState       = 'finished';
            room.currentQuestion = null;
        } else {
            passTurn(room);
        }
    } else {
        room.messages.push({
            senderId:   'system',
            senderName: 'Sistema',
            text:       `💥 ${player.name} errou a pergunta.`,
        });
        passTurn(room);
    }
    broadcastRoomState(rooms, ws.currentRoomId);
}

function _voteToReset(ws, room, rooms, userId) {
    if (!room || room.gameState !== 'finished') return;

    if (!room.playersVotedForReset.includes(userId)) {
        room.playersVotedForReset.push(userId);
        room.messages.push({
            senderId:   'system',
            senderName: 'Sistema',
            text:       `${room.players[userId].name} votou para jogar novamente.`,
        });
    }

    const totalPlayers = Object.keys(room.players).length;
    if (room.playersVotedForReset.length >= totalPlayers && totalPlayers > 0) {
        resetRoomToLobby(room);
    }
    broadcastRoomState(rooms, ws.currentRoomId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _makePlayer(id, name, color, ws) {
    return { id, name, team: null, ws, position: 0, color };
}

function _err(message) {
    return JSON.stringify({ type: 'error', payload: message });
}

module.exports = { handleMessage };
