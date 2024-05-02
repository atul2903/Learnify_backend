const User = require("../models/User");
const { mailSender } = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
//resetpassword token

exports.resetPasswordToken = async (req, res) => {
  try {
    //get email from body

    const email = req.body.email;

    //validation of email
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        success: true,
        message: "your email is not registered with us",
      });
    }
    //generate token
    const token = crypto.randomUUID();
    //update user by adding token & expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      { new: true }
    );

    //create url

    const url = `http://localhost:3000/update-password/${token}`;

    //send mail

    await mailSender(
      user.email,
      "Password reset link",
      `Password reset link : ${url}`
    );
    //return res

    return res.status(201).json({
      success: true,
      message: "email sent successfully for reset password",
      token,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "something went wrong in reset password link generation",
    });
  }
};

//reset password

exports.resetPassword = async (req, res) => {
  try {
    //data fetch
    const { password, confirmPassword, token } = req.body;

    //validation

    if (password !== confirmPassword) {
      return res.status(401).json({
        success: false,
        message: "password is not matching",
      });
    }

    //get user details
    const userDetails = await User.findOne({ token: token });
    //if no entry - invalid token

    if (!userDetails) {
      return res.status(401).json({
        success: false,
        message: "cant find the user please check token",
      });
    }

    //token time check

    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.status(401).json({
        success: false,
        message: "link expires for reset password",
      });
    }
    //hash password
    const hashedPassword = await bcrypt.hash(confirmPassword, 10);

    //update password
    await User.findOneAndUpdate(
      { token: token },
      {
        password: hashedPassword,
      },
      { new: true }
    );

    return res.status(201).json({
      success: true,
      message: "password reset done successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: true,
      message: "unable to reset password",
    });
  }
};
