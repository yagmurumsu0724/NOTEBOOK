const stickerModules = import.meta.glob('../../../assets/stickers/*.png', { eager: true, import: 'default' });
export const extractedStickers = Object.values(stickerModules) as string[];
