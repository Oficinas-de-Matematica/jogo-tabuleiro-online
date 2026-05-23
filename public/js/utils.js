export function el(id)        { return document.getElementById(id); }
export function setStatus(m)  { el('auth-status').textContent = m; }
export function showModal(id) { el(id).classList.remove('hidden'); }
export function hideModal(id) { el(id).classList.add('hidden'); }
export function escHtml(str)  {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function showScreen(id) {
    ['login-screen', 'room-screen', 'game-screen'].forEach(s => {
        el(s).classList.toggle('hidden', s !== id);
    });
}

export function makeBtn(text, extraClasses) {
    const btn       = document.createElement('button');
    btn.className   = `neon-button orbitron ${extraClasses} py-2 px-4 rounded-lg text-sm block`;
    btn.textContent = text;
    return btn;
}
