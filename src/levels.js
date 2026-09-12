/* Campaign data feeds the same simulation; future modes can supply the same shape. */
const LevelSystem = (() => {
  const band = (weight, y, speed, value, mass, size, type) => ({ weight, y, speed, value, mass, size, type });
  const defaults = {
    field: { escapeY: 75, reentryY: 360 },
    player: { startY: 225, suitIntegrity: 100 },
    station: { startX: 660, startY: 225, speed: 25, returnOffset: [420, 620], returnY: [190, 255] }
  };
  const level = (id, name, description, target, two, three, debris, station = defaults.station) => ({
    ...defaults, id, name, description, station, debris,
    objective: { type: 'bank_value', target },
    stars: [{ type: 'complete_objective' }, { type: 'bank_value', target: two }, { type: 'bank_value', target: three }]
  });
  const campaign = [
    level(1, 'First Haul', 'Collect, return, bank. Only banked salvage counts.', 60, 120, 200, {
      count: 5, spacing: 95, bands: [band(1, [185, 265], [24, 34], [30, 40], 5, 10, 'PANEL')]
    }, { ...defaults.station, startX: 450, returnOffset: [120, 180], returnY: [215, 235] }),
    level(2, 'Junkyard', 'Bank $150, or take another trip for more stars.', 150, 300, 500, {
      count: 8, spacing: 85, bands: [
        band(0.2, [110, 165], [22, 34], [70, 100], 10, 14, 'SAT'),
        band(0.42, [180, 260], [38, 54], [30, 50], 5, 10, 'PANEL'),
        band(0.38, [282, 342], [76, 112], [20, 60], 2, 7, 'SCRAP')
      ]
    }),
    level(3, 'High Roller', 'Optional $300 satellite in high orbit. Ordinary salvage is enough.', 150, 350, 600, {
      count: 7, spacing: 85, bands: [
        band(0.65, [190, 265], [38, 54], [30, 50], 5, 10, 'PANEL'),
        band(0.35, [282, 330], [65, 90], [30, 60], 2, 7, 'SCRAP')
      ],
      special: { x: 780, y: 112, speed: 28, value: 300, mass: 18, size: 14, type: 'SAT' }
    }),
    { ...level(4, 'Recovery Detail', 'Bank 10 objects. Light scraps count just as much as heavy salvage.', 10, 400, 650, {
      count: 8, spacing: 85, bands: [
        band(0.75, [190, 265], [38, 54], [15, 25], 2, 7, 'SCRAP'),
        band(0.25, [110, 165], [22, 34], [70, 100], 10, 14, 'SAT')
      ]
    }), objective: { type: 'bank_objects', target: 10 } },
    level(5, 'Temptation', 'Safer mid-orbit salvage or recurring high-value targets near the edge?', 350, 650, 1000, {
      count: 8, spacing: 85, bands: [
        band(0.75, [190, 265], [38, 54], [40, 60], 5, 10, 'PANEL'),
        band(0.25, [108, 135], [22, 34], [150, 200], 10, 14, 'SAT')
      ]
    })
  ];
  const endless = {
    ...defaults, id: 'endless', name: 'Endless Orbit',
    description: 'Keep collecting and banking. Beat your best before your run ends.',
    objective: null, stars: [],
    debris: { count: 8, spacing: 85, bands: [
      band(0.2, [110, 165], [22, 34], [70, 70], 10, 14, 'SAT'),
      band(0.42, [180, 260], [38, 54], [30, 30], 5, 10, 'PANEL'),
      band(0.38, [282, 342], [76, 112], [30, 30], 2, 7, 'SCRAP')
    ] }
  };
  function meets(criterion, stats, objective) {
    if (!criterion) return false;
    switch (criterion.type) {
      case 'bank_objects': return stats.bankedObjects >= criterion.target;
      case 'bank_value': return stats.bank >= criterion.target;
      case 'complete_objective': return meets(objective, stats);
      default: return false;
    }
  }
  const rating = (config, stats) => config.stars.reduce((stars, criterion, index) =>
    stars === index && meets(criterion, stats, config.objective) ? stars + 1 : stars, 0);
  function criterionLabel(criterion, objective) {
    if (criterion.type === 'complete_objective') return criterionLabel(objective);
    return criterion.type === 'bank_objects' ? `${criterion.target} objects` : `$${criterion.target}`;
  }
  const key = 'orbital-cleanup-progress-v1';
  function readProgress() {
    const result = { currentLevel: 1, best: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      for (const config of campaign) {
        const stars = saved?.best?.[config.id];
        if (Number.isInteger(stars) && stars >= 1 && stars <= 3 && (config.id === 1 || result.best[config.id - 1])) result.best[config.id] = stars;
      }
      if (campaign.some(config => config.id === saved?.currentLevel) && (saved.currentLevel === 1 || result.best[saved.currentLevel - 1])) result.currentLevel = saved.currentLevel;
    } catch (_) {}
    return result;
  }
  function saveProgress(progress) {
    try { localStorage.setItem(key, JSON.stringify(progress)); } catch (_) {}
  }
  return { campaign, endless, criterionLabel, meets, rating, readProgress, saveProgress };
})();
