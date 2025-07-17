const express = require("express");
const app = express();

const { getSettings, updateSettings } = require("./settings");
const { getAnalytics, incrementGptRequest } = require("./analytics");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectToWhatsApp, getQRCode } = require("./whatsapp");

dotenv.config();

let botEnabled = true; // ✅ Bot toggle state

// Middleware
app.use(cors());
app.use(express.json());

// Start WhatsApp bot
connectToWhatsApp();

// QR code for frontend
app.get("/api/whatsapp/qr", (req, res) => {
  const qr = getQRCode();
  if (!qr) return res.status(404).json({ message: "QR not ready yet" });
  res.json({ qr });
});

// Health check
app.get("/", (req, res) => {
  res.send("🔥 OLAMYKxVBOT backend is live!");
});

// ✅ Toggle bot ON/OFF from frontend
app.get("/api/bot-status", (req, res) => {
  res.json({ enabled: botEnabled });
});

app.post("/api/bot-status", (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ error: "Enabled must be true or false" });
  }
  botEnabled = enabled;
  console.log(`🤖 Bot is now ${enabled ? "ON" : "OFF"}`);
  res.json({ success: true, enabled: botEnabled });
});

// 💬 AI Reply using OpenRouter GPT-3.5
app.post("/api/ai-reply", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt is required" });
  if (!botEnabled) return res.json({ reply: "🤖 Bot is currently turned off." });

  try {
    incrementGptRequest(); // optional tracking

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://olamykxbot.vercel.app", // optional for OpenRouter analytics
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are OLAMYKxVBOT — a funny, street-smart, savage Nigerian guy who chats like he's talking to his guys. You avoid robotic talk. Speak with Nigerian Gen Z slang, be unpredictable and casual.",
          },
          { role: "user", content: prompt }
        ]
      }),
    });

    const data = await response.json();

    if (data?.error) {
      console.error("❌ OpenRouter API Error:", data.error);
      return res.status(500).json({ error: data.error.message || "OpenRouter API Error" });
    }

    const reply = data.choices?.[0]?.message?.content || "🤖 No smart reply generated.";
    res.json({ reply });

  } catch (err) {
    console.error("🤖 OpenRouter fetch error:", err);
    res.status(500).json({ error: "Failed to fetch AI reply from OpenRouter." });
  }
});

// Settings & Analytics routes
app.get("/api/settings", getSettings);
app.post("/api/settings", updateSettings);
app.get("/api/analytics", getAnalytics);

// Dummy users
app.get("/api/users", (req, res) => {
  res.json([{ username: "TestUser", phone: "+234...", status: "active" }]);
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});
