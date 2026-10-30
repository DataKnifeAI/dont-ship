// Iso world registry keyed by `data/rooms.json` template id, plus the shared tile-prop library.
// Each world file (js/iso/worlds/*.js) default-exports a definition:
//   grid + legend (h = height level, solid, void, goal, start, prop, ice, belt, glitch, catwalk),
//   physics (gravity, jumpV), look (lights, bg, view, baseY, edge), `native` hazard types used when the
//   door's tags are `none`, optional `anchors` (preferred hazard placements), world-only `props`,
//   and `decorate(ctx)` → customer blob. Hazards themselves come from hazardplan.js + hazards.js.
import * as THREE from "three";
import { PAL } from "./kit.js";
import { tileTop } from "./map.js";
import { buildPortal, cypressTree, lollipopTree, signpost } from "./props.js";
import porch from "./worlds/porch.js";
import neighborhood from "./worlds/neighborhood.js";
import shipping from "./worlds/shipping.js";
import rooftops from "./worlds/rooftops.js";
import jungle from "./worlds/jungle.js";
import neon from "./worlds/neon.js";
import frozen from "./worlds/frozen.js";
import space from "./worlds/space.js";
import underwater from "./worlds/underwater.js";
import desert from "./worlds/desert.js";
import unmapped from "./worlds/unmapped.js";
import impossible from "./worlds/impossible.js";

export const ISO_WORLDS = Object.fromEntries(
  [porch, neighborhood, shipping, rooftops, jungle, neon, frozen, space, underwater, desert, unmapped, impossible].map((d) => [d.id, d])
);

export { tileTop };

/**
 * Build the prop for one tile. `ctx`: { k, group, def, hazards, animators, player, rnd, hz, ... }.
 * World-specific builders in `def.props[key](ctx, t, x, y, z)` take precedence over the shared ones.
 */
