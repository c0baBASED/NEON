const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth > 1024 ? 1024 : window.innerWidth;
    canvas.height = window.innerHeight > 768 ? 768 : window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const STATES = { MENU: 0, PLAYING: 1, GAMEOVER: 2, VICTORY: 3, EASTER_EGG: 4 };
let gameState = STATES.MENU;
let previousState = STATES.MENU; // Guarda o estado anterior para poder voltar

const keys = {};
const mouse = { x: 0, y: 0, clicked: false };

let secretCode = "neon";
let inputBuffer = "";

const WEAPONS = {
    1: { name: "Rifle", cooldown: 100, type: "spread", projectiles: 1, spread: 0, dmgMult: 1000000, speed: 100 },
    2: { name: "Escopeta", cooldown: 50, type: "spread", projectiles: 12, spread: 0.5, dmgMult: 1000, speed: 12 },
    3: { name: "MiniGun", cooldown: 3, type: "spread", projectiles: 1, spread: 0, dmgMult: 100, speed: 30 }
};
let currentWeapon = WEAPONS[1];
let shakeIntensity = 0;

window.addEventListener('keydown', e => { 
    const keyStr = e.key.toLowerCase();
    keys[keyStr] = true; 

    if(gameState !== STATES.EASTER_EGG) {
        inputBuffer += keyStr;
       
        if (inputBuffer.length > secretCode.length) {
            inputBuffer = inputBuffer.substring(inputBuffer.length - secretCode.length);
        }
      
        if (inputBuffer === secretCode) {
            triggerEasterEgg();
        }
    }

    if(gameState === STATES.PLAYING) {
        if(keyStr === 'p' && player.statPoints > 0) {
            if(Math.random() > 0.5) { player.atq += 3; } else { player.def += 2; }
            player.statPoints--;
            updateUI();
        }
        if(e.key === '1') { currentWeapon = WEAPONS[1]; updateUI(); }
        if(e.key === '2') { currentWeapon = WEAPONS[2]; updateUI(); }
        if(e.key === '3') { currentWeapon = WEAPONS[3]; updateUI(); }
    }
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => { if(gameState === STATES.PLAYING) mouse.clicked = true; });
canvas.addEventListener('mouseup', () => mouse.clicked = false);

let player = {
    x: 0, y: 0, r: 14, speed: 5.5,
    hp: 137, maxHp: 300,
    xp: 0, nextXp: 100, lvl: 1,
    atq: 10, def: 10, attackCooldown: 0,
    statPoints: 0
};

let enemies = []; let projectiles = []; let particles = [];
let currentFloor = 1; let mapSize = { w: 1500, h: 1500 };
let camera = { x: 0, y: 0 }; let bossSpawned = false;

const enemyTypes = [
    { name: "Drone Estático", r: 12, speed: 4.3, hp: 10000, atq: 5, def: 3, color: "#ff8800", type: "chaser" },
    { name: "Sentinela de Pulso", r: 16, speed: 4.3, hp: 10000, atq: 5, def: 5, color: "#ff0055", type: "ranger" },
    { name: "Devorador de Dados", r: 22, speed: 4.3, hp: 10000, atq: 5, def: 4, color: "#cc00ff", type: "berserker" }
];

function initFloor(floor) {
    enemies = []; projectiles = []; particles = [];
    player.x = mapSize.w / 2; player.y = mapSize.h / 2;
    bossSpawned = false;

    if (floor === 10) {
        enemies.push({
            x: mapSize.w / 2, y: mapSize.h / 2 - 300, r: 60, speed: 4.5,
            hp: 1000000, maxHp: 1000000, atq: 60, def: 80, color: "#00ffff",
            type: "boss", name: "A SINGULARIDADE", attackCooldown: 0
        });
        bossSpawned = true;
    } else {
        let enemyCount = 15 + (floor * 5);
        for(let i=0; i<enemyCount; i++) {
            let type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            let distance = 300 + Math.random() * 600;
            let angle = Math.random() * Math.PI * 2;
            let mult = 1 + (floor * 0.35);

            enemies.push({
                x: player.x + Math.cos(angle) * distance,
                y: player.y + Math.sin(angle) * distance,
                r: type.r, speed: type.speed * (1 + (floor*0.03)),
                hp: Math.floor(type.hp * mult), maxHp: Math.floor(type.hp * mult),
                atq: Math.floor(type.atq * mult), def: Math.floor(type.def * mult),
                color: type.color, type: type.type, name: type.name, attackCooldown: 0
            });
        }
    }
    updateUI();
}

function spawnParticle(x, y, color, count=5) {
    for(let i=0; i<count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 4 + 2;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            radius: Math.random() * 3 + 1.5, alpha: 1,
            decay: Math.random() * 0.02 + 0.015, color: color
        });
    }
}

