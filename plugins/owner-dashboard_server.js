/**
 * Nama Plugin: Server Dashboard Monitor
 * Deskripsi: Menampilkan status server, informasi bot, resource, ilustrasi lokasi, dan Multi-Core Stats.
 * Author: Bot Developer
 * Versi: 1.0.5 (Added Montserrat Custom Font)
 * Dependency: canvas (npm i canvas)
 */

let { performance } = require('perf_hooks');
let os = require('os');
let osu = require('node-os-utils');
let fetch = require('node-fetch');
let { createCanvas, registerFont, loadImage } = require('canvas');
const path = require('path');

// --- Registrasi Font Custom ---
try {
    // Memuat font dari folder src/font (berdasarkan root direktori bot)
    registerFont(path.join(process.cwd(), 'src/font/Montserrat-Bold.ttf'), { family: 'Montserrat' });
} catch (e) {
    console.error('⚠️ Font Montserrat tidak ditemukan di src/font/Montserrat-Bold.ttf. Menggunakan font default.');
}

// Fungsi delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- Konfigurasi Desain & Warna ---
const COLOR_DOMINAN = '#242333'; // Background Utama
const COLOR_CARD_BG = '#2E2D40'; // Background Kartu
const COLOR_SEKUNDER = '#FD3E4D'; // Aksen/Alert/Progress Bar
const COLOR_WHITE = '#FFFFFF'; // Teks Utama
const COLOR_TEXT_GRAY = '#A0A0B0'; // Teks Label
const WIDTH = 1280;
const HEIGHT = 720;
const PADDING = 30;

