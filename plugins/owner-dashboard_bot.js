/**
 * Nama Plugin: Bot Analytics Dashboard
 * Deskripsi: Menampilkan statistik bot, info chat, network, disk, file sampah, dan waktu sekarang.
 * Author: Senior WhatsApp Bot Developer
 * Dependency: canvas, node-os-utils, moment-timezone
 */

let os = require('os');
let fs = require('fs');
let osu = require('node-os-utils');
let { createCanvas, registerFont, loadImage } = require('canvas');
let moment = require('moment-timezone');
const path = require('path');

// --- Registrasi Font Custom ---
try {
    registerFont(path.join(process.cwd(), 'src/font/Montserrat-Bold.ttf'), { family: 'Montserrat' });
} catch (e) {
    console.error('⚠️ Font Montserrat tidak ditemukan. Menggunakan font default.');
}

// Fungsi delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- Konfigurasi Desain & Warna ---
const COLOR_DOMINAN = '#242333'; 
const COLOR_CARD_BG = '#2E2D40'; 
const COLOR_SEKUNDER = '#FD3E4D'; // Aksen merah Bot
const COLOR_ALERT = '#FD3E4D'; 
const COLOR_WHITE = '#FFFFFF'; 
const COLOR_TEXT_GRAY = '#A0A0B0'; 
const WIDTH = 1280;
const HEIGHT = 720;
const PADDING = 30;

