const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  sendOTP,
  changePassword,
} = require("../controllers/Auth");

const {
  auth,
  isStudent,
  isAdmin,
  isInstructor,
} = require("../middlewares/auth");

const {
  resetPassword,
  resetPasswordToken,
} = require("../controllers/ResetPassword");
//signup

router.post("/signup", signup);

//login

router.post("/login", login);

//send otp

router.post("/sendotp", sendOTP);

//change password

router.post("/changepassword", auth, changePassword);

// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken);

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword);

module.exports = router;
