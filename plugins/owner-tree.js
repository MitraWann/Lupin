const fs = require('fs')
const path = require('path')

let handler = async (m, { conn, text, usedPrefix, command, args, isOwner }) => {
    // Memunculkan pesan loading
    m.reply(global.wait || '_*Tunggu sedang di proses...*_')

    try {
        // Logika penentuan direktori target dan kedalaman (depth)
        // Contoh penggunaan: .tree plugins 2, .tree 2, .ls plugins 2
        let targetPath = '.'
        let maxDepth = 1

        if (args[0]) {
            // Jika argumen pertama berupa angka dan tidak ada argumen kedua, anggap sebagai depth
            if (!isNaN(args[0]) && !args[1]) {
                maxDepth = parseInt(args[0])
            } else {
                targetPath = args[0]
                maxDepth = args[1] && !isNaN(args[1]) ? parseInt(args[1]) : 1
            }
        }

        // Resolve path agar mendukung navigasi relative (seperti ../ atau ./)
        let targetDir = path.resolve(targetPath)

        // Pengecekan apakah direktori eksis
        if (!fs.existsSync(targetDir)) {
            return m.reply(`❌ Direktori atau path tidak ditemukan!\n\nPath: \`${targetDir}\``)
        }

        const statDir = fs.statSync(targetDir)
        if (!statDir.isDirectory()) {
            return m.reply(`❌ Target yang Anda tuju adalah file, bukan sebuah direktori/folder!\n\nPath: \`${targetDir}\``)
        }

        // Fungsi rekursif untuk membangun struktur Tree (direktori)
        function getDirTree(dir, prefix = '', currentDepth = 0) {
            // Batas kedalaman pencarian agar bot tidak freeze
            if (currentDepth > maxDepth) return ''

            let result = ''
            try {
                const files = fs.readdirSync(dir)
                
                // Exclude folder berat dan sensitif untuk mencegah lag/crash dan kebocoran session
                const excludes = ['node_modules', '.git', 'sessions', 'session', 'tmp', 'database', '.cache', '.npm', '.RecycleBin']
                let filteredFiles = files.filter(f => !excludes.includes(f))

                let hiddenCount = 0
                
                // Penentuan limit file khusus KECUALI menggunakan command .ls
                if (command.toLowerCase() !== 'ls') {
                    let maxLimit = 0
                    let normalizedDir = path.resolve(dir).replace(/\\/g, '/') // Standarisasi path (cross-platform)

                    if (path.basename(dir) === 'plugins') {
                        maxLimit = 15 // Limit 15 file untuk folder plugins
                    } else if (normalizedDir === '/home/container/src/font') {
                        maxLimit = 5  // Limit 5 file untuk folder font spesifik
                    }

                    // Eksekusi acak dan limitasi jika melebihi batas
                    if (maxLimit > 0 && filteredFiles.length > maxLimit) {
                        for (let i = filteredFiles.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1))
                            ;[filteredFiles[i], filteredFiles[j]] = [filteredFiles[j], filteredFiles[i]]
                        }
                        hiddenCount = filteredFiles.length - maxLimit
                        filteredFiles = filteredFiles.slice(0, maxLimit)
                    }
                }

                // Sort: Folder tampil duluan, baru file
                filteredFiles.sort((a, b) => {
                    const isDirA = fs.statSync(path.join(dir, a)).isDirectory()
                    const isDirB = fs.statSync(path.join(dir, b)).isDirectory()
                    if (isDirA && !isDirB) return -1
                    if (!isDirA && isDirB) return 1
                    return a.localeCompare(b)
                })

                filteredFiles.forEach((file, index) => {
                    const fullPath = path.join(dir, file)
                    const isLast = (index === filteredFiles.length - 1) && (hiddenCount === 0)
                    
                    try {
                        const stats = fs.statSync(fullPath)
                        const isDirectory = stats.isDirectory()

                        // Penentuan ikon dan garis tree
                        const marker = isLast ? '└── ' : '├── '
                        const icon = isDirectory ? '📁' : '📄'

                        result += `${prefix}${marker}${icon} ${file}\n`

                        // Jika item adalah folder, jalankan fungsi ini lagi (rekursif) ke dalam folder tersebut
                        if (isDirectory) {
                            const newPrefix = prefix + (isLast ? '    ' : '│   ')
                            result += getDirTree(fullPath, newPrefix, currentDepth + 1)
                        }
                    } catch (e) {
                        // Error handling saat file tidak memiliki hak akses (permission denied)
                        const marker = isLast ? '└── ' : '├── '
                        result += `${prefix}${marker}❌ [Akses Ditolak: ${file}]\n`
                    }
                })

                if (hiddenCount > 0) {
                    result += `${prefix}└── ℹ️ [+ ${hiddenCount} file lainnya]\n`
                }
            } catch (err) {
                result += `${prefix}└── ❌ [Gagal membaca direktori]\n`
            }
            return result
        }

        // Eksekusi fungsi Tree
        let treeOutput = getDirTree(targetDir)
        
        // Output Formating
        let replyMsg = `📂 *Struktur Direktori Bot*\n`
        replyMsg += `📍 *Path:* \`${targetDir}\`\n`
        replyMsg += `📏 *Kedalaman (Depth):* ${maxDepth}\n\n`
        
        if (treeOutput.trim() === '') {
            replyMsg += `_Direktori kosong atau hanya berisi file yang di-exclude/tersembunyi._`
        } else {
            replyMsg += treeOutput
        }
        
        replyMsg += `\n\n> *Tips:* Gunakan \`${usedPrefix + command} <nama_folder> <depth>\` atau \`${usedPrefix + command} <depth>\`. Contoh: \`${usedPrefix + command} plugins 2\``

        // Mengirimkan hasil output
        conn.sendMessage(m.chat, { text: replyMsg }, { quoted: m })

    } catch (error) {
        console.error(error)
        m.reply(global.eror || '_*Server Error*_')
    }
}

handler.help = ['tree <path> <depth>', 'tree <depth>', 'ls <path> <depth>', 'ls <depth>']
handler.tags = ['owner']
handler.command = /^(tree|ls|dir|listfile)$/i

// Flag Keamanan Wajib
handler.owner = true // HANYA BISA DIAKSES OLEH OWNER

module.exports = handler