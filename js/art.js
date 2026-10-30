/**
 * Painted plates + brand marks for Phase 1.5 mock-matching draw.
 * Optional: draw falls back to procedural if a plate fails to load.
 */

const CACHE = new Map();

const PATHS = {
  hubHall: "assets/game/hub-hall-plate.jpg",
  hubMock: "assets/mocks/25d/hub-box-407b-25d.jpg",
  porchFar: "assets/game/porch-far-plate.jpg",
  porchMock: "assets/mocks/25d/universe-porch-25d.jpg",
  spaceFar: "assets/game/space-far-plate.jpg",
  spaceMock: "assets/mocks/25d/universe-space-25d.jpg",
  fenSeal: "assets/brand/fen-wolf-icon-from-herographic.png",
  fenLogo: "assets/brand/fen-wolf-logo.jpg",
  wally: "assets/brand/wally-dock-supervisor-npc.jpg",
  courier: "assets/game/courier-side.jpg",
};

export function preloadArt() {
  return Promise.all(
    Object.entries(PATHS).map(([key, src]) =>
      loadImage(src)
        .then((img) => {
          CACHE.set(key, img);
          return img;
        })
        .catch(() => {
          CACHE.set(key, null);
          return null;
        })
    )
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

export function art(key) {
  return CACHE.get(key) || null;
}

/** Cover-fit a plate into W×H (centered crop). */
export function drawPlateCover(ctx, img, W, H, alpha = 1) {
  if (!img || !img.width) return false;
  ctx.save();
  ctx.globalAlpha = alpha;
  const scale = Math.max(W / img.width, H / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.restore();
  return true;
}

/** World-space far plate stretched across room width (parallax caller translates). */
export function drawPlateWorld(ctx, img, roomW, roomH, alpha = 0.92) {
  if (!img || !img.width) return false;
  ctx.save();
  ctx.globalAlpha = alpha;
  const aspect = img.width / img.height;
  const h = roomH * 0.85;
  const w = h * aspect;
  const tiles = Math.ceil(roomW / w) + 1;
  for (let i = -1; i < tiles; i++) {
    ctx.drawImage(img, i * w * 0.92, roomH * 0.02, w, h);
  }
  ctx.restore();
  return true;
}
