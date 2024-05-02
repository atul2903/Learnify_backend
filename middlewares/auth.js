const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

//auth
exports.auth = async (req, res, next) => {
  try {
    //extract token
    console.log(req.header("Authorization"));

    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization").replace("Bearer", "");
    console.log("token->", token);
    //token in missing
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "cant find token",
      });
    }

    //verify token
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log("decoded ->", decode);
      req.user = decode;
    } catch (error) {
      //verification -issue
      console.log(error);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "session timed out! Relogin to Continue",
        });
      }
      return res.status(401).json({
        success: false,
        message: "invalid token",
      });
    }

    next();
  } catch (error) {
    res.status(501).json({
      success: false,
      message: "something went wrong while validating token",
    });
  }
};

//isStudent

exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Student") {
      return res.status(401).json({
        success: false,
        message: "this is a protected route for students only",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "user role cannot be verified,please try again",
    });
  }
};

//isInstructor

exports.isInstructor = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Instructor") {
      return res.status(401).json({
        success: false,
        message: "this is a protected route for instructor only",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "user role cannot be verified,please try again",
    });
  }
};

//admin

exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Admin") {
      return res.status(401).json({
        success: false,
        message: "this is a protected route for admin only",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "user role cannot be verified,please try again",
    });
  }
};
