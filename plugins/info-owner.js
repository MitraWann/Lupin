/**
 * Plugin: Info Owner (vCard)
 * Description: Menampilkan kontak (vCard) owner bot agar user bisa menghubungi developer
 * Location: ./plugins/info-owner.js
 */

let handler = async (m, { conn, usedPrefix, command }) => {
    // Ambil data owner dari konfigurasi global (global.owner)
    // Default fallback jika tidak ada data di global
    let ownerData = global.owner || [['6282215415550', 'Mitraaa']]; 
    let contacts = [];

    // Looping semua data owner untuk dibuatkan vCard-nya
    for (let i = 0; i < ownerData.length; i++) {
        // Handle format array string ['628xxx'] atau array of arrays [['628xxx', 'Name']]
        let number = typeof ownerData[i] === 'object' ? ownerData[i][0] : ownerData[i];
        let name = typeof ownerData[i] === 'object' ? (ownerData[i][1] || 'Mitraaa') : 'Mitraaa';
        
        // Bersihkan karakter non-digit pada nomor
        number = String(number).replace(/[^0-9]/g, '');
        
        // Format standar vCard versi 3.0
        let vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:Bot Developer;\nTEL;type=CELL;type=VOICE;waid=${number}:+${number}\nEND:VCARD`;
        
        contacts.push({ vcard, displayName: name });
    }

    // Mengirimkan kontak ke user dalam bentuk Contact Message (vCard)
    await conn.sendMessage(m.chat, {
        contacts: {
            // Tentukan display name jika kontaknya lebih dari 1
            displayName: contacts.length > 1 ? `${contacts.length} Kontak Owner` : contacts[0].displayName,
            contacts: contacts
        }
    }, { quoted: m });

    // Pesan tambahan (Bisa di-custom sesuai kebutuhan)
    await m.reply(`👋 Halo! Di atas adalah kontak owner bot ini.\n\n_Catatan: Harap chat jika ada kepentingan mendesak, bug report, atau request sewa bot. Jangan melakukan spam._`);
}

handler.help = ['owner']
handler.tags = ['info']
handler.command = /^(owner)$/i

// Tidak membutuhkan limit atau status premium
handler.limit = false
handler.premium = false

module.exports = handler;