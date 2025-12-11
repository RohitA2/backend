// Example routes in your routes file (e.g., routes/admin.js)
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // Adjust path as needed


router.get('/allUsersList', adminController.allUser);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/proposals',  adminController.allProposals);
router.put('/proposals/:id',  adminController.updateProposal);
router.delete('/proposals/:id',  adminController.deleteProposal);

module.exports = router;