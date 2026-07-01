export interface ReadyShape {
  id: string;
  name: string;
  category: 'basic' | 'arrow' | 'flowchart' | 'bubble';
  svgPath: string;
  viewBox: string;
}

export const SHAPE_LIBRARY: ReadyShape[] = [
  // --- BASIC ---
  { id: 'rect', name: 'Dikdörtgen', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M3 3h18v18H3z' },
  { id: 'circle', name: 'Daire', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' },
  { id: 'triangle', name: 'Üçgen', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M1 21h22L12 2 1 21z' },
  { id: 'star', name: 'Yıldız', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z' },
  { id: 'hexagon', name: 'Altıgen', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M17.3 2H6.7L1 12l5.7 10h10.6l5.7-10z' },
  { id: 'octagon', name: 'Sekizgen', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M15.7 2H8.3L2 8.3v7.4L8.3 22h7.4l6.3-6.3V8.3z' },
  { id: 'heart', name: 'Kalp', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  { id: 'diamond', name: 'Elmas', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M12 2L2 12l10 10 10-10L12 2z' },
  { id: 'cross', name: 'Çarpı', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' },
  { id: 'check', name: 'Tik', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' },
  { id: 'rhombus', name: 'Paralelkenar', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M6 2h14l-4 20H2L6 2z' },
  { id: 'trapezoid', name: 'Yamuk', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M8 2h8l6 20H2L8 2z' },
  { id: 'pentagon', name: 'Beşgen', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M12 2L2 10l4 12h12l4-12L12 2z' },
  { id: 'shield', name: 'Kalkan', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
  { id: 'bookmark', name: 'Yer İmi', category: 'basic', viewBox: '0 0 24 24', svgPath: 'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z' },
  
  // --- ARROWS ---
  { id: 'arrow-right', name: 'Sağ Ok', category: 'arrow', viewBox: '0 0 24 24', svgPath: 'M5 11v2h10v3l4-4-4-4v3H5z' },
  { id: 'arrow-left', name: 'Sol Ok', category: 'arrow', viewBox: '0 0 24 24', svgPath: 'M19 11v2H9v3l-4-4 4-4v3h10z' },
  { id: 'arrow-up', name: 'Yukarı Ok', category: 'arrow', viewBox: '0 0 24 24', svgPath: 'M11 19h2V9h3l-4-4-4 4h3v10z' },
  { id: 'arrow-down', name: 'Aşağı Ok', category: 'arrow', viewBox: '0 0 24 24', svgPath: 'M11 5h2v10h3l-4 4-4-4h3V5z' },
  { id: 'arrow-fat-right', name: 'Kalın Ok', category: 'arrow', viewBox: '0 0 24 24', svgPath: 'M4 10v4h9v4l7-6-7-6v4H4z' },
  { id: 'arrow-double', name: 'Çift Yön Ok', category: 'arrow', viewBox: '0 0 24 24', svgPath: 'M8 10V7L4 11l4 4v-3h8v3l4-4-4-4v-3h-8v3z' },
  { id: 'arrow-turn', name: 'Kıvrımlı Ok', category: 'arrow', viewBox: '0 0 24 24', svgPath: 'M19 15l-6 6-1.42-1.42L15.17 16H4V4h2v10h9.17l-3.59-3.58L13 9l6 6z' },
  { id: 'arrow-circle', name: 'Daire Ok', category: 'arrow', viewBox: '0 0 24 24', svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
  { id: 'cursor', name: 'İmleç', category: 'arrow', viewBox: '0 0 24 24', svgPath: 'M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4L7 18.5V2z' },
  { id: 'play', name: 'Oynat Ok', category: 'arrow', viewBox: '0 0 24 24', svgPath: 'M8 5v14l11-7z' },

  // --- FLOWCHART ---
  { id: 'process', name: 'İşlem (Kutu)', category: 'flowchart', viewBox: '0 0 24 24', svgPath: 'M3 5h18v14H3z' },
  { id: 'decision', name: 'Karar (Elmas)', category: 'flowchart', viewBox: '0 0 24 24', svgPath: 'M12 2L2 12l10 10 10-10L12 2z' },
  { id: 'terminator', name: 'Başla/Bitir', category: 'flowchart', viewBox: '0 0 24 24', svgPath: 'M17 6H7c-3.31 0-6 2.69-6 6s2.69 6 6 6h10c3.31 0 6-2.69 6-6s-2.69-6-6-6z' },
  { id: 'data', name: 'Veri (Paralel)', category: 'flowchart', viewBox: '0 0 24 24', svgPath: 'M7 4h14l-4 16H3L7 4z' },
  { id: 'document', name: 'Döküman', category: 'flowchart', viewBox: '0 0 24 24', svgPath: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z' },
  { id: 'database', name: 'Veritabanı', category: 'flowchart', viewBox: '0 0 24 24', svgPath: 'M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4z' },
  { id: 'display', name: 'Ekran', category: 'flowchart', viewBox: '0 0 24 24', svgPath: 'M2 7h20v10H2z' },
  { id: 'manual-input', name: 'Manuel Girdi', category: 'flowchart', viewBox: '0 0 24 24', svgPath: 'M3 9h18v10H3z' },
  { id: 'preparation', name: 'Hazırlık', category: 'flowchart', viewBox: '0 0 24 24', svgPath: 'M12 2l10 5v10l-10 5-10-5V7l10-5z' },
  { id: 'delay', name: 'Gecikme', category: 'flowchart', viewBox: '0 0 24 24', svgPath: 'M4 4h10c4.42 0 8 3.58 8 8s-3.58 8-8 8H4V4z' },

  // --- BUBBLES ---
  { id: 'chat-round', name: 'Yuvarlak Balon', category: 'bubble', viewBox: '0 0 24 24', svgPath: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z' },
  { id: 'chat-square', name: 'Kare Balon', category: 'bubble', viewBox: '0 0 24 24', svgPath: 'M20 2H4v16h12l4 4V2z' },
  { id: 'chat-thought', name: 'Düşünce Balonu', category: 'bubble', viewBox: '0 0 24 24', svgPath: 'M19 6c0-2.21-1.79-4-4-4-1.6 0-3 1.05-3.66 2.49-.49-.31-1.07-.49-1.68-.49-1.92 0-3.48 1.55-3.48 3.48 0 .19.02.37.05.54C4.38 8.68 3 10.18 3 12c0 2.21 1.79 4 4 4h12c2.21 0 4-1.79 4-4 0-1.95-1.41-3.59-3.26-3.95.17-.67.26-1.35.26-2.05zM7.5 19c-.83 0-1.5.67-1.5 1.5S6.67 22 7.5 22 9 21.33 9 20.5 8.33 19 7.5 19zm1.5-2h-3v-3h3v3zm-4.5 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z' },
  { id: 'quote', name: 'Alıntı', category: 'bubble', viewBox: '0 0 24 24', svgPath: 'M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z' },
  { id: 'info', name: 'Bilgi', category: 'bubble', viewBox: '0 0 24 24', svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' }
  // (Assuming we have around 50 definitions in total based on this pattern)
];
