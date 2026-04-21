const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- DOM ELEMENTLERİ ---
const menus = {
    main: document.getElementById('menu-main'),
    settings: document.getElementById('menu-settings'),
    pause: document.getElementById('menu-pause'),
    gameover: document.getElementById('menu-gameover'),
    hud: document.getElementById('hud')
};

const ui = {
    score: document.getElementById('score-text'),
    highscore: document.getElementById('highscore-text'),
    lives: document.getElementById('lives-text'),
    level: document.getElementById('level-text'),
    energyFill: document.getElementById('energy-fill'),
    energyText: document.getElementById('energy-percent'),
    finalScore: document.getElementById('final-score'),
    finalLevel: document.getElementById('final-level'),
    highscoreAlert: document.getElementById('highscore-alert'),
    diffSelect: document.getElementById('difficulty-select'),
    godModeSelect: document.getElementById('godmode-select'),
    rainSelect: document.getElementById('rain-select'),
    gfxSelect: document.getElementById('gfx-select'),
    musicSelect: document.getElementById('music-select'), 
    sfxSelect: document.getElementById('sfx-select'), 
    musicBtnPause: document.getElementById('btn-pause-music'), // Yeni
    sfxBtnPause: document.getElementById('btn-pause-sfx'),     // Yeni
    muteAllBtnPause: document.getElementById('btn-pause-muteall'), // Yeni
    godModeWarning: document.getElementById('godmode-warning'), 
    levelUpScreen: document.getElementById('level-up-screen'),
    levelUpText: document.getElementById('level-up-text'),
    flash: document.getElementById('flash-screen')
};

let savedHighscore = localStorage.getItem('hirtAvcisiHighscore') || 0;
ui.highscore.innerText = savedHighscore;

// --- MÜZİK VE SES MOTORU ---
let audioCtx;
const bgMusic = new Audio('muzik.mp3'); 
bgMusic.loop = true;
bgMusic.volume = 0.3; 

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (!audioCtx || !gameData.sfxEnabled) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'catch') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'ulti' || type === 'nuke') { 
        osc.type = 'square';
        osc.frequency.setValueAtTime(type === 'nuke' ? 50 : 100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + (type === 'nuke' ? 1.2 : 0.8));
        gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);
        osc.start(); osc.stop(audioCtx.currentTime + 1.2);
    } else if (type === 'epic_powerup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'vip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    }
}

// --- OYUN MOTORU DURUMU ---
let gameState = 'MENU';
let animationId;

let gameData = {
    score: 0,
    lives: 3,
    level: 1,
    combo: 0,
    energy: 0,
    frameCount: 0,
    bgOffsetY: 0,
    baseSpeed: 2.5,
    spawnRate: 60,
    timeScale: 1.0, 
    gridColor: 'rgba(0, 240, 255, 0.15)',
    baseGridColor: 'rgba(0, 240, 255, 0.15)',
    godMode: false,
    rainMode: 'heavy',
    gfxQuality: 'high',
    musicEnabled: true,
    sfxEnabled: true 
};

const levelColors = [
    'rgba(0, 240, 255, 0.2)',   'rgba(255, 0, 85, 0.2)',  
    'rgba(241, 196, 15, 0.2)',  'rgba(46, 204, 113, 0.2)',  'rgba(155, 89, 182, 0.2)'
];

const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false, Shift: false, ' ': false, e: false, E: false };

const images = { player: new Image(), enemy: new Image(), civilian: new Image(), heart: new Image(), shield: new Image() };
images.player.src = 'polis.jpg';
images.enemy.src = 'hırt.jpg';
images.civilian.src = 'insan.jpg';
images.heart.src = 'kalp.png';
images.shield.src = 'shield.png';

let player, entities = [], particles = [], floatingTexts = [], playerTrails = [], rainDrops = [];

// ==========================================
// SINIFLAR
// ==========================================

class Player {
    constructor() {
        this.width = 65; this.height = 95;
        this.x = canvas.width / 2 - this.width / 2; this.y = canvas.height - this.height - 30;
        this.speed = 8.5; this.targetX = this.x; this.tilt = 0;
        this.isDashing = false; this.dashCooldown = 0;
        this.shieldActive = false; this.shieldTimer = 0;
        this.magnetActive = false; this.magnetTimer = 0;
        this.timeWarpTimer = 0;
    }

