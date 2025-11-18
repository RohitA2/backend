const twilio = require("twilio");
require("dotenv").config();
const db = require("../config/database");
const { Op } = require("sequelize");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
exports.sendSMS = async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res
      .status(400)
      .json({ success: false, error: "To and message are required" });
  }

  console.log("i am from twilio body", req.body);
  
  
  try {
    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    // ✅ Save to DB
    await db.models.Message.create({
      sid: msg.sid,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
      body: message,
      direction: "outbound",
      status: msg.status,
    });

    res.json({ success: true, sid: msg.sid });
  } catch (error) {
    await db.models.Message.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
      body: message,
      direction: "outbound",
      status: "failed",
      errorMessage: error.message,
    });

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.receiveSMS = async (req, res) => {
  try {
    const from = req.body.From; // sender's phone
    const to = req.body.To; // your Twilio phone
    const body = req.body.Body; // SMS content
    const sid = req.body.MessageSid;

    console.log(`📩 Incoming SMS from ${from} to ${to}: ${body}`);

    // Save inbound SMS in DB
    await db.models.Message.create({
      sid,
      from,
      to,
      body,
      direction: "inbound",
      status: "received",
    });

    // ✅ Optional: Auto-reply back to sender
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(`You said: "${body}"`);

    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(twiml.toString());
  } catch (error) {
    console.error("❌ Error saving inbound SMS:", error.message);
    res.status(500).send("Error processing SMS");
  }
};

exports.allMessages = async (req, res) => {
  const { to } = req.query;
  const from = process.env.TWILIO_PHONE_NUMBER;

  const normalizedTo = to.startsWith("+") ? to.slice(1) : `+${to}`;

  try {
    const messages = await db.models.Message.findAll({
      where: {
        [Op.or]: [
          { from, to }, // sent with +91
          { from, to: normalizedTo }, // sent without +
          { from: to, to: from }, // received (from recipient)
          { from: normalizedTo, to: from },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
