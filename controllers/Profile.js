const User = require("../models/User");
const Profile = require("../models/Profile");
const Course = require("../models/Course");
const upload = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
const CourseProgress = require("../models/CourseProgress");
require("dotenv").config();
//update profile (as we have created  A PROFILE already in auth controller );

exports.updateProfile = async (req, res) => {
  try {
    //get the data
    const { dateOfBirth = "", about = "", gender, contactNumber } = req.body;

    //get userId;
    const id = req.user.id;

    //validate it
    if ((!gender, !contactNumber)) {
      return res.status(404).send({
        success: true,
        message: "fill out details",
      });
    }
    //find profile
    const userDetails = await User.find({ _id: id });
    console.log(userDetails);
    const profileId = userDetails[0].additionalDetails;
    console.log(profileId);
    //get profile
    const profileDetails = await Profile.findById(profileId);
    console.log(profileDetails);
    //update profile

    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;

    await profileDetails.save();

    //updated details
    const updatedUserDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();
    //return res

    res.status(200).json({
      success: true,
      message: "profile data updated",
      updatedUserDetails,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant update the profile",
    });
  }
};

//delete account

exports.deleteAccount = async (req, res) => {
  try {
    //get id
    const id = req.user.id;

    //validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "cant find user",
      });
    }
    //delete id from user and profile model
    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "cant find user",
      });
    }
    //1. deleting from profile

    const profileId = userDetails.additionalDetails;
    await Profile.findByIdAndDelete({ _id: profileId });
    //unenroll from all courses
    for (const courseId of userDetails.courses) {
      await Course.findByIdAndUpdate(
        courseId,
        { $pull: { studentsEnroled: id } },
        { new: true }
      );
    }

    const deletedAccount = await User.findByIdAndDelete({ _id: id });

    //send res

    res.status(201).json({
      success: true,
      message: "profile deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant delete account",
    });
  }
};

//get all users

exports.getAllUsers = async (req, res) => {
  try {
    const id = req.user.id;

    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    return res.status(201).json({
      success: true,
      message: "got all the users",
      userDetails,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant get all user ",
    });
  }
};

//update display picture

exports.updateDisplayPicture = async (req, res) => {
  try {
    const id = req.user.id;
    const displayPicture = req.files.displayPicture;

    if (!displayPicture) {
      return res.status(404).json({
        success: false,
        message: "cant find the profile pic",
      });
    }

    const userDetails = await User.findById({ _id: id });
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    console.log("uploading to cloudinary");
    const imageUrl = await upload.uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(imageUrl);
    const updatedUser = await User.findByIdAndUpdate(
      { _id: id },
      { image: imageUrl.secure_url },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "user profile pic updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant update profile picture",
    });
  }
};

//get enrolled courses

exports.getEnrolledCourses = async (req, res) => {
  try {
    //get user id

    const userId = req.user.id;

    //get user details
    let userDetails = await User.findById({ _id: userId })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .populate("additionalDetails")
      .exec();

    userDetails = userDetails.toObject();
    var SubsectionLength = 0;
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0;
      SubsectionLength = 0;
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce(
          (acc, curr) => acc + parseInt(curr.timeDuration),
          0
        );
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        );
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length;
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      });
      courseProgressCount = courseProgressCount?.completedVideos.length;
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100;
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2);
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier;
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      });
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,

      //validate

      //return res
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant get enrolled courses",
    });
  }
};

exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id });

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnrolled.length;
      const totalAmountGenerated = totalStudentsEnrolled * course.price;

      //create an object with the additional field

      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated,
      };
      return courseDataWithStats;
    });

    res.status(200).json({
      courses: courseData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error in instructor dashboard",
    });
  }
};
