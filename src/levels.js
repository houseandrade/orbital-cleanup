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
  const toolCrates = { ...band(0.5, [185, 260], [30, 42], [60, 80], 8, 12, 'TOOL'), zones: [
    { weight: 0.25, y: [105, 140], value: [70, 80], risky: true },
    { weight: 0.5, y: [170, 280], value: [60, 69] },
    { weight: 0.25, y: [300, 330], value: [70, 80], risky: true }
  ] };
  const rocketFragments = { ...band(0.45, [145, 205], [24, 34], [130, 170], 18, 16, 'ROCKET'), zones: [
    { weight: 0.25, y: [105, 140], value: [155, 170], risky: true },
    { weight: 0.5, y: [170, 280], value: [130, 154] },
    { weight: 0.25, y: [300, 330], value: [155, 170], risky: true }
  ] };
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
    { ...level(6, 'Lost Equipment', 'Recover 5 tool crates. Look for the cream cases with mint latches; Seven crates travel at varied altitudes. Edge-of-orbit crates pay more; missed crates return.', 5, 550, 850, {
      count: 5, spacing: 110, limited: { count: 7, spacing: 360, speed: 30, band: toolCrates }, bands: [
        band(0.3, [160, 290], [38, 48], [35, 50], 5, 10, 'PANEL'),
        band(0.2, [115, 325], [45, 65], [20, 35], 2, 7, 'SCRAP')]
    }), objective: { type: 'bank_type', salvageType: 'TOOL', target: 5 } },
    { ...level(7, 'Heavy Metal', 'Bank 3 rocket fragments. Heavy engine sections slow your reel and add cargo mass; Five fragments travel at varied altitudes. Edge-of-orbit fragments pay more; missed fragments return.', 3, 750, 1100, {
      count: 5, spacing: 110, limited: { count: 5, spacing: 480, speed: 30, band: rocketFragments }, bands: [
        band(0.2, [115, 325], [45, 65], [20, 35], 2, 7, 'SCRAP'),
        band(0.3, [160, 290], [38, 48], [35, 50], 5, 10, 'PANEL')]
    }), objective: { type: 'bank_type', salvageType: 'ROCKET', target: 3 } }
  ];
  const all = (...criteria) => ({ type: 'all', criteria });
  const typed = (salvageType, target) => ({ type: 'bank_type', salvageType, target });
  const mixedField = () => ({ count: 5, spacing: 110, bands: campaign[5].debris.bands,
    pools: [
      { count: 5, spacing: 480, speed: 30, band: toolCrates },
      { count: 4, spacing: 480, offset: 240, speed: 30, band: rocketFragments }
    ] });
  campaign.push(
    { ...level(8, 'Sorting Shift', 'Bank 3 tool crates and 2 rocket fragments. Choose the types you still need.', 1, 800, 1200, mixedField()),
      objective: all(typed('TOOL', 3), typed('ROCKET', 2)) },
    { ...level(9, 'Salvage Run', 'Bank 4 rocket fragments and $900 total. Shorter trips keep heavy cargo manageable.', 1, 1300, 1800,
      { ...campaign[6].debris, limited: { ...campaign[6].debris.limited, count: 6 } }),
      objective: all(typed('ROCKET', 4), { type: 'bank_value', target: 900 }) }
  );
  const assignments = [
    { name: 'Clear the field', description: 'Bank 6 ordinary objects: scraps, panels, or satellites.',
      objective: { type: 'bank_group', types: ['SCRAP', 'PANEL', 'SAT'], target: 6 }, debris: campaign[1].debris },
    { name: 'Recover equipment', description: 'Bank 3 tool crates and 2 rocket fragments.',
      objective: all(typed('TOOL', 3), typed('ROCKET', 2)), debris: mixedField() },
    { name: 'Retrieve the capsule', description: 'The capsule arrives after the first station pass, near the upper or lower orbit boundary. Recover it and return safely; missed capsules circle back.',
      objective: typed('CAPSULE', 1), debris: { count: 5, spacing: 110, bands: campaign[5].debris.bands,
        limited: { count: 1, spacing: 900, offset: 840, speed: 30,
          band: { ...band(1, [98, 110], [30, 30], [300, 300], 14, 15, 'CAPSULE'), zones: [
            { weight: 0.5, y: [98, 110], value: [300, 300], risky: true },
            { weight: 0.5, y: [325, 336], value: [300, 300], risky: true }
          ] } } } }
  ];
  campaign.push({ ...level(10, 'Final Sweep', 'Three assignments, saved checkpoints, and one final recovery. Complete World One for a one-time $2,000 reward.',
    1, 1200, 1800, assignments[0].debris), objective: assignments[0].objective, assignments });
  const varietySatellite = { ...band(0.1, [175, 270], [26, 34], [70, 100], 10, 14, 'SAT'), maxActive: 2, zones: [
    { weight: 0.25, y: [110, 145], value: [90, 100], risky: true },
    { weight: 0.5, y: [175, 270], value: [70, 89] },
    { weight: 0.25, y: [305, 330], value: [90, 100], risky: true }
  ] };
  const withSatelliteVariety = debris => ({ ...debris,
    bands: [...debris.bands.filter(entry => entry.type !== 'SAT'), varietySatellite] });
  for (const config of campaign.slice(5)) {
    config.debris = withSatelliteVariety(config.debris);
    if (config.assignments) config.assignments = config.assignments.map(assignment => ({ ...assignment, debris: withSatelliteVariety(assignment.debris) }));
  }
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
  const worlds = [
    { id: 1, name: 'EARTH ORBIT', planned: 10 },
    { id: 2, name: 'MOON', planned: 10 }
  ];
  campaign.forEach(config => { config.world = 1; config.missionNumber = config.id; });
  const lunarSupport = [
    band(0.65, [175, 280], [30, 44], [35, 50], 5, 10, 'PANEL'),
    band(0.25, [150, 300], [40, 60], [20, 35], 2, 7, 'SCRAP'),
    band(0.1, [140, 180], [24, 32], [70, 90], 10, 14, 'SAT')
  ];
  const roverWheel = { ...band(1, [170, 280], [30, 30], [65, 85], 7, 12, 'WHEEL'), zones: [
    { weight: 0.2, y: [125, 155], value: [80, 85], risky: true },
    { weight: 0.6, y: [175, 275], value: [65, 79] },
    { weight: 0.2, y: [300, 325], value: [80, 85], risky: true }
  ] };
  const lunarStation = { ...defaults.station, startX: 520, returnOffset: [280, 380], returnY: [205, 245] };
  const moon = (config, missionNumber) => ({ ...config, world: 2, missionNumber, station: lunarStation });
  campaign.push(
    moon(level(11, 'Lunar Arrival', 'Your first shift above the Moon. Recover familiar panels, scraps, and satellites. Keep clear of the lunar surface and bank your haul at the station.', 200, 400, 650,
      { count: 6, spacing: 105, bands: lunarSupport }), 1),
    moon({ ...level(12, 'Spare Parts', 'Recover rover wheels for the lunar workshop. Seven wheels pass one at a time; missed wheels circle back. Higher and lower passes pay more.', 5, 550, 800,
      { count: 5, spacing: 110, bands: lunarSupport, limited: { count: 7, spacing: 420, speed: 30, band: roverWheel } }),
      objective: typed('WHEEL', 5) }, 2),
    moon({ ...level(13, 'Tank Sweep', 'Collect spent oxygen tanks in small pockets among familiar salvage. These empty tanks are safe to recover; bank them over as many trips as you need.', 8, 550, 850,
      { count: 7, spacing: 105, bands: lunarSupport, pocket: { count: 2, spacing: 40, ySpread: 14,
        band: band(1, [185, 260], [32, 38], [35, 45], 4, 10, 'TANK') } }),
      objective: typed('TANK', 8) }, 3)
  );
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
    { name: 'Scrap pockets', at: 150, description: 'Light scraps arrive in clusters; occasional tool crates pass one at a time.',
      debris: { ...endless.debris, arrival: { band: toolCrates, interval: 18, speed: 30 }, pocket: scrapPocket } },
    { name: 'High-value passes', at: 300, description: 'Rare rocket fragments pass one at a time; valuable satellites arrive just before the station.',
      debris: { ...endless.debris, arrival: { band: rocketFragments, interval: 24, speed: 30 }, encounter: valuablePass } },
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
      case 'all': return criterion.criteria.every(c => meets(c, stats));
      case 'bank_group': return criterion.types.reduce((sum, type) => sum + (stats.bankedTypes?.[type] || 0), 0) >= criterion.target;
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
    if (criterion.type === 'all') return criterion.criteria.map(c => criterionLabel(c)).join(' + ');
    if (criterion.type === 'bank_group') return `${criterion.target} ordinary objects`;
    if (criterion.type === 'complete_objective') return criterionLabel(objective);
    if (criterion.type === 'bank_type') return `${criterion.target} ${({ SAT: 'satellites', PANEL: 'panels', SCRAP: 'scraps', TOOL: 'tool crates', ROCKET: 'rocket fragments', CAPSULE: 'survey capsule', WHEEL: 'rover wheels', TANK: 'oxygen tanks' })[criterion.salvageType] || 'items'}`;
    return criterion.type === 'bank_objects' ? `${criterion.target} objects` : `$${criterion.target}`;
  }
  const key = 'orbital-cleanup-progress-v1';
  function readProgress() {
    const result = { currentLevel: 1, best: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if ([1, 2].includes(saved?.selectedWorld)) result.selectedWorld = saved.selectedWorld;
      for (const config of campaign) {
        const stars = saved?.best?.[config.id];
        if (Number.isInteger(stars) && stars >= 1 && stars <= 3 && (config.id === 1 || result.best[config.id - 1])) result.best[config.id] = stars;
      }
      if (campaign.some(config => config.id === saved?.currentLevel) && (saved.currentLevel === 1 || result.best[saved.currentLevel - 1])) result.currentLevel = saved.currentLevel;
      if (result.best[9] && Number.isInteger(saved?.finale?.stage) && saved.finale.stage >= 1 && saved.finale.stage <= 2 && Number.isSafeInteger(saved.finale.bank) && saved.finale.bank >= 0) {
        result.finale = { stage: saved.finale.stage, bank: saved.finale.bank };
      }
    } catch (_) {}
    result.selectedWorld ??= campaign.find(config => config.id === result.currentLevel)?.world || 1;
    return result;
  }
  function saveProgress(progress) {
    try { localStorage.setItem(key, JSON.stringify(progress)); return true; } catch (_) { return false; }
  }
  return { worlds, campaign, endless, phaseFor, nextMilestone, criterionLabel, meets, rating, readProgress, saveProgress };
})();
