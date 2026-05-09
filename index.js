// [FIX] Hapus 'cluster' — tidak pernah dipakai
const { spawn } = require('child_process');
const path      = require('path');
const fs        = require('fs');
const os        = require('os');
const express   = require('express');
const app       = express();

// ── Express / Port ────────────────────────────────────────────
const ports = [4000, 3000, 5000, 8000, 8080, 4444];
let availablePortIndex = 0;

function checkPort(port) {
    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            server.close();
            resolve(true);
        });
        // [FIX] resolve(false) bukan reject — caller tidak perlu try-catch
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            } else {
                console.error(`[checkPort] Error pada port ${port}:`, err.message);
                resolve(false);
            }
        });
    });
}

async function startServer() {
    // [FIX] Loop dengan await — bukan rekursi tak-awaitable
    while (availablePortIndex < ports.length) {
        const port = ports[availablePortIndex];
        const isAvailable = await checkPort(port);

        if (isAvailable) {
            console.log('\x1b[33m%s\x1b[0m', `🌐 Port ${port} is open`);
            app.listen(port);
            app.get('/', (req, res) => {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({
                    response: { status: 'true', message: 'Bot Successfully Activated!', author: 'Wann' }
                }, null, 2));
            });
            return;
        }

        console.log(`Port ${port} is already in use. Trying another port...`);
        // [FIX] Jangan modifikasi isi array ports — cukup naikkan index
        availablePortIndex++;
    }

    console.log('No more available ports. Exiting...');
    process.exit(1);
}

// ── Buat folder tmp SEBELUM bot di-spawn ──────────────────────
// [FIX] Dipindahkan ke atas agar tmp tersedia sebelum main.js berjalan
const tmpDir = './tmp';
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log('\x1b[33m%s\x1b[0m', `📁 Created directory ${tmpDir}`);
}

// ── Bot spawner ───────────────────────────────────────────────
let isRunning = false;

function start(file) {
    if (isRunning) return;
    isRunning = true;

    const args = [path.join(__dirname, file), ...process.argv.slice(2)];
    const p = spawn(process.argv[0], args, {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    });

    p.on('message', (data) => {
        console.log('\x1b[36m%s\x1b[0m', `🟢 RECEIVED ${data}`);
        switch (data) {
            case 'reset':
                p.kill();
                isRunning = false;
                start(file);
                break;
            case 'uptime':
                p.send(process.uptime());
                break;
        }
    });

    p.on('exit', (code) => {
        isRunning = false;
        console.error('\x1b[31m%s\x1b[0m', `Exited with code: ${code}`);

        // [FIX] Cek code DULU sebelum start() — versi asli start() dipanggil tanpa syarat
        // Exit normal (code 0) → restart langsung
        if (code === 0) {
            return start(file);
        }

        // Exit tidak normal → watch file untuk restart saat file berubah
        fs.watchFile(args[0], () => {
            fs.unwatchFile(args[0]);
            console.error('\x1b[31m%s\x1b[0m', `File ${args[0]} modified. Restarting...`);
            start(file);
        });

        // [FIX #7] Bersihkan watchFile SEBELUM setTimeout restart
        // agar tidak ada dua instance start() terpanggil:
        // satu dari setTimeout dan satu lagi dari watchFile saat file berubah
        setTimeout(() => {
            fs.unwatchFile(args[0]); // pastikan watcher sudah bersih
            start(file);
        }, 2000);
    });

    p.on('error', (err) => {
        console.error('\x1b[31m%s\x1b[0m', `Spawn error: ${err}`);
        p.kill();
        isRunning = false;
        // [FIX] Jeda untuk cegah rapid-respawn loop
        setTimeout(() => start(file), 2000);
    });

    // ── Info plugins & environment ─────────────────────────────
    const pluginsFolder = path.join(__dirname, 'plugins');
    fs.readdir(pluginsFolder, (err, files) => {
        if (err) {
            console.error('\x1b[31m%s\x1b[0m', `Error reading plugins folder: ${err}`);
            return;
        }
        console.log('\x1b[33m%s\x1b[0m', `🟡 Found ${files.length} plugins in ${pluginsFolder}`);
        try {
            require.resolve('@whiskeysockets/baileys');
            const ver = require('@whiskeysockets/baileys/package.json').version;
            console.log('\x1b[33m%s\x1b[0m', `🟡 Baileys version ${ver} is installed`);
        } catch {
            console.error('\x1b[31m%s\x1b[0m', `❌ Baileys library is not installed`);
        }
    });

    console.log(`🖥️  \x1b[33m${os.type()}\x1b[0m, \x1b[33m${os.release()}\x1b[0m - \x1b[33m${os.arch()}\x1b[0m`);
    console.log(`💾 \x1b[33mTotal RAM: ${(os.totalmem() / 1024 ** 3).toFixed(2)} GB\x1b[0m`);
    console.log(`💽 \x1b[33mFree RAM:  ${(os.freemem()  / 1024 ** 3).toFixed(2)} GB\x1b[0m`);
    console.log('\x1b[33m%s\x1b[0m', '📃 Script by Wann');
    console.log('\x1b[33m%s\x1b[0m', '🔗 Github: https://github.com/MitraWann/Lupin-MD');

    // [FIX] Hapus setInterval(() => {}, 1000) yang kosong dan sia-sia
}

// ── Global error handler ──────────────────────────────────────
process.on('unhandledRejection', (reason) => {
    console.error('\x1b[31m%s\x1b[0m', `Unhandled promise rejection: ${reason}`);
    // Tidak spawn ulang dari sini — cegah double-spawn
});

// [FIX] process.on('exit') tidak bisa spawn — dihapus, diganti log saja
process.on('exit', (code) => {
    if (code !== 0) console.error(`[index.js] Proses keluar dengan kode: ${code}`);
});

// ── Entry point ───────────────────────────────────────────────
// [FIX] await startServer() sebelum start() agar port Express siap lebih dulu
(async () => {
    await startServer();
    start('main.js');
})();
