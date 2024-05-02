const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

//create Rating
exports.createRating = async (req, res) => {
  try {
    //get data: user id ,course id, rating and review from body

    const userId = req.user.id;
    console.log(userId);
    const courseId = req.body.courseId;

    const { rating, review } = req.body;

    //check if user is enrolled or not
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $eq: userId } },
    });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "student is not enrolled in the course",
      });
    }

    //check is user is already reviewed the course

    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });
    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: "course is already reviewed by the user",
      });
    }

    //create rating and review
    const ratingReview = await RatingAndReview.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });

    //update the course model
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          ratingAndReviews: ratingReview._id,
        },
      },
      { new: true }
    );
    console.log(updatedCourseDetails);
    //return res
    res.status(200).json({
      success: true,
      message: "rating and review is done successfully",
      ratingReview,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "cant take rating review",
    });
  }
};

//get avg rating

exports.getAverageRating = async (req, res) => {
  try {
    //get courseId
    const courseId = req.body.courseId;

    //cal avg rating
    const result = await RatingAndReview.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating,
      });
    }
    //if no rating review exist
    return res.status(200).json({
      success: true,
      message: "avg rating is zero no rating given till now",
      averageRating: 0,
    });
    //return rating
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "cant get avg rating review",
    });
  }
};

//get all rating and reviews

exports.getAllRating = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: "desc" })
      .populate({
        path: "user",
        select: "firstName lastName email image",
      })
      .populate({
        path: "course",
        select: "courseName",
      })
      .exec();

    return res.status(200).json({
      success: true,
      message: "all reviews fetched successfully",
      allReviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "cant get all rating review",
    });
  }
};
