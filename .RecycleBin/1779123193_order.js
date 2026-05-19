const fs = require('fs')
const path = require('path')

const PRODUCTS_PATH = path.join(__dirname, '../products.json')
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

const handler = async (m, { conn, args, usedPrefix, command }) => {
    const productId = args[0]?.toUpperCase()
    if (!productId) throw `Masukkan ID produk!\n\nContoh: ${usedPrefix + command} P001\n\nLihat katalog: ${usedPrefix}catalog`

    const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'))
    const product = products.find(p => p.id === productId)
    if (!product) throw `Produk *${productId}* tidak ditemukan.\n\nLihat katalog: ${usedPrefix}catalog`

    const orderId = `ORD${Date.now()}`
    const orders = loadOrders()
    orders[orderId] = {
        orderId,
        productId: product.id,
        productName: product.name,
        price: product.price,
        userJid: m.sender,
        chat: m.chat,
        status: 'INQUIRY',
        createdAt: Date.now(),
    }
    saveOrders(orders)

    const imageBuffer = await conn.getFile(product.image).then(f => f.data)
    const msgContent = {
        orderMessage: {
            orderId,
            thumbnail: imageBuffer,
            itemCount: 1,
            status: 1,
            surface: 1,
            message: `Order: ${product.name}\nID: ${orderId}`,
            orderTitle: product.name,
            sellerJid: m.chat,
            token: orderId,
            totalAmount1000: product.price * 1000,
            totalCurrencyCode: 'IDR',
        }
    }
    await conn.relayMessage(m.chat, msgContent, {
        messageId: conn.generateMessageTag(),
    })
}

handler.help = ['order <id produk>']
handler.tags = ['order']
handler.command = /^(order)$/i

module.exports = handler
