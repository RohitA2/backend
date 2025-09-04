const db = require("../config/database");

// ✅ Create new signature entry when block is dropped
exports.createSignature = async (req, res) => {
  try {
    const { blockId } = req.body;
    console.log(" i am from blockId:", blockId);

    if (!blockId) {
      return res.status(400).json({ error: "blockId is required" });
    }

    const newSignature = await db.models.Signature.create({ blockId });
    res.json({ success: true, data: newSignature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all signatures
exports.getSignatures = async (req, res) => {
  try {
    const signatures = await db.models.Signature.findAll();
    res.json({ success: true, data: signatures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update signature status (signed/declined)
exports.updateSignatureStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(" i am from signatureId:", id);
    
    const { status, signature, comment, method } = req.body;

    const signatureToUpdate = await db.models.Signature.findOne({
      where: { blockId:id },
    });
    if (!signatureToUpdate) return res.status(404).json({ error: "Not found" });

    await signatureToUpdate.update({
      status,
      signature,
      comment,
      method
    })
    if (!signatureToUpdate) return res.status(404).json({ error: "Not found" });

    res.json({ success: true, data: signature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// make to find basis of blockId
exports.getSignatureByBlockId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(" i am from signatureId:", id);

    const signature = await db.models.Signature.findOne({
      where: { blockId: id },
    });
    if (!signature) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, data: signature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
