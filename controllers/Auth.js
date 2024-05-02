const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { mailSender } = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const otpTemplate = require("../mail/templates/emailVerificationTemplate");
require("dotenv").config();

//otp
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    //check existing user
    let checkUser = await User.findOne({ email });
    if (checkUser) {
      return res.status(401).json({
        success: "false",
        message: "user is already registered please login",
      });
    }

    //generate otp
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    console.log("otp generated ->" + otp);

    //check unique otp or not

    const result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });

      const result = await OTP.findOne({ otp });
    }
    const otpPayload = { email, otp };

    //create an entry in db for otp

    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    const emailResponse = await mailSender(
      email,
      "OTP verification mail",
      otpTemplate(otp)
    );

    res.status(200).json({
      success: true,
      message: "otp send successfully",
      otp,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "cant send otp",
    });
  }
};

//signup

exports.signup = async (req, res) => {
  try {
    //data fetch
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    //user validation

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "please fill out all the fields",
      });
    }

    //check  2 password
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "password and confirm password doesnot match please try again",
      });
    }
    //check user is already registered
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "user is already registered",
      });
    }

    //find most recent otp for the user

    const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });

    console.log(recentOtp);

    //validate otp

    if (recentOtp.length === 0) {
      return res.status(400).json({
        success: false,
        message: "otp not found",
      });
    } else if (otp !== recentOtp.otp) {
      return res.status(400).json({
        success: false,
        message: "otp is invalid",
      });
    }
    console.log("otp validated");
    //hash password

    const hashedPassword = await bcrypt.hash(password, 10);

    //entry creation in db

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType,
      contactNumber,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    //return res

    return res.status(200).json({
      success: true,
      message: "user is registered successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,

      message: "cant sign up a user",
    });
  }
};

//login

exports.login = async (req, res) => {
  try {
    //data fetch
    const { email, password } = req.body;

    //validation
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "please fill out all the fields",
      });
    }

    //user existence

    const user = await User.findOne({ email }).populate("additionalDetails");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "user is not registered please sign up",
      });
    }

    //check password

    const comparepassword = await bcrypt.compare(password, user.password);

    if (comparepassword) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      user.token = token;
      user.password = undefined;

      //cookie genration
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.cookie("token", token, options).status(200).json({
        success: true,
        message: "user logged in",
        token,
        user,
      });
    } else {
      return res.status(400).send({
        success: false,
        message: "incorrect password",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "login error",
    });
  }
};

// Controller for Changing Password
exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    console.log(req.user);
    const userDetails = await User.findById(req.user.id);

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body;

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" });
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      );
      console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
};
