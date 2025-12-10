const express = require('express');
const router = express.Router();
const {
  createContact,
  getAllContacts,
  updateContactStatus,
  deleteContact
} = require('../controllers/contactController');

// Public route - anyone can submit contact form
router.post('/', createContact);

// Admin routes - you can add authentication later
// For now, these are accessible but you'll need to protect them
router.get('/', getAllContacts);
router.put('/:id/status', updateContactStatus);
router.delete('/:id', deleteContact);

module.exports = router;