// Example routes in your routes file (e.g., routes/admin.js)
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // Adjust path as needed


router.get('/allUsersList', adminController.allUser);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/allClients', adminController.allClients);
router.get('/clients/:id', adminController.getClient);
router.post('/clients', adminController.createClient);
router.put('/clients/:id', adminController.updateClient);
router.patch('/clients/:id/status', adminController.updateClientStatus);
router.patch('/clients/:id/verify', adminController.verifyCompany);
router.delete('/clients/:id', adminController.deleteClient);
router.post('/clients/bulk-update', adminController.bulkUpdateClients);

router.get('/proposals', adminController.allProposals);
router.put('/proposals/:id', adminController.updateProposal);
router.delete('/proposals/:id', adminController.deleteProposal);

router.get('/unVerified', adminController.getUnVerifiedCompany)
router.post('/verify/:companyId', adminController.verifyCompany);
router.post('/reject/:companyId', adminController.rejectCompany);
module.exports = router;