'use strict';

const { AVAILABLE_COLORS } = require('./constants');

/**
 * Returns a new array with the elements shuffled (Fisher-Yates).
 * @param {Array} array
 * @returns {Array}
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Returns a color not currently used by any player in the room.
 * Falls back to a random color from the full palette if all are taken.
 * @param {Object} room
 * @returns {string}
 */
function getUnusedColor(room) {
    const used      = new Set(Object.values(room.players).map(p => p.color));
    const available = AVAILABLE_COLORS.filter(c => !used.has(c));
    const pool      = available.length > 0 ? available : AVAILABLE_COLORS;
    return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { shuffleArray, getUnusedColor };
