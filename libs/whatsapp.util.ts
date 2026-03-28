import { toDataURL } from 'qrcode';

// ── Estado de sesión (singleton a nivel de módulo) ────────────────────────────
let waClient: any = null;
let waQrBase64: string | null = null;
let waReady = false;
let waInitializing = false; // ✅ evita doble inicialización

// ── Inicializa el cliente una sola vez ────────────────────────────────────────
async function ensureWhatsApp(): Promise<void> {
  if (waClient || waInitializing) return;

  waInitializing = true;

  const { Client, LocalAuth } = require('whatsapp-web.js');

  waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    },
  });

  waClient.on('qr', async (qr: string) => {
    waQrBase64 = await toDataURL(qr);
    waReady = false;
    console.log('📱 QR generado — escanea desde GET /receipts/whatsapp/status');
  });

  waClient.on('ready', () => {
    waReady = true;
    waQrBase64 = null;
    waInitializing = false;
    console.log('✅ WhatsApp listo');
  });

  waClient.on('auth_failure', (msg: string) => {
    console.error('❌ WhatsApp auth failure:', msg);
    waClient = null;
    waInitializing = false;
  });

  waClient.on('disconnected', (reason: string) => {
    console.warn('⚠️ WhatsApp desconectado:', reason);
    waReady = false;
    waClient = null;
    waInitializing = false;
  });

  // ✅ SIN await — corre en background para no bloquear el event loop
  waClient.initialize().catch((err: any) => {
    console.error('❌ Error al inicializar WhatsApp:', err);
    waClient = null;
    waInitializing = false;
  });
}

// ── Exportadas ────────────────────────────────────────────────────────────────

/**
 * Devuelve el estado de la sesión WhatsApp.
 * Primera llamada arranca Puppeteer en background y espera hasta 20s por el QR.
 */
export async function getWhatsAppStatus(): Promise<{
  ready: boolean;
  qr: string | null;
}> {
  await ensureWhatsApp();

  // Espera hasta 20s a que llegue el QR o se establezca sesión
  if (!waReady && !waQrBase64) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 20_000);
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
 */
export async function sendWhatsApp(
  telefono: string,
  mensaje: string,
  buffer: Buffer,
  filename: string,
): Promise<void> {
  if (!waReady) {
    throw new Error(
      'WhatsApp no está conectado. Escanea el QR primero en GET /receipts/whatsapp/status',
    );
  }

  // Normaliza número peruano → formato whatsapp-web.js
  let num = telefono.replace(/\D/g, '');
  if (num.length === 9 && num.startsWith('9')) num = `51${num}`;
  const chatId = `${num}@c.us`;

  const { MessageMedia } = require('whatsapp-web.js');
  const media = new MessageMedia(
    'application/pdf',
    buffer.toString('base64'),
    filename,
  );

  await waClient.sendMessage(chatId, media, { caption: mensaje });
}
