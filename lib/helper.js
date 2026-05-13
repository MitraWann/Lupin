const { proto } = require('@whiskeysockets/baileys');
const SubType = proto.AIRichResponseSubMessageType;
const MsgType = proto.AIRichResponseMessageType;

const AIRichResponse = {
  text: (text) => ({
    messageType: SubType.AI_RICH_RESPONSE_TEXT,
    messageText: text,
  }),

  inlineImage: ({ imageUrl, imageText = '', alignment = 0, tapLinkUrl = '' }) => ({
    messageType: SubType.AI_RICH_RESPONSE_INLINE_IMAGE,
    imageMetadata: { imageUrl, imageText, alignment, tapLinkUrl },
  }),

  gridImage: ({ gridImageUrl = '', imageUrls = [] }) => ({
    messageType: SubType.AI_RICH_RESPONSE_GRID_IMAGE,
    gridImageMetadata: {
      gridImageUrl,
      imageUrls: imageUrls.map(({ imagePreviewUrl = '', imageHighResUrl = '', sourceUrl = '' }) => ({
        imagePreviewUrl, imageHighResUrl, sourceUrl,
      })),
    },
  }),

  code: ({ codeLanguage = '', codeBlocks = [] }) => ({
    messageType: SubType.AI_RICH_RESPONSE_CODE,
    codeMetadata: {
      codeLanguage,
      codeBlocks: codeBlocks.map(({ highlightType = 0, codeContent = '' }) => ({
        highlightType, codeContent,
      })),
    },
  }),

  table: ({ title = '', rows = [] }) => ({
    messageType: SubType.AI_RICH_RESPONSE_TABLE,
    tableMetadata: {
      title,
      rows: rows.map(({ items = [], isHeading = false }) => ({ items, isHeading })),
    },
  }),

  map: ({ centerLatitude, centerLongitude, latitudeDelta = 0.01, longitudeDelta = 0.01, annotations = [], showInfoList = false }) => ({
    messageType: SubType.AI_RICH_RESPONSE_MAP,
    mapMetadata: {
      centerLatitude, centerLongitude, latitudeDelta, longitudeDelta, showInfoList,
      annotations: annotations.map(({ annotationNumber = 1, latitude, longitude, title = '', body = '' }) => ({
        annotationNumber, latitude, longitude, title, body,
      })),
    },
  }),

  latex: ({ text = '', expressions = [] }) => ({
    messageType: SubType.AI_RICH_RESPONSE_LATEX,
    latexMetadata: { text, expressions },
  }),

  dynamic: ({ type = 0, version = 0, url = '', loopCount = 0 }) => ({
    messageType: SubType.AI_RICH_RESPONSE_DYNAMIC,
    dynamicMetadata: { type, version, url, loopCount },
  }),

  contentItems: ({ contentType = 0, items = [] }) => ({
    messageType: SubType.AI_RICH_RESPONSE_CONTENT_ITEMS,
    contentItemsMetadata: {
      contentType,
      itemsMetadata: items.map(({ title = '', profileIconUrl = '', thumbnailUrl = '', videoUrl = '' }) => ({
        reelItem: { title, profileIconUrl, thumbnailUrl, videoUrl },
      })),
    },
  }),
};

async function sendAIRichResponse(conn, jid, submessages = [], opts = {}) {
  try {
    const msgContent = {
      richResponseMessage: {
        messageType: MsgType.AI_RICH_RESPONSE_TYPE_STANDARD,
        submessages,
        ...(opts.contextInfo ? { contextInfo: opts.contextInfo } : {}),
        ...(opts.unifiedResponse ? { unifiedResponse: { data: opts.unifiedResponse } } : {}),
      },
    };

    return await conn.relayMessage(jid, msgContent, {
      messageId: conn.generateMessageTag(),
    });
  } catch (e) {
    throw new Error(`sendAIRichResponse: ${e.message}`);
  }
}

module.exports = { sendAIRichResponse, AIRichResponse };