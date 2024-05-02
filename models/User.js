const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    approved: {
      type: Boolean,
      default: true,
    },
    accountType: {
      type: String,
      enum: ["Admin", "Instructor", "Student"],
      required: true,
    },
    contactNumber: {
      type: Number,
    },
    additionalDetails: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Profile",
    },
    token: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,

        ref: "Course",
      },
    ],
    image: {
      type: String,
      required: true,
    },
    courseProgess: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Courses",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
