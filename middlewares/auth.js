const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Superadmin = require('../models/superadmin');
const Branchadmin = require('../models/branchadmin');
const Teacher = require('../models/teacher');
const Student = require('../models/student');
const Parent = require('../models/parent');

dotenv.config();
const verifyToken = (req, res, next) => {
    const token = req.header('auth');
    console.log(token);
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        req.user_id = decoded.user_id;
        console.log(decoded);
        req.role = decoded.role;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
const verifyAdmin = async (req, res, next) => {
//    const userId = req.user_id;
//    console.log(userId);
//    const user = await Superadmin.findById(userId);
//     if(!user)
//         return res.status(403).json({ message: 'Not authorized' });
    next();
}
const verifyBranchAdmin = async (req, res, next) => {
    // const userId = req.user_id;
    // const user = await Branchadmin.findById(userId);
    // if(!user)
    //     return res.status(403).json({ message: 'Not authorized' });
    next();
}
const verifyTeacher = async (req, res, next) => {
    // const userId = req.user_id;
    // const user = await Teacher.findById(userId);
    // if(!user)
    //     return res.status(403).json({ message: 'Not authorized' });
    next();
}
const verifyStudent = async (req, res, next) => {
    // const userId = req.user_id;
    // const user = await Student.findById(userId);
    // if(!user)
    //     return res.status(403).json({ message: 'Not authorized' });
    next();
}
const verifyParent = async (req, res, next) => {
 
    next();
}   


module.exports = {
    verifyToken,
    verifyAdmin,
    verifyBranchAdmin,
    verifyTeacher,
    verifyStudent,
    verifyParent

};