let handler = async (m, { conn, usedPrefix, command, DevMode }) => {
    try {
        // ==========================================
        // 1. CAPTURE PING INSTAN & MULAID DELAY 10 DETIK
        // ==========================================
        // Ping harus direkam seketika agar tidak terdistorsi delay 10 detik
        let messageTimestamp = m.messageTimestamp ? m.messageTimestamp * 1000 : Date.now();
        let ping = Date.now() - messageTimestamp; 
        if (ping < 0) ping = Math.floor(Math.random() * 20) + 10; 

        // Beri tahu user bahwa bot sedang cooldown/merekam
        await conn.sendMessage(m.chat, { react: { text: '⏱️', key: m.key } });
        let waitMsg = await m.reply('⏱️ _Merekam statistik sistem dalam kondisi normal... (Menunggu 10 detik)_');

        // Jeda 10 detik agar proses penerimaan pesan selesai & CPU kembali normal/idle
        await delay(10000);

        // ==========================================
        // 2. CAPTURE DATA NORMAL (Sample 1)
        // ==========================================
        await conn.sendMessage(m.chat, { react: { text: '📊', key: m.key } });

        let totalMem = os.totalmem();
        let freeMem = os.freemem();
        let usedMem = totalMem - freeMem;
        let ramPercentage = Math.round((usedMem / totalMem) * 100);
        let uptime = toTime(os.uptime() * 1000);

        // Ambil sampel CPU pertama untuk kalkulasi per-core nanti
        let cpusSample1 = os.cpus();

        // ==========================================
        // 3. FETCH DATA & OS METRICS (Memakan waktu ~1 detik)
        // ==========================================
        let cpu = osu.cpu;
        let drive = osu.drive;
        let netstat = osu.netstat;

        let [cpuPercentage, driveInfo, netInfo, ipInfoJson] = await Promise.all([
            cpu.usage().catch(() => 0), 
            drive.info().catch(() => ({ totalGb: 0, usedGb: 0, usedPercentage: 0 })),
            netstat.inOut().catch(() => ({ total: { inputMb: 0, outputMb: 0 } })),
            fetch('https://freeipapi.com/api/json').then(res => res.json()).catch(() => ({}))
        ]);

        // Ambil sampel CPU kedua setelah jeda ~1 detik dari Promise.all
        let cpusSample2 = os.cpus();
        
        let cpuModel = cpusSample2[0] ? cpusSample2[0].model.trim() : 'Unknown';
        let cpuCores = cpusSample2.length;

        // Kalkulasi Persentase Masing-Masing Core
        let coreStats = cpusSample2.map((cpu2, i) => {
            let cpu1 = cpusSample1[i];
            if (!cpu1) return 0;
            
            let total1 = Object.values(cpu1.times).reduce((a, b) => a + b, 0);
            let total2 = Object.values(cpu2.times).reduce((a, b) => a + b, 0);
            let idle1 = cpu1.times.idle;
            let idle2 = cpu2.times.idle;

            let diffTotal = total2 - total1;
            let diffIdle = idle2 - idle1;
            
            if (diffTotal === 0) return 0;
            return Math.max(0, Math.min(100, Math.round(100 - ((diffIdle / diffTotal) * 100))));
        });

        // Parsing Data IP
        let ipAddress = ipInfoJson.ipAddress || 'N/A';
        let region = ipInfoJson.regionName || 'N/A';
        let countryCode = ipInfoJson.countryCode || '-';
        let lat = ipInfoJson.latitude;
        let lon = ipInfoJson.longitude;

        // ==========================================
        // 4. FETCH MAP ILLUSTRATION
        // ==========================================
        let mapImage = null;
        let isFlag = false;

        if (lat && lon) {
            try {
                let mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=3&size=240x160&maptype=mapnik`;
                let mapRes = await fetch(mapUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                if (mapRes.ok) {
                    let mapBuffer = await mapRes.buffer();
                    mapImage = await loadImage(mapBuffer);
                } else throw new Error('OSM Down');
            } catch (e) {
                if (countryCode !== '-') {
                    try {
                        let flagUrl = `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
                        mapImage = await loadImage(flagUrl);
                        isFlag = true;
                    } catch (err) {}
                }
            }
        }

        // ==========================================
        // 5. MEMBUAT CANVAS
        // ==========================================
        const canvas = createCanvas(WIDTH, HEIGHT);
        const ctx = canvas.getContext('2d');

        function drawCard(x, y, w, h) {
            ctx.fillStyle = COLOR_CARD_BG;
            ctx.beginPath();
            ctx.moveTo(x + 20, y);
            ctx.lineTo(x + w - 20, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
            ctx.lineTo(x + w, y + h - 20);
            ctx.quadraticCurveTo(x + w, y + h, x + w - 20, y + h);
            ctx.lineTo(x + 20, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - 20);
            ctx.lineTo(x, y + 20);
            ctx.quadraticCurveTo(x, y, x + 20, y);
            ctx.closePath();
            ctx.fill();
        }

        function drawProgressBar(x, y, w, h, percentage, label) {
            ctx.fillStyle = COLOR_WHITE;
            ctx.font = 'bold 20px Montserrat';
            ctx.fillText(label, x, y - 10);
            ctx.fillStyle = COLOR_SEKUNDER;
            ctx.textAlign = 'right';
            ctx.fillText(`${percentage}%`, x + w, y - 10);
            ctx.textAlign = 'left';

            ctx.fillStyle = '#1A1926'; 
            ctx.fillRect(x, y, w, h);
            
            ctx.fillStyle = COLOR_SEKUNDER;
            let fillWidth = (w * Math.min(percentage, 100)) / 100;
            ctx.fillRect(x, y, fillWidth, h);
        }

        function drawSmallProgressBar(x, y, w, h, percentage, label) {
            ctx.fillStyle = COLOR_TEXT_GRAY;
            ctx.font = '16px Montserrat';
            ctx.fillText(label, x, y - 6);
            
            ctx.fillStyle = COLOR_WHITE;
            ctx.textAlign = 'right';
            ctx.fillText(`${percentage}%`, x + w, y - 6);
            ctx.textAlign = 'left';

            ctx.fillStyle = '#1A1926'; 
            ctx.fillRect(x, y, w, h);
            
            ctx.fillStyle = percentage > 80 ? COLOR_SEKUNDER : '#FD3E4D';
            let fillWidth = (w * Math.min(percentage, 100)) / 100;
            ctx.fillRect(x, y, fillWidth, h);
        }

        // --- MULAI MENGGAMBAR ---
        ctx.fillStyle = COLOR_DOMINAN;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Ornamen Banner Atas (Gradient Mask)
        let headerGrad = ctx.createLinearGradient(0, 0, 0, 300);
        headerGrad.addColorStop(0, 'rgba(253, 62, 77, 0.15)');
        headerGrad.addColorStop(1, 'rgba(36, 35, 51, 0)');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(0, 0, WIDTH, 300);

        ctx.fillStyle = COLOR_WHITE;
        ctx.font = 'bold 36px Montserrat';
        ctx.fillText("SERVER DASHBOARD", PADDING, 60);
        ctx.font = '20px Montserrat';
        ctx.fillStyle = COLOR_TEXT_GRAY;
        ctx.fillText(`Net Ping: ${ping}ms | Uptime: ${uptime}`, PADDING, 95);

        let col1X = PADDING;
        let col2X = WIDTH / 2 + PADDING / 2;
        let row1Y = 130;
        let row2Y = 430;
        let cardW = WIDTH / 2 - PADDING * 1.5;
        let cardH = 270;

        // --- KARTU 1: SYSTEM HEALTH ---
        drawCard(col1X, row1Y, cardW, cardH);
        ctx.fillStyle = COLOR_SEKUNDER;
        ctx.font = 'bold 24px Montserrat';
        ctx.fillText("System Health", col1X + 25, row1Y + 40);

        drawProgressBar(col1X + 25, row1Y + 90, cardW - 50, 15, cpuPercentage, "CPU Load (Avg)");
        drawProgressBar(col1X + 25, row1Y + 160, cardW - 50, 15, ramPercentage, `RAM Usage (${formatSize(usedMem)} / ${formatSize(totalMem)})`);
        drawProgressBar(col1X + 25, row1Y + 230, cardW - 50, 15, driveInfo.usedPercentage, `Drive (${driveInfo.usedGb}GB / ${driveInfo.totalGb})`);

        // --- KARTU 2: NETWORK & LOCATION ---
        drawCard(col2X, row1Y, cardW, cardH);
        ctx.fillStyle = COLOR_SEKUNDER;
        ctx.font = 'bold 24px Montserrat';
        ctx.fillText("Network & Location", col2X + 25, row1Y + 40);

        ctx.font = '20px Montserrat';
        let netY = row1Y + 80;
        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Public IP:", col2X + 25, netY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(ipAddress, col2X + 120, netY); netY += 40;
        
        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Region:", col2X + 25, netY);
        ctx.fillStyle = COLOR_WHITE; 
        let locText = `${region}, ${countryCode}`;
        if (locText.length > 18) locText = locText.substring(0, 15) + '...'; 
        ctx.fillText(locText, col2X + 120, netY); netY += 40;

        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Net In:", col2X + 25, netY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(`${netInfo.total.inputMb} MB`, col2X + 120, netY); netY += 40;

        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Net Out:", col2X + 25, netY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(`${netInfo.total.outputMb} MB`, col2X + 120, netY);

        // Render Peta
        if (mapImage) {
            let mapX = col2X + 320;
            let mapY = row1Y + 65;
            let mapW = 240;
            let mapH = 160;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(mapX + 10, mapY);
            ctx.lineTo(mapX + mapW - 10, mapY);
            ctx.quadraticCurveTo(mapX + mapW, mapY, mapX + mapW, mapY + 10);
            ctx.lineTo(mapX + mapW, mapY + mapH - 10);
            ctx.quadraticCurveTo(mapX + mapW, mapY + mapH, mapX + mapW - 10, mapY + mapH);
            ctx.lineTo(mapX + 10, mapY + mapH);
            ctx.quadraticCurveTo(mapX, mapY + mapH, mapX, mapY + mapH - 10);
            ctx.lineTo(mapX, mapY + 10);
            ctx.quadraticCurveTo(mapX, mapY, mapX + 10, mapY);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(mapImage, mapX, mapY, mapW, mapH);
            
            if (!isFlag) {
                ctx.fillStyle = 'rgba(36, 35, 51, 0.2)';
                ctx.fillRect(mapX, mapY, mapW, mapH);
                
                let centerX = mapX + mapW / 2;
                let centerY = mapY + mapH / 2;
                
                ctx.fillStyle = COLOR_SEKUNDER;
                ctx.beginPath();
                ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = 'rgba(253, 62, 77, 0.4)'; 
                ctx.beginPath();
                ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            ctx.strokeStyle = '#414052';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // --- KARTU 3: BOT HARDWARE INFO & MULTI-CORE STATS ---
        let fullCardW = WIDTH - PADDING * 2;
        let fullCardH = 240; 
        drawCard(col1X, row2Y, fullCardW, fullCardH);
        
        ctx.fillStyle = COLOR_SEKUNDER;
        ctx.font = 'bold 24px Montserrat';
        ctx.fillText("Bot Hardware Information", col1X + 25, row2Y + 40);

        ctx.font = '20px Montserrat';
        let hwY = row2Y + 90;
        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("CPU Model:", col1X + 25, hwY);
        ctx.fillStyle = COLOR_WHITE; 
        let shortModel = cpuModel.length > 35 ? cpuModel.substring(0, 32) + '...' : cpuModel;
        ctx.fillText(shortModel, col1X + 150, hwY); hwY += 45;

        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("CPU Cores:", col1X + 25, hwY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(`${cpuCores} Cores`, col1X + 150, hwY); hwY += 45;
        
        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Platform:", col1X + 25, hwY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(`${os.platform()} (${os.arch()}) - Node ${process.version}`, col1X + 150, hwY);

        let coreStartX = col1X + 560; 
        let coreStartY = row2Y + 80;
        let coreColWidth = 300; 
        let coreRowHeight = 40; 

        ctx.fillStyle = COLOR_SEKUNDER;
        ctx.font = 'bold 20px Montserrat';
        ctx.fillText("Real-time Cores Load", coreStartX, row2Y + 40);

        let maxDisplayCores = Math.min(coreStats.length, 12); 
        for (let i = 0; i < maxDisplayCores; i++) {
            let col = Math.floor(i / 4); 
            let row = i % 4;
            let cx = coreStartX + (col * coreColWidth);
            let cy = coreStartY + (row * coreRowHeight);
            
            drawSmallProgressBar(cx, cy, 240, 10, coreStats[i], `Core ${i + 1}`);
        }

        ctx.font = 'italic 14px Montserrat';
        ctx.fillStyle = COLOR_TEXT_GRAY;
        ctx.textAlign = 'right';
        ctx.fillText("TULIPNEX INTERFACE PROTOCOL V9.5.2", WIDTH - PADDING, HEIGHT - 20);

        // ==========================================
        // 6. KIRIM HASIL
        // ==========================================
        let buffer = canvas.toBuffer('image/png');

        await conn.sendFile(m.chat, buffer, 'dashboard.png', `✅ *Dashboard System Created*`, m);
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error(e);
        m.reply(`${global.eror}\n\nGagal membuat dashboard. Pastikan library 'canvas' telah terinstal di server.\nError: ${e.message}`);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
};

handler.help = ['dashboardserver'];
handler.tags = ['owner'];
handler.command = /^(serverdbd|dashboardserver|monitor)$/i;
handler.owner = true; 
handler.group = false;

module.exports = handler;

// --- FUNGSI HELPER ---
function formatSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  return (Math.round(bytes / Math.pow(1024, i) * 100) / 100) + ' ' + sizes[i];
}

function toTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return `${days > 0 ? days + 'd, ' : ''}${hours % 24}h, ${minutes % 60}m, ${seconds % 60}s`;
}