export function buildProp(ctx, t) {
  const { k, group: G, def, rnd } = ctx;
  const { box, cyl, ico, mk, flat, toon, signPlane } = k;
  const x = t.c;
  const z = t.r;
  const y = tileTop(t);
  const own = def.props?.[t.prop];
  if (own) {
    own(ctx, t, x, y, z);
    return;
  }
  switch (t.prop) {
    case "hedge": {
      const shade = new THREE.Color(0x4d7a16).offsetHSL(0, 0, (rnd() - 0.5) * 0.05).getHex();
      box(0.98, 0.42 + rnd() * 0.12, 0.98, shade, { base: true, x, y, z, parent: G });
      break;
    }
    case "lollipop":
      lollipopTree(k, G, x, y, z);
      break;
    case "cypress":
      cypressTree(k, G, x, y, z);
      break;
    case "flowers":
      for (let i = 0; i < 6; i++) {
        const fx = x + (rnd() - 0.5) * 0.7;
        const fz = z + (rnd() - 0.5) * 0.7;
        cyl(0.01, 0.02, 0.18, 4, 0x3f6a12, { base: true, x: fx, y, z: fz, parent: G, cast: false });
        ico(0.07, 0, [PAL.burnt, PAL.harvest, PAL.cream][i % 3], { x: fx, y: y + 0.2, z: fz, parent: G });
      }
      break;
    case "mailbox": {
      cyl(0.04, 0.04, 0.55, 5, 0xe8dcc0, { base: true, x, y, z, parent: G, ol: 0.012 });
      const mb = new THREE.Group();
      mb.position.set(x, y + 0.6, z);
      mb.rotation.y = Math.PI / 4;
      G.add(mb);
      box(0.24, 0.16, 0.38, PAL.ibm, { parent: mb, ol: 0.018 });
      cyl(0.12, 0.12, 0.38, 8, PAL.ibm, { y: 0.08, rx: Math.PI / 2, parent: mb, ol: 0.018 });
      box(0.02, 0.22, 0.05, PAL.burnt, { x: 0.13, y: 0.18, z: -0.08, parent: mb, ol: 0.01 });
      ico(0.075, 1, 0xffffff, { y: 0.06, z: 0.2, parent: mb, ol: 0.01 });
      const pupil = ico(0.035, 0, PAL.ink, { y: 0.06, z: 0.26, parent: mb, cast: false });
      const eye = new THREE.Vector3(0, 0.06, 0.2);
      const look = new THREE.Vector3();
      ctx.animators.push(() => {
        look.copy(ctx.player.pos);
        look.y += 0.6;
        mb.worldToLocal(look).sub(eye).normalize().multiplyScalar(0.06);
        pupil.position.set(look.x, 0.06 + look.y, 0.2 + Math.max(0.03, look.z));
      });
      break;
    }
    case "sign":
      signpost(k, G, x, y, z, def.sign.lines, def.sign.opts);
      break;
    case "portal": {
      const p = buildPortal(k);
      p.root.position.set(x, y, z);
      G.add(p.root);
      ctx.animators.push((time) => {
        p.plane.material.map.offset.y = (time * 0.25) % 1;
      });
      break;
    }
    case "crate": {
      box(0.78, 0.6, 0.78, 0xb07a45, { base: true, x, y, z, parent: G, ol: 0.02 });
      box(0.79, 0.07, 0.79, 0xe8d9b0, { base: true, x, y: y + 0.27, z, parent: G, cast: false });
      const top = box(0.5, 0.4, 0.5, PAL.ibm, { base: true, x: x - 0.05, y: y + 0.6, z: z + 0.05, parent: G, ol: 0.02 });
      top.rotation.y = 0.4;
      for (const [lx, lz, ry] of [[x + 0.395, z, Math.PI / 2], [x, z + 0.395, 0]]) {
        const lbl = signPlane(0.5, 0.22, ["FRAGILE", "THIS WAY UP ↑"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ink, px: 260 });
        lbl.position.set(lx + (ry ? 0.003 : 0), y + 0.4, lz + (ry ? 0 : 0.003));
        lbl.rotation.y = ry;
        G.add(lbl);
      }
      break;
    }
    case "antenna": {
      cyl(0.05, 0.08, 1.4, 6, 0xcfd3d6, { base: true, x, y, z, parent: G, ol: 0.015 });
      const dishMat = toon(PAL.cream).clone();
      dishMat.side = THREE.DoubleSide;
      const dish = mk(flat(new THREE.SphereGeometry(0.5, 10, 4, 0, Math.PI * 2, 0, Math.PI / 3)), dishMat, { x, y: y + 1.45, z, parent: G, ol: 0.02 });
      dish.rotation.set(Math.PI * 0.85, 0, 0.5);
      const blink = ico(0.07, 0, PAL.harvest, { x, y: y + 1.5, z, parent: G });
      ctx.animators.push((time) => {
        dish.rotation.y = time * 0.4;
        blink.visible = Math.sin(time * 4) > 0;
      });
      break;
    }
    case "airlock": {
      cyl(0.48, 0.48, 1.5, 10, PAL.cream, { base: true, x, y, z, parent: G, ol: 0.025 });
      cyl(0.5, 0.5, 0.18, 10, PAL.ibm, { base: true, x, y: y + 0.9, z, parent: G });
      mk(flat(new THREE.SphereGeometry(0.48, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2)), PAL.harvest, { x, y: y + 1.5, z, parent: G, ol: 0.02 });
      cyl(0.3, 0.3, 0.05, 12, PAL.burnt, { x: x + 0.47, y: y + 0.55, z, rz: Math.PI / 2, parent: G, ol: 0.015 });
      cyl(0.13, 0.13, 0.06, 10, 0x2c4a6b, { x: x + 0.49, y: y + 0.62, z, rz: Math.PI / 2, parent: G });
      const s = signPlane(1.3, 0.34, ["AIRLOCK 7 · RECEIVING"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest });
      s.position.set(x + 0.1, y + 2.25, z + 0.1);
      s.rotation.y = Math.PI / 4;
      G.add(s);
      break;
    }
    case "vent":
      for (let i = -2; i <= 2; i++) box(0.8, 0.03, 0.06, PAL.harvest, { x, y: y + 0.015, z: z + i * 0.15, parent: G, cast: false });
      break;
    default:
      console.warn(`Unknown iso prop "${t.prop}" in ${def.id}`);
  }
}
