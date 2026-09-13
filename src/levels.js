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
  const toolCrates = band(0.5, [185, 260], [30, 42], [60, 80], 8, 12, 'TOOL');
  const rocketFragments = band(0.45, [145, 205], [24, 34], [130, 170], 18, 16, 'ROCKET');
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
    }),
    { ...level(6, 'Lost Equipment', 'Recover 5 tool crates. Look for the cream cases with mint latches; bank them across as many trips as needed.', 5, 550, 850, {
      count: 8, spacing: 90, bands: [toolCrates,
        band(0.3, [190, 265], [38, 48], [35, 50], 5, 10, 'PANEL'),
        band(0.2, [265, 310], [45, 65], [20, 35], 2, 7, 'SCRAP')]
    }), objective: { type: 'bank_type', salvageType: 'TOOL', target: 5 } },
    { ...level(7, 'Heavy Metal', 'Bank 3 rocket fragments. Heavy engine sections slow your reel and add cargo mass; shorter trips keep the load manageable.', 3, 750, 1100, {
      count: 8, spacing: 100, bands: [rocketFragments, { ...toolCrates, weight: 0.25 },
        band(0.3, [195, 270], [38, 48], [35, 50], 5, 10, 'PANEL')]
    }), objective: { type: 'bank_type', salvageType: 'ROCKET', target: 3 } }
  ];
  const scrapPocket = {
    count: 3, spacing: 32, ySpread: 12,
    band: band(1, [205, 250], [38, 44], [15, 25], 2, 7, 'SCRAP')
  };
  const valuablePass = {
    leadSeconds: 4,
    band: band(1, [108, 135], [22, 34], [150, 200], 10, 14, 'SAT')
  };
  campaign[3].debris.pocket = scrapPocket;
  // Reserve one of the eight slots for a target timed to each station pass.
  campaign[4].debris.bands[1].weight = 0;
  campaign[4].debris.encounter = valuablePass;
  const endless = {
    ...defaults, id: 'endless', name: 'Endless Orbit',
    description: 'Bank $150 for your first milestone. Explore changing fields; finish safely after any deposit or keep going.',
    objective: null, stars: [],
    debris: { count: 8, spacing: 85, bands: [
      band(0.2, [110, 165], [22, 34], [70, 70], 10, 14, 'SAT'),
      band(0.42, [180, 260], [38, 54], [30, 30], 5, 10, 'PANEL'),
      band(0.38, [282, 342], [76, 112], [30, 30], 2, 7, 'SCRAP')
    ] }
  };
  endless.milestones = [150, 300, 500, 750, 1000];
  endless.milestoneStep = 250;
  endless.phases = [
    { name: 'Open field', at: 0, description: 'Room to choose your haul.', debris: endless.debris },
    { name: 'Scrap pockets', at: 150, description: 'Light scraps arrive in clusters, with tool crates mixed into the field.',
      debris: { ...endless.debris, bands: [...endless.debris.bands, { ...toolCrates, weight: 0.3 }], pocket: scrapPocket } },
    { name: 'High-value passes', at: 300, description: 'Heavy rocket fragments cross the field; valuable satellites arrive just before the station.',
      debris: { ...endless.debris, bands: [...endless.debris.bands, { ...rocketFragments, weight: 0.25 }], encounter: valuablePass } },
    { name: 'Recovery stretch', at: 500, description: 'A quieter mid-orbit field for lighter trips.',
      debris: { count: 5, spacing: 110, bands: [band(1, [195, 260], [38, 44], [30, 40], 2, 7, 'SCRAP')] } }
  ];
  endless.phaseCycleValue = 750;
  function phaseFor(config, bank) {
    if (!config.phases) return null;
    const value = bank % config.phaseCycleValue;
    return config.phases.filter(phase => phase.at <= value).at(-1);
  }
  function nextMilestone(config, bank) {
    return config.milestones.find(value => value > bank) ||
      config.milestones.at(-1) + (Math.floor((bank - config.milestones.at(-1)) / config.milestoneStep) + 1) * config.milestoneStep;
  }
  function meets(criterion, stats, objective) {
    if (!criterion) return false;
    switch (criterion.type) {
      case 'bank_type': return (stats.bankedTypes?.[criterion.salvageType] || 0) >= criterion.target;
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
    if (criterion.type === 'bank_type') return `${criterion.target} ${({ SAT: 'satellites', PANEL: 'panels', SCRAP: 'scraps', TOOL: 'tool crates', ROCKET: 'rocket fragments' })[criterion.salvageType] || 'items'}`;
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
  return { campaign, endless, phaseFor, nextMilestone, criterionLabel, meets, rating, readProgress, saveProgress };
})();
