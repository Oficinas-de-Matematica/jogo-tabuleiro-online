export const state = {
    myUserId: null,
    roomState: null,
    prevDiceVal: 0,
    isAnimatingDice: false,
    pendingRoomState: null
};

export function setMyUserId(id) { state.myUserId = id; }
export function setRoomState(rs) { state.roomState = rs; }
export function setPrevDiceVal(val) { state.prevDiceVal = val; }
export function setAnimatingDice(isAnimating) { state.isAnimatingDice = isAnimating; }
export function setPendingRoomState(rs) { state.pendingRoomState = rs; }
