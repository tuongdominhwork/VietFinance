const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getFolderTree, getFolderContents, searchDocuments } = require('../controllers/documentsController');

router.get('/search', authenticate, searchDocuments);
router.get('/folders', authenticate, getFolderTree);
router.get('/folders/:id', authenticate, getFolderContents);

module.exports = router;
