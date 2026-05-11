let handler = async (m, { conn, usedPrefix, command }) => {
    // Memunculkan pesan loading bawaan (variabel global dari config)
    m.reply(global.wait || '_*Tunggu sedang di proses...*_');

    let replyMsg = '*[ 📻 STATUS EVENT LISTENERS ]*\n\n';

    // 1. Cek Baileys Event (conn.ev) dengan Fallback/Refleksi
    replyMsg += '*[ 🟢 BAILEYS EVENT (conn.ev) ]*\n';
    try {
        if (typeof conn.ev.eventNames === 'function') {
            const connEvents = conn.ev.eventNames();
            if (connEvents.length === 0) replyMsg += 'Tidak ada event berjalan.\n';
            for (let ev of connEvents) {
                replyMsg += `➭ *${ev}* : ${conn.ev.listenerCount(ev)} listener(s)\n`;
            }
        } else if (conn.ev && conn.ev._events) {
            // Bypass/Reverse internal object jika eventNames tidak ada
            const connEvents = Object.keys(conn.ev._events);
            if (connEvents.length === 0) replyMsg += 'Tidak ada event berjalan.\n';
            for (let ev of connEvents) {
                let listeners = conn.ev._events[ev];
                // Hitung manual jumlah listener (bisa berupa array atau object tunggal)
                let count = Array.isArray(listeners) ? listeners.length : (listeners ? 1 : 0);
                replyMsg += `➭ *${ev}* : ${count} listener(s)\n`;
            }
        } else {
            replyMsg += 'Sistem Baileys ini menyembunyikan detail event (Tidak terdeteksi).\n';
        }
    } catch (e) {
        replyMsg += `Gagal membaca conn.ev: ${e.message}\n`;
    }

    // 2. Cek WebSocket Event (conn.ws) - Titik rawan Memory Leak
    replyMsg += '\n*[ 🌐 WEBSOCKET EVENT (conn.ws) ]*\n';
    try {
        if (conn.ws && typeof conn.ws.eventNames === 'function') {
            const wsEvents = conn.ws.eventNames();
            if (wsEvents.length === 0) replyMsg += 'Tidak ada event berjalan.\n';
            for (let ev of wsEvents) {
                replyMsg += `➭ *${ev}* : ${conn.ws.listenerCount(ev)} listener(s)\n`;
            }
        } else if (conn.ws && conn.ws._events) {
            const wsEvents = Object.keys(conn.ws._events);
            if (wsEvents.length === 0) replyMsg += 'Tidak ada event berjalan.\n';
            for (let ev of wsEvents) {
                let listeners = conn.ws._events[ev];
                let count = Array.isArray(listeners) ? listeners.length : (listeners ? 1 : 0);
                replyMsg += `➭ *${ev}* : ${count} listener(s)\n`;
            }
        } else {
            replyMsg += 'Tidak ada koneksi WebSocket aktif terdeteksi.\n';
        }
    } catch (e) {
        replyMsg += `Gagal membaca conn.ws: ${e.message}\n`;
    }

    // 3. Cek Node Process Event (Global)
    replyMsg += '\n*[ ⚙️ NODE PROCESS LISTENERS ]*\n';
    try {
        const processEvents = process.eventNames();
        if (processEvents.length === 0) replyMsg += 'Tidak ada event global berjalan.\n';
        for (let ev of processEvents) {
            replyMsg += `➭ *${ev}* : ${process.listenerCount(ev)} listener(s)\n`;
        }
    } catch (e) {
        replyMsg += `Gagal membaca process: ${e.message}\n`;
    }

    replyMsg += '\n_📌 Catatan: Jika ada listener yang angkanya terus bertambah (misal lebih dari 15-20), itu adalah indikasi kuat terjadinya Memory Leak!_';

    // Mengirimkan pesan akhir
    m.reply(replyMsg);
}

handler.help = ['ceklistener']
handler.tags = ['owner']
handler.command = /^(ceklistener|cekpendengar)$/i

// Flag Keamanan: Hanya untuk Owner
handler.owner = true 

module.exports = handler