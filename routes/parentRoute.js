const express = require('express');
const router = express.Router();
const { 
    
    getChildren
} = require('../controllers/parentController');
const { verifyToken, verifyParent } = require('../middlewares/auth');

// Parent routes
router.get('/children', verifyToken, verifyParent, getChildren);

module.exports = router;