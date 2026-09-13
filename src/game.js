(() => {
  "use strict";

  const root = document.getElementById("game");
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  const status = document.getElementById("status");
  const restartButton = document.getElementById("restart");
  const tetherButton = document.getElementById("tether");
  const depositButton = document.getElementById("deposit");
  const thrustButton = document.getElementById("thrust");
  const startScreen = document.getElementById("start-screen");
  const startButton = document.getElementById("start");
  const gameOver = document.getElementById("game-over");
  const playAgainButton = document.getElementById("play-again");
  const death = document.getElementById("death");
  const detail = document.getElementById("detail");
  const bankDisplay = document.getElementById("bank");
  const lostDisplay = document.getElementById("lost");
  const summary = document.getElementById("summary");
  const startHighScore = document.getElementById("start-high-score");
  const gameOverHighScore = document.getElementById("game-over-high-score");

  const missionDisplay = document.getElementById("mission");
  const resultScreen = document.getElementById("level-result");
  const resultTitle = document.getElementById("result-title");
  const resultStats = document.getElementById("result-stats");
  const finishButton = document.getElementById("finish-level");
  const continueButton = document.getElementById("continue-level");
  const nextButton = document.getElementById("next-level");
  const replayButton = document.getElementById("replay-level");
  const progress = LevelSystem.readProgress();
  let level = LevelSystem.campaign.find(config => config.id === progress.currentLevel);
  let pendingResult = false;
  let exitPaused = false;
  let resumeAfterExit = false;
  const exitScreen = document.getElementById('exit-confirm');
  let specialCollected = false;
  let exitAction = 'leave';
  let phase = null;
  let queuedPhase = null;
  let nextStation = null;

  const WIDTH = 360;
  const HEIGHT = 520;
  const PLAYER_X = 180;
  let ESCAPE_Y = level.field.escapeY;
  let REENTRY_Y = level.field.reentryY;
  const HIGH_SCORE_KEY = "orbital-cleanup-high-score";

  let player;
  let junk;
  let cargo;
  let particles;
  let tether;
  let station;
  let running = false;
  let thrusting = false;
  let depositing = false;
  let haul = 0;
  let bank = 0;
  let carriedObjects = 0;
  let bankedObjects = 0;
  let carriedTypes = {};
  let bankedTypes = {};
  let contractBonus = 0;
  let contractCompleted = false;
  let runEffects = { reel: 1, thrust: 1 };
  let mass = 0;
  let integrity = 100;
  let lastFrame = 0;
  let animationFrame = 0;
  let depositProgress = 0;
  let depositStartBank = null;
  let depositNotice = '';
  let depositNoticeTime = 0;
  let shake = 0;
  let impactText = 0;
  let elapsed = 0;

  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
  const orbitZone = (y) => y < 170 ? "HIGH" : y < 270 ? "MID" : "LOW";
  const thrustEffectiveness = (cargoMass) => Math.max(0.75, 1 - Math.min(cargoMass / 100, 1) * 0.25);

  const sessionBests = {};
  const scoreKey = () => level.contract ? 'orbital-cleanup-contract-best-v1' : level.id === 'endless' ? 'orbital-cleanup-endless-best-v1' : HIGH_SCORE_KEY;
  function readEndlessBest() {
    try { return Math.max(sessionBests['orbital-cleanup-endless-best-v1'] || 0, Number.parseInt(localStorage.getItem('orbital-cleanup-endless-best-v1'), 10) || 0); }
    catch (_) { return sessionBests['orbital-cleanup-endless-best-v1'] || 0; }
  }
  function getHighScore() {
    try {
      const value = Number.parseInt(localStorage.getItem(scoreKey()) || "0", 10);
      return Math.max(sessionBests[scoreKey()] || 0, Number.isFinite(value) && value > 0 ? value : 0);
    } catch (_) {
      return sessionBests[scoreKey()] || 0;
    }
  }

  function setHighScore(score) {
    const highScore = Math.max(getHighScore(), score);
    sessionBests[scoreKey()] = highScore;
    try { localStorage.setItem(scoreKey(), String(highScore)); } catch (_) {}
    startHighScore.textContent = String(highScore);
    gameOverHighScore.textContent = String(highScore);
  }

  const debrisConfig = () => phase?.debris || level.debris;

  function makeJunk(offset = 0, chosenBand = null) {
    const bands = debrisConfig().bands;
    let roll = Math.random() * bands.reduce((sum, band) => sum + band.weight, 0);
    const band = chosenBand || bands.find(band => (roll -= band.weight) < 0) || bands[bands.length - 1];
    junk.push({ x: WIDTH + offset, y: random(...band.y), speed: random(...band.speed),
      value: Math.round(random(...band.value)), mass: band.mass, size: band.size,
      type: band.type, wobble: random(0, 6.28), hit: false });
  }

  function fillDebris(initial = false) {
    const config = debrisConfig();
    const limit = config.count - (config.encounter ? 1 : 0);
    const missing = limit - junk.filter(object => !object.special && !object.encounter).length;
    const pocket = config.pocket;
    const livePockets = junk.filter(object => object.pocket).length;
    const pocketCount = pocket && !livePockets && missing >= pocket.count ? pocket.count : 0;
    const normalCount = pocket ? Math.max(0, missing - Math.max(0, pocket.count - livePockets)) : missing;
    for (let i = 0; i < normalCount; i++) {
      makeJunk(initial ? i * config.spacing + random(0, 30) : random(140, 320));
    }
    if (pocketCount) {
      const offset = initial ? normalCount * config.spacing + random(0, 30) : random(140, 320);
      const y = random(...pocket.band.y);
      const speed = random(...pocket.band.speed);
      for (let i = 0; i < pocketCount; i++) {
        makeJunk(offset + i * pocket.spacing, pocket.band);
        Object.assign(junk.at(-1), { y: y + random(-pocket.ySpread, pocket.ySpread), speed, pocket: true });
      }
    }
  }

  function planNextStation() {
    nextStation = { x: WIDTH + random(...level.station.returnOffset), y: random(...level.station.returnY) };
  }

  function scheduleEncounter() {
    const encounter = debrisConfig().encounter;
    if (!encounter) return;
    // Reserve a slot without removing a target that the player is reeling in.
    junk = junk.filter(object => !object.encounter || tether?.object === object);
    if (junk.some(object => object.encounter)) return;
    makeJunk(0, encounter.band);
    const object = junk.at(-1);
    object.x = PLAYER_X + object.speed * ((station.x - (PLAYER_X + 90)) / station.speed - encounter.leadSeconds);
    object.encounter = object.valuable = true;
  }

  function refreshCareer() {
    const career = ContractSystem.career;
    document.getElementById('wallet').textContent = `$${career.wallet.toLocaleString()}`;
    document.getElementById('workshop-wallet').textContent = `$${career.wallet.toLocaleString()}`;
    document.getElementById('save-notice').hidden = ContractSystem.persistent;
    for (const contract of ContractSystem.contracts) {
      document.getElementById(`contract-${contract.id}`).textContent = `${career.completed.includes(contract.id) ? 'REPLAY' : 'ACCEPT'} CONTRACT`;
    }
    for (const [id, item] of Object.entries(ContractSystem.upgrades)) {
      const tier = career.upgrades[id];
      const button = document.getElementById(`buy-${id}`);
      const required = ContractSystem.requirements[tier];
      document.getElementById(`tier-${id}`).textContent = `Tier ${tier}/3 · ${item.labels[tier]}`;
      const locked = tier < 3 && career.completed.length < required;
      button.disabled = tier === 3 || locked || career.wallet < item.prices[tier];
      button.textContent = tier === 3 ? 'FULLY UPGRADED' : locked ? `${career.completed.length}/${required} DIFFERENT JOBS COMPLETED` : career.wallet < item.prices[tier] ? `NEED $${item.prices[tier] - career.wallet} MORE` : `BUY TIER ${tier + 1} · $${item.prices[tier]}`;
      document.getElementById(`next-${id}`).textContent = tier === 3 ? 'Maximum tier reached.' : `Next: ${item.labels[tier + 1]} · $${item.prices[tier].toLocaleString()}`;
    }
  }

  function refreshCampaign() {
    LevelSystem.campaign.forEach(config => {
      const button = document.getElementById(`level-${config.id}`);
      button.disabled = config.id > 1 && !progress.best[config.id - 1];
      button.textContent = `${config.id}. ${config.name} • ${progress.best[config.id] ? '★'.repeat(progress.best[config.id]) : button.disabled ? 'LOCKED' : 'NEW'}`;
      button.setAttribute('aria-pressed', String(config.id === level.id));
    });
    document.getElementById('endless-menu-best').textContent = `$${readEndlessBest()}`;
    refreshCareer();
    const isEndless = level.id === 'endless';
    document.getElementById('start-score-label').textContent = level.contract ? 'CONTRACT BEST' : isEndless ? 'ENDLESS BEST' : 'CAMPAIGN HIGH SCORE';
    document.getElementById('over-score-label').textContent = level.contract ? 'CONTRACT BEST' : isEndless ? 'ENDLESS BEST' : 'CAMPAIGN HIGH SCORE';
    startButton.textContent = isEndless ? '▶ START ENDLESS ORBIT' : '▶ START MISSION';
    setHighScore(getHighScore());
    document.getElementById('level-description').textContent = (isEndless || level.contract) ? level.description : `${level.description} Goal: ${LevelSystem.criterionLabel(level.objective)}. Stars: ${level.stars.map(criterion => LevelSystem.criterionLabel(criterion, level.objective)).join(" / ")}.${level.objective.type === "bank_objects" ? " Higher stars also require all 10 objects banked." : ""}`;
  }

  function showResult(previousBank = bank) {
    releaseControls();
    running = false;
    pendingResult = true;
    thrusting = depositing = false;
    depositProgress = 0;
    cancelAnimationFrame(animationFrame);
    document.getElementById('contract-payout').hidden = !level.contract;
    const isEndless = !level.objective;
    document.getElementById('result-mode').textContent = isEndless ? 'ENDLESS ORBIT' : 'CAMPAIGN';
    document.getElementById('phase-preview').hidden = !isEndless;
    finishButton.textContent = isEndless ? 'FINISH RUN SUCCESSFULLY' : 'FINISH LEVEL';
    replayButton.textContent = isEndless ? 'PLAY ENDLESS AGAIN' : 'REPLAY LEVEL';
    const stars = LevelSystem.rating(level, { bank, bankedObjects });
    resultTitle.textContent = 'OBJECTIVE MET';
    resultStats.textContent = `${level.id}. ${level.name} • $${bank} banked${level.objective?.type === "bank_objects" ? ` • ${bankedObjects} objects banked` : ""} • ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} • Previous best: ${progress.best[level.id] || 0}/3`;
    finishButton.hidden = false;
    continueButton.hidden = stars === 3;
    continueButton.textContent = `KEEP SALVAGING → $${level.stars[stars]?.target || bank}`;
    if (isEndless) {
      queuedPhase = LevelSystem.phaseFor(level, bank);
      const next = LevelSystem.nextMilestone(level, bank);
      const reachedMilestone = bank >= LevelSystem.nextMilestone(level, previousBank);
      resultTitle.textContent = reachedMilestone ? 'MILESTONE REACHED' : 'HAUL SAFELY BANKED';
      resultStats.textContent = `$${bank} banked • Best $${getHighScore()} • Next milestone $${next}`;
      document.getElementById('phase-preview').textContent = `${queuedPhase !== phase ? 'Next phase' : 'Continue in'}: ${queuedPhase.name}. ${queuedPhase.description}`;
      continueButton.hidden = false;
      continueButton.textContent = `KEEP SALVAGING → $${next}`;
    }
    if (level.contract) {
      document.getElementById('result-mode').textContent = `${level.difficulty.toUpperCase()} CONTRACT`;
      resultTitle.textContent = 'CONTRACT FULFILLED';
      resultStats.textContent = `${level.name} • ${LevelSystem.criterionLabel(level.objective)} deposited`;
      document.getElementById('contract-payout').textContent = `Salvage $${bank} + bonus $${contractBonus} = $${bank + contractBonus} earned this run. Wallet $${ContractSystem.career.wallet}.${ContractSystem.persistent ? '' : ' Saving unavailable: session only.'}`;
      finishButton.textContent = 'FINISH CONTRACT';
      continueButton.hidden = false;
      continueButton.textContent = 'KEEP SALVAGING';
      replayButton.textContent = 'REPLAY CONTRACT';
    }
    replayButton.hidden = nextButton.hidden = true;
    document.getElementById('result-endless').hidden = true;
    document.getElementById('result-menu').hidden = true;
    document.getElementById('result-contracts').hidden = true;
    resultScreen.classList.add('overlay--visible');
    resultScreen.setAttribute('aria-hidden', 'false');
  }

  function finishLevel() {
    if (!pendingResult) return;
    pendingResult = false;
    if (level.contract) {
      resultTitle.textContent = 'CONTRACT COMPLETE';
      document.getElementById('result-contracts').hidden = false;
      finishButton.hidden = continueButton.hidden = nextButton.hidden = true;
      replayButton.hidden = false;
      document.getElementById('result-menu').hidden = false;
      refreshCareer();
      return;
    }
    if (!level.objective) {
      resultTitle.textContent = 'RUN COMPLETE';
      resultStats.textContent = `$${bank} safely banked • Best $${getHighScore()} • No haul lost`;
      document.getElementById('phase-preview').hidden = true;
      finishButton.hidden = continueButton.hidden = nextButton.hidden = true;
      replayButton.hidden = false;
      document.getElementById('result-menu').hidden = false;
      status.textContent = `Run complete • $${bank} banked`;
      return;
    }
    const stars = LevelSystem.rating(level, { bank, bankedObjects });
    progress.best[level.id] = Math.max(progress.best[level.id] || 0, stars);
    progress.currentLevel = Math.min(level.id + 1, LevelSystem.campaign.length);
    LevelSystem.saveProgress(progress);
    setHighScore(bank);
    resultTitle.textContent = 'LEVEL COMPLETE';
    finishButton.hidden = continueButton.hidden = true;
    replayButton.hidden = false;
    document.getElementById('result-menu').hidden = false;
    nextButton.hidden = level.id === LevelSystem.campaign.length;
    document.getElementById('result-endless').hidden = !nextButton.hidden;
    status.textContent = nextButton.hidden ? 'Campaign complete. Try Endless Orbit or replay for stars.' : 'Level complete. Next level unlocked.';
    refreshCampaign();
  }

  function resumeLevel() {
    if (!pendingResult) return;
    pendingResult = false;
    if (queuedPhase) { phase = queuedPhase; queuedPhase = null; }
    resultScreen.classList.remove('overlay--visible');
    resultScreen.setAttribute('aria-hidden', 'true');
    running = true;
    lastFrame = performance.now();
    animationFrame = requestAnimationFrame(loop);
  }

  function reset() {
    releaseControls();
    cancelAnimationFrame(animationFrame);
    running = false;
    exitPaused = false;
    exitScreen.classList.remove('overlay--visible');
    exitScreen.setAttribute('aria-hidden', 'true');
    restartButton.disabled = false;
    pendingResult = false;
    specialCollected = false;
    ESCAPE_Y = level.field.escapeY;
    REENTRY_Y = level.field.reentryY;
    resultScreen.classList.remove('overlay--visible');
    resultScreen.setAttribute('aria-hidden', 'true');
    gameOver.classList.remove("overlay--visible");
    gameOver.setAttribute("aria-hidden", "true");
    player = { y: level.player.startY, velocityY: 0, flash: 0 };
    junk = [];
    cargo = [];
    particles = [];
    tether = null;
    haul = 0;
    bank = 0;
    carriedObjects = 0;
    bankedObjects = 0;
    carriedTypes = {};
    bankedTypes = {};
    contractBonus = 0;
    contractCompleted = false;
    runEffects = { reel: ContractSystem.effect('reel'), thrust: ContractSystem.effect('thrust') };
    mass = 0;
    depositProgress = 0;
    integrity = level.player.suitIntegrity;
    depositStartBank = null;
    depositNotice = '';
    depositNoticeTime = 0;
    shake = 0;
    impactText = 0;
    elapsed = 0;
    thrusting = false;
    depositing = false;
    phase = LevelSystem.phaseFor(level, 0);
    queuedPhase = null;
    station = { x: level.station.startX, y: level.station.startY, speed: level.station.speed };
    fillDebris(true);
    scheduleEncounter();
    planNextStation();
    if (level.debris.special) junk.push({ ...level.debris.special, special: true, wobble: 0, hit: false });
    depositButton.disabled = true;
    tetherButton.textContent = "◎ TETHER";
    draw();
  }

  function start() {
    if (exitPaused) return;
    reset();
    startScreen.classList.remove("overlay--visible");
    running = true;
    lastFrame = performance.now();
    root.classList.remove('menu-open');
    status.textContent = level.description;
    if (level.objective && !level.contract) {
      progress.currentLevel = level.id;
      LevelSystem.saveProgress(progress);
    }
    refreshCampaign();
    animationFrame = requestAnimationFrame(loop);
  }

  function end(kind) {
    if (!running) return;
    releaseControls();
    const finalBank = Math.round(bank);
    const lostHaul = Math.round(haul);
    running = false;
    thrusting = false;
    depositing = false;
    tether = null;
    depositButton.disabled = true;
    cancelAnimationFrame(animationFrame);

    let title = "MISSION ENDED";
    let description = "Your run is over.";
    if (kind === "REENTRY") { title = "REENTRY"; description = "You dropped below the recoverable orbit."; }
    if (kind === "ESCAPE") { title = "LOST IN SPACE"; description = "You drifted beyond the recoverable orbit."; }
    if (kind === "SUIT") { title = "SUIT FAILURE"; description = "Your suit integrity reached zero."; }

    setHighScore(finalBank);
    death.textContent = title;
    detail.textContent = description;
    bankDisplay.textContent = String(finalBank);
    lostDisplay.textContent = String(lostHaul);
    summary.textContent = `${finalBank} banked • ${lostHaul} lost`;
    if (level.contract) summary.textContent = `Salvage $${finalBank} + bonus $${contractBonus} retained • $${lostHaul} lost • Wallet $${ContractSystem.career.wallet}`;
    status.textContent = `${title} • ${finalBank} banked • ${lostHaul} lost`;
    gameOver.classList.add("overlay--visible");
    gameOver.setAttribute("aria-hidden", "false");
    draw();
  }

  function isNearStation() {
    return Math.abs(station.x - PLAYER_X) < 90 && Math.abs(station.y - player.y) < 85;
  }

  function stationMessage() {
    if (depositNoticeTime > 0) return depositNotice;
    if (isNearStation()) return depositing && mass > 0 ? `TRANSFERRING SALVAGE… ${Math.min(100, Math.floor(100 * depositProgress / Math.min(0.3, (cargo[0]?.mass || mass) / 18)))}% · KEEP HOLDING` : 'STATION IN RANGE';
    if (station.x >= PLAYER_X + 90) return `STATION PASS IN ${Math.ceil((station.x - PLAYER_X - 90) / station.speed)}s`;
    if (station.x > PLAYER_X - 90) return 'STATION PASS NOW • ALIGN ALTITUDE';
    const seconds = (station.x + 70 + nextStation.x - PLAYER_X - 90) / station.speed;
    return `NEXT STATION PASS IN ${Math.ceil(Math.max(0, seconds))}s`;
  }

  function updateHud() {
    const stars = LevelSystem.rating(level, { bank, bankedObjects });
    document.getElementById('flight-title').textContent = level.contract ? level.name : level.objective ? `${level.id}. ${level.name}` : level.name;
    missionDisplay.textContent = level.objective ? `BANK ${LevelSystem.criterionLabel(level.objective).toUpperCase()}` : `PERSONAL BEST $${sessionBests[scoreKey()] || 0}`;
    const goal = document.getElementById('goal-progress');
    const endlessTarget = level.milestones ? LevelSystem.nextMilestone(level, bank) : null;
    if (endlessTarget) missionDisplay.textContent = `${phase.name} · NEXT $${endlessTarget} · BEST $${sessionBests[scoreKey()] || 0}`;
    goal.hidden = false;
    goal.max = level.objective?.target || endlessTarget || 1;
    goal.value = Math.min(level.objective?.type === 'bank_objects' ? bankedObjects : bank, goal.max);
    const objectProgress = document.getElementById('object-progress');
    objectProgress.hidden = level.objective?.type !== 'bank_objects';
    objectProgress.textContent = `${bankedObjects} / ${level.objective?.target || 0} banked · ${carriedObjects} carried${bankedObjects < (level.objective?.target || 0) && bankedObjects + carriedObjects >= (level.objective?.target || 0) ? ' · Return to bank' : ''}`;
    if (level.contract) {
      const count = level.objective.type === 'bank_type' ? (bankedTypes[level.objective.salvageType] || 0) : level.objective.type === 'bank_objects' ? bankedObjects : bank;
      const carried = level.objective.type === 'bank_type' ? (carriedTypes[level.objective.salvageType] || 0) : level.objective.type === 'bank_objects' ? carriedObjects : haul;
      goal.value = Math.min(count, goal.max);
      objectProgress.hidden = false;
      objectProgress.textContent = `${count}/${goal.max} banked · ${carried} carried · ${contractCompleted ? 'Bonus paid' : `Bonus $${level.bonus}`}${!contractCompleted && count + carried >= goal.max ? ' · Return to bank' : ''}`;
    }
    document.getElementById('star-goals').hidden = !level.objective || level.contract;
    if (level.objective) level.stars.forEach((criterion, index) => {
      const star = document.getElementById(`star-${index + 1}`);
      star.textContent = `${'★'.repeat(index + 1)} ${LevelSystem.criterionLabel(criterion, level.objective)}`;
      star.classList.remove('earned');
      if (stars > index) star.classList.add('earned');
    });
    document.getElementById('hud-bank').textContent = `$${Math.round(bank)}`;
    document.getElementById('hud-haul').textContent = `$${haul}`;
    document.getElementById('hud-mass').textContent = `${Math.round(mass)}kg`;
    document.getElementById('hud-integrity').textContent = `${Math.round(integrity)}%`;
    const suit = document.getElementById('integrity-progress');
    suit.value = integrity;
    suit.style.setProperty('--accent', integrity > 60 ? '#a7f3b5' : integrity > 30 ? '#f1c76b' : '#ff7167');
    document.getElementById('station-status').textContent = depositNoticeTime > 0 ? depositNotice : running ? stationMessage() : '';
    depositButton.disabled = !running || !isNearStation() || mass <= 0;
    thrustButton.disabled = tetherButton.disabled = !running;
  }

  function fireTether() {
    if (!running) return;
    if (tether) {
      tether = null;
      tetherButton.textContent = "◎ TETHER";
      return;
    }

    let target = null;
    let closestDistance = 82;
    junk.forEach((object) => {
      const objectY = object.y + Math.sin(object.wobble) * 4;
      const distance = Math.hypot(object.x - PLAYER_X, objectY - player.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        target = object;
      }
    });

    if (!target) {
      status.textContent = "Nothing in tether range.";
      return;
    }

    tether = {
      object: target,
      startX: target.x,
      startY: target.y,
      progress: 0,
      duration: (0.55 + target.mass * 0.025) * runEffects.reel,
      currentX: target.x,
      currentY: target.y
    };
    tetherButton.textContent = "✕ RELEASE";
  }

  function collect(object) {
    const index = junk.indexOf(object);
    if (index >= 0) junk.splice(index, 1);
    haul += object.value;
    carriedObjects += 1;
    carriedTypes[object.type] = (carriedTypes[object.type] || 0) + 1;
    mass += object.mass;
    cargo.push({ value: object.value, mass: object.mass, type: object.type, angle: random(0, 6.28), radius: 16 + Math.min(cargo.length * 2, 22), size: Math.max(3, object.size * 0.4) });
    for (let count = 0; count < 10; count += 1) {
      particles.push({ x: PLAYER_X, y: player.y, velocityX: random(-50, 50), velocityY: random(-50, 50), life: random(0.2, 0.6) });
    }
    tether = null;
    tetherButton.textContent = "◎ TETHER";
    if (object.special) specialCollected = true;
    else if (debrisConfig().pocket || debrisConfig().encounter || level.phases) fillDebris();
    else makeJunk(random(150, 320));
    status.textContent = `+${object.value} • ${orbitZone(player.y)} ORBIT • ${mass}kg`;
  }

  function collide(object) {
    if (object.hit) return;
    object.hit = true;
    const relativeSpeed = Math.max(1, object.speed / 40);
    const damage = Math.round((object.type === "SAT" ? 18 : object.type === "PANEL" ? 11 : 7) * relativeSpeed * 0.55);
    integrity = clamp(integrity - damage, 0, 100);
    player.velocityY += (object.y - player.y) * 0.18 + random(-20, 20);
    player.flash = 0.25;
    shake = 0.3;
    impactText = 0.6;
    status.textContent = `IMPACT! -${damage} integrity`;
    for (let count = 0; count < 20; count += 1) {
      particles.push({ x: PLAYER_X, y: player.y, velocityX: random(-110, 110), velocityY: random(-110, 110), life: random(0.2, 0.55) });
    }
    if (integrity <= 0) end("SUIT");
  }

  function update(deltaTime) {
    if (!running) return;
    elapsed += deltaTime;
    depositNoticeTime = Math.max(0, depositNoticeTime - deltaTime);
    const massRatio = Math.min(mass / 100, 1);
    const gravity = 26 + massRatio * 5;
    const thrustPower = 72 * runEffects.thrust * thrustEffectiveness(mass);
    const damping = 0.968 + massRatio * 0.014;

    player.velocityY += gravity * deltaTime;
    if (thrusting) player.velocityY -= thrustPower * deltaTime;
    player.velocityY *= Math.pow(damping, deltaTime * 30);
    player.y += player.velocityY * deltaTime;
    player.flash = Math.max(0, player.flash - deltaTime);
    shake = Math.max(0, shake - deltaTime);
    impactText = Math.max(0, impactText - deltaTime);

    junk.forEach((object) => {
      if (tether && tether.object === object) return;
      object.x -= object.speed * deltaTime;
      object.wobble += deltaTime * 1.5;
      const objectY = object.y + Math.sin(object.wobble) * 4;
      if (Math.abs(object.x - PLAYER_X) < 12 + object.size && Math.abs(objectY - player.y) < 16 + object.size) collide(object);
    });
    if (!running) return;
    if (player.y < ESCAPE_Y) { end("ESCAPE"); return; }
    if (player.y > REENTRY_Y) { end("REENTRY"); return; }
    junk.forEach(object => {
      if (object.special && object.x <= -40 && !specialCollected) { object.x = WIDTH + 300; object.hit = false; }
    });
    junk = junk.filter((object) => object.x > -40 || (tether && tether.object === object));
    fillDebris();

    station.x -= station.speed * deltaTime;
    if (station.x < -70) {
      station.x = nextStation.x;
      station.y = nextStation.y;
      planNextStation();
      scheduleEncounter();
    }
    depositButton.disabled = !isNearStation() || mass <= 0;

    if (tether) {
      const object = tether.object;
      if (!junk.includes(object)) {
        tether = null;
        tetherButton.textContent = "◎ TETHER";
      } else {
        tether.progress += deltaTime / tether.duration;
        const amount = clamp(tether.progress, 0, 1);
        const easedAmount = easeOutCubic(amount);
        tether.currentX = tether.startX + (PLAYER_X - tether.startX) * easedAmount;
        tether.currentY = tether.startY + (player.y - tether.startY) * easedAmount;
        object.x = tether.currentX;
        object.y = tether.currentY;
        if (amount >= 1) collect(object);
      }
    }

    if (depositing && isNearStation() && mass > 0) {
      depositProgress += deltaTime;
      while (cargo.length && depositProgress >= Math.min(0.3, cargo[0].mass / 18)) {
        const previousBank = bank;
        if (depositStartBank === null) depositStartBank = bank;
        const item = cargo.shift();
        depositProgress -= Math.min(0.3, item.mass / 18);
        bank += item.value;
        haul -= item.value;
        mass = Math.max(0, mass - item.mass);
        carriedObjects -= 1;
        carriedTypes[item.type] -= 1;
        bankedObjects += 1;
        bankedTypes[item.type] = (bankedTypes[item.type] || 0) + 1;
        if (level.contract) {
          const completedNow = !contractCompleted && LevelSystem.meets(level.objective, { bank, bankedObjects, bankedTypes });
          contractBonus = completedNow ? level.bonus : contractBonus;
          ContractSystem.credit(item.value + (completedNow ? level.bonus : 0));
          if (completedNow) { contractCompleted = true; ContractSystem.complete(level.id); }
        }
        depositNotice = `BANKED +$${bank - previousBank} · TOTAL $${bank}`;
        depositNoticeTime = 3;
        setHighScore(bank);
        if (!cargo.length) {
          carriedTypes = {};
          carriedObjects = haul = mass = depositProgress = 0;
          integrity = clamp(integrity + 12, 0, 100);
          depositing = false;
          if (!level.objective || LevelSystem.meets(level.objective, { bank, bankedObjects, bankedTypes })) showResult(depositStartBank);
          depositStartBank = null;
        }
        status.textContent = `${depositNotice} • integrity ${Math.round(integrity)}%`;
        updateHud();
      }
    } else {
      depositProgress = 0;
    }

    particles.forEach((particle) => {
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      particle.life -= deltaTime;
    });
    particles = particles.filter((particle) => particle.life > 0);

    if (running && player.y < ESCAPE_Y) end("ESCAPE");
    else if (running && player.y > REENTRY_Y) end("REENTRY");
  }

  function drawEarth() {
    if (GameArt.backdrop(context)) return;
    context.beginPath();
    context.arc(180, HEIGHT + 48, 180, Math.PI, Math.PI * 2);
    context.lineTo(WIDTH, HEIGHT);
    context.lineTo(0, HEIGHT);
    context.closePath();
    context.fillStyle = "#195985";
    context.fill();
    context.strokeStyle = "#8bcbe7";
    context.lineWidth = 6;
    context.beginPath();
    context.arc(180, HEIGHT + 48, 177, Math.PI, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#397557";
    context.beginPath(); context.ellipse(120, 443, 58, 16, 0.1, 0, 6.28); context.fill();
    context.beginPath(); context.ellipse(250, 465, 65, 17, -0.1, 0, 6.28); context.fill();
  }

  function drawJunk(object) {
    const objectY = tether && tether.object === object ? object.y : object.y + Math.sin(object.wobble) * 4;
    context.save();
    context.translate(object.x, objectY);
    const dimensions = object.type === 'SCRAP' ? [14, 14] : object.type === 'PANEL' ? [28, 14] : [50, 28];
    if (GameArt.sprite(context, object.type, 0, 0, ...dimensions)) {
      // The configured collision size remains unchanged.
    } else if (object.type === "SCRAP") {
      context.fillStyle = "#c7cbce"; context.fillRect(-5, -3, 10, 6); context.fillRect(-2, -6, 4, 12);
    } else if (object.type === "PANEL") {
      context.fillStyle = "#52799f"; context.fillRect(-13, -6, 26, 12); context.strokeStyle = "#ccd5dc"; context.strokeRect(-13, -6, 26, 12);
    } else {
      context.fillStyle = "#d0d4d7"; context.fillRect(-7, -8, 14, 16); context.fillStyle = "#52799f"; context.fillRect(-25, -5, 18, 10); context.fillRect(7, -5, 18, 10);
    }
    if (object.special || object.valuable) {
      context.strokeStyle = '#f1c76b'; context.strokeRect(-29, -14, 58, 28);
      context.fillStyle = '#f1c76b'; context.font = 'bold 10px monospace'; context.textAlign = 'center';
      context.fillText(`$${object.value}`, 0, -20);
    }
    context.restore();
  }

  function drawStation() {
    context.save();
    context.translate(station.x, station.y);
    if (!GameArt.sprite(context, 'station', 0, 0, 92, 48)) {
    context.fillStyle = "#929da5"; context.fillRect(-22, -12, 44, 24);
    context.fillStyle = "#52799f"; context.fillRect(-46, -7, 24, 14); context.fillRect(22, -7, 24, 14);
    }
    context.strokeStyle = isNearStation() ? "#a7f3b5" : "#d7dde2";
    context.lineWidth = 2; context.beginPath(); context.arc(0, 0, 32, 0, 6.28); context.stroke();
    context.fillStyle = "#fff"; context.font = "bold 8px monospace"; context.textAlign = "center"; context.fillText("CLEANUP", 0, 38);
    context.restore();
    context.textAlign = "left";
  }

  function drawPlayer() {
    context.save();
    context.translate(PLAYER_X, player.y);
    if (thrusting && running) {
      const flame = 12 + Math.random() * 8;
      context.fillStyle = "#f5a947"; context.fillRect(-4, 13, 8, flame);
      context.fillStyle = "#fff0a1"; context.fillRect(-2, 13, 4, flame * 0.55);
    }
    cargo.forEach((item, index) => {
      const angle = item.angle + index * 0.8;
      context.fillStyle = "#9da7ad";
      context.fillRect(Math.cos(angle) * item.radius - item.size / 2, Math.sin(angle) * item.radius - item.size / 2, item.size, item.size);
    });
    if (!GameArt.sprite(context, 'astronaut', 0, 3, 26, 34) || player.flash > 0) {
    context.fillStyle = player.flash > 0 ? "#ff6f61" : "#eef1f3";
    context.fillRect(-8, -10, 16, 22); context.fillRect(-13, -3, 5, 10); context.fillRect(8, -3, 5, 10);
    context.fillRect(-7, 12, 5, 8); context.fillRect(2, 12, 5, 8);
    context.fillStyle = "#6c94a8"; context.fillRect(-6, -8, 12, 7);
    context.fillStyle = "#202c38"; context.fillRect(-4, -6, 8, 4);
    }
    context.restore();
  }

  function drawWarnings() {
    const top = clamp((135 - player.y) / 60, 0, 1);
    const bottom = clamp((player.y - 300) / 60, 0, 1);
    const pulse = 0.55 + 0.25 * Math.sin(elapsed * 7);
    if (top > 0) {
      const gradient = context.createLinearGradient(0, 0, 0, 150);
      gradient.addColorStop(0, `rgba(90,90,255,${top * 0.5})`); gradient.addColorStop(1, "rgba(90,90,255,0)");
      context.fillStyle = gradient; context.fillRect(0, 0, WIDTH, 160);
      context.strokeStyle = `rgba(140,140,255,${top * pulse})`; context.lineWidth = 3;
      context.beginPath(); context.moveTo(0, ESCAPE_Y); context.lineTo(WIDTH, ESCAPE_Y); context.stroke();
      if (player.y < 115) {
        context.fillStyle = `rgba(180,180,255,${pulse})`; context.font = "bold 14px monospace"; context.textAlign = "center";
        context.fillText("⚠ ESCAPE RISK", 180, 100); context.textAlign = "left";
      }
    }
    if (bottom > 0) {
      const gradient = context.createLinearGradient(0, 270, 0, HEIGHT);
      gradient.addColorStop(0, "rgba(255,80,50,0)"); gradient.addColorStop(1, `rgba(255,65,35,${bottom * 0.42})`);
      context.fillStyle = gradient; context.fillRect(0, 270, WIDTH, HEIGHT - 270);
      context.strokeStyle = `rgba(255,95,65,${bottom * pulse})`; context.lineWidth = 3;
      context.beginPath(); context.moveTo(0, REENTRY_Y); context.lineTo(WIDTH, REENTRY_Y); context.stroke();
      if (player.y > 325) {
        context.fillStyle = `rgba(255,135,95,${pulse})`; context.font = "bold 14px monospace"; context.textAlign = "center";
        context.fillText("⚠ REENTRY RISK", 180, 340); context.textAlign = "left";
      }
    }
  }

  function draw() {
    updateHud();
    context.save();
    // Crop only unused space above/below the orbit; world physics stay 360 × 520.
    context.translate(0, -60);
    if (shake > 0) context.translate(random(-4, 4), random(-4, 4));
    context.clearRect(-10, -10, WIDTH + 20, HEIGHT + 20);
    context.fillStyle = "#02050a"; context.fillRect(-10, -10, WIDTH + 20, HEIGHT + 20);
    for (let index = 0; index < 55; index += 1) {
      context.globalAlpha = 0.35 + (index % 5) * 0.1;
      context.fillStyle = "#fff"; context.fillRect((index * 67) % WIDTH, (index * 41) % 350, 1, 1);
    }
    context.globalAlpha = 1;
    junk.forEach(drawJunk);
    drawStation();
    drawEarth();
    drawWarnings();
    if (tether) {
      context.beginPath(); context.moveTo(PLAYER_X, player.y); context.lineTo(tether.currentX, tether.currentY);
      context.strokeStyle = "#fff"; context.lineWidth = 2; context.stroke();
    }
    if (isNearStation() && mass > 0) {
      context.strokeStyle = "rgba(170,255,190,.65)"; context.beginPath(); context.arc(PLAYER_X, player.y, 40, 0, 6.28); context.stroke();
    }
    drawPlayer();
    particles.forEach((particle) => {
      context.globalAlpha = clamp(particle.life * 3, 0, 1); context.fillStyle = "#fff"; context.fillRect(particle.x, particle.y, 3, 3);
    });
    context.globalAlpha = 1;
    context.restore();

    if (impactText > 0) {
      context.fillStyle = `rgba(255,70,60,${clamp(impactText * 1.4, 0, 1)})`; context.textAlign = "center"; context.font = "bold 20px monospace";
      context.fillText("IMPACT!", 180, 110); context.textAlign = "left";
    }
  }

  function loop(now) {
    if (!running) return;
    const deltaTime = Math.min((now - lastFrame) / 1000, 0.034);
    lastFrame = now;
    update(deltaTime);
    draw();
    if (running) animationFrame = requestAnimationFrame(loop);
  }

  function preventDefault(event) { event.preventDefault(); }
  ["contextmenu", "selectstart", "dragstart", "touchmove"].forEach((eventName) => {
    root.addEventListener(eventName, event => {
      if (eventName === 'touchmove' && event.target.closest('.panel')) return;
      preventDefault(event);
    }, { passive: false });
  });

  const releaseThrust = GameInput.hold(thrustButton, () => running,
    () => { thrusting = true; }, () => { thrusting = false; });
  const releaseDeposit = GameInput.hold(depositButton, () => running,
    () => { depositing = true; }, () => { depositing = false; depositProgress = 0; });
  function releaseControls() { releaseThrust(); releaseDeposit(); }
  GameInput.protect(document.getElementById('flight-controls'));
  GameInput.protect(canvas);

  tetherButton.addEventListener("pointerdown", (event) => { event.preventDefault(); fireTether(); });
  restartButton.addEventListener('click', () => {
    if (!exitPaused) return;
    exitAction = 'restart';
    document.getElementById('exit-title').textContent = 'Restart this run?';
    document.getElementById('leave-run').textContent = 'CONFIRM RESTART';
    restartButton.hidden = true;
  });
  startButton.addEventListener("pointerdown", (event) => { event.preventDefault(); start(); });
  playAgainButton.addEventListener("pointerdown", (event) => { event.preventDefault(); start(); });

  document.addEventListener("visibilitychange", () => {
    if (!running || !document.hidden) {
      lastFrame = performance.now();
      return;
    }
    thrusting = false;
    depositing = false;
    depositProgress = 0;
  });

  function careerPage(id) {
    root.classList.add('picker-open');
    for (const page of ['mode-menu', 'campaign-picker', 'contracts-picker', 'upgrades-picker']) document.getElementById(page).hidden = page !== id;
    refreshCareer();
    document.getElementById(id).scrollIntoView?.({ block: 'start' });
  }
  document.getElementById('contract-list').innerHTML = ContractSystem.contracts.map(c => `<article class="career-card"><div class="kicker">${c.difficulty} · ${c.objective.type === 'bank_type' ? 'TARGETED RECOVERY' : c.objective.type === 'bank_value' ? 'VALUE TARGET' : 'COLLECTION'}</div><h3>${c.name}</h3><p>Bank ${LevelSystem.criterionLabel(c.objective)}</p><p class="reward">Salvage value + $${c.bonus} bonus</p><button id="contract-${c.id}" type="button" class="button button--cta">ACCEPT CONTRACT</button></article>`).join('');
  document.getElementById('upgrade-list').innerHTML = Object.entries(ContractSystem.upgrades).map(([id, item]) => `<article class="career-card"><h3>${item.name}</h3><p id="tier-${id}" class="reward"></p><p>${item.description}</p><p id="next-${id}"></p><button id="buy-${id}" type="button" class="button button--cta"></button></article>`).join('');
  for (const contract of ContractSystem.contracts) document.getElementById(`contract-${contract.id}`).addEventListener('click', () => { level = contract; start(); });
  for (const [id, item] of Object.entries(ContractSystem.upgrades)) document.getElementById(`buy-${id}`).addEventListener('click', () => {
    if (running || pendingResult || exitPaused) return;
    document.getElementById('purchase-status').textContent = ContractSystem.purchase(id) ? `${item.name} upgraded. Ready for your next contract.` : 'Purchase unavailable.';
    refreshCareer();
  });
  document.getElementById('choose-contracts').addEventListener('click', () => careerPage('contracts-picker'));
  document.getElementById('choose-upgrades').addEventListener('click', () => careerPage('upgrades-picker'));
  document.getElementById('back-contracts').addEventListener('click', openCampaign);
  document.getElementById('back-upgrades').addEventListener('click', openCampaign);
  document.getElementById('choose-campaign').addEventListener('click', () => {
    if (!level.objective || level.contract) level = LevelSystem.campaign.find(config => config.id === progress.currentLevel);
    root.classList.add('picker-open');
    document.getElementById('mode-menu').hidden = true;
    document.getElementById('campaign-picker').hidden = false;
    document.getElementById('contracts-picker').hidden = true;
    document.getElementById('upgrades-picker').hidden = true;
    refreshCampaign();
  });
  document.getElementById('back-modes').addEventListener('click', openCampaign);
  document.getElementById('over-menu').addEventListener('click', openCampaign);
  document.getElementById('result-menu').addEventListener('click', openCampaign);
  document.getElementById('result-contracts').addEventListener('click', () => {
    openCampaign();
    careerPage('contracts-picker');
    document.getElementById('back-contracts').focus();
  });
  document.getElementById('endless').addEventListener('click', () => {
    level = LevelSystem.endless;
    start();
  });
  document.getElementById('result-endless').addEventListener('click', () => {
    level = LevelSystem.endless;
    start();
  });
  finishButton.addEventListener('click', finishLevel);
  continueButton.addEventListener('click', resumeLevel);
  replayButton.addEventListener('click', start);
  nextButton.addEventListener('click', () => {
    if (level.id < LevelSystem.campaign.length && progress.best[level.id]) { level = LevelSystem.campaign[level.id]; start(); }
  });
  function openCampaign() {
    reset();
    startScreen.classList.add('overlay--visible');
    root.classList.add('menu-open');
    root.classList.remove('picker-open');
    document.getElementById('mode-menu').hidden = false;
    document.getElementById('campaign-picker').hidden = true;
    document.getElementById('contracts-picker').hidden = true;
    document.getElementById('upgrades-picker').hidden = true;
    refreshCampaign();
  }
  document.getElementById('campaign').addEventListener('click', () => {
    if (exitPaused) return;
    if (!running && !pendingResult) { openCampaign(); return; }
    exitAction = 'leave';
    document.getElementById('exit-title').textContent = 'Run paused';
    document.getElementById('leave-run').textContent = 'LEAVE TO MENU';
    restartButton.hidden = false;
    releaseControls();
    resumeAfterExit = running;
    exitPaused = true;
    running = false;
    thrusting = depositing = false;
    depositProgress = 0;
    cancelAnimationFrame(animationFrame);
    restartButton.disabled = false;
    exitScreen.classList.add('overlay--visible');
    exitScreen.setAttribute('aria-hidden', 'false');
    draw();
    document.getElementById('keep-playing').focus();
  });
  document.getElementById('keep-playing').addEventListener('click', () => {
    if (!exitPaused) return;
    exitPaused = false;
    exitScreen.classList.remove('overlay--visible');
    exitScreen.setAttribute('aria-hidden', 'true');
    restartButton.disabled = false;
    running = resumeAfterExit;
    lastFrame = performance.now();
    if (running) animationFrame = requestAnimationFrame(loop);
    document.getElementById('campaign').focus();
  });
  document.getElementById('leave-run').addEventListener('click', () => {
    if (!exitPaused) return;
    if (exitAction === 'restart') { exitPaused = false; start(); }
    else openCampaign();
  });
  LevelSystem.campaign.forEach(config => {
    document.getElementById(`level-${config.id}`).addEventListener('click', () => {
      if (config.id > 1 && !progress.best[config.id - 1]) return;
      level = config;
      progress.currentLevel = level.id;
      LevelSystem.saveProgress(progress);
      refreshCampaign();
      draw();
    });
  });
  refreshCampaign();
  setHighScore(getHighScore());
  reset();

  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" }).then(registration => registration.update()).catch(() => {}));
  }
})();
