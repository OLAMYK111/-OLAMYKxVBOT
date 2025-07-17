// settings.js
let settings = {
  savageMode: true,
  autoReply: true,
  botActive: true, // <-- this controls whether bot replies or not
};

function getSettings(req, res) {
  res.json(settings);
}

function updateSettings(req, res) {
  const { savageMode, autoReply, botActive } = req.body;

  if (typeof savageMode === "boolean") settings.savageMode = savageMode;
  if (typeof autoReply === "boolean") settings.autoReply = autoReply;
  if (typeof botActive === "boolean") settings.botActive = botActive;

  res.json({ message: "Settings updated", settings });
}

module.exports = { getSettings, updateSettings };
