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
    level(3, 'High Roller', 'Recover valuable satellites or build your haul from ordinary salvage.', 150, 350, 600, {
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
    level(5, 'Temptation', 'Bank $350. Decide when to return and when to keep salvaging.', 350, 650, 1000, {
      count: 8, spacing: 85, bands: [
        band(0.75, [190, 265], [38, 54], [40, 60], 5, 10, 'PANEL'),
        band(0.25, [108, 135], [22, 34], [150, 200], 10, 14, 'SAT')
      ]
    }),
    { ...level(6, 'Lost Equipment', 'Bank 5 tool crates. Missed crates return on a later pass.', 5, 550, 850, {
      count: 5, spacing: 110, limited: { count: 7, spacing: 360, speed: 30, band: toolCrates }, bands: [
        band(0.3, [160, 290], [38, 48], [35, 50], 5, 10, 'PANEL'),
        band(0.2, [115, 325], [45, 65], [20, 35], 2, 7, 'SCRAP')]
    }), objective: { type: 'bank_type', salvageType: 'TOOL', target: 5 } },
    { ...level(7, 'Heavy Metal', 'Bank 3 rocket fragments. Shorter trips keep heavy cargo manageable. Missed fragments return on a later pass.', 3, 750, 1100, {
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
    { name: 'Retrieve the capsule', description: 'Recover and bank the survey capsule. Missed capsules return on a later pass.',
      objective: typed('CAPSULE', 1), debris: { count: 5, spacing: 110, bands: campaign[5].debris.bands,
        limited: { count: 1, spacing: 900, offset: 840, speed: 30,
          band: { ...band(1, [98, 110], [30, 30], [300, 300], 14, 15, 'CAPSULE'), zones: [
            { weight: 0.5, y: [98, 110], value: [300, 300], risky: true },
            { weight: 0.5, y: [325, 336], value: [300, 300], risky: true }
          ] } } } }
  ];
  campaign.push({ ...level(10, 'Final Sweep', 'Three assignments, saved checkpoints, and one final recovery. Complete World One for a one-time $2,000 reward.',
    1, 1200, 1800, assignments[0].debris), objective: assignments[0].objective, assignments, checkpointKey: 'finale', completion: { title: 'WORLD ONE COMPLETE', salvage: 'Survey capsule secured' } });
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
    { id: 2, name: 'MOON', planned: 10 },
    { id: 3, name: 'MARS', planned: 10 }
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
  const lunarRecoverySupport = lunarSupport.map(entry => entry.type === 'SAT' ? { ...entry, maxActive: 2 } : entry);
  const lunarInstrument = band(1, [185, 265], [30, 30], [110, 140], 6, 12, 'INSTRUMENT');
  const landerLeg = band(1, [175, 275], [30, 30], [150, 190], 18, 15, 'LEG');
  const lunarStation = { ...defaults.station, startX: 520, returnOffset: [280, 380], returnY: [205, 245] };
  const moon = (config, missionNumber) => ({ ...config, world: 2, missionNumber, station: lunarStation });
  campaign.push(
    moon(level(11, 'Lunar Arrival', 'Begin your lunar cleanup. Recover familiar salvage and bank your haul.', 200, 400, 650,
      { count: 6, spacing: 105, bands: lunarSupport }), 1),
    moon({ ...level(12, 'Spare Parts', 'Bank 5 rover wheels for the lunar workshop. Missed wheels return on a later pass.', 5, 550, 800,
      { count: 5, spacing: 110, bands: lunarSupport, limited: { count: 7, spacing: 420, speed: 30, band: roverWheel } }),
      objective: typed('WHEEL', 5) }, 2),
    moon({ ...level(13, 'Tank Sweep', 'Bank 8 spent oxygen tanks. Return to the station over as many trips as you need.', 8, 550, 850,
      { count: 7, spacing: 105, bands: lunarSupport, pocket: { count: 2, spacing: 40, ySpread: 14,
        band: band(1, [185, 260], [32, 38], [35, 45], 4, 10, 'TANK') } }),
      objective: typed('TANK', 8) }, 3),
    moon({ ...level(14, 'Field Research', 'Bank 3 instrument packages. Missed packages return on a later pass.', 3, 550, 800,
      { count: 5, spacing: 110, bands: lunarRecoverySupport, limited: { count: 5, spacing: 420, speed: 30, band: lunarInstrument } }),
      objective: typed('INSTRUMENT', 3) }, 4),
    moon({ ...level(15, 'Landing Debris', 'Bank 3 lander legs. Shorter trips keep heavy cargo manageable. Missed legs return on a later pass.', 3, 650, 950,
      { count: 5, spacing: 110, bands: lunarRecoverySupport, limited: { count: 5, spacing: 480, speed: 30, band: landerLeg } }),
      objective: typed('LEG', 3) }, 5),
    moon({ ...level(16, 'Workshop Delivery', 'Bank 3 rover wheels and 2 tool crates. Choose the types you still need. Missed items return on a later pass.', 1, 650, 950,
      { count: 5, spacing: 110, bands: lunarRecoverySupport, pools: [
        { count: 5, spacing: 480, speed: 30, band: roverWheel },
        { count: 4, spacing: 480, offset: 240, speed: 30, band: toolCrates }
      ] }), objective: all(typed('WHEEL', 3), typed('TOOL', 2)) }, 6),
    moon({ ...level(17, 'Off Course', 'Bank 3 instrument packages that drift gently up and down. Follow their movement before tethering. Missed packages return on a later pass.', 3, 650, 950,
      { count: 5, spacing: 110, bands: lunarRecoverySupport, limited: { count: 5, spacing: 480, speed: 30,
        band: { ...lunarInstrument, y: [180, 265], drift: { speed: 7, minY: 140, maxY: 300 } } } }),
      objective: typed('INSTRUMENT', 3) }, 7),
    moon({ ...level(18, 'Catch the Window', 'Bank 4 instrument packages. Missed packages return on a later pass; up to six can be recovered.', 4, 800, 1150,
      { count: 6, spacing: 110, bands: lunarRecoverySupport, encounter: { leadSeconds: 4, finiteCount: 6,
        band: { ...lunarInstrument, y: [195, 250] } } }),
      objective: typed('INSTRUMENT', 4) }, 8),
    moon({ ...level(19, 'Heavy Recovery', 'Bank 3 lander legs and 2 rocket fragments. Shorter trips keep heavy cargo manageable. Missed items return on a later pass.', 1, 1100, 1500,
      { count: 5, spacing: 110, bands: lunarRecoverySupport, pools: [
        { count: 5, spacing: 480, speed: 30, band: { ...landerLeg, y: [160, 290] } },
        { count: 4, spacing: 480, offset: 240, speed: 30, band: rocketFragments }
      ] }), objective: all(typed('LEG', 3), typed('ROCKET', 2)) }, 9)
  );
  const moonAssignments = [
    { name: 'Clear the workshop', description: 'Bank 6 oxygen tanks and 3 rover wheels. Missed items return on a later pass.',
      objective: all(typed('TANK', 6), typed('WHEEL', 3)),
      debris: { count: 5, spacing: 110, bands: lunarRecoverySupport, pools: [
        { count: 8, spacing: 360, speed: 30, band: band(1, [185, 260], [30, 30], [35, 45], 4, 10, 'TANK') },
        { count: 5, spacing: 720, offset: 180, speed: 30, band: roverWheel }
      ] } },
    { name: 'Recover the equipment', description: 'Bank 2 lander legs and 2 instrument packages. Missed items return on a later pass.',
      objective: all(typed('LEG', 2), typed('INSTRUMENT', 2)),
      debris: { count: 5, spacing: 110, bands: lunarRecoverySupport, pools: [
        { count: 4, spacing: 480, speed: 30, band: landerLeg },
        { count: 4, spacing: 480, offset: 240, speed: 30, band: lunarInstrument }
      ] } },
    { name: 'Bring the rover home', description: 'Recover and bank the rover chassis. This heavy cargo returns on a later pass if missed.',
      objective: typed('ROVER', 1), debris: { count: 5, spacing: 110, bands: lunarRecoverySupport,
        limited: { count: 1, spacing: 900, offset: 840, speed: 30,
          band: band(1, [190, 260], [30, 30], [450, 450], 22, 20, 'ROVER') } } }
  ];
  campaign.push(moon({ ...level(20, 'Last Rover', 'Three assignments, saved checkpoints, and one final recovery. Complete the Moon campaign for a one-time $2,000 reward.',
    1, 1800, 2400, moonAssignments[0].debris), objective: moonAssignments[0].objective,
    assignments: moonAssignments, checkpointKey: 'moonFinale',
    completion: { title: 'WORLD TWO COMPLETE', salvage: 'Lunar rover secured' } }, 10));

  // First Mars review batch: familiar motion, sparse support, finite targets + two spares.
  const marsHigh = [105, 120];
  const marsLow = [325, 338];
  const marsMiddle = [195, 250];
  // Ordinary salvage has outer-band opportunities too, without a rare-value bonus.
  const marsZones = value => [
    { weight: 0.3, y: [120, 145], value },
    { weight: 0.4, y: [175, 270], value },
    { weight: 0.3, y: [305, 330], value }
  ];
  const marsSupport = [
    { ...band(0.7, [180, 275], [30, 40], [35, 50], 5, 10, 'PANEL'), zones: marsZones([35, 50]) },
    { ...band(0.3, [170, 280], [28, 36], [60, 80], 8, 12, 'TOOL'), maxActive: 2, zones: marsZones([60, 80]) }
  ];
  const marsStation = { ...defaults.station, startX: 500, returnOffset: [240, 340], returnY: [205, 245] };
  const mars = config => ({ ...config, world: 3, missionNumber: config.id - 20, station: marsStation });
  campaign.push(
    mars(level(21, 'Red Arrival', 'Begin recovery above the abandoned expedition site. Collect familiar salvage and bank your haul.', 250, 450, 700,
      { count: 5, spacing: 115, bands: marsSupport })),
    mars({ ...level(22, 'Sample Return', 'Recover 5 geological sample canisters. Missed canisters return on a later pass. Bank your samples over as many trips as you need.', 5, 550, 800,
      { count: 5, spacing: 115, bands: marsSupport, limited: { count: 7, spacing: 420, speed: 30, altitudeBands: [marsMiddle, marsHigh, marsLow],
        band: band(1, [180, 275], [30, 30], [55, 70], 4, 10, 'SAMPLE') } }), objective: typed('SAMPLE', 5) }),
    mars({ ...level(23, 'Survey Recovery', 'Recover 3 folded survey drones. Their equipment adds weight to your haul. Missed drones return on a later pass.', 3, 600, 900,
      { count: 5, spacing: 115, bands: marsSupport, limited: { count: 5, spacing: 480, speed: 30, altitudeBands: [marsHigh, marsLow, marsMiddle],
        band: band(1, [170, 280], [30, 30], [110, 140], 9, 13, 'DRONE') } }), objective: typed('DRONE', 3) })
  );

  const sampleCanister = campaign[21].debris.limited.band;
  const surveyDrone = campaign[22].debris.limited.band;
  const solarArray = band(1, [180, 275], [30, 30], [140, 170], 14, 16, 'ARRAY');
  const habitatFrame = band(1, [175, 280], [30, 30], [180, 220], 20, 17, 'FRAME');
  const marsHeavyRocket = band(1, [165, 285], [30, 30], [130, 170], 18, 16, 'ROCKET');
  const marsRecoverySupport = [
    ...marsSupport.map(entry => ({ ...entry, weight: entry.weight * 0.9 })),
    { ...varietySatellite, weight: 0.1 }
  ];
  const marsField = extra => ({ count: 5, spacing: 115, bands: marsRecoverySupport, ...extra });
  const marsPool = (targetBand, required, offset = 0, altitudeBands = [marsHigh, marsLow]) => ({ count: required + 2, spacing: 480, offset, speed: 30, band: targetBand, altitudeBands });
  campaign.push(
    mars({ ...level(24, 'Power Salvage', 'Bank 3 solar array sections. Heavy loads carry momentum. Brake early near the boundaries. Missed arrays return on a later pass.', 3, 750, 1050,
      marsField({ limited: marsPool(solarArray, 3, 0, [marsHigh, marsLow, marsMiddle]) })), objective: typed('ARRAY', 3) }),
    mars({ ...level(25, 'Habitat Recovery', 'Bank 3 habitat support frames. Shorter trips keep this heavy cargo manageable. Brake early when moving fast. Missed frames return on a later pass.', 3, 900, 1250,
      marsField({ limited: marsPool(habitatFrame, 3, 0, [marsLow, marsHigh, marsMiddle]) })), objective: typed('FRAME', 3) }),
    mars({ ...level(26, 'Research Manifest', 'Bank 4 sample canisters and 2 survey drones. Choose the types you still need. Missed items return on a later pass.', 1, 850, 1200,
      marsField({ pools: [marsPool(sampleCanister, 4, 0, [marsHigh]), marsPool(surveyDrone, 2, 240, [marsLow])] })),
      objective: all(typed('SAMPLE', 4), typed('DRONE', 2)) }),
    mars({ ...level(27, 'Survey Window', 'Bank 4 survey drones. Balance recovery with returns to the station. Missed drones return on a later pass; up to six can be recovered.', 4, 850, 1200,
      marsField({ encounter: { leadSeconds: 4, finiteCount: 6, band: { ...surveyDrone, y: marsHigh } } })),
      objective: typed('DRONE', 4) }),
    mars({ ...level(28, 'Power Reserve', 'Bank 4 solar array sections and $1,000 total. Balance heavy arrays with other salvage, and bank over as many trips as you need. Missed arrays return on a later pass.', 1, 1350, 1750,
      marsField({ limited: marsPool({ ...solarArray, y: [155, 290] }, 4) })),
      objective: all(typed('ARRAY', 4), { type: 'bank_value', target: 1000 }) }),
    mars({ ...level(29, 'Heavy Lift', 'Bank 3 habitat support frames and 2 rocket fragments. Shorter trips keep heavy cargo manageable. Missed items return on a later pass.', 1, 1350, 1800,
      marsField({ pools: [marsPool(habitatFrame, 3, 0, [marsHigh]), marsPool(marsHeavyRocket, 2, 240, [marsLow])] })),
      objective: all(typed('FRAME', 3), typed('ROCKET', 2)) })
  );
  const marsAssignments = [
    { name: 'Secure the research', description: 'Bank 3 sample canisters and 2 survey drones. Missed items return on a later pass.',
      objective: all(typed('SAMPLE', 3), typed('DRONE', 2)),
      debris: marsField({ pools: [marsPool(sampleCanister, 3, 0, [marsLow]), marsPool(surveyDrone, 2, 240, [marsHigh])] }) },
    { name: 'Recover the infrastructure', description: 'Bank 2 solar array sections and 2 habitat support frames. Make shorter trips with heavy cargo. Missed items return on a later pass.',
      objective: all(typed('ARRAY', 2), typed('FRAME', 2)),
      debris: marsField({ pools: [marsPool(solarArray, 2, 0, [marsHigh]), marsPool(habitatFrame, 2, 240, [marsLow])] }) },
    { name: 'Bring the engine home', description: 'Recover and bank the ascent engine. This heavy cargo returns on a later pass if missed.',
      objective: typed('ENGINE', 1), debris: marsField({ limited: { count: 1, spacing: 900, offset: 840, speed: 30,
        band: band(1, [190, 260], [30, 30], [550, 550], 24, 18, 'ENGINE') } }) }
  ];
  campaign.push(mars({ ...level(30, 'Last Ascent', 'Three assignments, saved checkpoints, and the expedition’s final engine. Complete the Mars campaign for a one-time $2,000 reward.',
    1, 2300, 3000, marsAssignments[0].debris), objective: marsAssignments[0].objective,
    assignments: marsAssignments, checkpointKey: 'marsFinale',
    completion: { title: 'WORLD THREE COMPLETE', salvage: 'Ascent engine secured' } }));

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
    { name: 'Scrap pockets', at: 150, description: 'Recover light scraps and occasional tool crates.',
      debris: { ...endless.debris, arrival: { band: toolCrates, interval: 18, speed: 30 }, pocket: scrapPocket } },
    { name: 'High-value passes', at: 300, description: 'Recover valuable satellites and occasional rocket fragments.',
      debris: { ...endless.debris, arrival: { band: rocketFragments, interval: 24, speed: 30 }, encounter: valuablePass } },
    { name: 'Recovery stretch', at: 500, description: 'A chance to return with a lighter haul.',
      debris: { count: 5, spacing: 110, bands: [band(1, [195, 260], [38, 44], [30, 40], 2, 7, 'SCRAP')] } }
  ];
  endless.phaseCycleValue = 750;
  endless.world = 1;
  const moonEndless = { ...endless, world: 2, name: 'Endless Orbit · Moon', station: lunarStation,
    debris: { count: 5, spacing: 110, bands: lunarRecoverySupport },
    phases: [
      { name: 'Lunar salvage', at: 0, description: 'Recover familiar salvage above the Moon.',
        debris: { count: 5, spacing: 110, bands: lunarRecoverySupport } },
      { name: 'Workshop spares', at: 150, description: 'Recover rover wheels and spent oxygen tanks.',
        debris: { count: 5, spacing: 110, bands: lunarRecoverySupport,
          arrival: { band: roverWheel, interval: 16, speed: 30 },
          pocket: { count: 2, spacing: 40, ySpread: 14, band: band(1, [185, 260], [32, 38], [35, 45], 4, 10, 'TANK') } } },
      { name: 'Research recovery', at: 300, description: 'Recover valuable instrument packages.',
        debris: { count: 5, spacing: 110, bands: lunarRecoverySupport,
          arrival: { band: lunarInstrument, interval: 16, speed: 30 } } },
      { name: 'Lander salvage', at: 500, description: 'Recover heavy lander legs. Bank your haul over as many trips as you need.',
        debris: { count: 5, spacing: 110, bands: lunarRecoverySupport,
          arrival: { band: landerLeg, interval: 20, speed: 30 } } }
    ]
  };
  const marsEndless = { ...endless, world: 3, name: 'Endless Orbit · Mars', station: marsStation,
    debris: marsField({}),
    phases: [
      { name: 'Sample field', at: 0, description: 'Recover geological samples above the expedition site.',
        debris: marsField({ arrival: { band: sampleCanister, interval: 16, speed: 30 } }) },
      { name: 'Survey equipment', at: 150, description: 'Recover survey drones and bank your research haul.',
        debris: marsField({ arrival: { band: surveyDrone, interval: 18, speed: 30 } }) },
      { name: 'Power salvage', at: 300, description: 'Recover solar arrays. Brake early with a loaded suit.',
        debris: marsField({ arrival: { band: solarArray, interval: 20, speed: 30 } }) },
      { name: 'Habitat recovery', at: 500, description: 'Recover heavy habitat frames. Shorter trips keep cargo manageable.',
        debris: marsField({ arrival: { band: habitatFrame, interval: 24, speed: 30 } }) }
    ]
  };
  // Shared movement layout: cycle ordinary fields and recurring targets across altitude bands.
  // Clone configurations so contracts and phase variants never mutate their source missions.
  const recoveryHigh = [105, 120], recoveryLow = [322, 334], recoveryMiddle = [195, 250];
  function withBoundaryTargets(debris, introduction = false, targetType = null) {
    const high = introduction ? [120, 140] : recoveryHigh;
    const low = introduction ? [305, 325] : recoveryLow;
    const layout = { ...debris, altitudeBands: introduction ? [recoveryMiddle, high, low] : [high, low, recoveryMiddle],
      boundaryTargetType: targetType, targetAltitudeBands: [high, low] };
    if (debris.limited && debris.limited.count > 1) layout.limited = { ...debris.limited,
      altitudeBands: debris.limited.band.drift ? [recoveryMiddle, high, low] : [high, low, recoveryMiddle] };
    if (debris.pools) layout.pools = debris.pools.map((pool, index) => ({ ...pool,
      altitudeBands: [index % 2 ? low : high] }));
    if (debris.arrival) layout.arrival = { ...debris.arrival, altitudeBands: [high, low] };
    if (debris.encounter) layout.encounter = { ...debris.encounter, altitudeBands: [high, low] };
    // Keep pockets together, with their original internal spread and pacing.
    if (debris.pocket) layout.pocket = { ...debris.pocket, altitudeBands: [[114, 118], [318, 322]] };
    return layout;
  }
  for (const config of campaign.filter(config => config.world <= 2)) {
    config.debris = withBoundaryTargets(config.debris, config.missionNumber === 1);
    if (config.assignments) config.assignments = config.assignments.map(assignment => ({ ...assignment,
      debris: withBoundaryTargets(assignment.debris) }));
  }
  for (const mode of [endless, moonEndless, marsEndless]) {
    mode.debris = withBoundaryTargets(mode.debris);
    mode.phases = mode.phases.map(phase => ({ ...phase, debris: withBoundaryTargets(phase.debris) }));
  }
  const endlessFor = world => world === 3 ? marsEndless : world === 2 ? moonEndless : endless;
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
    if (criterion.type === 'bank_type') return `${criterion.target} ${({ SAT: 'satellites', PANEL: 'panels', SCRAP: 'scraps', TOOL: 'tool crates', ROCKET: 'rocket fragments', CAPSULE: 'survey capsule', WHEEL: 'rover wheels', TANK: 'oxygen tanks', INSTRUMENT: 'instrument packages', LEG: 'lander legs', ROVER: 'rover chassis', SAMPLE: 'sample canisters', DRONE: 'survey drones', ARRAY: 'solar array sections', FRAME: 'habitat support frames', ENGINE: 'ascent engines' })[criterion.salvageType] || 'items'}`;
    return criterion.type === 'bank_objects' ? `${criterion.target} objects` : `$${criterion.target}`;
  }
  const key = 'orbital-cleanup-progress-v1';
  function readProgress() {
    const result = { currentLevel: 1, best: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (worlds.some(world => world.id === saved?.selectedWorld)) result.selectedWorld = saved.selectedWorld;
      for (const config of campaign) {
        const stars = saved?.best?.[config.id];
        if (Number.isInteger(stars) && stars >= 1 && stars <= 3 && (config.id === 1 || result.best[config.id - 1])) result.best[config.id] = stars;
      }
      if (campaign.some(config => config.id === saved?.currentLevel) && (saved.currentLevel === 1 || result.best[saved.currentLevel - 1])) result.currentLevel = saved.currentLevel;
      for (const config of campaign.filter(config => config.assignments)) {
        const checkpoint = saved?.[config.checkpointKey];
        if (result.best[config.id - 1] && Number.isInteger(checkpoint?.stage) && checkpoint.stage >= 1 && checkpoint.stage < config.assignments.length && Number.isSafeInteger(checkpoint.bank) && checkpoint.bank >= 0) {
          result[config.checkpointKey] = { stage: checkpoint.stage, bank: checkpoint.bank };
        }
      }
    } catch (_) {}
    result.activeWorld = result.best[20] && (result.best[21] || result.currentLevel >= 21) ? 3 : result.best[10] && (result.best[11] || result.currentLevel >= 11) ? 2 : 1;
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved?.activeWorld === 3 && result.best[20]) result.activeWorld = 3;
      else if (saved?.activeWorld === 2 && result.best[10] && !result.best[21]) result.activeWorld = 2;
      else if (saved?.activeWorld === 1 && !result.best[11]) result.activeWorld = 1;
    } catch (_) {}
    result.selectedWorld ??= campaign.find(config => config.id === result.currentLevel)?.world || 1;
    return result;
  }
  function saveProgress(progress) {
    try { localStorage.setItem(key, JSON.stringify(progress)); return true; } catch (_) { return false; }
  }
  return { withBoundaryTargets, worlds, campaign, endless, endlessFor, phaseFor, nextMilestone, criterionLabel, meets, rating, readProgress, saveProgress };
})();
