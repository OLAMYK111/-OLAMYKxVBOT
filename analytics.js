// analytics.js
let analytics = {
  totalUsers: 1,
  activeChats: 12,
  gptRequests: 33,
};

function getAnalytics(req, res) {
  res.json(analytics);
}

function incrementGptRequest() {
  analytics.gptRequests += 1;
}

module.exports = { getAnalytics, incrementGptRequest };
