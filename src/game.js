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
  let mass = 0;
  let integrity = 100;
  let lastFrame = 0;
  let animationFrame = 0;
  let depositProgress = 0;
  let shake = 0;
  let impactText = 0;
  let elapsed = 0;

  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
  const orbitZone = (y) => y < 170 ? "HIGH" : y < 270 ? "MID" : "LOW";
  const thrustEffectiveness = (cargoMass) => Math.max(0.75, 1 - Math.min(cargoMass / 100, 1) * 0.25);

  function getHighScore() {
    try {
      const value = Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch (_) {
      return 0;
    }
  }

  function setHighScore(score) {
    const highScore = Math.max(getHighScore(), score);
    try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (_) {}
    startHighScore.textContent = String(highScore);
    gameOverHighScore.textContent = String(highScore);
  }

  function makeJunk(offset = 0) {
    const bands = level.debris.bands;
    let roll = Math.random() * bands.reduce((sum, band) => sum + band.weight, 0);
    const band = bands.find(band => (roll -= band.weight) < 0) || bands[bands.length - 1];
    junk.push({ x: WIDTH + offset, y: random(...band.y), speed: random(...band.speed),
      value: Math.round(random(...band.value)), mass: band.mass, size: band.size,
      type: band.type, wobble: random(0, 6.28), hit: false });
  }

  function refreshCampaign() {
    LevelSystem.campaign.forEach(config => {
      const button = document.getElementById(`level-${config.id}`);
      button.disabled = config.id > 1 && !progress.best[config.id - 1];
      button.textContent = `${config.id}. ${config.name} • ${progress.best[config.id] ? '★'.repeat(progress.best[config.id]) : button.disabled ? 'LOCKED' : 'NEW'}`;
      button.setAttribute('aria-pressed', String(config.id === level.id));
    });
    document.getElementById('level-description').textContent = `${level.description} Goal: $${level.objective.target}. Stars: $${level.objective.target} / $${level.stars[1].target} / $${level.stars[2].target}.`;
  }

  function showResult() {
    running = false;
    pendingResult = true;
    thrusting = depositing = false;
    depositProgress = 0;
    cancelAnimationFrame(animationFrame);
    const stars = LevelSystem.rating(level, { bank });
    resultTitle.textContent = 'OBJECTIVE MET';
    resultStats.textContent = `${level.id}. ${level.name} • $${bank} banked • ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} • Previous best: ${progress.best[level.id] || 0}/3`;
    finishButton.hidden = false;
    continueButton.hidden = stars === 3;
    continueButton.textContent = `KEEP SALVAGING → $${level.stars[stars]?.target || bank}`;
    replayButton.hidden = nextButton.hidden = true;
    resultScreen.classList.add('overlay--visible');
    resultScreen.setAttribute('aria-hidden', 'false');
  }

  function finishLevel() {
    if (!pendingResult) return;
    pendingResult = false;
    const stars = LevelSystem.rating(level, { bank });
    progress.best[level.id] = Math.max(progress.best[level.id] || 0, stars);
    progress.currentLevel = Math.min(level.id + 1, LevelSystem.campaign.length);
    LevelSystem.saveProgress(progress);
    setHighScore(bank);
    resultTitle.textContent = 'LEVEL COMPLETE';
    finishButton.hidden = continueButton.hidden = true;
    replayButton.hidden = false;
    nextButton.hidden = level.id === LevelSystem.campaign.length;
    status.textContent = nextButton.hidden ? 'Campaign prototype complete. Replay for more stars.' : 'Level complete. Next level unlocked.';
    refreshCampaign();
  }

  function resumeLevel() {
    if (!pendingResult) return;
    pendingResult = false;
    resultScreen.classList.remove('overlay--visible');
    resultScreen.setAttribute('aria-hidden', 'true');
    running = true;
    lastFrame = performance.now();
    animationFrame = requestAnimationFrame(loop);
  }

  function reset() {
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
    mass = 0;
    depositProgress = 0;
    integrity = level.player.suitIntegrity;
    shake = 0;
    impactText = 0;
    elapsed = 0;
    thrusting = false;
    depositing = false;
    station = { x: level.station.startX, y: level.station.startY, speed: level.station.speed };
    for (let index = 0; index < level.debris.count; index += 1) makeJunk(index * level.debris.spacing + random(0, 30));
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
    restartButton.textContent = "RESTART";
    status.textContent = level.description;
    progress.currentLevel = level.id;
    LevelSystem.saveProgress(progress);
    animationFrame = requestAnimationFrame(loop);
  }

  function end(kind) {
    if (!running) return;
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
    status.textContent = `${title} • ${finalBank} banked • ${lostHaul} lost`;
    gameOver.classList.add("overlay--visible");
    gameOver.setAttribute("aria-hidden", "false");
    draw();
  }

  function isNearStation() {
    return Math.abs(station.x - PLAYER_X) < 90 && Math.abs(station.y - player.y) < 85;
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
      duration: 0.55 + target.mass * 0.025,
      currentX: target.x,
      currentY: target.y
    };
    tetherButton.textContent = "✕ RELEASE";
  }

  function collect(object) {
    const index = junk.indexOf(object);
    if (index >= 0) junk.splice(index, 1);
    haul += object.value;
    mass += object.mass;
    cargo.push({ angle: random(0, 6.28), radius: 16 + Math.min(cargo.length * 2, 22), size: Math.max(3, object.size * 0.4) });
    for (let count = 0; count < 10; count += 1) {
      particles.push({ x: PLAYER_X, y: player.y, velocityX: random(-50, 50), velocityY: random(-50, 50), life: random(0.2, 0.6) });
    }
    tether = null;
    tetherButton.textContent = "◎ TETHER";
    if (object.special) specialCollected = true;
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
    const massRatio = Math.min(mass / 100, 1);
    const gravity = 26 + massRatio * 5;
    const thrustPower = 72 * thrustEffectiveness(mass);
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
    while (junk.filter(object => !object.special).length < level.debris.count) makeJunk(random(140, 320));

    station.x -= station.speed * deltaTime;
    if (station.x < -70) {
      station.x = WIDTH + random(...level.station.returnOffset);
      station.y = random(...level.station.returnY);
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
      const transfer = Math.min(mass, deltaTime * 18);
      mass -= transfer;
      if (cargo.length && Math.random() < deltaTime * 18) cargo.pop();
      if (depositProgress >= 1.25 || mass <= 0.2) {
        bank += haul;
        haul = 0;
        mass = 0;
        cargo = [];
        integrity = clamp(integrity + 12, 0, 100);
        depositProgress = 0;
        depositing = false;
        status.textContent = `TRANSFER COMPLETE • integrity ${Math.round(integrity)}%`;
        setHighScore(bank);
        if (LevelSystem.meets(level.objective, { bank })) showResult();
      }
    } else if (!depositing) {
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
    if (object.type === "SCRAP") {
      context.fillStyle = "#c7cbce"; context.fillRect(-5, -3, 10, 6); context.fillRect(-2, -6, 4, 12);
    } else if (object.type === "PANEL") {
      context.fillStyle = "#52799f"; context.fillRect(-13, -6, 26, 12); context.strokeStyle = "#ccd5dc"; context.strokeRect(-13, -6, 26, 12);
    } else {
      context.fillStyle = "#d0d4d7"; context.fillRect(-7, -8, 14, 16); context.fillStyle = "#52799f"; context.fillRect(-25, -5, 18, 10); context.fillRect(7, -5, 18, 10);
    }
    if (object.special) {
      context.strokeStyle = '#f1c76b'; context.strokeRect(-29, -14, 58, 28);
      context.fillStyle = '#f1c76b'; context.font = 'bold 10px monospace'; context.textAlign = 'center';
      context.fillText(`$${object.value}`, 0, -20);
    }
    context.restore();
  }

  function drawStation() {
    context.save();
    context.translate(station.x, station.y);
    context.fillStyle = "#929da5"; context.fillRect(-22, -12, 44, 24);
    context.fillStyle = "#52799f"; context.fillRect(-46, -7, 24, 14); context.fillRect(22, -7, 24, 14);
    context.strokeStyle = isNearStation() ? "#a7f3b5" : "#d7dde2";
    context.lineWidth = 2; context.beginPath(); context.arc(0, 0, 32, 0, 6.28); context.stroke();
    context.fillStyle = "#fff"; context.font = "bold 8px monospace"; context.textAlign = "center"; context.fillText("CLEANUP", 0, 3);
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
    context.fillStyle = player.flash > 0 ? "#ff6f61" : "#eef1f3";
    context.fillRect(-8, -10, 16, 22); context.fillRect(-13, -3, 5, 10); context.fillRect(8, -3, 5, 10);
    context.fillRect(-7, 12, 5, 8); context.fillRect(2, 12, 5, 8);
    context.fillStyle = "#6c94a8"; context.fillRect(-6, -8, 12, 7);
    context.fillStyle = "#202c38"; context.fillRect(-4, -6, 8, 4);
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
    const stars = LevelSystem.rating(level, { bank });
    missionDisplay.textContent = `${level.id}. ${level.name} • Bank $${bank} / $${level.objective.target} • ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
    context.save();
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

    context.fillStyle = "rgba(0,0,0,.72)"; context.fillRect(7, 7, 346, 72);
    context.fillStyle = "#fff"; context.font = "bold 12px monospace";
    context.fillText(`BANK ${Math.round(bank)}`, 14, 24); context.fillText(`HAUL ${haul}`, 126, 24); context.fillText(`MASS ${Math.round(mass)}kg`, 244, 24);
    const effectiveness = Math.round(thrustEffectiveness(mass) * 100);
    context.fillStyle = "#adb8c2"; context.font = "10px monospace";
    context.fillText(`${orbitZone(player.y)} ORBIT • THRUST ${effectiveness}%`, 14, 42); context.fillText("INTEGRITY", 14, 59);
    context.fillStyle = "#333"; context.fillRect(78, 51, 120, 9);
    context.fillStyle = integrity > 60 ? "#8ee59b" : integrity > 30 ? "#f1c76b" : "#ff7167"; context.fillRect(78, 51, 120 * (integrity / 100), 9);
    context.fillStyle = "#fff"; context.fillText(`${Math.round(integrity)}%`, 205, 59);
    if (depositing && isNearStation()) {
      context.fillStyle = "#a7f3b5"; context.fillText("TRANSFER", 248, 59);
      context.fillStyle = "#36454f"; context.fillRect(248, 64, 94, 7);
      context.fillStyle = "#a7f3b5"; context.fillRect(248, 64, 94 * clamp(depositProgress / 1.25, 0, 1), 7);
    } else {
      context.fillStyle = "#adb8c2"; context.fillText(isNearStation() ? "STATION IN RANGE" : "STATION APPROACHING", 225, 59);
    }
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

  function addHoldControl(button, onPress, onRelease) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      try { button.setPointerCapture(event.pointerId); } catch (_) {}
      onPress();
    });
    const stop = (event) => {
      event.preventDefault();
      onRelease();
      try { if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId); } catch (_) {}
    };
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
  }

  addHoldControl(thrustButton, () => { if (running) thrusting = true; }, () => { thrusting = false; });
  addHoldControl(depositButton, () => { if (running && !depositButton.disabled) depositing = true; }, () => { depositing = false; depositProgress = 0; });
  tetherButton.addEventListener("pointerdown", (event) => { event.preventDefault(); fireTether(); });
  restartButton.addEventListener("pointerdown", (event) => { event.preventDefault(); start(); });
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

  finishButton.addEventListener('click', finishLevel);
  continueButton.addEventListener('click', resumeLevel);
  replayButton.addEventListener('click', start);
  nextButton.addEventListener('click', () => {
    if (level.id < LevelSystem.campaign.length && progress.best[level.id]) { level = LevelSystem.campaign[level.id]; start(); }
  });
  function openCampaign() {
    reset();
    startScreen.classList.add('overlay--visible');
    refreshCampaign();
  }
  document.getElementById('campaign').addEventListener('click', () => {
    if (exitPaused) return;
    if (!running && !pendingResult) { openCampaign(); return; }
    resumeAfterExit = running;
    exitPaused = true;
    running = false;
    thrusting = depositing = false;
    depositProgress = 0;
    cancelAnimationFrame(animationFrame);
    restartButton.disabled = true;
    exitScreen.classList.add('overlay--visible');
    exitScreen.setAttribute('aria-hidden', 'false');
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
    if (exitPaused) openCampaign();
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
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  }
})();
