const { proto } = require('@whiskeysockets/baileys');

/**
 * Membuat AIRich Text Submessage
 */
function createTextSubmessage(text) {
  return {
    messageType: proto.Message.AIRichResponseSubMessageType.AI_RICH_RESPONSE_TEXT,
    messageText: text,
  };
}

/**
 * Membuat AIRich Inline Image Submessage
 */
function createInlineImageSubmessage(previewUrl, highResUrl, sourceUrl, imageText, alignment = 2, tapUrl = null) {
  return {
    messageType: proto.Message.AIRichResponseSubMessageType.AI_RICH_RESPONSE_INLINE_IMAGE,
    imageMetadata: {
      imageUrl: {
        imagePreviewUrl: previewUrl,
        imageHighResUrl: highResUrl,
        sourceUrl: sourceUrl,
      },
      imageText: imageText,
      alignment: alignment, // 0=LEFT, 1=RIGHT, 2=CENTER
      tapLinkUrl: tapUrl || sourceUrl,
    },
  };
}

/**
 * Membuat AIRich Response Message lengkap
 */
function createAIRichResponseMessage(submessages, contextInfo = null) {
  return {
    richResponseMessage: {
      messageType: proto.AIRichResponseMessageType.AI_RICH_RESPONSE_TYPE_STANDARD,
      submessages: submessages,
      contextInfo: contextInfo,
    },
  };
}

module.exports = {
  createTextSubmessage,
  createInlineImageSubmessage,
  createAIRichResponseMessage,
};