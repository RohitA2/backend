// controllers/partiesController.js
const db = require("../config/database");

exports.saveParties = async (req, res) => {
  try {
    const { userId, toParty, fromParty } = req.body;

    // Upsert logic
    const [record, created] = await db.models.Parties.findOrCreate({
      where: { userId },
      defaults: { toParty, fromParty },
    });

    if (!created) {
      record.toParty = toParty;
      record.fromParty = fromParty;
      await record.save();
    }

    res.json({ success: true, data: record });
  } catch (err) {
    console.error("Error saving parties:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getParties = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("i am from parties costroller:", userId);

    const record = await db.models.Parties.findOne({ where: { userId } });
    console.log("i am from parties costroller record:", record);

    res.json({ success: true, data: record });
  } catch (err) {
    console.error("Error fetching parties:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

//get party by partyid
exports.getPartiesById = async (req, res) => {
  try {
    const { partyId } = req.params;
    console.log("i am from parties costroller:", partyId);

    const record = await db.models.Parties.findOne({ where: { partyId } });
    console.log("i am from parties costroller record:", record);

    res.json({ success: true, data: record });
  } catch (err) {
    console.error("Error fetching parties:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
