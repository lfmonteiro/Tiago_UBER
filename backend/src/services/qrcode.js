const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Garante que a pasta public/qrcodes exista
const QR_DIR = path.join(__dirname, '../../public/qrcodes');
if (!fs.existsSync(QR_DIR)) {
  fs.mkdirSync(QR_DIR, { recursive: true });
}

// Gera QR Code como arquivo PNG e retorna a URL pública
async function gerarQRCode(slug) {
  const url = `${process.env.FRONTEND_URL}/${slug}`;
  const filename = `qr-${slug}.png`;
  const filepath = path.join(QR_DIR, filename);

  await QRCode.toFile(filepath, url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff'
    }
  });

  const publicUrl = `${process.env.BACKEND_URL}/qrcodes/${filename}`;
  console.log(`✅ QR Code gerado: ${publicUrl}`);
  return publicUrl;
}

// Gera QR Code como base64 (para exibir direto no frontend sem salvar arquivo)
async function gerarQRCodeBase64(slug) {
  const url = `${process.env.FRONTEND_URL}/${slug}`;
  const base64 = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff'
    }
  });
  return base64;
}

module.exports = { gerarQRCode, gerarQRCodeBase64 };
