const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rollNumber: {
    type: String,
    required: false,
  },
  dateOfBirth: {
    type: Date,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true, 
  },
  password: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: false,
  },
  age: {
    type: Number,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  },
  // classes: [{
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'Class'
  // }],
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent",
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
  },
  curr_merit_points: {
    type: Number,
    default: 0,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Student", studentSchema);
