const express = require('express');
const router = express.Router();
const { 
    addChildren,
    getChildren,
    AssignParent,
    deAssignParent
} = require('../controllers/parentController');
const { verifyToken, verifyParent } = require('../middlewares/auth');

// Parent routes
router.get('/children', verifyToken, verifyParent, getChildren);
router.put('/children', verifyToken, verifyParent, addChildren);
router.post('/assign', verifyToken, verifyParent, AssignParent);
router.post('/deassign', verifyToken, verifyParent, deAssignParent);


module.exports = router;