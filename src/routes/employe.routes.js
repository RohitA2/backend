const express = require("express");
const router = express.Router();
const emController = require("../controllers/employe.controller");

// CRUD routes
router.post("/create", emController.createUser);
router.get("/allEmployees/:id", emController.getUsers);
router.get("/:id", emController.getUserById);
router.put("/:id", emController.updateUser);
router.delete("/:id", emController.deleteUser);
router.get("/allProposals/:companyId", emController.getProposalsByCompanyId);


module.exports = router;
