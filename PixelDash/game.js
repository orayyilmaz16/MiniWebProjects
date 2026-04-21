const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==================== TEMA SÖZLÜĞÜ (RENDER İÇİN) ====================
const THEMES = {
    grass: { sky: ['#1a1a3e', '#2d3561', '#4a5568'], plat: {top: '#2ed573', body: '#27ae60', side: '#1e8449'} },
    cave: { sky: ['#0f0f23', '#1a1a3e', '#2d2d44'], plat: {top: '#a0a0a0', body: '#808080', side: '#606060'} },
    sky: { sky: ['#87ceeb', '#b0d4f1', '#e0f0ff'], plat: {top: '#ffffff', body: '#f0f0f0', side: '#e0e0e0'} },
    lava: { sky: ['#2d0a0a', '#5c1010', '#ff4757'], plat: {top: '#a0a0a0', body: '#808080', side: '#606060'} },
    crystal: { sky: ['#100a2d', '#2c1a5c', '#a29bfe'], plat: {top: '#ffffff', body: '#f0f0f0', side: '#e0e0e0'} },
    ice: { sky: ['#1c2833', '#00838f', '#b2ebf2'], plat: {top: '#e0f7fa', body: '#80deea', side: '#00acc1'} },
    desert: { sky: ['#4e342e', '#d84315', '#ffb300'], plat: {top: '#ffcc80', body: '#ffe082', side: '#ffb74d'} },
    swamp: { sky: ['#1b5e20', '#33691e', '#558b2f'], plat: {top: '#558b2f', body: '#33691e', side: '#1b5e20'} },
    space: { sky: ['#000000', '#1a237e', '#311b92'], plat: {top: '#b39ddb', body: '#9575cd', side: '#7e57c2'} },
    final: { sky: ['#212121', '#b71c1c', '#f44336'], plat: {top: '#424242', body: '#212121', side: '#000000'} }
};

// ==================== SES SİSTEMİ ====================
class AudioSystem {
    constructor() { this.ctx = null; this.soundEnabled = true; this.musicEnabled = true; this.musicInterval = null; this.currentMusicType = null; this.step = 0; this.initialized = false; }
    init() { if (this.initialized) return; try { const AudioContext = window.AudioContext || window.webkitAudioContext; if(AudioContext) { this.ctx = new AudioContext(); this.initialized = true; } else { this.soundEnabled = false; this.musicEnabled = false; } } catch(e) { this.soundEnabled = false; this.musicEnabled = false; } }
    resumeAudio() { if(this.ctx && this.ctx.state === 'suspended') { this.ctx.resume().catch(e => console.warn("Ses engellendi.")); } }
    playTone(freq, type, duration, vol = 0.1) { if (!this.soundEnabled || !this.ctx || this.ctx.state === 'suspended') return; try { const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime); gain.gain.setValueAtTime(vol, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration); osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + duration); } catch(e) {} }
    jump() { if(!this.soundEnabled || !this.ctx || this.ctx.state === 'suspended') return; try { const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.type = 'square'; osc.frequency.setValueAtTime(300, this.ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.05, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1); osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.1); } catch(e) {} }
    coin() { this.playTone(900, 'sine', 0.1, 0.05); setTimeout(()=>this.playTone(1200, 'sine', 0.1, 0.05), 50); }
    hit() { this.playTone(150, 'sawtooth', 0.3, 0.1); }
    fall() { this.playTone(100, 'sine', 0.5, 0.1); }
    powerup() { this.playTone(600, 'sine', 0.1, 0.1); this.playTone(800, 'sine', 0.1, 0.1); }
    powerdown() { this.playTone(300, 'sawtooth', 0.2, 0.05); }
    stomp() { this.playTone(200, 'square', 0.15, 0.1); }
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.3, 0.1), i * 100)); }
    levelComplete() { [440, 554, 659].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.2, 0.1), i * 150)); }

    playMusic(type) {
        if (!this.musicEnabled) return;
        this.init(); this.stopMusic(); this.currentMusicType = type;
        const menuSeq = [220, null, 261, null, 329, null, 261, null];
        const gameSeq = [440, null, 554, 659, 440, null, 554, 659, 349, null, 440, 523, 329, null, 415, 493];
        const speed = type === 'menu' ? 300 : 180;
        const seq = type === 'menu' ? menuSeq : gameSeq;
        this.step = 0;
        
        this.musicInterval = setInterval(() => {
            if(!this.musicEnabled || !this.ctx || this.ctx.state === 'suspended') return;
            const note = seq[this.step % seq.length];
            if (note) {
                try {
                    const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
                    osc.type = type === 'menu' ? 'sine' : 'square';
                    osc.frequency.value = note;
                    gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (speed/1000) * 0.8);
                    osc.connect(gain); gain.connect(this.ctx.destination);
                    osc.start(); osc.stop(this.ctx.currentTime + (speed/1000));
                } catch(e) {}
            }
            this.step++;
        }, speed);
    }
    pauseMusic() { clearInterval(this.musicInterval); }
    resumeMusic() { if(this.currentMusicType && this.musicEnabled) this.playMusic(this.currentMusicType); }
    stopMusic() { clearInterval(this.musicInterval); this.musicInterval = null; }
}
const audio = new AudioSystem();

// ==================== PARÇACIK SİSTEMİ ====================
class ParticleSystem {
    constructor() { this.particles = []; this.maxParticles = 300; }
    spawn(x, y, color, count, type = 'burst') {
        if (game.settings.particles === 'off') return;
        const limit = game.settings.particles === 'low' ? Math.floor(count / 2) : count;
        for (let i = 0; i < limit && this.particles.length < this.maxParticles; i++) {
            const angle = type === 'run' ? Math.PI + (Math.random() * 0.5 - 0.25) : Math.random() * Math.PI * 2;
            const speed = type === 'run' ? Math.random() * 2 + 1 : Math.random() * 4 + 2;
            this.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (type === 'jump' || type === 'run' ? 2 : 0),
                life: 1, decay: Math.random() * 0.03 + 0.02, color, size: Math.random() * 5 + 2, gravity: type === 'run' ? 0.05 : 0.15
            });
        }
    }
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life -= p.decay; p.size *= 0.98;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }
    draw(ctx, cameraX) {
        for (const p of this.particles) { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - cameraX, p.y, p.size, p.size); }
        ctx.globalAlpha = 1;
    }
    clear() { this.particles = []; }
}
const particles = new ParticleSystem();

// ==================== AYARLAR VE DİNAMİK SEVİYELER ====================
const SETTINGS = { sound: true, music: true, particles: 'high', difficulty: 'normal', shadows: true, shake: true };
const DIFFICULTY = { 
    easy: { speed: 0.6, dmgMult: 0.5, startLives: 5 }, 
    normal: { speed: 1, dmgMult: 1, startLives: 3 }, 
    hard: { speed: 1.4, dmgMult: 2, startLives: 1 } 
};

const buildLevel = (name, theme, w, platforms, coins, enemies, powerups = []) => {
    return { name, theme, width: w, platforms, coins, enemies, powerups, decorations: [{x: 200, y: 580, type: 'rock', w:40, h:30}], flag: {x: w - 150, y: 400} };
}