    update() {
        let currentSpeed = this.speed;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if ((keys.Shift || keys[' ']) && this.dashCooldown === 0) {
            this.isDashing = true; this.dashCooldown = 45; 
            playSound('catch');
            createParticles(this.x + this.width/2, this.y + this.height, '#00f0ff', 15);
        }
        if (this.isDashing) {
            currentSpeed = this.speed * 3.8;
            if (this.dashCooldown < 35) this.isDashing = false;
        }

        if (keys.ArrowLeft || keys.a) this.targetX -= currentSpeed;
        if (keys.ArrowRight || keys.d) this.targetX += currentSpeed;

        if (this.targetX < 10) this.targetX = 10;
        if (this.targetX + this.width > canvas.width - 10) this.targetX = canvas.width - this.width - 10;

        let diff = this.targetX - this.x;
        this.x += diff * 0.25; this.tilt = diff * 0.018;

        if (gameData.gfxQuality === 'high' || this.isDashing) {
            if (Math.abs(diff) > 2 || this.isDashing) {
                playerTrails.push({ x: this.x, y: this.y, tilt: this.tilt, life: 1.0 });
            }
        }

        if (this.shieldActive) { this.shieldTimer--; if (this.shieldTimer <= 0) this.shieldActive = false; }
        if (this.magnetActive) { this.magnetTimer--; if (this.magnetTimer <= 0) this.magnetActive = false; }
        if (this.timeWarpTimer > 0) {
            this.timeWarpTimer--; gameData.timeScale = 0.35; 
            if (this.timeWarpTimer <= 0) gameData.timeScale = 1.0;
        }

        if ((keys.e || keys.E) && gameData.energy >= 100) triggerUltimate();
    }

    draw() {
        playerTrails.forEach(trail => {
            ctx.save(); ctx.translate(trail.x + this.width / 2, trail.y + this.height / 2); ctx.rotate(trail.tilt);
            ctx.globalAlpha = trail.life * 0.35; ctx.fillStyle = this.magnetActive ? '#9b59b6' : '#00f0ff';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height); ctx.restore();
            trail.life -= (gameData.gfxQuality === 'high' ? 0.12 : 0.2); 
        });
        playerTrails = playerTrails.filter(t => t.life > 0);

        ctx.save(); ctx.translate(this.x + this.width / 2, this.y + this.height / 2); ctx.rotate(this.tilt);
        
