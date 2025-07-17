const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const { getSettings } = require("./settings"); // optionally use this to avoid calling API

let currentQR = null;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQR = qr;
      qrcode.generate(qr, { small: true }); // show QR in terminal
    }

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("✅ WhatsApp connected!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (text) {
      console.log(`💬 Message from ${sender}: ${text}`);

      try {
        // ✅ Check settings from backend
        const settingsRes = await fetch("http://localhost:5000/api/settings");
        const settings = await settingsRes.json();

        if (!settings.botActive) {
          console.log("🤖 Bot is OFF. Skipping reply.");
          return;
        }

        const aiRes = await fetch("http://localhost:5000/api/ai-reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: text }),
        });

        const data = await aiRes.json();
        const reply = data.reply || "🤖 Failed to fetch smart reply";

        await sock.sendMessage(sender, { text: reply });
      } catch (err) {
        console.error("❌ Bot error:", err);
        await sock.sendMessage(sender, { text: "⚠️ Bot encountered an error." });
      }
    }
  });
}

// Make QR code available to frontend
function getQRCode() {
  return currentQR;
}

module.exports = {
  connectToWhatsApp,
  getQRCode,
};
