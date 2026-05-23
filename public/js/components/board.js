import { el } from '../utils.js';

const TOTAL_SPACES = 30;

export function renderBoard(roomState) {
    const container = el('game-board-container');

    // Build static structure only once per container lifetime
    if (!container.dataset.built) {
        container.dataset.built = '1';
        container.innerHTML     = '';

        // SVG neon connection lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'board-lines-svg');
        container.appendChild(svg);

        for (let i = 0; i < TOTAL_SPACES - 1; i++) {
            const a    = spacePos(i);
            const b    = spacePos(i + 1);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${a.x}%`);
            line.setAttribute('y1', `${a.y}%`);
            line.setAttribute('x2', `${b.x}%`);
            line.setAttribute('y2', `${b.y}%`);
            line.setAttribute('class', 'neon-line');
            svg.appendChild(line);
        }

        // Space tiles
        for (let i = 0; i < TOTAL_SPACES; i++) {
            const pos = spacePos(i);
            const div = document.createElement('div');
            div.className = 'board-space'
                + (i === 0              ? ' start-space' : '')
                + (i === TOTAL_SPACES-1 ? ' end-space'   : '');
            div.style.left      = `${pos.x}%`;
            div.style.top       = `${pos.y}%`;
            div.textContent     = i === 0 ? '🚀' : i === TOTAL_SPACES-1 ? '🏆' : i + 1;
            div.dataset.spaceId = i;
            container.appendChild(div);
        }
    }

    const teamsPlaying = Object.keys(roomState.teams).length > 0;
    const tokens = teamsPlaying
        ? Object.entries(roomState.teams).map(([name, d]) => ({ id: `team-${name}`, name, color: d.color, position: d.position }))
        : Object.values(roomState.players).map(p => ({ id: `player-${p.id}`, name: p.name, color: p.color, position: p.position }));

    // Group overlapping tokens for offset
    const byPos = {};
    tokens.forEach(t => { (byPos[t.position] ??= []).push(t); });

    const existingTokens = Array.from(container.querySelectorAll('.player-token-wrapper'));
    const staleTokens = new Set(existingTokens.map(t => t.dataset.tokenId));

    Object.entries(byPos).forEach(([posStr, group]) => {
        const pos = spacePos(Number(posStr));
        group.forEach((token, idx) => {
            staleTokens.delete(token.id);
            const offsetX = (idx - (group.length - 1) / 2) * 22;
            
            let wrapper = existingTokens.find(t => t.dataset.tokenId === token.id);
            const targetLeft = `calc(${pos.x}% + ${offsetX}px)`;
            const targetTop = `${pos.y}%`;

            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className  = 'player-token-wrapper';
                wrapper.dataset.tokenId = token.id;
                wrapper.innerHTML  = `
                    <span class="player-name-on-token"></span>
                    <div class="player-token"></div>`;
                
                wrapper.style.left = targetLeft;
                wrapper.style.top  = targetTop;
                container.appendChild(wrapper);
                
                void wrapper.offsetWidth; // Força o reflow para fixar a posição inicial sem animar
                wrapper.style.transition = 'left 1s ease-in-out, top 1s ease-in-out';
            }

            wrapper.querySelector('.player-name-on-token').textContent = token.name;
            wrapper.querySelector('.player-token').className = `player-token token-${token.color}`;
            
            wrapper.style.left = targetLeft;
            wrapper.style.top  = targetTop;
        });
    });

    // Remove peões de jogadores/equipas que tenham saído do jogo
    staleTokens.forEach(id => {
        const elem = existingTokens.find(t => t.dataset.tokenId === id);
        if (elem) elem.remove();
    });
}

/**
 * Returns { x, y } percentages for a board space index.
 * Snake layout: 10 cols × 3 rows, bottom-to-top.
 */
function spacePos(index) {
    const row      = Math.floor(index / 10);
    const colInRow = index % 10;
    const col      = row % 2 === 0 ? colInRow : 9 - colInRow;
    return {
        x: col * 10 + 5,           // centers at 5%, 15%, …, 95%
        y: 83.5 - row * 33.5,      // bottom row ≈83%, middle ≈50%, top ≈17%
    };
}