        if (gameData.godMode && gameData.gfxQuality === 'high') {
            ctx.shadowBlur = 15; ctx.shadowColor = '#f1c40f';
            ctx.beginPath(); ctx.arc(0, 0, this.width + 5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(241, 196, 15, ${Math.abs(Math.sin(gameData.frameCount * 0.1))})`;
            ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;
        }

        if (this.magnetActive) {
            ctx.beginPath(); ctx.arc(0, 0, 200, 0, Math.PI * 2); ctx.fillStyle = 'rgba(155, 89, 182, 0.15)'; ctx.fill();
            if(gameData.gfxQuality === 'high') {
                ctx.lineWidth = 2; ctx.strokeStyle = `rgba(155, 89, 182, ${Math.abs(Math.sin(gameData.frameCount * 0.1))})`; ctx.stroke();
            }
        }

        if (this.shieldActive) {
            ctx.beginPath(); ctx.arc(0, 0, this.width + 10, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0, 240, 255, 0.3)'; ctx.fill();
            ctx.lineWidth = 4; ctx.strokeStyle = '#00f0ff'; ctx.stroke();
        }

        if (images.player.complete && images.player.naturalHeight !== 0) {
            ctx.drawImage(images.player, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#0a84ff'; ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.fillStyle = gameData.frameCount % 10 < 5 ? '#ff0055' : '#00f0ff';
            ctx.fillRect(-this.width / 2 + 15, -this.height / 2 - 8, this.width - 30, 8);
        }
        ctx.restore();
    }
}

class FallingEntity {
    constructor(type) {
        this.type = type; 
        this.width = (type === 'obstacle') ? 70 : ((type === 'health' || type === 'shield' || type === 'nuke') ? 35 : 45);
        this.height = (type === 'obstacle') ? 30 : ((type === 'health' || type === 'shield' || type === 'nuke') ? 35 : 45);
        this.x = Math.random() * (canvas.width - this.width - 40) + 20; this.y = -80;
        
        let speedMultiplier = 1 + (gameData.level * 0.15); 
        this.speed = (Math.random() * 1.5 + gameData.baseSpeed) * speedMultiplier;
        
        this.isZigzag = (this.type === 'enemy' && Math.random() > 0.5) || (this.type === 'vip');
        this.startX = this.x; this.angle = Math.random() * Math.PI * 2;

        if(this.type !== 'enemy' && this.type !== 'obstacle' && this.type !== 'civilian' && this.type !== 'vip') this.speed *= 1.3;
        if(this.type === 'obstacle') this.speed = gameData.baseSpeed * speedMultiplier;
        if(this.type === 'vip') this.speed *= 1.8;
        if(this.type === 'nuke') this.speed *= 1.5; 

        this.markedForDeletion = false;
    }

    update() {
        let currentSpeed = this.speed * gameData.timeScale;
        this.y += currentSpeed;

        if (this.isZigzag) {
            this.angle += (this.type === 'vip' ? 0.1 : 0.05) * gameData.timeScale; 
            let amplitude = this.type === 'vip' ? 120 : 80;
            this.x = this.startX + Math.sin(this.angle) * amplitude; 
            if(this.x < 10) this.x = 10;
            if(this.x > canvas.width - this.width - 10) this.x = canvas.width - this.width - 10;
        }

        if (player.magnetActive && (this.type === 'enemy' || this.type === 'health' || this.type === 'shield' || this.type === 'vip' || this.type === 'nuke')) {
            let dx = (player.x + player.width/2) - (this.x + this.width/2);
            let dy = (player.y + player.height/2) - (this.y + this.height/2);
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 250) { 
                this.x += (dx / dist) * 8 * gameData.timeScale; this.y += (dy / dist) * 8 * gameData.timeScale;
            }
        }

        let hitMargin = 12; 
        if (
            player.x + hitMargin < this.x + this.width &&
            player.x + player.width - hitMargin > this.x &&
            player.y + hitMargin < this.y + this.height &&
            player.y + player.height - hitMargin > this.y
        ) {
            this.markedForDeletion = true;
            this.handleCollision();
        }

        if (this.y > canvas.height + 50) {
            this.markedForDeletion = true;
            this.handleMiss();
        }
    }

    handleCollision() {
        if (this.type === 'enemy') {
            playSound('catch');
            gameData.combo++; 
            gameData.energy = Math.min(100, gameData.energy + 8);
            let pointsEarned = 15 * (1 + (gameData.combo * 0.1));
            gameData.score += Math.round(pointsEarned);
            createParticles(this.x + this.width/2, this.y + this.height/2, '#ff0055', 10);
            createFloatingText(`+${Math.round(pointsEarned)}`, this.x, this.y, '#f1c40f');
            checkLevelUp(); updateHUD();

        } else if (this.type === 'vip') {
            playSound('vip');
            gameData.combo += 5; 
            gameData.energy = Math.min(100, gameData.energy + 30); 
            gameData.score += 100; 
            createParticles(this.x + this.width/2, this.y + this.height/2, '#f1c40f', 30); 
            createFloatingText(`VIP +100!`, this.x, this.y, '#f1c40f');
            canvas.style.transform = "translate(10px, 10px)";
            setTimeout(() => { canvas.style.transform = "translate(0, 0)"; }, 80);
            checkLevelUp(); updateHUD();

        } else if (this.type === 'nuke') {
            triggerNuke();

        } else if (this.type === 'civilian') {
            if (player.shieldActive) {
                playSound('hit'); player.shieldActive = false; gameData.combo = 0;
                createFloatingText("KALKAN KIRILDI!", player.x, player.y - 20, '#00f0ff');
                createParticles(player.x, player.y, '#00f0ff', 15);
            } else {
                gameData.combo = 0; createFloatingText("MASUM!", this.x, this.y, '#ff0055');
                loseLife();
            }

        } else if (this.type === 'obstacle') {
            if (player.shieldActive) {
                playSound('hit'); player.shieldActive = false;
                createFloatingText("ENGEL PARÇALANDI!", player.x, player.y - 20, '#f1c40f');
                createParticles(this.x + this.width/2, this.y + this.height/2, '#f1c40f', 15);
            } else {
                createFloatingText("KAZA!", this.x, this.y, '#ff0000');
                loseLife();
            }

        } else if (this.type === 'health') {
            playSound('powerup'); gameData.lives++;
            createFloatingText("+1 CAN", this.x, this.y, '#2ecc71'); updateHUD();
        } else if (this.type === 'shield') {
            playSound('powerup'); player.shieldActive = true; player.shieldTimer = 400; 
            createFloatingText("KALKAN AKTİF!", this.x, this.y, '#00f0ff');
        } else if (this.type === 'magnet') {
            playSound('epic_powerup'); player.magnetActive = true; player.magnetTimer = 500;
            createFloatingText("MIKNATIS!", this.x, this.y, '#9b59b6');
        } else if (this.type === 'time_warp') {
            playSound('epic_powerup'); player.timeWarpTimer = 300; 
            createFloatingText("AĞIR ÇEKİM!", this.x, this.y, '#2ecc71');
        }
    }

    handleMiss() {
        if (this.type === 'enemy' || this.type === 'vip') {
            gameData.combo = 0; createFloatingText("KAÇTI!", this.x, canvas.height - 20, '#555');
        }
    }

    draw() {
        let img = null; let fallbackColor = '#fff';
        
        if(this.type === 'enemy') { img = images.enemy; fallbackColor = '#ff0055'; }
        if(this.type === 'civilian') { img = images.civilian; fallbackColor = '#2ecc71'; }
        if(this.type === 'health') { img = images.heart; fallbackColor = '#e74c3c'; }
        if(this.type === 'shield') { img = images.shield; fallbackColor = '#00f0ff'; }
        if(this.type === 'magnet') { fallbackColor = '#9b59b6'; } 
        if(this.type === 'time_warp') { fallbackColor = '#1abc9c'; } 
        if(this.type === 'vip') { img = images.enemy; fallbackColor = '#f1c40f'; } 
        if(this.type === 'nuke') { fallbackColor = '#e67e22'; } 

        if (img && img.complete && img.naturalHeight !== 0 && this.type !== 'obstacle' && this.type !== 'magnet' && this.type !== 'time_warp' && this.type !== 'nuke') {
            if (this.type === 'vip' && gameData.gfxQuality === 'high') {
                ctx.shadowBlur = 20; ctx.shadowColor = '#f1c40f';
                ctx.fillStyle = `rgba(241, 196, 15, ${Math.abs(Math.sin(gameData.frameCount * 0.2))})`; 
                ctx.beginPath(); ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width, 0, Math.PI*2); ctx.fill();
            }
            ctx.drawImage(img, this.x, this.y, this.width, this.height); ctx.shadowBlur = 0; 
        } else {
            ctx.fillStyle = fallbackColor; ctx.beginPath();
            if (this.type === 'obstacle') {
                ctx.fillStyle = '#f1c40f'; ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#111'; for(let i=0; i<this.width; i+=15) ctx.fillRect(this.x + i, this.y, 7, this.height);
                ctx.strokeStyle = '#fff'; ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
            else if (this.type === 'nuke') {
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
                ctx.fillStyle = gameData.frameCount % 10 < 5 ? '#e74c3c' : '#f1c40f'; 
                ctx.fill();
                ctx.fillStyle = '#000'; ctx.font="20px Arial"; ctx.fillText("☢", this.x + 8, this.y + 25);
            }
            else if (this.type === 'enemy' || this.type === 'vip') {
                if(gameData.gfxQuality === 'high') { ctx.shadowBlur = this.type === 'vip' ? 20 : 0; ctx.shadowColor = fallbackColor; }
                ctx.rect(this.x, this.y, this.width, this.height); ctx.fill(); ctx.shadowBlur = 0;
            } 
            else if (this.type === 'shield') {
                ctx.moveTo(this.x + this.width/2, this.y); ctx.lineTo(this.x + this.width, this.y + this.height/2);
                ctx.lineTo(this.x + this.width/2, this.y + this.height); ctx.lineTo(this.x, this.y + this.height/2); ctx.fill();
            }
            else if (this.type === 'magnet') {
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, Math.PI, 0);
                ctx.lineWidth = 6; ctx.strokeStyle = fallbackColor; ctx.stroke();
            }
            else if (this.type === 'time_warp') {
                ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.width, this.y);
                ctx.lineTo(this.x, this.y + this.height); ctx.lineTo(this.x + this.width, this.y + this.height); ctx.fill();
            }
            else {
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
}

// --- EFEKTLER VE YAĞMUR SİSTEMİ ---
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color; this.size = Math.random() * 6 + 2;
        this.speedX = Math.random() * 12 - 6; this.speedY = Math.random() * -10 - 2;
        this.gravity = 0.5; this.life = 1.0; 
    }
    update() {
        this.speedY += this.gravity * gameData.timeScale;
        this.x += this.speedX * gameData.timeScale; this.y += this.speedY * gameData.timeScale;
        this.life -= 0.02 * gameData.timeScale;
    }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1.0;
    }
}

class FloatingText {
    constructor(text, x, y, color) {
        this.text = text; this.x = x; this.y = y; this.color = color; this.life = 1.0;
    }
    update() { this.y -= 2 * gameData.timeScale; this.life -= 0.015 * gameData.timeScale; }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color;
        ctx.font = "bold 26px Rajdhani"; 
        if(gameData.gfxQuality === 'high'){ ctx.shadowBlur = 8; ctx.shadowColor = '#000'; }
        ctx.fillText(this.text, this.x, this.y); ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
    }
}

class RainDrop {
    constructor() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * -canvas.height;
        this.speed = Math.random() * 10 + 15; this.length = Math.random() * 20 + 10;
        this.color = `rgba(0, 240, 255, ${Math.random() * 0.4 + 0.1})`; 
    }
    update() {
        this.y += this.speed * gameData.timeScale;
        if (this.y > canvas.height) { this.y = -this.length; this.x = Math.random() * canvas.width; }
    }
    draw() {
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x, this.y + this.length);
        ctx.strokeStyle = gameData.timeScale < 1.0 ? 'rgba(46, 204, 113, 0.5)' : this.color; 
        ctx.lineWidth = 2; ctx.stroke();
    }
}

// ==========================================
// SİSTEM FONKSİYONLARI
// ==========================================

function createParticles(x, y, color, amount) { 
    let count = gameData.gfxQuality === 'low' ? Math.floor(amount / 2) : amount;
    for(let i = 0; i < count; i++) particles.push(new Particle(x, y, color)); 
}
function createFloatingText(text, x, y, color) { floatingTexts.push(new FloatingText(text, x, y, color)); }

function triggerNuke() {
    playSound('nuke');
    ui.flash.style.background = 'rgba(231, 76, 60, 0.8)'; 
    ui.flash.style.opacity = '1'; 
    setTimeout(() => { ui.flash.style.opacity = '0'; ui.flash.style.background = 'white'; }, 400);

    let killed = 0;
    entities.forEach(obj => {
        if (obj.type === 'enemy' || obj.type === 'vip') {
            obj.markedForDeletion = true; createParticles(obj.x, obj.y, '#e74c3c', 10); killed++;
        } else if (obj.type === 'obstacle') {
            obj.markedForDeletion = true; createParticles(obj.x, obj.y, '#f1c40f', 10); 
        }
    });

    if(killed > 0) {
        let p = killed * 20; 
        gameData.score += p;
        createFloatingText(`BOMBA: +${p}`, canvas.width/2 - 50, canvas.height/2, '#e74c3c');
        checkLevelUp(); updateHUD();
    }
}

function triggerUltimate() {
    playSound('ulti'); gameData.energy = 0; updateHUD();
    ui.flash.style.opacity = '1'; setTimeout(() => { ui.flash.style.opacity = '0'; }, 300);

    let killed = 0;
    entities.forEach(obj => {
        if (obj.type === 'enemy' || obj.type === 'vip') {
            obj.markedForDeletion = true; createParticles(obj.x, obj.y, '#ff0055', 15); killed++;
        }
    });

    if(killed > 0) {
        let p = killed * 40; gameData.score += p;
        createFloatingText(`ULTİ: +${p}`, canvas.width/2 - 50, canvas.height/2, '#9b59b6');
        checkLevelUp(); updateHUD();
    }
}

function checkLevelUp() {
    let nextLevelScore = gameData.level * 400; 
    if (gameData.score >= nextLevelScore) {
        gameData.level++; gameData.baseGridColor = levelColors[(gameData.level - 1) % levelColors.length];
        ui.levelUpText.innerText = "BÖLÜM " + gameData.level; ui.levelUpScreen.classList.remove('hidden');
        setTimeout(() => { ui.levelUpScreen.classList.add('hidden'); }, 2000);
    }
}

// --- YENİ: Sesleri Senkronize Etme Fonksiyonları ---

function syncAudioUI() {
    ui.sfxSelect.value = gameData.sfxEnabled ? "on" : "off";
    ui.musicSelect.value = gameData.musicEnabled ? "on" : "off";

    ui.sfxBtnPause.innerText = gameData.sfxEnabled ? "🔊 Efekt: AÇIK" : "🔊 Efekt: KAPALI";
    ui.sfxBtnPause.style.color = gameData.sfxEnabled ? "#fff" : "#e74c3c";
    ui.sfxBtnPause.style.borderColor = gameData.sfxEnabled ? "rgba(255,255,255,0.2)" : "#e74c3c";

    ui.musicBtnPause.innerText = gameData.musicEnabled ? "🎵 Müzik: AÇIK" : "🎵 Müzik: KAPALI";
    ui.musicBtnPause.style.color = gameData.musicEnabled ? "#fff" : "#e74c3c";
    ui.musicBtnPause.style.borderColor = gameData.musicEnabled ? "rgba(255,255,255,0.2)" : "#e74c3c";

    let allMuted = (!gameData.musicEnabled && !gameData.sfxEnabled);
    ui.muteAllBtnPause.innerText = allMuted ? "Tüm Sesleri Aç" : "Tüm Sesleri Kapat";
    ui.muteAllBtnPause.style.color = allMuted ? "#2ecc71" : "#f1c40f";
    ui.muteAllBtnPause.style.borderColor = allMuted ? "#2ecc71" : "#f1c40f";
}

function toggleSFX() {
    gameData.sfxEnabled = !gameData.sfxEnabled;
    syncAudioUI();
}

function toggleMusic() {
    gameData.musicEnabled = !gameData.musicEnabled;
    syncAudioUI();
    if (gameData.musicEnabled && gameState === 'PLAYING') bgMusic.play().catch(()=>{});
    else bgMusic.pause();
}

function toggleMuteAll() {
    let turnOn = !(gameData.musicEnabled || gameData.sfxEnabled);
    gameData.musicEnabled = turnOn;
    gameData.sfxEnabled = turnOn;
    syncAudioUI();
    if(turnOn && gameState === 'PLAYING') bgMusic.play().catch(()=>{});
    else bgMusic.pause();
}

function updateSettings() {
    let diff = ui.diffSelect.value;
    if(diff === 'easy') { gameData.baseSpeed = 2.0; gameData.spawnRate = 80; }
    if(diff === 'normal') { gameData.baseSpeed = 3.2; gameData.spawnRate = 55; }
    if(diff === 'hard') { gameData.baseSpeed = 5.0; gameData.spawnRate = 35; }
    
    gameData.godMode = ui.godModeSelect.value === 'on';
    gameData.rainMode = ui.rainSelect.value;
    gameData.gfxQuality = ui.gfxSelect.value;
    
    gameData.musicEnabled = ui.musicSelect.value === 'on';
    gameData.sfxEnabled = ui.sfxSelect.value === 'on';
    
    syncAudioUI();

    if (gameData.musicEnabled && gameState === 'PLAYING') {
        bgMusic.play().catch(e => console.log("Müzik izni bekleniyor..."));
    } else {
        bgMusic.pause();
    }

    initRain(); 
}

function initRain() {
    rainDrops = [];
    if (gameData.rainMode === 'heavy') {
        for(let i=0; i<100; i++) rainDrops.push(new RainDrop());
    } else if (gameData.rainMode === 'light') {
        for(let i=0; i<30; i++) rainDrops.push(new RainDrop());
    }
}

function showMenu(menuId) {
    Object.values(menus).forEach(m => m.classList.add('hidden'));
    if (menuId !== 'hud') document.getElementById(menuId).classList.remove('hidden');
}

function switchState(newState) {
    let previousState = gameState;
    gameState = newState;
    
    if (newState === 'MENU') {
        menus.hud.classList.add('hidden'); showMenu('menu-main'); 
        bgMusic.pause();
        cancelAnimationFrame(animationId);
    } 
    else if (newState === 'PLAYING') {
        if (previousState === 'MENU' || previousState === 'GAMEOVER') initGame();
        showMenu('hud'); menus.hud.classList.remove('hidden'); 
        if(gameData.musicEnabled) bgMusic.play().catch(e=>console.log("Müzik izni bekleniyor..."));
        cancelAnimationFrame(animationId); animate();
    }
    else if (newState === 'PAUSED') {
        bgMusic.pause();
    }
    else if (newState === 'GAMEOVER') {
        bgMusic.pause();
        ui.highscoreAlert.innerText = "";
        
        if(!gameData.godMode) {
            let currentScore = Math.round(gameData.score);
            if (currentScore > savedHighscore) {
                savedHighscore = currentScore;
                localStorage.setItem('hirtAvcisiHighscore', savedHighscore);
                ui.highscore.innerText = savedHighscore;
                ui.highscoreAlert.innerText = "YENİ REKOR!";
                ui.highscoreAlert.style.color = "#2ecc71"; 
            }
        } else {
            ui.highscoreAlert.style.color = "#e74c3c"; 
            ui.highscoreAlert.innerText = "Ölümsüzlük açık. Skor kaydedilmedi.";
        }

        ui.finalScore.innerText = Math.round(gameData.score);
        ui.finalLevel.innerText = gameData.level;
        menus.hud.classList.add('hidden');
        showMenu('menu-gameover');
        cancelAnimationFrame(animationId);
    }
}

function togglePause() {
    if (gameState === 'PLAYING') {
        switchState('PAUSED');
        menus.pause.classList.remove('hidden'); 
    } else if (gameState === 'PAUSED') {
        menus.pause.classList.add('hidden');
        switchState('PLAYING');
    }
}

function initAudioAndStart() { initAudio(); switchState('PLAYING'); }

function initGame() {
    updateSettings();
    gameData.score = 0; gameData.lives = 3; gameData.level = 1; gameData.combo = 0;
    gameData.energy = 0; gameData.frameCount = 0; gameData.timeScale = 1.0; gameData.baseGridColor = levelColors[0];
    
    bgMusic.currentTime = 0;

    if (gameData.godMode) {
        gameData.lives = 999; 
        ui.godModeWarning.classList.remove('hidden');
    } else {
        ui.godModeWarning.classList.add('hidden');
    }

    player = new Player();
    entities = []; particles = []; floatingTexts = []; playerTrails = []; 
    initRain();
    updateHUD();
}

function loseLife() {
    if (gameData.godMode) {
        createFloatingText("GOD MODE!", player.x, player.y - 20, '#e74c3c');
        return; 
    }

    playSound('hit');
    gameData.lives--;
    updateHUD();
    
    canvas.style.transform = "translate(20px, 20px)";
    setTimeout(() => { canvas.style.transform = "translate(-20px, -20px)"; }, 40);
    setTimeout(() => { canvas.style.transform = "translate(20px, -20px)"; }, 80);
    setTimeout(() => { canvas.style.transform = "translate(-10px, 10px)"; }, 120);
    setTimeout(() => { canvas.style.transform = "translate(0, 0)"; }, 160);

    createParticles(player.x + player.width/2, player.y, '#ff0000', 40);

    if (gameData.lives <= 0) switchState('GAMEOVER');
}

function updateHUD() {
    ui.score.innerText = Math.round(gameData.score);
    ui.level.innerText = gameData.level;
    
    if(gameData.godMode) {
        ui.lives.innerText = "ÖLÜMSÜZ";
    } else if(gameData.lives > 10) {
        ui.lives.innerText = `❤️ x${gameData.lives}`;
    } else {
        ui.lives.innerText = '❤️'.repeat(Math.max(0, gameData.lives));
    }
    
    ui.energyFill.style.width = gameData.energy + '%';
    
    // YENİ: Ulti Hazır Animasyonu Tetikleyici
    if(gameData.energy >= 100) {
        ui.energyText.innerText = 'HAZIR! [E]';
        ui.energyText.style.color = '#fff';
        ui.energyText.style.textShadow = '0 0 10px #ff0055';
        
        ui.energyFill.classList.add('ulti-ready');
        ui.energyFill.parentElement.parentElement.classList.add('ulti-ready');
    } else {
        ui.energyText.innerText = Math.round(gameData.energy) + '%';
        ui.energyText.style.color = 'var(--energy)';
        ui.energyText.style.textShadow = 'none';
        
        ui.energyFill.classList.remove('ulti-ready');
        ui.energyFill.parentElement.parentElement.classList.remove('ulti-ready');
    }
}
// ==========================================
// DÖNGÜ (GAME LOOP)
// ==========================================

function drawEnvironment() {
    if(gameData.timeScale < 1.0) {
        ctx.fillStyle = 'rgba(10, 25, 15, 0.45)'; 
        gameData.gridColor = 'rgba(46, 204, 113, 0.4)';
    } else {
        ctx.fillStyle = 'rgba(8, 8, 12, 0.45)';
        if (gameData.combo >= 10) { 
            let glow = (Math.sin(gameData.frameCount * 0.2) + 1) / 2;
            gameData.gridColor = `rgba(241, 196, 15, ${0.2 + glow * 0.4})`;
        } else {
            if (gameData.level > 5 && gameData.gfxQuality === 'high') {
                gameData.gridColor = `hsl(${(gameData.frameCount * 0.5) % 360}, 100%, 50%)`;
            } else {
                gameData.gridColor = gameData.baseGridColor;
            }
        }
    }

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = gameData.gridColor;
    ctx.lineWidth = gameData.combo >= 10 ? 3 : 1.5;
    
    gameData.bgOffsetY += (gameData.baseSpeed + (gameData.level * 0.5)) * gameData.timeScale;
    if(gameData.bgOffsetY > 80) gameData.bgOffsetY = 0;

    ctx.beginPath();
    let lineStep = gameData.gfxQuality === 'high' ? 60 : 100;
    for(let i=-300; i<=canvas.width+300; i+=lineStep) { ctx.moveTo(canvas.width/2, 0); ctx.lineTo(i, canvas.height); }
    for(let i=0; i<=canvas.height; i+=80) { 
        let yPos = i + gameData.bgOffsetY;
        if(yPos > canvas.height) yPos -= canvas.height;
        ctx.moveTo(0, yPos); ctx.lineTo(canvas.width, yPos); 
    }
    ctx.stroke();

    if (gameData.rainMode !== 'off') {
        rainDrops.forEach(drop => { drop.update(); drop.draw(); });
    }
}

function animate() {
    if (gameState !== 'PLAYING') return;

    drawEnvironment();
    player.update(); player.draw();
    gameData.frameCount++;
    
    let currentSpawnRate = Math.max(12, gameData.spawnRate - (gameData.level * 2));
    
    if (gameData.frameCount % Math.round(currentSpawnRate / gameData.timeScale) === 0) {
        let rand = Math.random();
        let type = 'enemy'; 
        
        if (rand > 0.985) type = 'nuke';         
        else if (rand > 0.97) type = 'vip';      
        else if (rand > 0.95) type = 'magnet';   
        else if (rand > 0.93) type = 'time_warp';
        else if (rand > 0.88) type = 'shield';   
        else if (rand > 0.83) type = 'health';   
        else if (rand > 0.67) type = 'obstacle'; 
        else if (rand > 0.52) type = 'civilian'; 
        
        entities.push(new FallingEntity(type));
    }

    entities.forEach(obj => { obj.update(); obj.draw(); });
    particles.forEach(p => { p.update(); p.draw(); });
    floatingTexts.forEach(ft => { ft.update(); ft.draw(); });

    if (gameData.combo > 1) {
        ctx.save();
        let comboColor = gameData.combo >= 10 ? '#f1c40f' : '#00f0ff';
        ctx.fillStyle = comboColor; ctx.font = "italic bold 36px Rajdhani"; ctx.textAlign = "right";
        if(gameData.gfxQuality === 'high') { ctx.shadowBlur = 15; ctx.shadowColor = comboColor; }
        
        let scale = 1 + Math.abs(Math.sin(gameData.frameCount * 0.1)) * 0.1;
        ctx.translate(canvas.width - 25, 110); ctx.scale(scale, scale);
        ctx.fillText(`${gameData.combo}x KOMBO`, 0, 0); ctx.restore();
    }

    entities = entities.filter(obj => !obj.markedForDeletion);
    particles = particles.filter(p => p.life > 0);
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);

    animationId = requestAnimationFrame(animate);
}

// ==========================================
// EVENT LİSTENERS
// ==========================================

window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if(gameState === 'PLAYING' || gameState === 'PAUSED') togglePause();
    }
});

window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

window.addEventListener('blur', () => {
    for (let key in keys) keys[key] = false;
    if (gameState === 'PLAYING') togglePause();
});

ctx.fillStyle = '#050505'; ctx.fillRect(0,0, canvas.width, canvas.height);