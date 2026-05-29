// Generates a printable QR code card for the FATS portal notice boards
// Run with: node scripts/generate-qr.js

const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const URL = "https://fine-art-tech-support.vercel.app";
const OUT_DIR = path.join(__dirname, "../public");

async function generate() {
  // Generate QR code as a data URL (PNG, high res)
  const qrDataUrl = await QRCode.toDataURL(URL, {
    width: 400,
    margin: 2,
    color: { dark: "#0f1117", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });

  // Also save a standalone PNG
  await QRCode.toFile(path.join(OUT_DIR, "fats-qr.png"), URL, {
    width: 600,
    margin: 2,
    color: { dark: "#0f1117", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });

  // Build a printable A5 HTML card (print two per A4 page)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>FATS — QR Code Cards</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: #f0f0f0;
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding: 32px;
      justify-content: center;
    }

    .card {
      width: 148mm;   /* A5 width */
      min-height: 210mm; /* A5 height */
      background: #0f1117;
      border-radius: 16px;
      padding: 36px 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #e0e3ea;
      page-break-inside: avoid;
    }

    .dept {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #4b5563;
      margin-bottom: 20px;
      text-align: center;
    }

    .title {
      font-size: 22px;
      font-weight: 700;
      color: #e0e3ea;
      text-align: center;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .subtitle {
      font-size: 13px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 28px;
    }

    .qr-wrap {
      background: #ffffff;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 28px;
    }

    .qr-wrap img {
      display: block;
      width: 180px;
      height: 180px;
    }

    .cta {
      font-size: 15px;
      font-weight: 600;
      color: #20B07F;
      text-align: center;
      margin-bottom: 8px;
    }

    .instruction {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .url {
      font-size: 11px;
      color: #374151;
      background: #141720;
      border: 1px solid #1e2130;
      border-radius: 8px;
      padding: 8px 16px;
      letter-spacing: 0.02em;
      text-align: center;
      margin-bottom: 28px;
      word-break: break-all;
    }

    .services {
      width: 100%;
      border-top: 1px solid #1e2130;
      padding-top: 20px;
    }

    .services-title {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #4b5563;
      text-align: center;
      margin-bottom: 12px;
    }

    .services-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .service-item {
      font-size: 11px;
      color: #9ca3af;
      display: flex;
      align-items: center;
      gap: 6px;
      line-height: 1.3;
    }

    .service-item span.icon {
      font-size: 13px;
      flex-shrink: 0;
    }

    @media print {
      body {
        background: white;
        padding: 0;
        gap: 0;
      }
      .card {
        border-radius: 0;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>

  <!-- Card 1: General poster -->
  <div class="card">
    <div class="dept">Rhodes University · Fine Art Department</div>
    <div class="title">Fine Art<br/>Tech Support</div>
    <div class="subtitle">Log your request online</div>

    <div class="qr-wrap">
      <img src="${qrDataUrl}" alt="QR Code"/>
    </div>

    <div class="cta">Scan to submit a request</div>
    <div class="instruction">
      Scan the code with your phone camera<br/>
      or type the address below
    </div>

    <div class="url">fine-art-tech-support.vercel.app</div>

    <div class="services">
      <div class="services-title">What you can request</div>
      <div class="services-grid">
        <div class="service-item"><span class="icon">🖨️</span> Large format printing</div>
        <div class="service-item"><span class="icon">⚡</span> Laser cutter</div>
        <div class="service-item"><span class="icon">🧱</span> 3D printing</div>
        <div class="service-item"><span class="icon">📷</span> Equipment loan</div>
        <div class="service-item"><span class="icon">💻</span> Software install</div>
        <div class="service-item"><span class="icon">💡</span> Lighting studio</div>
        <div class="service-item"><span class="icon">📽️</span> AV / tech setup</div>
        <div class="service-item"><span class="icon">🖼️</span> Gallery booking</div>
        <div class="service-item"><span class="icon">💬</span> General query</div>
      </div>
    </div>
  </div>

  <!-- Card 2: Equipment-focused (for stockroom door) -->
  <div class="card">
    <div class="dept">Rhodes University · Fine Art Department</div>
    <div class="title">Equipment<br/>Bookings</div>
    <div class="subtitle">Book online before coming to collect</div>

    <div class="qr-wrap">
      <img src="${qrDataUrl}" alt="QR Code"/>
    </div>

    <div class="cta">Scan to book equipment</div>
    <div class="instruction">
      Submit your request at least <strong style="color:#e0e3ea">3 days in advance</strong>.<br/>
      Wait for confirmation before coming to collect.
    </div>

    <div class="url">fine-art-tech-support.vercel.app</div>

    <div class="services">
      <div class="services-title">Collection days &amp; times</div>
      <div class="services-grid">
        <div class="service-item"><span class="icon">📅</span> Monday</div>
        <div class="service-item"><span class="icon">📅</span> Wednesday</div>
        <div class="service-item"><span class="icon">📅</span> Friday</div>
        <div class="service-item"><span class="icon">🕐</span> 11:00 – 12:30</div>
      </div>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.join(OUT_DIR, "fats-qr-cards.html");
  fs.writeFileSync(htmlPath, html, "utf8");

  console.log("\n✅ Done!\n");
  console.log("  PNG (standalone QR):  public/fats-qr.png");
  console.log("  HTML (print cards):   public/fats-qr-cards.html");
  console.log("\nOpen fats-qr-cards.html in a browser and Print → Save as PDF.");
  console.log("Two cards per page — general notice board + equipment stockroom.\n");
}

generate().catch(console.error);
