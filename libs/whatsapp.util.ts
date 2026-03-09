
// ── Estado de sesión (singleton a nivel de módulo) ────────────────────────────
let waClient:   any    = null;
let waQrBase64: string | null = null;
let waReady             = false;

// ── Inicializa el cliente una sola vez ────────────────────────────────────────
async function ensureWhatsApp(): Promise<void> {
  if (waClient) return;

  const { Client, LocalAuth } = require('whatsapp-web.js');

  waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  });

  waClient.on('qr', async (qr: string) => {
    const QRCodeLib = require('qrcode');
    waQrBase64 = await QRCodeLib.toDataURL(qr);
    waReady    = false;
  });

  waClient.on('ready', () => {
    waReady    = true;
    waQrBase64 = null;
  });

  waClient.on('disconnected', () => {
    waReady  = false;
    waClient = null; // permite reinicializar si se desconecta
  });

  await waClient.initialize();
}

// ── Exportadas ────────────────────────────────────────────────────────────────

/**
 * Devuelve el estado de la sesión WhatsApp.
 * Llama a ensureWhatsApp() la primera vez — igual que buildQuotePdf hace require('pdfkit').
 */
export async function getWhatsAppStatus(): Promise<{ ready: boolean; qr: string | null }> {
  await ensureWhatsApp();

  // Espera hasta 15s a que llegue el QR si recién se inicializó
  if (!waReady && !waQrBase64) {
    await new Promise<void>((resolve) => {
      const timeout  = setTimeout(resolve, 15_000);
      const interval = setInterval(() => {
        if (waQrBase64 || waReady) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve();
        }
      }, 500);
    });
  }

  return { ready: waReady, qr: waQrBase64 };
}

/**
 * Envía un PDF por WhatsApp al número indicado.
 * Mismo patrón que buildQuotePdf: recibe datos, devuelve resultado.
 */
export async function sendWhatsApp(
  telefono: string,
  mensaje:  string,
  buffer:   Buffer,
  filename: string,
): Promise<void> {
  if (!waReady) {
    throw new Error('WhatsApp no está conectado. Escanea el QR primero en GET /quote/whatsapp/status');
  }

  // Normaliza número peruano → formato whatsapp-web.js
  let num = telefono.replace(/\D/g, '');
  if (num.length === 9 && num.startsWith('9')) num = `51${num}`;
  const chatId = `${num}@c.us`;

  const { MessageMedia } = require('whatsapp-web.js');
  const media = new MessageMedia('application/pdf', buffer.toString('base64'), filename);

  await waClient.sendMessage(chatId, media, { caption: mensaje });
}