function triggerEasterEgg() {
    if (gameState === STATES.EASTER_EGG) return;
    previousState = gameState;
    gameState = STATES.EASTER_EGG;
    mouse.clicked = false;
    document.getElementById("easter-egg-screen").style.display = "block";
}

function closeEasterEgg() {
    document.getElementById("easter-egg-screen").style.display = "none";
    inputBuffer = ""; 
    gameState = previousState;
    if (gameState === STATES.PLAYING) {
        gameLoop();
    }
}

function startGame() {
    document.getElementById("screen-msg").style.display = "none";
    gameState = STATES.PLAYING;
    currentFloor = 1;
    player.hp = 100; player.maxHp = 100;
    player.xp = 0; player.lvl = 1; player.atq = 10; player.def = 10; player.statPoints = 0;
    currentWeapon = WEAPONS[1];
    initFloor(currentFloor);
    gameLoop();
}

function updateUI() {
    document.getElementById("lbl-lvl").innerText = player.lvl;
    document.getElementById("lbl-floor").innerText = currentFloor;
    document.getElementById("lbl-atq").innerText = player.atq;
    document.getElementById("lbl-def").innerText = player.def;
    document.getElementById("lbl-pts").innerText = player.statPoints;
    document.getElementById("lbl-weapon").innerText = currentWeapon.name;
    
    document.getElementById("hp-fill").style.width = Math.max(0, (player.hp / player.maxHp) * 100) + "%";
    document.getElementById("xp-fill").style.width = Math.min(100, (player.xp / player.nextXp) * 100) + "%";
}

function triggerGameOver() {
    gameState = STATES.GAMEOVER;
    document.getElementById("screen-msg").style.display = "block";
    document.getElementById("msg-title").innerText = "CONEXÃO CORTADA";
    document.getElementById("msg-title").style.color = "#ff3355";
    document.getElementById("msg-desc").innerText = `Você sucumbiu no andar ${currentFloor}. Seu código foi deletado da existência.`;
    document.getElementById("btn-action").innerText = "RECONECTAR";
}

function triggerVictory() {
    gameState = STATES.VICTORY;
    document.getElementById("screen-msg").style.display = "block";
    document.getElementById("msg-title").innerText = "SINGULARIDADE DESTRUÍDA";
    document.getElementById("msg-title").style.color = "#00ffcc";
    document.getElementById("msg-desc").innerText = `ÉPICO! Você superou a barreira matemática impossível do Décimo Andar. Nível Final: ${player.lvl}.`;
    document.getElementById("btn-action").innerText = "JOGAR DE NOVO";
}

