/**
 * Library: Native Flow (Interactive Buttons)
 * Description: Helper untuk merakit, mengirim, dan menyadap pesan tombol interaktif
 * Author: Senior Bot Developer
 */

/**
 * Mengirim pesan tombol Native Flow
 */
const sendButton = async (conn, jid, buttons = [], quoted = null, opts = {}) => {
    // Dynamic import untuk menghindari error ESM Baileys
    const { 
        proto,
        prepareWAMessageMedia,
        generateWAMessageFromContent
    } = await import('@whiskeysockets/baileys');

    if (!conn.user?.id) throw new Error("User not authenticated");
    if (!Array.isArray(buttons) || !buttons.length) throw new Error("Buttons must be a non-empty array");

    const { title = "", subtitle = "", header = "", content = "", footer = "", image = null } = opts;

    // Memproses susunan format tombol
    const processedButtons = buttons.map((btn, i) => {
        if (!btn.name || !btn.buttonParamsJson) throw new Error(`Button[${i}] invalid format`);
        return {
            name: btn.name,
            buttonParamsJson: btn.buttonParamsJson
        };
    });

    let headerContent;
    if (image) {
        const media = typeof image === "string" ? { image: { url: image } } : { image };
        const prepared = await prepareWAMessageMedia(media, { upload: conn.waUploadToServer });
        headerContent = {
            title: title || undefined,
            subtitle: subtitle || undefined,
            hasMediaAttachment: true,
            imageMessage: prepared.imageMessage
        };
    } else if (header || title) {
        headerContent = {
            title: title || header,
            subtitle: subtitle || undefined,
            hasMediaAttachment: false
        };
    }

    // Merakit pesan interaktif (UI Native Flow)
    const interactive = proto.Message.InteractiveMessage.create({
        ...(headerContent && { header: headerContent }),
        ...(content && { body: { text: content } }),
        ...(footer && { footer: { text: footer } }),
        contextInfo: {
            mentionedJid: conn.parseMention ? conn.parseMention(content) : []
        },
        nativeFlowMessage: {
            buttons: processedButtons
        }
    });

    // Menghasilkan konten siap kirim
    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: interactive
            }
        }
    }, { userJid: conn.user.id, quoted });

    // Mengeksekusi pengiriman menggunakan raw payload
    await conn.relayMessage(jid, msg.message, {
        messageId: msg.key.id,
        additionalNodes: [{
            tag: "biz",
            attrs: {},
            content: [{
                tag: "interactive",
                attrs: { type: "native_flow", v: "1" },
                content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }]
            }]
        }]
    });

    return msg;
};

/**
 * Menyadap dan mengekstrak Payload (JSON) dari respon tombol (Digunakan di handler.all)
 */
const extractPayload = (m) => {
    if (m.message?.interactiveResponseMessage?.nativeFlowResponseMessage) {
        try {
            return JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
        } catch (e) {
            console.error("Gagal mengekstrak respon Native Flow:", e);
            return null;
        }
    }
    return null;
};

module.exports = {
    sendButton,
    extractPayload
};