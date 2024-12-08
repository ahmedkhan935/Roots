const Parent = require('../models/parent');
const Student = require('../models/student');

// Get student details by parent
const getChildren = async (req, res) => {
    try {
        const parent = await Parent.findById(req.user_id);
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        const children = await Student.find({ parent: parent._id });
        res.status(200).json(children);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
  
    getChildren
};