function update() {
    if (gameState !== STATES.PLAYING) return;

    if (shakeIntensity > 0) shakeIntensity *= 0.9;

    let moveX = 0; let moveY = 0;
    if (keys['w'] || keys['arrowup']) moveY = -1;
    if (keys['s'] || keys['arrowdown']) moveY = 1;
    if (keys['a'] || keys['arrowleft']) moveX = -1;
    if (keys['d'] || keys['arrowright']) moveX = 1;

    if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071; moveY *= 0.7071;
    }

    player.x += moveX * player.speed;
    player.y += moveY * player.speed;

    player.x = Math.max(player.r, Math.min(mapSize.w - player.r, player.x));
    player.y = Math.max(player.r, Math.min(mapSize.h - player.r, player.y));

    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    camera.x = Math.max(0, Math.min(mapSize.w - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(mapSize.h - canvas.height, camera.y));

    if (player.attackCooldown > 0) player.attackCooldown--;
    
    if (mouse.clicked && player.attackCooldown === 0) {
        let worldMouseX = mouse.x + camera.x;
        let worldMouseY = mouse.y + camera.y;
        let dx = worldMouseX - player.x;
        let dy = worldMouseY - player.y;
        let baseAngle = Math.atan2(dy, dx);

        let count = currentWeapon.projectiles;
        let spreadExtent = currentWeapon.spread;

        for(let i=0; i<count; i++) {
            let offset = count > 1 ? (i / (count - 1) - 0.5) * spreadExtent : (Math.random() - 0.5) * spreadExtent;
            let finalAngle = baseAngle + offset;

            projectiles.push({
                x: player.x, y: player.y,
                vx: Math.cos(finalAngle) * currentWeapon.speed, 
                vy: Math.sin(finalAngle) * currentWeapon.speed,
                r: 5, color: "#00ffcc", fromPlayer: true, life: 70,
                damage: Math.ceil(player.atq * currentWeapon.dmgMult)
            });
        }
        player.attackCooldown = currentWeapon.cooldown;
    }

    for(let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.95; p.vy *= 0.95;
        p.alpha -= p.decay;
        if(p.alpha <= 0) particles.splice(i, 1);
    }

    for(let i = projectiles.length - 1; i >= 0; i--) {
        let proj = projectiles[i];
        proj.x += proj.vx; proj.y += proj.vy;
        proj.life--;

        if(proj.life <= 0) { projectiles.splice(i, 1); continue; }

        if(proj.fromPlayer) {
            for(let j = enemies.length - 1; j >= 0; j--) {
                let e = enemies[j];
                let dx = proj.x - e.x; let dy = proj.y - e.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < proj.r + e.r) {
                    let damage = Math.max(1, proj.damage - e.def);
                    e.hp -= damage;
                    spawnParticle(proj.x, proj.y, "#ff3355", 4);
                    projectiles.splice(i, 1);

                    if(e.hp <= 0) {
                        spawnParticle(e.x, e.y, e.color, 16);
                        let xpGained = e.type === "boss" ? 1000 : 15 + (currentFloor * 5);
                        player.xp += xpGained;
                        
                        if(player.xp >= player.nextXp) {
                            player.lvl++;
                            player.xp -= player.nextXp;
                            player.nextXp = Math.floor(player.nextXp * 1.5);
                            player.maxHp += 15;
                            player.hp = player.maxHp;
                            player.statPoints += 3;
                            spawnParticle(player.x, player.y, "#33ffaa", 30);
                        }
                        enemies.splice(j, 1);
                        updateUI();
                    }
                    break;
                }
            }
        } else {
            let dx = proj.x - player.x; let dy = proj.y - player.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < proj.r + player.r) {
                let damage = Math.max(2, proj.damage - player.def);
                player.hp -= damage;
                spawnParticle(player.x, player.y, "#ff0000", 8);
                shakeIntensity = Math.min(15, shakeIntensity + damage * 0.8);
                projectiles.splice(i, 1);
                updateUI();
                if(player.hp <= 0) { triggerGameOver(); }
            }
        }
    }

    for(let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        let dx = player.x - e.x; let dy = player.y - e.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if(e.type === "chaser" || e.type === "berserker" || e.type === "boss") {
            e.x += (dx / dist) * e.speed; e.y += (dy / dist) * e.speed;
        } else if(e.type === "ranger") {
            if(dist > 250) {
                e.x += (dx / dist) * e.speed; e.y += (dy / dist) * e.speed;
            } else if(dist < 150) {
                e.x -= (dx / dist) * e.speed; e.y -= (dy / dist) * e.speed;
            }
        }

        if(dist < e.r + player.r) {
            if(!e.lastContactAttack || Date.now() - e.lastContactAttack > 800) {
                let dmg = Math.max(1, e.atq - player.def);
                player.hp -= dmg;
                spawnParticle(player.x, player.y, "#ff3355", 8);
                shakeIntensity = Math.min(12, shakeIntensity + dmg * 1.2);
                e.lastContactAttack = Date.now();
                updateUI();
                if(player.hp <= 0) { triggerGameOver(); return; }
            }
        }

        if(e.type === "ranger" || e.type === "boss") {
            if(!e.attackCooldown) e.attackCooldown = 0;
            e.attackCooldown--;
            if(e.attackCooldown <= 0 && dist < 450) {
                if(e.type === "ranger") {
                    let angle = Math.atan2(dy, dx);
                    projectiles.push({
                        x: e.x, y: e.y, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
                        r: 6, color: "#ff0055", fromPlayer: false, life: 100, damage: e.atq
                    });
                    e.attackCooldown = 90;
                } else if(e.type === "boss") {
                    for(let a=0; a<Math.PI*2; a += Math.PI/4) {
                        projectiles.push({
                            x: e.x, y: e.y, vx: Math.cos(a) * 4.5, vy: Math.sin(a) * 4.5,
                            r: 8, color: "#00ffff", fromPlayer: false, life: 150, damage: e.atq
                        });
                    }
                    e.attackCooldown = 50;
                }
            }
        }
    }

    if(enemies.length === 0) {
        if(currentFloor === 10 && bossSpawned) {
            triggerVictory();
        } else {
            currentFloor++;
            if(currentFloor > 10) { triggerVictory(); } else { initFloor(currentFloor); }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    
    if (shakeIntensity > 0.3) {
        let dx = (Math.random() - 0.5) * shakeIntensity;
        let dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
    }

    ctx.translate(-camera.x, -camera.y);

    ctx.strokeStyle = "#0c0d1a"; ctx.lineWidth = 1;
    const gridSpacing = 80;
    for(let x=0; x<mapSize.w; x+=gridSpacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mapSize.h); ctx.stroke();
    }
    for(let y=0; y<mapSize.h; y+=gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mapSize.w, y); ctx.stroke();
    }

    ctx.strokeStyle = "#ff3355"; ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, mapSize.w, mapSize.h);

    particles.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    });

    projectiles.forEach(p => {
        ctx.fillStyle = p.color; ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    enemies.forEach(e => {
        ctx.fillStyle = e.color; ctx.shadowBlur = 12; ctx.shadowColor = e.color;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#222"; ctx.fillRect(e.x - e.r, e.y - e.r - 12, e.r*2, 4);
        ctx.fillStyle = "#ff3355"; ctx.fillRect(e.x - e.r, e.y - e.r - 12, (e.hp/e.maxHp) * (e.r*2), 4);

        if(e.type === "boss") {
            ctx.fillStyle = "#fff"; ctx.font = "bold 14px Courier New";
            ctx.fillText(e.name, e.x - 55, e.y - e.r - 20);
        }
    });

    ctx.save();
    ctx.translate(player.x, player.y);
    let pAngle = Math.atan2((mouse.y + camera.y) - player.y, (mouse.x + camera.x) - player.x);
    ctx.rotate(pAngle);
    ctx.fillStyle = "#00ffcc"; ctx.shadowBlur = 15; ctx.shadowColor = "#00ffcc";
    ctx.beginPath();
    ctx.moveTo(player.r, 0);
    ctx.lineTo(-player.r, -player.r + 4);
    ctx.lineTo(-player.r, player.r - 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    if(gameState === STATES.PLAYING) {
        requestAnimationFrame(gameLoop);
    }
}

updateUI();