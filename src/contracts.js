/* Contract content and persistent economy are independent of campaign scores. */
const ContractSystem = (() => {
  const key = 'orbital-cleanup-career-v1';
  const upgrades = {
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
    if (salvageType === 'TOOL' || salvageType === 'ROCKET') {
      const config = LevelSystem.campaign[salvageType === 'TOOL' ? 5 : 6].debris;
      const source = [config.limited.band, ...config.bands];
      bands.splice(0, bands.length, ...source.map(band => ({ ...band })));
    }
    const objective = { type, target, salvageType };
    return { ...base, id, name, difficulty, bonus, contract: true, objective, stars: [],
      description: `Bank ${LevelSystem.criterionLabel(objective)} for a $${bonus} bonus. Only deposited salvage counts.`,
      debris: { count: 8, spacing: 85, bands } };
  });
  let career = { wallet: 0, completed: [], upgrades: { reel: 0, thrust: 0 } };
  let persistent = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) {
      if (Number.isSafeInteger(saved.wallet) && saved.wallet >= 0) career.wallet = saved.wallet;
      career.completed = contracts.filter(c => Array.isArray(saved.completed) && saved.completed.includes(c.id)).map(c => c.id);
      for (const id of Object.keys(upgrades)) {
        const tier = saved.upgrades?.[id];
        if (Number.isInteger(tier) && tier >= 0 && tier <= 3) career.upgrades[id] = tier;
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
  function complete(id) {
    if (!contracts.some(c => c.id === id)) return;
    if (!career.completed.includes(id)) career.completed.push(id);
    save();
  }
  function purchase(id) {
    const item = upgrades[id];
    if (!item) return false;
    const tier = career.upgrades[id];
    if (tier >= 3 || career.completed.length < requirements[tier] || career.wallet < item.prices[tier]) return false;
    career.wallet -= item.prices[tier];
    career.upgrades[id]++;
    save();
    return true;
  }
  const effect = id => upgrades[id].effects[career.upgrades[id]];
  return { contracts, upgrades, requirements, credit, complete, purchase, effect,
    get career() { return structuredClone(career); }, get persistent() { return persistent; } };
})();
