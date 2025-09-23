const twilio = require("twilio");
require("dotenv").config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send SMS
exports.sendSMS = async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ success: false, error: "To and message are required" });
  }

  try {
    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    res.json({ success: true, sid: msg.sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Receive incoming SMS
exports.receiveSMS = (req, res) => {
  const from = req.body.From;
  const body = req.body.Body;

  console.log(`Incoming message from ${from}: ${body}`);

  // Auto-reply example
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(`You said: "${body}"`);
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
};
