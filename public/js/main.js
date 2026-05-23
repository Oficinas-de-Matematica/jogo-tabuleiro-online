// public/js/main.js – ES Module entry point
import { state, setRoomState, setPrevDiceVal, setAnimatingDice, setPendingRoomState } from './state.js';
import { connect } from './network.js';
import { setupLogin, setupStaticButtons } from './components/login.js';
import { renderLobby } from './components/lobby.js';
import { renderGame } from './components/game.js';
import { renderVictory } from './components/victory.js';
import { showNotification } from './components/modals.js';
import { showDiceAnimation } from './components/dice.js';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
connect(onRoomUpdate, showNotification);
setupLogin();
setupStaticButtons();

// ─────────────────────────────────────────────────────────────────────────────
// Room update dispatcher
// ─────────────────────────────────────────────────────────────────────────────
export function onRoomUpdate(newState) {
    setRoomState(newState);

    // Trigger dice animation when a new dice value arrives
    if (newState.diceValue > 0 && newState.diceValue !== state.prevDiceVal) {
        setAnimatingDice(true);
        showDiceAnimation(newState.diceValue, () => {
            setAnimatingDice(false);
            if (state.pendingRoomState) {
                applyRoomUpdate(state.pendingRoomState);
                setPendingRoomState(null);
            }
        });
    }
    setPrevDiceVal(newState.diceValue);

    if (state.isAnimatingDice) {
        setPendingRoomState(newState);
        return;
    }

    applyRoomUpdate(newState);
}

function applyRoomUpdate(roomState) {
    if (roomState.gameState === 'lobby')    return renderLobby(roomState);
    if (roomState.gameState === 'in-game')  return renderGame(roomState);
    if (roomState.gameState === 'finished') return renderVictory(roomState);
}
