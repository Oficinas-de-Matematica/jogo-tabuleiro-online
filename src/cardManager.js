'use strict';

const { SPECIAL_CARDS, SPECIAL_CARD_PROBABILITY } = require('./constants');
const { shuffleArray }                            = require('./utils');
const { passTurn }                                = require('./gameLogic');

/**
 * Draws a card for the current player.
 *
 * Has a SPECIAL_CARD_PROBABILITY chance of being a special card;
 * otherwise draws a trivia question from the deck.
 *
 * Mutates room state in place.
 *
 * @param {Object}   room
 * @param {Object[]} allQuestions - The full question bank
 */
function drawCard(room, allQuestions) {
    room.diceValue = 0;

    if (Math.random() < SPECIAL_CARD_PROBABILITY && allQuestions.length > 0) {
        _drawSpecialCard(room);
    } else {
        _drawQuestion(room, allQuestions);
    }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _drawSpecialCard(room) {
    const template  = SPECIAL_CARDS[Math.floor(Math.random() * SPECIAL_CARDS.length)];
    let messageText = template.text;
    let effectValue = 0;

    if (template.type === 'advance' || template.type === 'goback') {
        const k    = Math.floor(Math.random() * (template.max - template.min + 1)) + template.min;
        messageText = template.text.replace('%k%', k);
        effectValue = k;
    }

    room.lastCardDrawn = { type: template.type, text: messageText, value: effectValue };
    room.turnState     = 'awaiting_special_card_confirmation';
}

function _drawQuestion(room, allQuestions) {
    if (room.questionDeck.length === 0) {
        room.questionDeck = shuffleArray(allQuestions);
    }

    if (room.questionDeck.length === 0) {
        room.messages.push({
            senderId:   'system',
            senderName: 'Sistema',
            text:       'Não há perguntas disponíveis! A passar a vez.',
        });
        passTurn(room);
        return;
    }

    room.currentQuestion = room.questionDeck.pop();
    room.turnState       = 'awaiting_answer';
    room.lastCardDrawn   = { type: 'question' };
}

module.exports = { drawCard };
