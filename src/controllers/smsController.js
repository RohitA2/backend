// const twilio = require("twilio");
// require("dotenv").config();
// const db = require("../config/database");
// const { Op } = require("sequelize");
// const { MessagingResponse } = twilio.twiml;

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// // Send SMS
// exports.sendSMS = async (req, res) => {
//   const { to, message } = req.body;

//   if (!to || !message) {
//     return res
//       .status(400)
//       .json({ success: false, error: "To and message are required" });
//   }

//   console.log("i am from twilio body", req.body);


//   try {
//     const msg = await client.messages.create({
//       body: message,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: to,
//     });

//     // ✅ Save to DB
//     await db.models.Message.create({
//       sid: msg.sid,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: to,
//       body: message,
//       direction: "outbound",
//       status: msg.status,
//     });

//     res.json({ success: true, sid: msg.sid });
//   } catch (error) {
//     await db.models.Message.create({
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: to,
//       body: message,
//       direction: "outbound",
//       status: "failed",
//       errorMessage: error.message,
//     });

//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // exports.receiveSMS = async (req, res) => {
// //   try {
// //     const from = req.body.From; // sender's phone
// //     const to = req.body.To; // your Twilio phone
// //     const body = req.body.Body; // SMS content
// //     const sid = req.body.MessageSid;

// //     console.log(`📩 Incoming SMS from ${from} to ${to}: ${body}`);

// //     // Save inbound SMS in DB
// //     await db.models.Message.create({
// //       sid,
// //       from,
// //       to,
// //       body,
// //       direction: "inbound",
// //       status: "received",
// //     });

// //     // ✅ Optional: Auto-reply back to sender
// //     const twiml = new twilio.twiml.MessagingResponse();
// //     twiml.message(`You said: "${body}"`);

// //     res.writeHead(200, { "Content-Type": "text/xml" });
// //     res.end(twiml.toString());
// //   } catch (error) {
// //     console.error("❌ Error saving inbound SMS:", error.message);
// //     res.status(500).send("Error processing SMS");
// //   }
// // };

// exports.receiveSMS = async (req, res) => {
//   try {
//     // 🔍 Log entire Twilio payload for debugging
//     console.log("========== 🌐 Incoming Twilio Webhook Payload ==========");
//     console.log(JSON.stringify(req.body, null, 2));
//     console.log("========================================================");

//     const from = req.body.From;
//     const to = req.body.To;
//     const body = req.body.Body || req.body.body;
//     const sid = req.body.MessageSid || req.body.Sid;


//     console.log(`📩 Incoming SMS:
//       From: ${from}
//       To: ${to}
//       Body: ${body}
//       SID: ${sid}
//     `);

//     if (!body || body.trim() === "") {
//       console.warn("⚠️ Warning: Message Body is empty or undefined.");
//     }

//     // 💾 Save inbound SMS in DB
//     const savedMessage = await db.models.Message.create({
//       sid,
//       from,
//       to,
//       body: body || "(empty message)",
//       direction: "inbound",
//       status: "received",
//     });

//     // 🟢 Print the saved DB record
//     console.log("✅ Message saved in DB:");
//     console.log(JSON.stringify(savedMessage.toJSON(), null, 2));

//     // Respond back to user
//     const twiml = new MessagingResponse();
//     twiml.message(`You said: "${body}"`);

//     res.writeHead(200, { "Content-Type": "text/xml" });
//     return res.end(twiml.toString());

//   } catch (error) {
//     console.error("❌ Error saving inbound SMS:");

//     // Detailed DB/Sequelize error logging
//     if (error.name?.includes("Sequelize")) {
//       console.error("🔍 Sequelize Error Details:");
//       console.error(JSON.stringify(error, null, 2));

//       if (error.errors) {
//         error.errors.forEach((err, index) =>
//           console.error(`   (${index + 1}) Field: ${err.path}, Message: ${err.message}`)
//         );
//       }
//     } else {
//       console.error("🔍 General Error:", error);
//     }