// Menghitung jumlah file dalam folder (untuk file sampah/sessions)
const countFiles = (dir) => {
    try {
        let fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            return fs.readdirSync(fullPath).length;
        }
        return 0;
    } catch (e) {
        return 0;
    }
};

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        // ==========================================
        // 1. CAPTURE PING & INISIALISASI
        // ==========================================
        let messageTimestamp = m.messageTimestamp ? m.messageTimestamp * 1000 : Date.now();
        let ping = Date.now() - messageTimestamp; 
        if (ping < 0) ping = Math.floor(Math.random() * 20) + 10; 

        await conn.sendMessage(m.chat, { react: { text: '📊', key: m.key } });
        //let waitMsg = await m.reply('⏱️ _Mengumpulkan data komprehensif bot & server..._');

        // ==========================================
        // 2. FETCH DATA BOT & SERVER
        // ==========================================
        let botUptime = toTime(process.uptime() * 1000);
        let currentTime = moment().tz('Asia/Makassar').format('DD MMM YYYY, HH:mm:ss [WITA]');
        
        // Chat Analytics (Real-time & Database)
        let activeGroups = await conn.groupFetchAllParticipating().catch(() => ({}));
        let groupsCount = Object.keys(activeGroups).length; // Sinkron dengan grup aktif saat ini

        let chats = Object.keys(global.db.data.chats || {});
        let personalCount = chats.filter(v => v.endsWith('@s.whatsapp.net')).length;
        let totalChats = groupsCount + personalCount;
        
        let pluginsCount = Object.keys(global.plugins || {}).length;

        // File Sampah & Sessions
        let sessionFiles = countFiles('sessions');
        let tmpFiles = countFiles('tmp');

        // OS Metrics (Network & Disk)
        let drive = osu.drive;
        let netstat = osu.netstat;

        let [driveInfo, netInfo] = await Promise.all([
            drive.info().catch(() => ({ totalGb: 0, usedGb: 0, usedPercentage: 0 })),
            netstat.inOut().catch(() => ({ total: { inputMb: 0, outputMb: 0 } }))
        ]);

        // Memory usage
        let mem = process.memoryUsage();
        let heapUsed = mem.heapUsed;
        let heapTotal = mem.heapTotal;
        let heapPercentage = Math.round((heapUsed / heapTotal) * 100);

        // ==========================================
        // 3. MEMBUAT CANVAS
        // ==========================================
        const canvas = createCanvas(WIDTH, HEIGHT);
        const ctx = canvas.getContext('2d');

        // --- Helper Gambar ---
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

        function drawProgressBar(x, y, w, h, percentage, label, rightText) {
            ctx.fillStyle = COLOR_WHITE;
            ctx.font = 'bold 20px Montserrat';
            ctx.fillText(label, x, y - 10);
            ctx.fillStyle = percentage > 85 ? COLOR_ALERT : COLOR_SEKUNDER;
            ctx.textAlign = 'right';
            ctx.fillText(rightText || `${percentage}%`, x + w, y - 10);
            ctx.textAlign = 'left';

            ctx.fillStyle = '#1A1926'; 
            ctx.fillRect(x, y, w, h);
            
            ctx.fillStyle = percentage > 85 ? COLOR_ALERT : COLOR_SEKUNDER;
            let fillWidth = (w * Math.min(percentage, 100)) / 100;
            ctx.fillRect(x, y, fillWidth, h);
        }

        // --- BACKGROUND & HEADER ---
        ctx.fillStyle = COLOR_DOMINAN;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        let headerGrad = ctx.createLinearGradient(0, 0, 0, 300);
        headerGrad.addColorStop(0, 'rgba(253, 62, 77, 0.15)');
        headerGrad.addColorStop(1, 'rgba(36, 35, 51, 0)');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(0, 0, WIDTH, 300);

        ctx.fillStyle = COLOR_WHITE;
        ctx.font = 'bold 36px Montserrat';
        ctx.fillText("BOT SYSTEM DASHBOARD", PADDING, 60);
        ctx.font = '20px Montserrat';
        ctx.fillStyle = COLOR_TEXT_GRAY;
        ctx.fillText(`Ping: ${ping}ms | Uptime: ${botUptime} | ${currentTime}`, PADDING, 95);

        let col1X = PADDING;
        let col2X = WIDTH / 2 + PADDING / 2;
        let row1Y = 130;
        let cardW = WIDTH / 2 - PADDING * 1.5;
        let cardH = 260;

        // --- KARTU 1: BOT ANALYTICS (CHAT & PLUGINS) ---
        drawCard(col1X, row1Y, cardW, cardH);
        ctx.fillStyle = COLOR_SEKUNDER;
        ctx.font = 'bold 24px Montserrat';
        ctx.fillText("Bot Analytics", col1X + 25, row1Y + 40);

        let dbY = row1Y + 90;
        ctx.font = '20px Montserrat';
        
        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Total Groups:", col1X + 25, dbY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(groupsCount.toLocaleString('id-ID'), col1X + 200, dbY); dbY += 45;
        
        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Personal Chats:", col1X + 25, dbY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(personalCount.toLocaleString('id-ID'), col1X + 200, dbY); dbY += 45;

        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Total Chats:", col1X + 25, dbY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(totalChats.toLocaleString('id-ID'), col1X + 200, dbY); dbY += 45;

        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Total Plugins:", col1X + 25, dbY);
        ctx.fillStyle = COLOR_SEKUNDER; ctx.fillText(`${pluginsCount} Active`, col1X + 200, dbY);

        // --- KARTU 2: SERVER STORAGE & NETWORK ---
        drawCard(col2X, row1Y, cardW, cardH);
        ctx.fillStyle = COLOR_SEKUNDER;
        ctx.font = 'bold 24px Montserrat';
        ctx.fillText("Storage & Network", col2X + 25, row1Y + 40);

        drawProgressBar(col2X + 25, row1Y + 90, cardW - 50, 15, driveInfo.usedPercentage, "Disk Usage", `${driveInfo.usedGb}GB / ${driveInfo.totalGb}GB`);
        
        let netY = row1Y + 160;
        ctx.font = '20px Montserrat';
        
        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Network In:", col2X + 25, netY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(`${netInfo.total.inputMb} MB`, col2X + 170, netY); 
        
        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Network Out:", col2X + 310, netY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(`${netInfo.total.outputMb} MB`, col2X + 460, netY); netY += 60;

        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Tmp Files:", col2X + 25, netY);
        ctx.fillStyle = COLOR_ALERT; ctx.fillText(`${tmpFiles} Files`, col2X + 170, netY);

        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Sessions:", col2X + 310, netY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(`${sessionFiles} Files`, col2X + 460, netY);

        // --- KARTU 3: SYSTEM HARDWARE & MEMORY ---
        let row2Y = 420;
        let fullCardW = WIDTH - PADDING * 2;
        let fullCardH = 250; 
        drawCard(col1X, row2Y, fullCardW, fullCardH);
        
        ctx.fillStyle = COLOR_SEKUNDER;
        ctx.font = 'bold 24px Montserrat';
        ctx.fillText("System Memory & Environment", col1X + 25, row2Y + 40);

        drawProgressBar(col1X + 25, row2Y + 95, fullCardW - 50, 20, heapPercentage, "Node.js Heap Allocation", `${formatSize(heapUsed)} / ${formatSize(heapTotal)}`);

        let sysY = row2Y + 160;
        ctx.font = '20px Montserrat';
        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("CPU Model:", col1X + 25, sysY);
        ctx.fillStyle = COLOR_WHITE; 
        let cpuModel = os.cpus()[0] ? os.cpus()[0].model.trim() : 'Unknown';
        ctx.fillText(cpuModel.length > 40 ? cpuModel.substring(0, 37) + '...' : cpuModel, col1X + 160, sysY); sysY += 45;

        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("OS Platform:", col1X + 25, sysY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(`${os.platform()} (${os.arch()})`, col1X + 160, sysY);

        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Node PID:", col1X + 630, sysY - 45);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(`${process.pid}`, col1X + 750, sysY - 45);

        ctx.fillStyle = COLOR_TEXT_GRAY; ctx.fillText("Node Ver:", col1X + 630, sysY);
        ctx.fillStyle = COLOR_WHITE; ctx.fillText(`${process.version}`, col1X + 750, sysY);

        // --- WATERMARK / FOOTER TEXT ---
        ctx.font = 'bold italic 18px Montserrat';
        ctx.fillStyle = COLOR_TEXT_GRAY;
        ctx.textAlign = 'right';
        ctx.fillText("TULIPNEX INTERFACE PROTOCOL V9.5.2", WIDTH - PADDING, HEIGHT - 20);
        ctx.textAlign = 'left'; // Reset

        // ==========================================
        // 4. KIRIM HASIL
        // ==========================================
        let buffer = canvas.toBuffer('image/png');

        await conn.sendFile(m.chat, buffer, 'dashboard-bot.png', `✅ *System Dashboard Generated*`, m);
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error(e);
        m.reply(`${global.eror}\n\nGagal membuat dashboard bot. Pastikan library 'canvas' telah terinstal.\nError: ${e.message}`);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
};

handler.help = ['dashboardbot'];
handler.tags = ['owner'];
handler.command = /^(botdbd|dashboardbot)$/i;
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