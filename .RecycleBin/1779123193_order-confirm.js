const fs = require('fs')
const path = require('path')

const ORDERS_PATH = path.join(__dirname, '../orders.json')

const loadOrders = () => {
    try {
        return JSON.parse(fs.readFileSync(ORDERS_PATH, 'utf8'))
    } catch {
        return {}
    }
}

const saveOrders = (orders) => {
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2))
}

const handler = async (m, { conn, args, command }) => {
    const orderId = args[0]?.toUpperCase()
    if (!orderId) throw `Masukkan Order ID!\n\nContoh:\n!accept ORD123\n!decline ORD123`

    const orders = loadOrders()
    const order = orders[orderId]
    if (!order) throw `Order *${orderId}* tidak ditemukan.`
    if (order.status !== 'INQUIRY') throw `Order *${orderId}* sudah diproses (${order.status}).`

    const isAccept = /^accept$/i.test(command)
    const newStatus = isAccept ? 2 : 3
    const newStatusLabel = isAccept ? 'ACCEPTED' : 'DECLINED'

    orders[orderId].status = newStatusLabel
    orders[orderId].updatedAt = Date.now()
    saveOrders(orders)

    let imageBuffer
    try {
        const products = JSON.parse(fs.readFileSync(path.join(__dirname, '../products.json'), 'utf8'))
        const product = products.find(p => p.id === order.productId)
        if (product) imageBuffer = await conn.getFile(product.image).then(f => f.data)
    } catch {}

    const msgContent = {
        orderMessage: {
            orderId,
            thumbnail: imageBuffer || null,
            itemCount: 1,
            status: newStatus,
            surface: 1,
            message: isAccept
                ? `✅ Order ${orderId} diterima! Kami akan segera memproses pesanan Anda.`
                : `❌ Order ${orderId} ditolak. Silakan hubungi kami untuk informasi lebih lanjut.`,
            orderTitle: order.productName,
            sellerJid: order.chat,
            token: orderId,
            totalAmount1000: order.price * 1000,
            totalCurrencyCode: 'IDR',
        }
    }

    await conn.relayMessage(order.chat, msgContent, {
        messageId: conn.generateMessageTag(),
    })

    conn.reply(m.chat, `Order *${orderId}* berhasil di-${newStatusLabel.toLowerCase()}.`, m)
}

handler.help = ['accept <orderId>', 'decline <orderId>']
handler.tags = ['order']
handler.command = /^(accept|decline)$/i
handler.owner = true

module.exports = handler
