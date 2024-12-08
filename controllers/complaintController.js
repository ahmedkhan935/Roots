 const Complaint = require('../models/Complaint');
const Branch = require('../models/branch');

// Create new complaint
exports.createComplaint = async (req, res) => {
    try {
        const {
            title,
            content,
            studentId,
            parentId,
            branch_id,
            status = 'pending'
        } = req.body;

        // Validate required fields
        if (!title || !content || !branch_id) {
            return res.status(400).json({ 
                message: 'Title, content and branch_id are required' 
            });
        }

        const complaint = new Complaint({
            title,
            content,
            studentId,
            parentId,
            branch_id,
            status
        });
        
        await complaint.save();

        // Add complaint to branch
        await Branch.findByIdAndUpdate(
            branch_id,
            { $push: { complaints: complaint._id } }
        );

        res.status(201).json(complaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all complaints
exports.getComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('studentId', 'name')
            .populate('parentId', 'name')
            .populate('branch_id', 'name');
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single complaint
exports.getComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('studentId')
            .populate('parentId')
            .populate('branch_id');
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update complaint
exports.updateComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        res.json(complaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete complaint
exports.deleteComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        // Remove complaint from branch
        await Branch.findByIdAndUpdate(
            complaint.branch_id,
            { $pull: { complaints: complaint._id } }
        );

        await complaint.remove();
        res.json({ message: 'Complaint deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
