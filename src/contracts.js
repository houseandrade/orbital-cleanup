/* Contract content and persistent economy are independent of campaign scores. */
const ContractSystem = (() => {
  const key = 'orbital-cleanup-career-v1';
  const upgrades = {
    scanner: { name: 'Recovery scanner', description: 'Marks visible salvage still needed for your current objective. Carried items count toward what you already have; bank them to complete the objective.', prices: [100], effects: [0, 1], labels: ['Not unlocked', 'Unlocked'] },
    reach: { name: 'Tether reach', description: 'A little more collection range. Positioning still matters.', prices: [600, 2400, 6000], effects: [82, 90.2, 98.4, 106.6], labels: ['Standard', '10% farther', '20% farther', '30% farther'] },
    stabilizer: { name: 'Cargo stabilizer', description: 'Reduces cargo handling penalties and momentum at speed. Cargo keeps its full mass and recovery time.', prices: [700, 2800, 7000], effects: [1, 0.85, 0.7, 0.55], labels: ['Standard', '15% less cargo penalty', '30% less cargo penalty', '45% less cargo penalty'] },
    deposit: { name: 'Deposit speed', description: 'Shorter station transfers. Each item still banks separately.', prices: [800, 3000, 7500], effects: [1, 0.85, 0.7, 0.55], labels: ['Standard', '15% shorter', '30% shorter', '45% shorter'] },
    reel: { name: 'Reel motor', description: 'Shorter recovery time. Heavy salvage still takes longer.', prices: [900, 3500, 9000], effects: [1, 0.9, 0.8, 0.7], labels: ['Standard', '10% shorter', '20% shorter', '30% shorter'] },
    thrust: { name: 'Thruster power', description: 'More lift under load. Watch your altitude near the upper boundary.', prices: [1000, 4000, 10000], effects: [1, 1.06, 1.12, 1.18], labels: ['Standard', '+6% power', '+12% power', '+18% power'] }
  };
  const requirements = [0, 3, 6];
  const definitions = [
    ['first-shift', 'First Shift', 'Easy', 'bank_objects', 5, 180],
    ['panel-patrol', 'Panel Patrol', 'Easy', 'bank_type', 5, 250, 'PANEL'],
    ['small-fortune', 'Small Fortune', 'Easy', 'bank_value', 300, 220],
    ['cleanup-crew', 'Cleanup Crew', 'Medium', 'bank_objects', 12, 600],
    ['satellite-sweep', 'Satellite Sweep', 'Medium', 'bank_type', 5, 750, 'SAT'],
    ['payday', 'Payday', 'Medium', 'bank_value', 850, 650],
    ['orbital-overhaul', 'Orbital Overhaul', 'Hard', 'bank_objects', 22, 1400],
    ['satellite-ten', 'Satellite Ten', 'Hard', 'bank_type', 10, 1800, 'SAT'],
    ['big-ticket', 'Big Ticket', 'Hard', 'bank_value', 1800, 1500],
    ['equipment-return', 'Equipment Return', 'Medium', 'bank_type', 5, 500, 'TOOL'],
    ['engine-recovery', 'Engine Recovery', 'Hard', 'bank_type', 3, 700, 'ROCKET']
  ];
  const contracts = definitions.map(([id, name, difficulty, type, target, bonus, salvageType]) => {
    const rank = ['Easy', 'Medium', 'Hard'].indexOf(difficulty);
    const base = LevelSystem.campaign[1];
    const bands = base.debris.bands.map(band => ({ ...band }));
    // Satellite jobs have recurring targets; none depend on a one-off spawn.
    if (salvageType === 'SAT') { bands[0].weight = 0.5; bands[1].weight = 0.3; bands[2].weight = 0.2; }
    if (rank === 0) { bands[0].y = [145, 175]; bands[2].y = [265, 300]; bands[2].speed = [45, 65]; }
    if (rank === 2) { bands[0].y = [108, 140]; bands[2].speed = [85, 112]; }
    let arrival;
    if (salvageType === 'TOOL' || salvageType === 'ROCKET') {
      const config = LevelSystem.campaign[salvageType === 'TOOL' ? 5 : 6].debris;
      const source = config.bands;
      arrival = { band: config.limited.band, interval: salvageType === 'TOOL' ? 12 : 16, speed: 30 };
      bands.splice(0, bands.length, ...source.map(band => ({ ...band })));
    }
    const objective = { type, target, salvageType };
    return { ...base, id, name, difficulty, bonus, contract: true, objective, stars: [],
      description: `Bank ${LevelSystem.criterionLabel(objective)} for a $${bonus} bonus. Only deposited salvage counts.`,
      debris: { count: 8, spacing: 85, bands, ...(arrival ? { arrival } : {}) } };
  });
  // Targeted lunar jobs use finite, spaced pools with two spare items.
  const moonDefinitions = [
    ['moon-tank-return', 'Tank Return', 'Easy', 'bank_type', 5, 220, 'TANK', 12],
    ['moon-wheel-run', 'Wheel Run', 'Easy', 'bank_type', 3, 280, 'WHEEL', 11],
    ['moon-research-order', 'Research Order', 'Medium', 'bank_type', 4, 650, 'INSTRUMENT', 13],
    ['moon-cleanup-shift', 'Lunar Cleanup', 'Medium', 'bank_objects', 12, 600],
    ['moon-lander-recovery', 'Lander Recovery', 'Hard', 'bank_type', 4, 1100, 'LEG', 14],
    ['moon-big-haul', 'Lunar Payday', 'Hard', 'bank_value', 1800, 1500]
  ];
  contracts.push(...moonDefinitions.map(([id, name, difficulty, type, target, bonus, salvageType, sourceIndex]) => {
    const base = LevelSystem.campaign[13];
    const objective = { type, target, salvageType };
    const source = sourceIndex === undefined ? null : LevelSystem.campaign[sourceIndex].debris;
    const targetBand = source?.limited?.band || source?.pocket?.band;
    const debris = { count: 5, spacing: 110, bands: base.debris.bands,
      ...(targetBand ? { limited: { count: target + 2, spacing: salvageType === 'TANK' ? 360 : 480, speed: 30, band: targetBand } }
        : { arrival: { band: LevelSystem.campaign[type === 'bank_value' ? 13 : 11].debris.limited.band, interval: 16, speed: 30 } }) };
    return { ...base, id, name, difficulty, bonus, contract: true, objective, stars: [], debris,
      description: `Bank ${LevelSystem.criterionLabel(objective)} for a $${bonus} bonus. Only deposited salvage counts.` };
  }));
  const marsDefinitions = [
    ['mars-sample-order', 'Sample Order', 'Easy', 'bank_type', 5, 300, 'SAMPLE', 21],
    ['mars-survey-return', 'Survey Return', 'Easy', 'bank_type', 3, 400, 'DRONE', 22],
    ['mars-array-recovery', 'Array Recovery', 'Medium', 'bank_type', 4, 800, 'ARRAY', 23],
    ['mars-cleanup-shift', 'Expedition Cleanup', 'Medium', 'bank_objects', 12, 650],
    ['mars-habitat-recovery', 'Habitat Recovery', 'Hard', 'bank_type', 4, 1200, 'FRAME', 24],
    ['mars-big-haul', 'Expedition Payday', 'Hard', 'bank_value', 2000, 1600]
  ];
  contracts.push(...marsDefinitions.map(([id, name, difficulty, type, target, bonus, salvageType, sourceIndex]) => {
    const base = LevelSystem.campaign[23];
    const objective = { type, target, salvageType };
    const targetBand = sourceIndex === undefined ? null : LevelSystem.campaign[sourceIndex].debris.limited.band;
    const debris = { count: 5, spacing: 115, bands: base.debris.bands,
      ...(targetBand ? { limited: { count: target + 2, spacing: salvageType === 'SAMPLE' ? 420 : 480, speed: 30, band: targetBand } }
        : { arrival: { band: LevelSystem.campaign[type === 'bank_value' ? 24 : 21].debris.limited.band, interval: type === 'bank_value' ? 24 : 16, speed: 30 } }) };
    return { ...base, id, name, difficulty, bonus, contract: true, objective, stars: [], debris,
      description: `Bank ${LevelSystem.criterionLabel(objective)} for a $${bonus} bonus. Only deposited salvage counts.` };
  }));
  for (const contract of contracts) contract.debris = LevelSystem.withBoundaryTargets(contract.debris, false, contract.objective.salvageType);
  let career = { wallet: 0, completed: [], upgrades: Object.fromEntries(Object.keys(upgrades).map(id => [id, 0])), worldOneReward: false, worldTwoReward: false, worldThreeReward: false };
  let persistent = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) {
      career.worldOneReward = saved.worldOneReward === true;
      career.worldTwoReward = saved.worldTwoReward === true;
      career.worldThreeReward = saved.worldThreeReward === true;
      if (Number.isSafeInteger(saved.wallet) && saved.wallet >= 0) career.wallet = saved.wallet;
      career.completed = contracts.filter(c => Array.isArray(saved.completed) && saved.completed.includes(c.id)).map(c => c.id);
      for (const id of Object.keys(upgrades)) {
        const tier = saved.upgrades?.[id];
        if (Number.isInteger(tier) && tier >= 0 && tier <= upgrades[id].prices.length) career.upgrades[id] = tier;
      }
    }
  } catch (_) { persistent = false; }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(career)); persistent = true; }
    catch (_) { persistent = false; }
  }
  function credit(amount) {
    if (!Number.isSafeInteger(amount) || amount < 0 || !Number.isSafeInteger(career.wallet + amount)) return false;
    career.wallet += amount;
    save();
    return true;
  }
  function rewardWorld(world) {
    const key = ({ 1: 'worldOneReward', 2: 'worldTwoReward', 3: 'worldThreeReward' })[world];
    if (!key || career[key] || !Number.isSafeInteger(career.wallet + 2000)) return false;
    career.wallet += 2000;
    career[key] = true;
    save();
    return true;
  }
  const rewardWorldOne = () => rewardWorld(1);
  function complete(id) {
    if (!contracts.some(c => c.id === id)) return;
    if (!career.completed.includes(id)) career.completed.push(id);
    save();
  }
  function purchase(id) {
    const item = upgrades[id];
    if (!item) return false;
    const tier = career.upgrades[id];
    if (tier >= item.prices.length || career.completed.length < requirements[tier] || career.wallet < item.prices[tier]) return false;
    career.wallet -= item.prices[tier];
    career.upgrades[id]++;
    save();
    return true;
  }
  const effect = id => upgrades[id].effects[career.upgrades[id]];
  return { contracts, upgrades, requirements, credit, complete, purchase, effect, rewardWorldOne, rewardWorld,
    get career() { return structuredClone(career); }, get persistent() { return persistent; } };
})();
