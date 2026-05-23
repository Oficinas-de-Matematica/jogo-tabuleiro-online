import { el } from '../utils.js';

export function showDiceAnimation(value, onComplete) {
    const modal     = el('dice-modal');
    const container = el('dice-canvas-container');
    modal.classList.remove('hidden');
    container.innerHTML = '';

    const W = container.clientWidth  || 200;
    const H = container.clientHeight || 200;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0x00bfff, 1.2);
    dir.position.set(5, 5, 5);
    scene.add(dir);

    // Build textured die faces
    const materials = [1, 2, 3, 4, 5, 6].map(n => {
        const cvs  = document.createElement('canvas');
        cvs.width  = 128; cvs.height = 128;
        const ctx  = cvs.getContext('2d');
        ctx.fillStyle = '#1e3c72';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#00bfff'; ctx.lineWidth = 5;
        ctx.strokeRect(5, 5, 118, 118);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 72px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n, 64, 68);
        return new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cvs) });
    });

    const die = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), materials);
    scene.add(die);

    // Map face index to number shown facing +Z camera
    const targetRotations = {
        1: [0, -Math.PI / 2, 0],   // face 1 (+X)
        2: [0,  Math.PI / 2, 0],   // face 2 (-X)
        3: [ Math.PI / 2, 0, 0],   // face 3 (+Y)
        4: [-Math.PI / 2, 0, 0],   // face 4 (-Y)
        5: [0, 0, 0],              // face 5 (+Z)
        6: [0, Math.PI, 0],        // face 6 (-Z)
    };
    const [tx, ty, tz] = targetRotations[value] ?? [0, 0, 0];

    const startTime = performance.now();
    const duration  = 2800; // ms
    let   animId;

    function animate(now) {
        animId     = requestAnimationFrame(animate);
        const t    = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out

        // Spin wildly at start, settle on target face
        const spin = (1 - ease) * Math.PI * 6;
        die.rotation.x = tx + spin * 0.7;
        die.rotation.y = ty + spin;
        die.rotation.z = tz + spin * 0.3;

        renderer.render(scene, camera);

        if (t >= 1) {
            cancelAnimationFrame(animId);
            // Hold for a moment then close
            setTimeout(() => {
                modal.classList.add('hidden');
                renderer.dispose();
                if (onComplete) { onComplete(); onComplete = null; }
            }, 700);
        }
    }
    requestAnimationFrame(animate);

    modal.onclick = () => {
        cancelAnimationFrame(animId);
        modal.classList.add('hidden');
        renderer.dispose();
        if (onComplete) { onComplete(); onComplete = null; }
    };
}