//     // Twilio STILL needs valid XML response
//     const twiml = new MessagingResponse();
//     twiml.message(
//       "We received your message, but an internal database error occurred."
//     );

//     res.writeHead(200, { "Content-Type": "text/xml" });
//     return res.end(twiml.toString());
//   }
// };

// exports.allMessages = async (req, res) => {
//   const { to } = req.query;
//   const from = process.env.TWILIO_PHONE_NUMBER;

//   const normalizedTo = to.startsWith("+") ? to.slice(1) : `+${to}`;

//   try {
//     const messages = await db.models.Message.findAll({
//       where: {
//         [Op.or]: [
//           { from, to }, // sent with +91
//           { from, to: normalizedTo }, // sent without +
//           { from: to, to: from }, // received (from recipient)
//           { from: normalizedTo, to: from },
//         ],
//       },
//       order: [["createdAt", "ASC"]],
//     });

//     res.json({ success: true, data: messages });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


const twilio = require("twilio");
require("dotenv").config();
const db = require("../config/database");
const { Op } = require("sequelize");

const { MessagingResponse } = twilio.twiml;

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* ============================================================
   📤 SEND SMS
============================================================ */
exports.sendSMS = async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      success: false,
      error: "To and message are required",
    });
  }

  try {
    // ✅ Normalize phone number
    const normalizedTo = to.startsWith("+") ? to : `+${to}`;

    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedTo,
    });

    // ✅ Save to DB
    await db.models.Message.create({
      sid: msg.sid,
      from: msg.from,
      to: msg.to,
      body: msg.body,
      direction: "outbound",
      status: msg.status,
    });

    return res.json({ success: true, sid: msg.sid });
  } catch (error) {
    console.error("❌ Send SMS Error:", error.message);

    await db.models.Message.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
      body: message,
      direction: "outbound",
      status: "failed",
      errorMessage: error.message,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* ============================================================
   📩 RECEIVE SMS (TWILIO WEBHOOK)
============================================================ */
exports.receiveSMS = async (req, res) => {
  try {
    console.log("========== 🌐 Incoming Twilio Webhook ==========");
    console.log(JSON.stringify(req.body, null, 2));

    const from = req.body.From;
    const to = req.body.To;
    const body = req.body.Body || "";
    const sid = req.body.MessageSid;

    if (!from || !to) {
      console.warn("⚠️ Missing From/To in webhook");
    }

    // ✅ Save inbound message
    const savedMessage = await db.models.Message.create({
      sid,
      from,
      to,
      body: body.trim() || "(empty message)",
      direction: "inbound",
      status: "received",
    });

    console.log("✅ Message saved:", savedMessage.id);

    // ✅ Twilio XML Response
    const twiml = new MessagingResponse();
    twiml.message(`You said: "${body}"`);

    res.set("Content-Type", "text/xml");
    return res.status(200).send(twiml.toString());

  } catch (error) {
    console.error("❌ Receive SMS Error:", error);

    // Twilio MUST get XML response
    const twiml = new MessagingResponse();
    twiml.message("Message received, but internal error occurred.");

    res.set("Content-Type", "text/xml");
    return res.status(200).send(twiml.toString());
  }
};

/* ============================================================
   📜 GET CONVERSATION MESSAGES
============================================================ */
exports.allMessages = async (req, res) => {
  try {
    const { to } = req.query;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: "Phone number (to) is required",
      });
    }

    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    const normalizedTo = to.startsWith("+") ? to : `+${to}`;

    const messages = await db.models.Message.findAll({
      where: {
        [Op.or]: [
          {
            from: twilioNumber,
            to: normalizedTo,
          },
          {
            from: normalizedTo,
            to: twilioNumber,
          },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    return res.json({
      success: true,
      count: messages.length,
      data: messages,
    });

  } catch (error) {
    console.error("❌ Fetch Messages Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