const LEVELS = [
    {   name: "Yeşil Vadi", width: 3200, theme: 'grass',
        platforms: [{x: 0, y: 550, w: 600, h: 100, type: 'grass'}, {x: 750, y: 480, w: 200, h: 30, type: 'grass'}, {x: 1050, y: 400, w: 150, h: 30, type: 'stone'}, {x: 1300, y: 550, w: 400, h: 100, type: 'grass'}, {x: 1850, y: 450, w: 100, h: 30, type: 'wood'}, {x: 2100, y: 350, w: 100, h: 30, type: 'wood'}, {x: 2350, y: 500, w: 250, h: 30, type: 'grass'}, {x: 2750, y: 400, w: 450, h: 60, type: 'grass'}],
        coins: [{x: 800, y: 430}, {x: 850, y: 430}, {x: 1100, y: 350}, {x: 1400, y: 500}, {x: 1880, y: 400}, {x: 2130, y: 300}, {x: 2400, y: 450}, {x: 2850, y: 350}],
        enemies: [{x: 1450, y: 520, type: 'walker', range: 100}, {x: 2400, y: 470, type: 'walker', range: 80}],
        powerups: [{x: 1100, y: 350, type: 'speed'}],
        decorations: [{x: 100, y: 550, type: 'tree', w: 60, h: 120}, {x: 400, y: 550, type: 'bush', w: 60, h: 30}, {x: 1500, y: 550, type: 'tree', w: 50, h: 100}, {x: 2850, y: 400, type: 'bush', w: 80, h: 40}],
        flag: {x: 3050, y: 340}
    },
    {   name: "Mağara", width: 3600, theme: 'cave',
        platforms: [{x: 0, y: 500, w: 400, h: 150, type: 'stone'}, {x: 550, y: 400, w: 100, h: 30, type: 'stone'}, {x: 800, y: 300, w: 100, h: 30, type: 'stone'}, {x: 1050, y: 450, w: 300, h: 30, type: 'stone'}, {x: 1500, y: 550, w: 200, h: 100, type: 'stone'}, {x: 1850, y: 450, w: 80, h: 30, type: 'stone'}, {x: 2100, y: 350, w: 80, h: 30, type: 'stone'}, {x: 2350, y: 250, w: 300, h: 30, type: 'stone'}, {x: 2800, y: 450, w: 200, h: 30, type: 'stone'}, {x: 3200, y: 500, w: 400, h: 150, type: 'stone'}],
        coins: [{x: 580, y: 350}, {x: 830, y: 250}, {x: 1100, y: 400}, {x: 1150, y: 400}, {x: 1870, y: 400}, {x: 2120, y: 300}, {x: 2400, y: 200}, {x: 2450, y: 200}, {x: 2850, y: 400}, {x: 3300, y: 450}],
        enemies: [{x: 1150, y: 420, type: 'walker', range: 100}, {x: 1600, y: 520, type: 'walker', range: 60}, {x: 600, y: 350, type: 'flyer', range: 150, yRange: 50}, {x: 2500, y: 200, type: 'flyer', range: 100, yRange: 80}],
        powerups: [{x: 2450, y: 200, type: 'jump'}],
        decorations: [{x: 200, y: 500, type: 'rock', w: 40, h: 30}, {x: 1100, y: 450, type: 'stalagmite', w: 30, h: 60}, {x: 2400, y: 250, type: 'stalagmite', w: 40, h: 80}],
        flag: {x: 3450, y: 440}
    },
    {   name: "Gökyüzü Şatosu", width: 4000, theme: 'sky',
        platforms: [{x: 0, y: 550, w: 300, h: 40, type: 'cloud'}, {x: 450, y: 450, w: 120, h: 30, type: 'cloud'}, {x: 700, y: 350, w: 120, h: 30, type: 'cloud'}, {x: 1000, y: 250, w: 300, h: 40, type: 'cloud'}, {x: 1450, y: 400, w: 100, h: 30, type: 'cloud'}, {x: 1700, y: 550, w: 250, h: 40, type: 'cloud'}, {x: 2150, y: 450, w: 150, h: 30, type: 'cloud'}, {x: 2500, y: 300, w: 200, h: 30, type: 'cloud'}, {x: 2900, y: 400, w: 100, h: 30, type: 'cloud'}, {x: 3200, y: 500, w: 150, h: 30, type: 'cloud'}, {x: 3550, y: 400, w: 450, h: 40, type: 'cloud'}],
        coins: [{x: 490, y: 400}, {x: 740, y: 300}, {x: 1050, y: 200}, {x: 1100, y: 200}, {x: 1480, y: 350}, {x: 1800, y: 500}, {x: 2200, y: 400}, {x: 2550, y: 250}, {x: 2930, y: 350}, {x: 3250, y: 450}],
        enemies: [{x: 1150, y: 220, type: 'walker', range: 100}, {x: 1800, y: 520, type: 'walker', range: 80}, {x: 2550, y: 270, type: 'walker', range: 60}, {x: 600, y: 300, type: 'flyer', range: 150, yRange: 100}, {x: 2000, y: 350, type: 'flyer', range: 200, yRange: 150}, {x: 3050, y: 400, type: 'flyer', range: 100, yRange: 80}],
        powerups: [{x: 1150, y: 200, type: 'heart'}],
        decorations: [{x: 100, y: 550, type: 'cloud_dec', w: 80, h: 30}, {x: 1050, y: 250, type: 'cloud_dec', w: 100, h: 40}],
        flag: {x: 3800, y: 340}
    },
    {   name: "Volkanik Dağ", width: 4200, theme: 'lava',
        platforms: [{x: 0, y: 550, w: 250, h: 100, type: 'stone'}, {x: 400, y: 450, w: 80, h: 30, type: 'stone'}, {x: 650, y: 350, w: 80, h: 30, type: 'stone'}, {x: 900, y: 450, w: 300, h: 30, type: 'stone'}, {x: 1400, y: 550, w: 200, h: 100, type: 'stone'}, {x: 1800, y: 450, w: 100, h: 30, type: 'stone'}, {x: 2100, y: 300, w: 250, h: 30, type: 'stone'}, {x: 2550, y: 450, w: 80, h: 30, type: 'stone'}, {x: 2800, y: 550, w: 400, h: 100, type: 'stone'}, {x: 3400, y: 400, w: 150, h: 30, type: 'stone'}, {x: 3750, y: 500, w: 450, h: 100, type: 'stone'}],
        coins: [{x: 420, y: 400}, {x: 670, y: 300}, {x: 1000, y: 400}, {x: 1050, y: 400}, {x: 1450, y: 500}, {x: 1830, y: 400}, {x: 2200, y: 250}, {x: 2250, y: 250}, {x: 2900, y: 500}, {x: 2950, y: 500}, {x: 3450, y: 350}],
        enemies: [
            {x: 1000, y: 420, type: 'walker', range: 100}, {x: 2900, y: 520, type: 'walker', range: 150},
            {x: 1450, y: 520, type: 'jumper', range: 60, jumpInterval: 90}, {x: 2200, y: 270, type: 'jumper', range: 80, jumpInterval: 120},
            {x: 3000, y: 520, type: 'jumper', range: 100, jumpInterval: 80},
            {x: 950, y: 420, type: 'spike', range: 0}, {x: 3100, y: 520, type: 'spike', range: 0}
        ],
        powerups: [{x: 2200, y: 250, type: 'speed'}],
        decorations: [{x: 150, y: 550, type: 'stalagmite', w: 40, h: 80}, {x: 2850, y: 550, type: 'stalagmite', w: 50, h: 100}],
        flag: {x: 4000, y: 440}
    },
    {   name: "Kristal Zindan", width: 4500, theme: 'crystal',
        platforms: [{x: 0, y: 500, w: 300, h: 150, type: 'stone'}, {x: 450, y: 400, w: 100, h: 20, type: 'cloud'}, {x: 750, y: 300, w: 100, h: 20, type: 'cloud'}, {x: 1050, y: 450, w: 250, h: 30, type: 'stone'}, {x: 1500, y: 350, w: 80, h: 20, type: 'cloud'}, {x: 1750, y: 250, w: 200, h: 30, type: 'stone'}, {x: 2150, y: 400, w: 100, h: 30, type: 'stone'}, {x: 2450, y: 550, w: 350, h: 100, type: 'stone'}, {x: 3000, y: 450, w: 80, h: 20, type: 'cloud'}, {x: 3250, y: 300, w: 150, h: 30, type: 'stone'}, {x: 3600, y: 450, w: 100, h: 30, type: 'stone'}, {x: 3950, y: 500, w: 550, h: 150, type: 'stone'}],
        coins: [{x: 480, y: 350}, {x: 780, y: 250}, {x: 1150, y: 400}, {x: 1520, y: 300}, {x: 1850, y: 200}, {x: 2180, y: 350}, {x: 2600, y: 500}, {x: 2650, y: 500}, {x: 3020, y: 400}, {x: 3300, y: 250}, {x: 3630, y: 400}],
        enemies: [{x: 1150, y: 420, type: 'walker', range: 80}, {x: 2600, y: 520, type: 'walker', range: 120}, {x: 1850, y: 220, type: 'jumper', range: 60, jumpInterval: 100}, {x: 550, y: 350, type: 'flyer', range: 150, yRange: 100}, {x: 2300, y: 450, type: 'flyer', range: 200, yRange: 150}, {x: 3280, y: 270, type: 'spike', range:0}],
        powerups: [{x: 1850, y: 200, type: 'jump'}],
        decorations: [{x: 1100, y: 450, type: 'rock', w: 50, h: 40}, {x: 2500, y: 550, type: 'stalagmite', w: 40, h: 90}],
        flag: {x: 4300, y: 440}
    },
    {   name: "Buzul Zirvesi", width: 4800, theme: 'ice',
        platforms: [{x: 0, y: 550, w: 400, h: 100, type: 'stone'}, {x: 600, y: 450, w: 150, h: 30, type: 'stone'}, {x: 950, y: 350, w: 100, h: 30, type: 'stone'}, {x: 1250, y: 250, w: 250, h: 30, type: 'stone'}, {x: 1700, y: 450, w: 80, h: 30, type: 'stone'}, {x: 2000, y: 550, w: 300, h: 100, type: 'stone'}, {x: 2500, y: 400, w: 150, h: 30, type: 'stone'}, {x: 2850, y: 250, w: 200, h: 30, type: 'stone'}, {x: 3250, y: 400, w: 100, h: 30, type: 'stone'}, {x: 3550, y: 550, w: 250, h: 100, type: 'stone'}, {x: 4000, y: 450, w: 150, h: 30, type: 'stone'}, {x: 4350, y: 500, w: 450, h: 150, type: 'stone'}],
        coins: [{x: 650, y: 400}, {x: 980, y: 300}, {x: 1350, y: 200}, {x: 1400, y: 200}, {x: 2100, y: 500}, {x: 2150, y: 500}, {x: 2550, y: 350}, {x: 2900, y: 200}, {x: 3300, y: 350}, {x: 3650, y: 500}, {x: 4050, y: 400}],
        enemies: [
            {x: 1350, y: 220, type: 'walker', range: 80}, {x: 2150, y: 520, type: 'walker', range: 100},
            {x: 2950, y: 220, type: 'jumper', range: 50, jumpInterval: 100}, {x: 800, y: 350, type: 'flyer', range: 150, yRange: 100},
            {x: 2700, y: 350, type: 'flyer', range: 150, yRange: 150},
            {x: 3800, y: 250, type: 'ghost', range: 0, isHiding: false}
        ],
        powerups: [{x: 2950, y: 200, type: 'heart'}],
        decorations: [{x: 150, y: 550, type: 'stalagmite', w: 40, h: 70}, {x: 2100, y: 550, type: 'rock', w: 50, h: 40}],
        flag: {x: 4600, y: 440}
    },
    {   name: "Çöl Harabeleri", width: 5000, theme: 'desert',
        platforms: [{x: 0, y: 550, w: 300, h: 100, type: 'stone'}, {x: 500, y: 500, w: 100, h: 150, type: 'wood'}, {x: 800, y: 400, w: 100, h: 250, type: 'wood'}, {x: 1100, y: 300, w: 200, h: 30, type: 'stone'}, {x: 1500, y: 450, w: 150, h: 30, type: 'stone'}, {x: 1850, y: 550, w: 350, h: 100, type: 'stone'}, {x: 2400, y: 400, w: 80, h: 30, type: 'wood'}, {x: 2700, y: 300, w: 80, h: 30, type: 'wood'}, {x: 3000, y: 200, w: 250, h: 30, type: 'stone'}, {x: 3500, y: 450, w: 200, h: 30, type: 'stone'}, {x: 3900, y: 550, w: 300, h: 100, type: 'stone'}, {x: 4400, y: 450, w: 150, h: 30, type: 'wood'}, {x: 4700, y: 500, w: 300, h: 150, type: 'stone'}],
        coins: [{x: 530, y: 450}, {x: 830, y: 350}, {x: 1200, y: 250}, {x: 1550, y: 400}, {x: 2000, y: 500}, {x: 2050, y: 500}, {x: 2420, y: 350}, {x: 2720, y: 250}, {x: 3100, y: 150}, {x: 3150, y: 150}, {x: 3600, y: 400}, {x: 4050, y: 500}],
        enemies: [{x: 1200, y: 270, type: 'walker', range: 80}, {x: 2000, y: 520, type: 'walker', range: 120}, {x: 3100, y: 170, type: 'jumper', range: 100, jumpInterval: 80}, {x: 4000, y: 520, type: 'jumper', range: 80, jumpInterval: 100}, {x: 650, y: 350, type: 'flyer', range: 150, yRange: 100}, {x: 2600, y: 250, type: 'flyer', range: 200, yRange: 150}, {x: 3750, y: 400, type: 'flyer', range: 150, yRange: 100}, {x: 1120, y: 270, type: 'spike', range: 0}, {x: 3520, y: 420, type: 'spike', range: 0}],
        powerups: [{x: 3150, y: 150, type: 'speed'}],
        decorations: [{x: 150, y: 550, type: 'rock', w: 60, h: 40}, {x: 1950, y: 550, type: 'bush', w: 80, h: 30}],
        flag: {x: 4850, y: 440}
    },
    {   name: "Zehirli Bataklık", width: 5200, theme: 'swamp',
        platforms: [{x: 0, y: 550, w: 200, h: 100, type: 'grass'}, {x: 400, y: 500, w: 80, h: 30, type: 'wood'}, {x: 700, y: 450, w: 80, h: 30, type: 'wood'}, {x: 1000, y: 400, w: 150, h: 30, type: 'grass'}, {x: 1400, y: 300, w: 80, h: 30, type: 'wood'}, {x: 1700, y: 200, w: 200, h: 30, type: 'grass'}, {x: 2100, y: 350, w: 80, h: 30, type: 'wood'}, {x: 2400, y: 500, w: 300, h: 150, type: 'grass'}, {x: 2900, y: 400, w: 80, h: 30, type: 'wood'}, {x: 3200, y: 300, w: 80, h: 30, type: 'wood'}, {x: 3500, y: 200, w: 250, h: 30, type: 'grass'}, {x: 4000, y: 350, w: 150, h: 30, type: 'wood'}, {x: 4400, y: 500, w: 100, h: 30, type: 'wood'}, {x: 4800, y: 550, w: 400, h: 100, type: 'grass'}],
        coins: [{x: 420, y: 450}, {x: 720, y: 400}, {x: 1050, y: 350}, {x: 1420, y: 250}, {x: 1780, y: 150}, {x: 1830, y: 150}, {x: 2120, y: 300}, {x: 2500, y: 450}, {x: 2550, y: 450}, {x: 2920, y: 350}, {x: 3220, y: 250}, {x: 3600, y: 150}, {x: 4050, y: 300}, {x: 4430, y: 450}],
        enemies: [{x: 1050, y: 370, type: 'jumper', range: 50, jumpInterval: 80}, {x: 1800, y: 170, type: 'walker', range: 80}, {x: 2550, y: 470, type: 'walker', range: 100}, {x: 3600, y: 170, type: 'walker', range: 100}, {x: 850, y: 350, type: 'flyer', range: 150, yRange: 150}, {x: 2250, y: 350, type: 'flyer', range: 150, yRange: 150}, {x: 3350, y: 250, type: 'flyer', range: 150, yRange: 150}, {x: 4200, y: 400, type: 'flyer', range: 150, yRange: 100}, {x: 2600, y: 470, type: 'spike', range: 0}],
        powerups: [{x: 1830, y: 150, type: 'jump'}, {x: 2450, y: 450, type: 'shield'}], 
        decorations: [{x: 100, y: 550, type: 'tree', w: 50, h: 100}, {x: 2450, y: 500, type: 'bush', w: 80, h: 40}],
        flag: {x: 5050, y: 490}
    },
    {   name: "Uzay Üssü", width: 5500, theme: 'space',
        platforms: [{x: 0, y: 500, w: 300, h: 150, type: 'stone'}, {x: 500, y: 400, w: 150, h: 20, type: 'cloud'}, {x: 850, y: 300, w: 150, h: 20, type: 'cloud'}, {x: 1200, y: 200, w: 250, h: 30, type: 'stone'}, {x: 1700, y: 350, w: 100, h: 20, type: 'cloud'}, {x: 2050, y: 500, w: 300, h: 150, type: 'stone'}, {x: 2600, y: 400, w: 100, h: 20, type: 'cloud'}, {x: 2900, y: 250, w: 100, h: 20, type: 'cloud'}, {x: 3250, y: 150, w: 300, h: 30, type: 'stone'}, {x: 3800, y: 300, w: 150, h: 20, type: 'cloud'}, {x: 4200, y: 450, w: 200, h: 30, type: 'stone'}, {x: 4650, y: 350, w: 100, h: 20, type: 'cloud'}, {x: 5000, y: 500, w: 500, h: 150, type: 'stone'}],
        coins: [{x: 550, y: 350}, {x: 900, y: 250}, {x: 1300, y: 150}, {x: 1350, y: 150}, {x: 1730, y: 300}, {x: 2150, y: 450}, {x: 2200, y: 450}, {x: 2630, y: 350}, {x: 2930, y: 200}, {x: 3350, y: 100}, {x: 3400, y: 100}, {x: 3850, y: 250}, {x: 4280, y: 400}, {x: 4680, y: 300}],
        enemies: [{x: 1300, y: 170, type: 'walker', range: 100}, {x: 2150, y: 470, type: 'walker', range: 120}, {x: 3400, y: 120, type: 'jumper', range: 100, jumpInterval: 70}, {x: 4300, y: 420, type: 'jumper', range: 80, jumpInterval: 90}, {x: 650, y: 300, type: 'flyer', range: 150, yRange: 200}, {x: 1850, y: 250, type: 'flyer', range: 150, yRange: 200}, {x: 2750, y: 350, type: 'flyer', range: 150, yRange: 150}, {x: 4000, y: 350, type: 'flyer', range: 200, yRange: 200}, {x: 4220, y: 420, type: 'spike', range: 0}],
        powerups: [{x: 3400, y: 100, type: 'speed'}, {x: 2150, y: 450, type: 'shield'}],
        decorations: [{x: 100, y: 500, type: 'rock', w: 60, h: 50}, {x: 2200, y: 500, type: 'stalagmite', w: 40, h: 80}],
        flag: {x: 5300, y: 440}
    },
    {   name: "Cehennemin Dibi", width: 6000, theme: 'final',
        platforms: [{x: 0, y: 550, w: 200, h: 100, type: 'stone'}, {x: 350, y: 450, w: 80, h: 30, type: 'stone'}, {x: 600, y: 350, w: 80, h: 30, type: 'stone'}, {x: 850, y: 250, w: 80, h: 30, type: 'stone'}, {x: 1100, y: 150, w: 200, h: 30, type: 'stone'}, {x: 1500, y: 300, w: 100, h: 30, type: 'stone'}, {x: 1800, y: 450, w: 100, h: 30, type: 'stone'}, {x: 2100, y: 600, w: 400, h: 50, type: 'stone'}, {x: 2700, y: 450, w: 80, h: 30, type: 'stone'}, {x: 3000, y: 300, w: 80, h: 30, type: 'stone'}, {x: 3300, y: 150, w: 300, h: 30, type: 'stone'}, {x: 3800, y: 300, w: 100, h: 30, type: 'stone'}, {x: 4100, y: 450, w: 150, h: 30, type: 'stone'}, {x: 4500, y: 550, w: 300, h: 100, type: 'stone'}, {x: 5000, y: 400, w: 100, h: 30, type: 'stone'}, {x: 5300, y: 250, w: 100, h: 30, type: 'stone'}, {x: 5600, y: 500, w: 400, h: 150, type: 'stone'}],
        coins: [{x: 380, y: 400}, {x: 630, y: 300}, {x: 880, y: 200}, {x: 1150, y: 100}, {x: 1200, y: 100}, {x: 1530, y: 250}, {x: 1830, y: 400}, {x: 2200, y: 550}, {x: 2250, y: 550}, {x: 2300, y: 550}, {x: 2730, y: 400}, {x: 3030, y: 250}, {x: 3400, y: 100}, {x: 3450, y: 100}, {x: 3830, y: 250}, {x: 4150, y: 400}, {x: 4600, y: 500}, {x: 4650, y: 500}, {x: 5030, y: 350}, {x: 5330, y: 200}],
        enemies: [
            {x: 1150, y: 120, type: 'jumper', range: 80, jumpInterval: 60}, {x: 2200, y: 570, type: 'walker', range: 150},
            {x: 3450, y: 120, type: 'jumper', range: 100, jumpInterval: 60}, {x: 4600, y: 520, type: 'walker', range: 100},
            {x: 450, y: 300, type: 'flyer', range: 100, yRange: 200}, {x: 950, y: 200, type: 'flyer', range: 100, yRange: 200},
            {x: 1650, y: 350, type: 'flyer', range: 150, yRange: 200}, {x: 2850, y: 350, type: 'flyer', range: 150, yRange: 200},
            {x: 3950, y: 350, type: 'flyer', range: 150, yRange: 200}, {x: 5150, y: 300, type: 'flyer', range: 100, yRange: 200},
            {x: 2300, y: 100, type: 'ghost', range: 0, isHiding: false}, {x: 4700, y: 100, type: 'ghost', range: 0, isHiding: false}
        ],
        powerups: [{x: 1250, y: 100, type: 'heart'}, {x: 3500, y: 100, type: 'shield'}],
        decorations: [{x: 100, y: 550, type: 'stalagmite', w: 50, h: 100}, {x: 2300, y: 600, type: 'stalagmite', w: 60, h: 150}, {x: 4650, y: 550, type: 'stalagmite', w: 40, h: 80}],
        flag: {x: 5850, y: 440}
    }
];


