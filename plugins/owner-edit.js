/**
 * Nama Plugin: Global Code Replacer
 * Deskripsi: Mengganti potongan string/kode spesifik secara massal di semua file .js
 * Author: Senior Bot Developer
 */

const fs = require('fs');
const path = require('path');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Validasi Input
    if (!text) {
        return m.reply(`⚠️ *Format Salah!*\n\nGunakan format: ${usedPrefix}${command} teks_lama | teks_baru\n\n*Contoh Penggunaan:*\n${usedPrefix}${command} menu | daftar\n${usedPrefix}${command} reply( | sendMessage(`);
    }

    let [oldText, newText] = text.split('|');
    
    if (!oldText || newText === undefined) {
        return m.reply(`⚠️ *Format Salah!*\nPastikan Anda memisahkan teks lama dan baru dengan tanda vertikal ( | ).\n\n*Contoh:* ${usedPrefix}${command} let handler | const handler`);
    }

    oldText = oldText.trim();
    newText = newText.trim();

    // 2. Proteksi dari input kosong yang bisa merusak seluruh file
    if (oldText === '') {
        return m.reply(`⚠️ *Akses Ditolak:* Teks yang ingin diganti tidak boleh kosong!`);
    }

    await m.reply(global.wait || '⏳ Sedang memproses penggantian kode massal...');

    let modifiedFiles = [];
    
    // 3. Fungsi Rekursif untuk membaca dan memodifikasi file
    function replaceInFiles(dir, oldTxt, newTxt) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // EXCLUDE folder yang tidak boleh disentuh
                const excludeDirs = ['node_modules', '.git', 'sessions', 'tmp', 'database', 'src'];
                if (excludeDirs.includes(file)) continue;
                
                // Lanjut scan ke dalam sub-folder
                replaceInFiles(fullPath, oldTxt, newTxt);
            } else {
                // HANYA proses file Javascript (.js) untuk meminimalisir korupsi database .json
                if (!fullPath.endsWith('.js')) continue;

                try {
                    let content = fs.readFileSync(fullPath, 'utf8');
                    
                    // Cek apakah file mengandung teks lama
                    if (content.includes(oldTxt)) {
                        // split().join() digunakan sebagai alternatif gampang dari RegEx global replace
                        let newContent = content.split(oldTxt).join(newTxt);
                        
                        // Timpa file dengan konten baru
                        fs.writeFileSync(fullPath, newContent, 'utf8');
                        modifiedFiles.push(fullPath.replace(process.cwd(), '')); // Simpan path relatif
                    }
                } catch (err) {
                    console.error(`Gagal membaca/menulis file ${fullPath}:`, err);
                }
            }
        }
    }

    // 4. Eksekusi Penggantian
    try {
        replaceInFiles(process.cwd(), oldText, newText);
        
        let resultMsg = `✅ *PENGGANTIAN BERHASIL*\n\n`;
        resultMsg += `📝 *Teks Lama:* \`${oldText}\`\n`;
        resultMsg += `📝 *Teks Baru:* \`${newText}\`\n`;
        resultMsg += `📁 *Total File Diubah:* ${modifiedFiles.length} file\n\n`;
        
        if (modifiedFiles.length > 0) {
            resultMsg += `*Detail File:*\n` + modifiedFiles.map(v => `• ${v}`).join('\n');
            resultMsg += `\n\n⚠️ _Disarankan untuk me-restart bot agar perubahan pada file utama (di luar /plugins) dapat direkam oleh Node.js._`;
        } else {
            resultMsg += `_Tidak ditemukan potongan kode "${oldText}" di file .js manapun._`;
        }

        m.reply(resultMsg);
        
    } catch (e) {
        console.error(e);
        m.reply((global.eror || '❌ Terjadi Kesalahan') + `\n\nError: ${e.message}`);
    }
}

handler.help = ['replacecode <old|new>']
handler.tags = ['owner']
handler.command = /^(replacecode|gantikode|ubahkode)$/i

// KEAMANAN TINGKAT TINGGI: Hanya boleh diakses oleh Owner
handler.owner = true 

module.exports = handler;