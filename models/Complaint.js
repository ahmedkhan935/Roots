const mongoose = require('mongoose');
const parent = require('./parent');
const Schema = mongoose.Schema;

const ComplaintSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }
});

ComplaintSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Complaint = mongoose.model('Complaint', ComplaintSchema);
module.exports = Complaint;