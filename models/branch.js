const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BranchSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    
    branchAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'BranchAdmin' },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    contactNumber: { type: String },
    email: { type: String },
    capacity: { type: Number },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    complains: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complain' }]
});

BranchSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Branch = mongoose.model('Branch', BranchSchema);

module.exports = Branch;