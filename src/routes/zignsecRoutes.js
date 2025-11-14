// const express = require("express");
// const multer = require("multer");
// const router = express.Router();
// const upload = multer({ dest: "uploads/" });
// const {
//     startZignSecFlow
// } = require("../controllers/zignsecController");

// router.post("/create-session", upload.single("file"), startZignSecFlow);


// module.exports = router;

const express = require("express");
const multer = require("multer");
const { createSession } = require("../controllers/zignsecController");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/create-session", upload.single("file"), createSession);

module.exports = router;