// ==================== OYUN MOTORU ====================
class Game {
    constructor() {
        this.state = 'loading'; this.uiState = 'loadingScreen'; 
        this.settings = {...SETTINGS};
        
        this.level = 0; this.score = 0; this.lives = 3; this.coins = 0; this.totalCoins = 0;
        this.levelTime = 0; this.totalTime = 0;
        this.camera = {x: 0, y: 0}; this.shake = 0;
        this.loopRunning = false;
        
        this.highScore = this.getSafeStorage('macera2d_rekor', 0);
        this.unlockedLevel = this.getSafeStorage('macera2d_unlocked', 1);
        
        const hsEl = document.getElementById('menuHighScore'); if(hsEl) hsEl.textContent = this.highScore;
        const hstEl = document.getElementById('highScoreText'); if(hstEl) hstEl.textContent = this.highScore;

        this.player = { 
            x: 50, y: 400, w: 32, h: 32, vx: 0, vy: 0, onGround: false, facingRight: true, 
            jumps: 0, maxJumps: 2, invincible: 0, shieldTime: 0, speedBoost: 0, jumpBoost: 0, 
            anim: {frame: 0, timer: 0}, coyoteFrames: 0, jumpBuffer: 0,
            scale: {x: 1, y: 1}, trails: []
        };
        
        this.currentLevel = null; this.floatTexts = [];
        this.keys = {}; this.jumpPressed = false;
        this.lastTime = 0; this.accumulator = 0; this.step = 1000 / 60;
        this.bgStars = Array.from({length: 150}, () => ({ x: Math.random() * 6000, y: Math.random() * 640, size: Math.random() * 2 + 0.5, speed: Math.random() * 0.3 + 0.05, brightness: Math.random() }));
        
        this.bindEvents(); this.bindButtons(); 
        this.simulateLoading();

        // TAM EKRAN SENKRONİZASYONU (ESC tuşuna basıldığında ayarı günceller ve oyunu duraklatır)
        document.addEventListener('fullscreenchange', () => {
            const el = document.getElementById('fullscreenToggle');
            if (!document.fullscreenElement) {
                if(el){
                    el.classList.remove('active');
                    const lbl = el.querySelector('.toggle-label');
                    if (lbl) lbl.textContent = "Kapalı";
                }
                // Tam ekrandan çıkıldığında oyun oynanıyorsa otomatik duraklat
                if(this.state === 'playing') {
                    this.pause();
                }
            } else {
                if(el){
                    el.classList.add('active');
                    const lbl = el.querySelector('.toggle-label');
                    if (lbl) lbl.textContent = "Açık";
                }
            }
        });

        const startAudio = () => {
            audio.init(); audio.resumeAudio();
            if(this.state === 'menu' && this.settings.music) audio.playMusic('menu');
            document.removeEventListener('click', startAudio); document.removeEventListener('keydown', startAudio);
        };
        document.addEventListener('click', startAudio); document.addEventListener('keydown', startAudio);
    }

