/* Draw-only artwork. Sprite bounds never participate in collision or tether logic. */
const GameArt = (() => {
  const atlas = new Image();
  const earth = new Image();
  const mars = new Image();
  mars.src = 'src/art/mars/mars-background.png';
  const moon = new Image();
  moon.src = 'src/art/lunar/moon-background.png';
  atlas.src = 'src/art/sprites.png';
  earth.src = 'src/art/earth.png';
  const salvage = {};
  for (const [type, file] of Object.entries({ TOOL: 'tool-crate', ROCKET: 'rocket-fragment', CAPSULE: 'survey-capsule', WHEEL: 'lunar/rover-wheel', TANK: 'lunar/oxygen-tank', INSTRUMENT: 'lunar/instrument-package', LEG: 'lunar/lander-leg', ROVER: 'lunar/rover-chassis', SAMPLE: 'mars/sample-canister', DRONE: 'mars/survey-drone', ARRAY: 'mars/solar-array-section', FRAME: 'mars/habitat-support-frame', ENGINE: 'mars/ascent-engine' })) {
    salvage[type] = new Image();
    salvage[type].src = `src/art/${file}.png`;
  }
  // Source rectangles and silhouette masks keep the atlas backdrop out of play.
  const sprites = {
    astronaut: { box: [132, 123, 248, 339], shape: [[.4,0],[.6,0],[.72,.06],[.78,.15],[.82,.15],[.83,.34],[.98,.54],[1,.65],[.91,.66],[.82,.56],[.74,.51],[.73,.61],[.78,.78],[.74,.87],[.78,.99],[.54,1],[.5,.85],[.46,1],[.2,1],[.24,.87],[.21,.8],[.26,.61],[.25,.51],[.16,.57],[.08,.66],[0,.65],[.02,.54],[.18,.34],[.18,.16],[.23,.15],[.29,.06]] },
    PANEL: { box: [542, 211, 452, 143], shape: [[.07,0],[.93,0],[.95,.27],[1,.29],[1,.71],[.95,.72],[.94,1],[.06,1],[.05,.72],[0,.71],[0,.3],[.05,.28]] },
    SCRAP: { box: [1180, 180, 223, 245], shape: [[.2,.05],[.45,.2],[.67,0],[.85,.13],[.84,.33],[1,.4],[.85,.57],[1,.89],[.86,1],[.57,.77],[.4,.9],[.27,.71],[0,.61],[.06,.39],[.23,.31]] },
    SAT: { box: [48, 637, 418, 234], shape: [[.48,0],[.52,0],[.53,.13],[.61,.16],[.62,.23],[.53,.3],[.64,.4],[1,.35],[1,.83],[.65,.83],[.59,.96],[.52,1],[.48,1],[.4,.95],[.35,.83],[0,.83],[0,.35],[.35,.4],[.47,.3],[.38,.23],[.38,.17],[.47,.13]] },
    station: { box: [518, 598, 501, 290], shape: [[.48,0],[.52,0],[.53,.14],[.56,.16],[.57,.33],[.65,.43],[.69,.47],[.71,.43],[.71,.41],[.68,.41],[.68,.2],[1,.2],[1,.42],[.85,.42],[.85,.5],[.9,.52],[.9,.62],[.85,.65],[.85,.73],[1,.73],[1,.95],[.68,.95],[.68,.73],[.74,.73],[.74,.65],[.65,.66],[.57,.8],[.56,.9],[.52,1],[.48,1],[.44,.9],[.43,.8],[.35,.66],[.26,.65],[.26,.73],[.32,.73],[.32,.95],[0,.95],[0,.73],[.15,.73],[.15,.65],[.1,.62],[.1,.52],[.15,.5],[.15,.42],[0,.42],[0,.2],[.32,.2],[.32,.41],[.29,.41],[.29,.43],[.31,.47],[.35,.43],[.43,.33],[.44,.16],[.47,.14]] }
  };
  function sprite(ctx, name, x, y, width, height) {
    if (salvage[name]) {
      const image = salvage[name];
      if (!image.complete || !image.naturalWidth) return false;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, Math.round(x - width / 2), Math.round(y - height / 2), width, height);
      ctx.restore(); return true;
    }
    if (!sprites[name] || !atlas.complete || !atlas.naturalWidth) return false;
    const { box, shape } = sprites[name];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x - width / 2), Math.round(y - height / 2));
    ctx.beginPath();
    shape.forEach(([px, py], index) => index ? ctx.lineTo(px * width, py * height) : ctx.moveTo(px * width, py * height));
    ctx.closePath(); ctx.clip();
    ctx.drawImage(atlas, ...box, 0, 0, width, height);
    ctx.restore();
    return true;
  }
  function backdrop(ctx, world = 1) {
    if (world === 3) {
      if (!mars.complete || !mars.naturalWidth) return false;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      // Keep the terrain below the flight boundary and preserve the expedition site.
      ctx.drawImage(mars, 0, 480, 1536, 544, 0, 368, 360, 152);
      ctx.restore(); return true;
    }
    if (world === 2) {
      if (!moon.complete || !moon.naturalWidth) return false;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      // Crop the horizon below the flight boundary; place the distant Earth separately
      // so the original wide illustration remains readable on a narrow phone canvas.
      ctx.drawImage(moon, 0, 500, 1536, 524, 0, 368, 360, 152);
      ctx.drawImage(moon, 1340, 140, 125, 125, 288, 100, 30, 30);
      ctx.restore(); return true;
    }
    if (!earth.complete || !earth.naturalWidth) return false;
    // Entire horizon remains below the original reentry boundary (y=360).
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(earth, 0, 480, 1536, 544, 0, 378, 360, 142);
    ctx.restore(); return true;
  }
  return { sprite, backdrop };
})();
