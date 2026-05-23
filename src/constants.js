'use strict';

const AVAILABLE_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const TEAM_NAMES = [
    'Tropa Estelar', 'Exploradores do Universo', 'Guardiões da Galáxia', 'Navegantes Cósmicos',
    'Viajantes Siderais', 'Patrulha de Órion', 'Frota de Andrômeda', 'Cometas Velozes',
    'Supernovas', 'Pioneiros Astrais', 'Legião Nebulosa', 'Conquistadores de Marte',
];

const SPECIAL_CARDS = [
    { type: 'advance', text: 'Avance %k% casas!', min: 2, max: 4 },
    { type: 'goback',  text: 'Volte %k% casas!',  min: 2, max: 4 },
    { type: 'skip',    text: 'Perdeu a vez!' },
];

const SPECIAL_CARD_PROBABILITY = 0.25;
const WINNING_POSITION         = 29;

module.exports = {
    AVAILABLE_COLORS,
    TEAM_NAMES,
    SPECIAL_CARDS,
    SPECIAL_CARD_PROBABILITY,
    WINNING_POSITION,
};
