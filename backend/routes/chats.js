const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getSessions, createSession, getMessages, addMessage, deleteSession, renameSession } = require('../controllers/chatsController');

router.get('/', authenticate, getSessions);
router.post('/', authenticate, createSession);
router.get('/:id/messages', authenticate, getMessages);
router.post('/:id/messages', authenticate, addMessage);
router.delete('/:id', authenticate, deleteSession);
router.patch('/:id', authenticate, renameSession);

module.exports = router;