    getSafeStorage(key, def) { try { return parseInt(localStorage.getItem(key)) || def; } catch(e) { return def; } }
    setSafeStorage(key, val) { try { localStorage.setItem(key, val); } catch(e) {} }

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        if(screenId) { 
            const el = document.getElementById(screenId);
            if(el) { el.classList.remove('hidden'); this.uiState = screenId; }
        }
    }

    simulateLoading() {
        let prog = 0;
        const interval = setInterval(() => {
            prog += Math.random() * 25;
            const bar = document.getElementById('loadingProgress');
            if(prog >= 100) {
                prog = 100; if(bar) bar.style.width = prog + '%';
                clearInterval(interval); setTimeout(() => { this.showMenu(); }, 300);
            } else { if(bar) bar.style.width = prog + '%'; }
        }, 100);
    }
    
    buildLevelGrid() {
        const grid = document.getElementById('levelGrid');
        if(!grid) return;
        grid.innerHTML = '';
        for(let i = 0; i < LEVELS.length; i++) {
            const isUnlocked = i < this.unlockedLevel;
            const btn = document.createElement('button');
            btn.className = `lvl-btn ${isUnlocked ? 'unlocked' : ''}`;
            btn.textContent = isUnlocked ? (i + 1) : '🔒';
            btn.disabled = !isUnlocked;
            if(isUnlocked) {
                btn.onclick = () => {
                    this.totalTime = 0; this.score = 0; this.coins = 0;
                    this.startLevel(i);
                };
            }
            grid.appendChild(btn);
        }
    }

    bindButtons() {
        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) { el.addEventListener('click', (e) => { e.target.blur(); fn(); }); }
        };
        
        bind('btnStart', () => { this.buildLevelGrid(); this.switchScreen('levelSelectScreen'); });
        bind('btnBackToMenu', () => this.showMenu());
        bind('btnSettings', () => { this.previousScreen = 'startScreen'; this.switchScreen('settingsScreen'); });
        bind('btnPauseSettings', () => { this.previousScreen = 'pauseScreen'; this.switchScreen('settingsScreen'); });
        bind('btnSaveSettings', () => { this.switchScreen(this.previousScreen); });
        
        bind('soundToggle', () => this.toggleSetting('sound'));
        bind('musicToggle', () => { this.toggleSetting('music'); if(!this.settings.music) audio.stopMusic(); else audio.playMusic(this.state === 'menu' ? 'menu' : 'game'); });
        bind('particlesToggle', () => this.toggleSetting('particles'));
        bind('shadowsToggle', () => this.toggleSetting('shadows'));
        bind('shakeToggle', () => this.toggleSetting('shake'));
        bind('fullscreenToggle', () => this.toggleFullscreen());
        
        const diff = document.getElementById('difficulty');
        if(diff) diff.addEventListener('change', (e) => { this.setDifficulty(e.target.value); e.target.blur(); });
        
        bind('btnResume', () => this.resume());
        bind('btnPauseRestart', () => this.startLevel(this.level));
        bind('btnPauseLevels', () => { this.buildLevelGrid(); this.switchScreen('levelSelectScreen'); });
        bind('btnPauseMenu', () => this.showMenu());
        
        bind('btnNextLevel', () => this.startLevel(this.level + 1));
        bind('btnLCRetry', () => this.startLevel(this.level));
        bind('btnLCLevels', () => { this.buildLevelGrid(); this.switchScreen('levelSelectScreen'); });
        
        bind('btnGameOverRestart', () => this.startLevel(this.level));
        bind('btnGameOverLevels', () => { this.buildLevelGrid(); this.switchScreen('levelSelectScreen'); });
        bind('btnGameOverMenu', () => this.showMenu());
        bind('btnWinRestart', () => { this.buildLevelGrid(); this.switchScreen('levelSelectScreen'); });
        bind('btnWinMenu', () => this.showMenu());
    }
    
    bindEvents() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true; this.keys[e.key] = true;
            if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
            
            // ESC TUŞU İLE HEM ÇIKIŞ HEM DURAKLATMA MANTIĞI EKLENDİ
            if (e.code === 'Escape') {
                if (this.state === 'playing') {
                    this.pause();
                    if(document.fullscreenElement) {
                        document.exitFullscreen().catch(()=>{});
                    }
                }
                else if (this.state === 'paused' && this.uiState === 'pauseScreen') this.resume();
                else if (this.uiState === 'settingsScreen') this.switchScreen(this.previousScreen);
                else if (this.uiState === 'levelSelectScreen') this.showMenu();
            }
            
            if (e.code === 'Enter') {
                if (this.uiState === 'startScreen') { this.buildLevelGrid(); this.switchScreen('levelSelectScreen'); }
                else if (this.uiState === 'pauseScreen') this.resume();
                else if (this.uiState === 'gameOverScreen') this.startLevel(this.level);
                else if (this.uiState === 'levelCompleteScreen') { const btn = document.getElementById('btnNextLevel'); if(btn) btn.click(); }
                else if (this.uiState === 'winScreen') this.showMenu();
            }
            if (['Space', 'KeyW', 'ArrowUp', 'w', 'W'].includes(e.key) && !this.jumpPressed) { this.player.jumpBuffer = 10; }
        }, {passive: false});
        
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false; this.keys[e.key] = false;
            if (['Space', 'KeyW', 'ArrowUp', 'w', 'W'].includes(e.key)) {
                this.jumpPressed = false;
                if (this.player.vy < -5) this.player.vy = -5; 
            }
        });
    }
    
    toggleSetting(key) {
        const el = document.getElementById(key + 'Toggle');
        if(!el) return;
        if (key === 'particles') {
            const vals = ['off', 'low', 'high'];
            this.settings.particles = vals[(vals.indexOf(this.settings.particles) + 1) % vals.length];
            const lbl = el.querySelector('.toggle-label'); if(lbl) lbl.textContent = this.settings.particles === 'off' ? 'Kapalı' : this.settings.particles === 'low' ? 'Düşük' : 'Yüksek';
            el.classList.toggle('active', this.settings.particles !== 'off');
        } else {
            this.settings[key] = !this.settings[key];
            el.classList.toggle('active', this.settings[key]);
            const lbl = el.querySelector('.toggle-label'); if(lbl) lbl.textContent = this.settings[key] ? 'Açık' : 'Kapalı';
            if (key === 'sound') audio.soundEnabled = this.settings.sound;
            if (key === 'music') audio.musicEnabled = this.settings.music;
        }
    }

    toggleFullscreen() {
        const el = document.getElementById('fullscreenToggle');
        if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => console.log(err)); } 
        else { document.exitFullscreen().catch(()=>{}); }
    }
    
    setDifficulty(val) { this.settings.difficulty = val; }
    
    updateData() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.setSafeStorage('macera2d_rekor', this.highScore);
            const hst = document.getElementById('highScoreText'); if(hst) hst.textContent = this.highScore;
            const mhs = document.getElementById('menuHighScore'); if(mhs) mhs.textContent = this.highScore;
        }
        this.setSafeStorage('macera2d_unlocked', this.unlockedLevel);
    }

    formatTime(ms) {
        let totalSeconds = Math.floor(ms / 1000);
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateTimeHUD() {
        const ltt = document.getElementById('levelTimeText'); if(ltt) ltt.textContent = this.formatTime(this.levelTime);
        const ttt = document.getElementById('totalTimeText'); if(ttt) ttt.textContent = this.formatTime(this.totalTime);
    }

    startLevel(idx) {
        audio.init(); audio.resumeAudio(); this.stopLoop(); audio.playMusic('game'); 
        
        this.state = 'playing'; this.level = idx; 
        this.levelTime = 0; 
        
        const diff = DIFFICULTY[this.settings.difficulty];
        this.lives = diff.startLives; 

        this.totalCoins = LEVELS[idx].coins.length; 
        
        this.switchScreen(null); 
        const hud = document.getElementById('hud'); if(hud) hud.classList.add('active');
        
        particles.clear();
        this.currentLevel = JSON.parse(JSON.stringify(LEVELS[idx]));
        
        this.currentLevel.enemies.forEach(e => { 
            e.vx = (e.type === 'flyer' || e.type === 'ghost' ? 1.2 : 1.0) * diff.speed; 
            e.origX = e.x; e.origY = e.y; e.timer = 0; e.dead = false; e.onGround = true; 
        });
        
        this.player = { ...this.player, x: 50, y: 400, vx: 0, vy: 0, jumps: 0, invincible: 0, shieldTime: 0, speedBoost: 0, jumpBoost: 0, coyoteFrames: 0, jumpBuffer: 0, scale: {x: 1, y: 1}, trails: [] };
        
        if(this.currentLevel.platforms[0] && this.currentLevel.platforms[0].y < 400) { 
            this.player.y = this.currentLevel.platforms[0].y - 50; 
        }

        this.camera.x = 0; this.shake = 0; this.floatTexts = [];
        
        const lt = document.getElementById('levelText'); if(lt) lt.textContent = `${idx + 1} / ${LEVELS.length}`;
        this.updateHearts(); this.updateScore(); this.updatePowerups(); this.updateTimeHUD();

        this.lastTime = performance.now(); this.accumulator = 0; this.loopRunning = true;
        requestAnimationFrame(t => this.loop(t));
    }
    
    restart() { this.startLevel(this.level); }
    pause() { if (this.state !== 'playing') return; this.state = 'paused'; audio.pauseMusic(); this.switchScreen('pauseScreen'); }
    resume() { if (this.state !== 'paused') return; this.state = 'playing'; audio.resumeMusic(); this.switchScreen(null); this.lastTime = performance.now(); this.accumulator = 0; if (!this.loopRunning) { this.loopRunning = true; requestAnimationFrame(t => this.loop(t)); } }
    showMenu() { this.stopLoop(); this.state = 'menu'; audio.playMusic('menu'); particles.clear(); const hud = document.getElementById('hud'); if(hud) hud.classList.remove('active'); this.switchScreen('startScreen'); this.drawMenuBg(); }
    stopLoop() { this.loopRunning = false; }
    
    levelComplete() {
        this.updateData(); this.stopLoop(); audio.levelComplete();
        this.unlockedLevel = Math.max(this.unlockedLevel, this.level + 2); 
        this.updateData();

        const lct = document.getElementById('lcTime'); if(lct) lct.textContent = this.formatTime(this.levelTime);
        const lcc = document.getElementById('lcCoins'); if(lcc) lcc.textContent = `${this.coins}`;

        if (this.level + 1 >= LEVELS.length) {
            this.win();
        } else {
            this.state = 'levelcomplete';
            this.switchScreen('levelCompleteScreen');
        }
    }

    win() { 
        audio.stopMusic(); this.updateData(); this.stopLoop(); this.state = 'win'; audio.win(); 
        const ws = document.getElementById('winScore'); if(ws) ws.textContent = this.score; 
        const wt = document.getElementById('winTime'); if(wt) wt.textContent = this.formatTime(this.totalTime); 
        this.switchScreen('winScreen'); 
    }
    
    gameOver() { 
        audio.stopMusic(); this.updateData(); this.stopLoop(); this.state = 'gameover'; 
        const fs = document.getElementById('finalScore'); if(fs) fs.textContent = this.score; 
        const fc = document.getElementById('finalCoins'); if(fc) fc.textContent = this.coins; 
        const got = document.getElementById('gameOverTime'); if(got) got.textContent = this.formatTime(this.totalTime); 
        this.switchScreen('gameOverScreen'); 
    }
    
    update(dt) {
        if (this.state !== 'playing') return;
        
        this.levelTime += dt; this.totalTime += dt;
        this.updateTimeHUD();

        const p = this.player; const diff = DIFFICULTY[this.settings.difficulty];
        const wasOnGround = p.onGround;

        if (p.onGround) p.coyoteFrames = 6; else p.coyoteFrames--;
        if (p.jumpBuffer > 0) p.jumpBuffer--;

        const isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['Shift'];
        const maxSpeed = p.speedBoost > 0 ? 12 : (isRunning ? 10.5 : 4.5);
        const accel = isRunning ? 1.5 : 0.8;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['a']) { p.vx -= accel; p.facingRight = false; }
        if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['d']) { p.vx += accel; p.facingRight = true; }
        p.vx *= 0.82; p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
        
        if (isRunning && p.onGround && Math.abs(p.vx) > 4 && p.anim.timer % 3 === 0) particles.spawn(p.x + p.w/2, p.y + p.h, 'rgba(255,255,255,0.5)', 2, 'run');
        if (Math.abs(p.vx) > 6 || p.speedBoost > 0) { if(p.trails.length > 5) p.trails.shift(); p.trails.push({x: p.x, y: p.y, scaleX: p.scale.x, scaleY: p.scale.y}); } 
        else { if(p.trails.length > 0) p.trails.shift(); }

        if (p.jumpBuffer > 0 && !this.jumpPressed) {
            if (p.coyoteFrames > 0 || (p.jumps > 0 && p.jumps < p.maxJumps)) {
                p.vy = p.jumpBoost > 0 ? -16 : -13.5; 
                p.jumps++; p.onGround = false; p.coyoteFrames = 0; p.jumpBuffer = 0; p.scale.x = 0.6; p.scale.y = 1.4; 
                audio.jump(); particles.spawn(p.x + p.w/2, p.y + p.h, p.jumps === 2 ? '#4ecdc4' : '#fff', 8, 'jump');
            }
            this.jumpPressed = true;
        }
        
        p.vy += 0.6; if (p.vy > 14) p.vy = 14; p.x += p.vx; p.y += p.vy; 
        
        if (p.y > 700) { this.takeDamage(1, true); return; } 
        
        p.onGround = false;
        for (const plat of this.currentLevel.platforms) {
            if (this.rectIntersect(p.x, p.y, p.w, p.h, plat.x, plat.y, plat.w, plat.h)) {
                const overlapTop = (p.y + p.h) - plat.y; const overlapBottom = (plat.y + plat.h) - p.y; const overlapLeft = (p.x + p.w) - plat.x; const overlapRight = (plat.x + plat.w) - p.x;
                const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);
                if (minOverlap === overlapTop && p.vy >= 0) { p.y = plat.y - p.h; p.vy = 0; p.onGround = true; p.jumps = 0; }
                else if (minOverlap === overlapBottom && p.vy < 0) { p.y = plat.y + plat.h; p.vy = 0; }
                else if (minOverlap === overlapLeft && p.vx > 0) { p.x = plat.x - p.w; p.vx = 0; }
                else if (minOverlap === overlapRight && p.vx < 0) { p.x = plat.x + plat.w; p.vx = 0; }
            }
        }
        
        if (p.onGround && !wasOnGround) { p.scale.x = 1.4; p.scale.y = 0.6; if(p.vy > 10) particles.spawn(p.x + p.w/2, p.y + p.h, '#fff', 5, 'jump'); }
        p.scale.x += (1 - p.scale.x) * 0.15; p.scale.y += (1 - p.scale.y) * 0.15;
        if (p.x < 0) { p.x = 0; p.vx = 0; }
        if (p.x > this.currentLevel.width - p.w) { p.x = this.currentLevel.width - p.w; p.vx = 0; }
        p.anim.timer++; if (Math.abs(p.vx) > 0.5 && p.onGround) { if (p.anim.timer > (isRunning ? 4 : 8)) { p.anim.frame = (p.anim.frame + 1) % 4; p.anim.timer = 0; } } else p.anim.frame = 0;
        
        for (const coin of this.currentLevel.coins) {
            if (!coin.collected && this.rectIntersect(p.x, p.y, p.w, p.h, coin.x, coin.y, 20, 20)) {
                coin.collected = true; this.coins++; this.score += 10; audio.coin();
                particles.spawn(coin.x + 10, coin.y + 10, '#ffd700', 12, 'burst'); this.addFloatText(coin.x, coin.y - 10, '+10', '#ffd700'); this.updateScore();
            }
        }
        for (const pow of this.currentLevel.powerups) {
            if (!pow.collected && this.rectIntersect(p.x, p.y, p.w, p.h, pow.x, pow.y, 30, 30)) { pow.collected = true; this.applyPowerup(pow.type); }
        }
        
        for (const enemy of this.currentLevel.enemies) {
            if (enemy.dead || enemy.y > 1000) continue;
            enemy.timer++;
            
            if (enemy.type === 'walker') { 
                enemy.x += enemy.vx; if (enemy.x <= enemy.origX - enemy.range || enemy.x >= enemy.origX + enemy.range) enemy.vx *= -1; 
            }
            else if (enemy.type === 'flyer') { 
                enemy.x = enemy.origX + Math.sin(enemy.timer * 0.02) * enemy.range; 
                enemy.y = enemy.origY + Math.cos(enemy.timer * 0.025) * (enemy.yRange || 50); 
            }
            else if (enemy.type === 'jumper') {
                if (enemy.timer % enemy.jumpInterval === 0 && enemy.onGround) { enemy.vy = -12; enemy.onGround = false; }
                enemy.vy += 0.6; enemy.y += enemy.vy;
                if (enemy.y >= enemy.origY) { enemy.y = enemy.origY; enemy.vy = 0; enemy.onGround = true; }
                enemy.x = enemy.origX + Math.sin(enemy.timer * 0.015) * enemy.range;
            }
            else if (enemy.type === 'ghost') {
                const dx = p.x - enemy.x; const dy = p.y - enemy.y;
                const dist = Math.hypot(dx, dy);
                
                const isLookingAtGhost = (p.facingRight && dx < 0) || (!p.facingRight && dx > 0);

                if (dist < 600) { 
                    if (isLookingAtGhost) {
                        enemy.isHiding = true;
                        enemy.x += (dx / dist) * 0.2;
                        enemy.y += (dy / dist) * 0.2;
                    } else {
                        enemy.isHiding = false;
                        enemy.x += (dx / dist) * 2.5 * diff.speed;
                        enemy.y += (dy / dist) * 2.5 * diff.speed;
                    }
                } else {
                    enemy.isHiding = true; 
                }
            }

            if (p.invincible <= 0 && p.shieldTime <= 0 && this.rectIntersect(p.x, p.y, p.w, p.h, enemy.x, enemy.y, 30, 30)) {
                if (enemy.type === 'spike') {
                    this.takeDamage(1); return;
                }
                else if (p.vy > 0 && (p.y + p.h) < (enemy.y + 20)) {
                    enemy.dead = true; p.vy = -10; this.score += 50; audio.stomp(); 
                    particles.spawn(enemy.x + 15, enemy.y, '#ff4757', 15, 'burst');
                    this.addFloatText(enemy.x, enemy.y - 30, '+50', '#ff6b6b'); 
                    this.updateScore(); 
                    if(this.settings.shake) this.shake = 5;
                } else { 
                    this.takeDamage(1); return; 
                }
            }
        }
        
        const flag = this.currentLevel.flag;
        if (this.rectIntersect(p.x, p.y, p.w, p.h, flag.x, flag.y, 40, 60)) {
            this.score += 100; this.updateScore(); this.addFloatText(flag.x, flag.y - 40, 'BÖLÜM BİTTİ!', '#2ed573');
            particles.spawn(flag.x + 20, flag.y + 30, '#2ed573', 40, 'burst'); 
            this.levelComplete(); return;
        }
        
        if (p.speedBoost > 0) { p.speedBoost--; if (p.speedBoost === 0) { audio.powerdown(); this.addFloatText(p.x, p.y - 20, 'Hız Bitti!', '#ff4757'); } }
        if (p.jumpBoost > 0) { p.jumpBoost--; if (p.jumpBoost === 0) { audio.powerdown(); this.addFloatText(p.x, p.y - 20, 'Zıplama Bitti!', '#ff4757'); } }
        if (p.shieldTime > 0) { p.shieldTime--; if (p.shieldTime === 0) { audio.powerdown(); this.addFloatText(p.x, p.y - 20, 'Kalkan Bitti!', '#ff4757'); } }
        if (p.invincible > 0) p.invincible--;
        
        const lookAhead = (p.vx * 12); const targetCam = p.x - canvas.width / 2.5 + lookAhead;
        this.camera.x += (targetCam - this.camera.x) * 0.1; this.camera.x = Math.max(0, Math.min(this.camera.x, this.currentLevel.width - canvas.width));
        if (this.shake > 0) this.shake--;
        for (let i = this.floatTexts.length - 1; i >= 0; i--) { const ft = this.floatTexts[i]; ft.y -= 1.5; ft.life -= 0.02; if (ft.life <= 0) this.floatTexts.splice(i, 1); }
        particles.update(); this.updatePowerups();
    }
    
    applyPowerup(type) {
        const p = this.player; audio.powerup();
        if (type === 'heart') { this.lives++; this.addFloatText(p.x, p.y - 30, '+1 CAN!', '#ff4757'); particles.spawn(p.x + p.w/2, p.y + p.h/2, '#ff4757', 20, 'burst'); this.updateHearts(); }
        else if (type === 'speed') { p.speedBoost = 600; this.addFloatText(p.x, p.y - 30, '⚡ HIZ!', '#ffd700'); }
        else if (type === 'jump') { p.jumpBoost = 600; this.addFloatText(p.x, p.y - 30, '🚀 SÜPER ZIPLAMA!', '#4ecdc4'); }
        else if (type === 'shield') { p.shieldTime = 600; p.invincible = 600; this.addFloatText(p.x, p.y - 30, '🛡️ KALKAN!', '#0984e3'); }
    }
    
    takeDamage(amount, isFall = false) {
        const p = this.player; const diff = DIFFICULTY[this.settings.difficulty];
        amount = Math.max(1, Math.ceil(amount * diff.dmgMult));
        this.lives -= amount; 
        if(isFall) audio.fall(); else audio.hit(); 
        if(this.settings.shake) this.shake = 20;
        particles.spawn(p.x + p.w/2, p.y + p.h/2, '#ff4757', 20, 'burst');
        
        if (this.lives <= 0) { 
            this.lives = 0; this.updateHearts(); setTimeout(() => this.gameOver(), 500); 
        } else { 
            p.invincible = 120; 
            if (isFall) { 
                p.x = this.currentLevel.platforms[0].x + 50; 
                p.y = this.currentLevel.platforms[0].y - 50; 
                p.vx = 0; p.vy = 0; this.camera.x = 0; 
            } else { p.vy = -8; p.vx = p.facingRight ? -5 : 5; }
            this.updateHearts(); 
        }
    }
    
    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) { return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2; }
    addFloatText(x, y, text, color) { this.floatTexts.push({x, y, text, color, life: 1}); }
    
    updateScore() { const el = document.getElementById('scoreText'); if(el) {el.textContent = this.score; el.style.transform = 'scale(1.3)'; el.style.color = '#ffd700'; setTimeout(() => { el.style.transform = 'scale(1)'; el.style.color = 'white'; }, 150);} this.updateData(); }
    updateHearts() { const container = document.getElementById('livesContainer'); if(!container) return; let html = ''; const dCount = Math.min(this.lives, 8); for (let i = 1; i <= dCount; i++) html += `<span class="heart">❤️</span>`; if (this.lives > 8) html += `<span style="color:#ff4757; font-size:18px; font-weight:700;">+${this.lives - 8}</span>`; container.innerHTML = html; const lt = document.getElementById('livesText'); if(lt) lt.textContent = `x${this.lives}`; }
    
    updatePowerups() { 
        const bar = document.getElementById('powerups-bar'); if(!bar) return; const p = this.player; let html = ''; 
        if (p.speedBoost > 0) { const time = (p.speedBoost / 60).toFixed(1); const blink = p.speedBoost < 180 ? 'blink' : ''; html += `<div class="powerup-badge ${blink}" style="border-color:#ffd700; color:#ffd700;">⚡ ${time}s</div>`; } 
        if (p.jumpBoost > 0) { const time = (p.jumpBoost / 60).toFixed(1); const blink = p.jumpBoost < 180 ? 'blink' : ''; html += `<div class="powerup-badge ${blink}" style="border-color:#4ecdc4; color:#4ecdc4;">🚀 ${time}s</div>`; } 
        if (p.shieldTime > 0) { const time = (p.shieldTime / 60).toFixed(1); const blink = p.shieldTime < 180 ? 'blink' : ''; html += `<div class="powerup-badge ${blink}" style="border-color:#0984e3; color:#0984e3;">🛡️ KALKAN ${time}s</div>`; }
        bar.innerHTML = html; 
    }
    
    draw() {
        const p = this.player; const camX = this.camera.x + (this.settings.shake && this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0);
        this.drawBackground(camX); ctx.save(); ctx.translate(-camX, 0);
        
        this.currentLevel.decorations.forEach(d => this.drawDecoration(d)); 
        this.currentLevel.platforms.forEach(pl => this.drawPlatform(pl)); 
        this.currentLevel.coins.filter(c => !c.collected).forEach(c => this.drawCoin(c)); 
        this.currentLevel.powerups.filter(pw => !pw.collected).forEach(pw => this.drawPowerup(pw)); 
        this.drawFlag(this.currentLevel.flag); 
        this.currentLevel.enemies.filter(e => !e.dead && e.y < 1000).forEach(e => this.drawEnemy(e));
        
        if (p.shieldTime > 0) {
            ctx.beginPath(); ctx.arc(p.x + p.w/2, p.y + p.h/2, 25, 0, Math.PI*2); ctx.fillStyle = 'rgba(9, 132, 227, 0.4)'; ctx.fill();
        } else if (p.invincible > 0 && Math.floor(p.invincible / 4) % 2 === 0) {
            ctx.globalCompositeOperation = 'lighter';
        }

        p.trails.forEach((t, i) => { ctx.globalAlpha = (i / p.trails.length) * 0.4; this.drawPlayerModel(t.x, t.y, p.w, p.h, t.scaleX, t.scaleY, p.facingRight, p.onGround, p.anim, true); }); ctx.globalAlpha = 1;
        if (p.invincible % 6 < 3 || p.shieldTime > 0) this.drawPlayerModel(p.x, p.y, p.w, p.h, p.scale.x, p.scale.y, p.facingRight, p.onGround, p.anim, false, p.speedBoost, p.jumpBoost); ctx.globalCompositeOperation = 'source-over';
        
        this.floatTexts.forEach(ft => { ctx.globalAlpha = ft.life; ctx.fillStyle = ft.color; ctx.font = 'bold 20px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(ft.text, ft.x + 16, ft.y); }); ctx.globalAlpha = 1; particles.draw(ctx, camX); ctx.restore();
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 300, canvas.width/2, canvas.height/2, 600); grad.addColorStop(0, 'transparent'); grad.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    drawBackground(camX) {
        const tObj = THEMES[this.currentLevel ? this.currentLevel.theme : 'grass'];
        const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, tObj.sky[0]); skyGrad.addColorStop(0.5, tObj.sky[1]); skyGrad.addColorStop(1, tObj.sky[2]);
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = (tObj.sky[0] === '#87ceeb' || tObj.sky[0] === '#1c2833' || tObj.sky[0] === '#ffffff') ? 'rgba(255,255,255,0.8)' : (tObj.sky[0] === '#2d0a0a' ? 'rgba(255,100,100,0.5)' : 'white');
        for (const star of this.bgStars) {
            const drawX = (star.x - camX * star.speed) % (canvas.width + 100);
            ctx.globalAlpha = (tObj.sky[0] === '#87ceeb') ? 0.6 : (0.3 + star.brightness * 0.7);
            const size = (tObj.sky[0] === '#87ceeb') ? star.size * 8 : star.size;
            if (tObj.sky[0] === '#87ceeb') { ctx.beginPath(); ctx.arc(drawX < 0 ? drawX + canvas.width + 100 : drawX, star.y, size, 0, Math.PI * 2); ctx.fill(); }
            else ctx.fillRect(drawX < 0 ? drawX + canvas.width + 100 : drawX, star.y, star.size, star.size);
        }
        ctx.globalAlpha = 1;
    }
    
    drawWithShadow(x, y, w, h, fn) { if(this.settings.shadows) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 5, y + 5, w, h); } fn(); }

    drawPlatform(plat) {
        const c = THEMES[this.currentLevel.theme].plat;
        this.drawWithShadow(plat.x, plat.y, plat.w, plat.h, () => {
            ctx.fillStyle = c.body; ctx.fillRect(plat.x, plat.y + 5, plat.w, plat.h - 5);
            ctx.fillStyle = c.side; ctx.fillRect(plat.x, plat.y + plat.h - 5, plat.w, 5);
            ctx.fillStyle = c.top; ctx.fillRect(plat.x, plat.y, plat.w, 6);
            if (c.top === '#2ed573' || c.top === '#558b2f') { ctx.fillStyle = c.side; for (let i = 5; i < plat.w - 5; i += 15) { ctx.fillRect(plat.x + i, plat.y - 4, 3, 4); ctx.fillRect(plat.x + i + 5, plat.y - 3, 2, 3); } }
        });
    }
    
    drawCoin(coin) {
        const x = coin.x + 10, y = coin.y + 10 + Math.sin(Date.now() / 200) * 4; const spin = Math.abs(Math.cos(Date.now() / 300)); 
        ctx.save(); ctx.translate(x, y); ctx.scale(spin, 1);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffed4a'; ctx.beginPath(); ctx.arc(-3, -3, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b8860b'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 0); ctx.restore();
    }
    
    drawPowerup(pow) {
        const y = pow.y + 15 + Math.sin(Date.now() / 300) * 5; 
        ctx.fillStyle = {heart: '#ff4757', speed: '#ffd700', jump: '#4ecdc4', shield: '#0984e3'}[pow.type];
        ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(pow.x + 15, y, 20, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.fillText({heart: '❤️', speed: '⚡', jump: '🚀', shield: '🛡️'}[pow.type], pow.x + 15, y + 7);
    }
    
    drawEnemy(enemy) {
        if(this.settings.shadows) {
             ctx.fillStyle = 'rgba(0,0,0,0.3)';
             if(enemy.type === 'flyer') { ctx.beginPath(); ctx.moveTo(enemy.x + 20, enemy.y + 5); ctx.lineTo(enemy.x + 35, enemy.y + 25); ctx.lineTo(enemy.x + 20, enemy.y + 35); ctx.lineTo(enemy.x + 5, enemy.y + 25); ctx.fill(); } 
             else if (enemy.type === 'jumper' || enemy.type === 'ghost') { ctx.beginPath(); ctx.arc(enemy.x + 20, enemy.y + 20, 15, 0, Math.PI*2); ctx.fill(); } 
             else if (enemy.type === 'spike') { ctx.beginPath(); ctx.moveTo(enemy.x + 20, enemy.y + 5); ctx.lineTo(enemy.x + 35, enemy.y + 35); ctx.lineTo(enemy.x + 5, enemy.y + 35); ctx.fill(); } 
             else { ctx.fillRect(enemy.x + 5, enemy.y + 5, 30, 30); }
        }

        if (enemy.type === 'walker') {
            const walkSquash = Math.sin(Date.now() / 150) * 2; ctx.fillStyle = '#ff4757'; ctx.fillRect(enemy.x, enemy.y + walkSquash, 30, 30 - walkSquash);
            const dir = enemy.vx > 0 ? 1 : -1; ctx.fillStyle = 'white'; ctx.fillRect(enemy.x + (dir > 0 ? 16 : 4), enemy.y + 6 + walkSquash, 10, 10); ctx.fillStyle = 'black'; ctx.fillRect(enemy.x + (dir > 0 ? 20 : 6), enemy.y + 8 + walkSquash, 4, 4);
        } else if (enemy.type === 'flyer') {
            ctx.fillStyle = '#a29bfe'; ctx.beginPath(); ctx.moveTo(enemy.x + 15, enemy.y); ctx.lineTo(enemy.x + 30, enemy.y + 20); ctx.lineTo(enemy.x + 15, enemy.y + 30); ctx.lineTo(enemy.x, enemy.y + 20); ctx.fill();
        } else if (enemy.type === 'jumper') { 
            ctx.fillStyle = '#fdcb6e'; ctx.beginPath(); ctx.arc(enemy.x + 15, enemy.y + 15, 15, 0, Math.PI * 2); ctx.fill(); 
        } else if (enemy.type === 'spike') {
            ctx.fillStyle = '#b2bec3'; ctx.beginPath(); ctx.moveTo(enemy.x + 15, enemy.y); ctx.lineTo(enemy.x + 30, enemy.y + 30); ctx.lineTo(enemy.x, enemy.y + 30); ctx.fill();
        } else if (enemy.type === 'ghost') {
            ctx.globalAlpha = enemy.isHiding ? 0.2 : 0.85; ctx.fillStyle = '#dfe6e9'; ctx.beginPath(); ctx.arc(enemy.x + 15, enemy.y + 10, 15, Math.PI, 0); ctx.lineTo(enemy.x + 30, enemy.y + 30); ctx.lineTo(enemy.x + 20, enemy.y + 25); ctx.lineTo(enemy.x + 15, enemy.y + 30); ctx.lineTo(enemy.x + 10, enemy.y + 25); ctx.lineTo(enemy.x, enemy.y + 30); ctx.fill();
            ctx.fillStyle = enemy.isHiding ? '#b2bec3' : '#d63031'; ctx.fillRect(enemy.x + 8, enemy.y + 5, 4, 4); ctx.fillRect(enemy.x + 18, enemy.y + 5, 4, 4); ctx.globalAlpha = 1;
        }
    }
    
    drawFlag(flag) { const wave = Math.sin(Date.now() / 200) * 5; ctx.fillStyle = '#747d8c'; ctx.fillRect(flag.x + 15, flag.y, 6, 60); ctx.fillStyle = '#2ed573'; ctx.beginPath(); ctx.moveTo(flag.x + 21, flag.y + 5); ctx.quadraticCurveTo(flag.x + 50, flag.y + 15 + wave, flag.x + 21, flag.y + 25); ctx.fill(); }
    
    drawPlayerModel(x, y, w, h, sX, sY, facingRight, onGround, anim, isGhost, speedBoost=0, jumpBoost=0) {
        ctx.save(); ctx.translate(x + w/2, y + h); ctx.scale(sX, sY); ctx.translate(-(w/2), -h);
        if (!isGhost && speedBoost > 0) { ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w/2, h/2, 22, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = jumpBoost > 0 ? '#74b9ff' : (isGhost ? '#a29bfe' : '#4ecdc4'); ctx.fillRect(2, 2, w - 4, h - 4);
        const eyeDir = facingRight ? 1 : -1; ctx.fillStyle = 'white'; ctx.fillRect((eyeDir > 0 ? 18 : 6), 8, 8, 8); ctx.fillRect((eyeDir > 0 ? 6 : 18), 8, 8, 8);
        ctx.fillStyle = 'black'; ctx.fillRect((eyeDir > 0 ? 20 : 8), 10, 4, 4); ctx.fillRect((eyeDir > 0 ? 8 : 20), 10, 4, 4);
        if (onGround) { const l = Math.sin(anim.frame * Math.PI / 2) * 4; ctx.fillStyle = '#3dbdb4'; ctx.fillRect(6, h - 2, 6, 4 + l); ctx.fillRect(20, h - 2, 6, 4 - l); }
        ctx.restore();
    }
    
    drawDecoration(dec) {
        if (dec.type === 'bush') { ctx.fillStyle = '#229954'; ctx.beginPath(); ctx.arc(dec.x + dec.w/2, dec.y, dec.w/2, Math.PI, 0); ctx.fill(); } 
        else if (dec.type === 'tree') { const trunkW = dec.w * 0.25; ctx.fillStyle = '#5c3a21'; ctx.fillRect(dec.x + dec.w/2 - trunkW/2, dec.y - dec.h * 0.4, trunkW, dec.h * 0.4); ctx.fillStyle = '#27ae60'; ctx.beginPath(); ctx.moveTo(dec.x, dec.y - dec.h * 0.3); ctx.lineTo(dec.x + dec.w/2, dec.y - dec.h); ctx.lineTo(dec.x + dec.w, dec.y - dec.h * 0.3); ctx.fill(); } 
        else if (dec.type === 'rock') { ctx.fillStyle = '#606060'; ctx.beginPath(); ctx.arc(dec.x + dec.w/2, dec.y, dec.w/2, Math.PI, 0); ctx.fill(); } 
        else if (dec.type === 'stalagmite') { ctx.fillStyle = '#a0a0a0'; ctx.beginPath(); ctx.moveTo(dec.x, dec.y); ctx.lineTo(dec.x + dec.w/2, dec.y - dec.h); ctx.lineTo(dec.x + dec.w, dec.y); ctx.fill(); } 
        else if (dec.type === 'cloud_dec') { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(dec.x + dec.w/2, dec.y - dec.h/2, dec.w/2, Math.PI, 0); ctx.fill(); }
    }
    
    drawMenuBg() { ctx.fillStyle = '#0f1b2e'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    
    loop(timestamp) {
        if (!this.loopRunning) return;
        let dt = timestamp - (this.lastTime || timestamp);
        if (dt > 250) dt = 16; 
        this.lastTime = timestamp;
        
        this.accumulator += dt;
        while (this.accumulator >= this.step) { this.update(this.step); this.accumulator -= this.step; }
        if (this.state === 'playing' && this.currentLevel) this.draw();
        this.animationId = requestAnimationFrame(t => this.loop(t));
    }
}

const game = new Game();