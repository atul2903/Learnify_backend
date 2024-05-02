const { instance } = require("../configs/razorpay");
const User = require("../models/User");
const Course = require("../models/Course");
const { mailSender } = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const {
  paymentSuccessEmail,
} = require("../mail/templates/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");
const mongoose = require("mongoose");
const crypto = require("crypto");
//capture the payment and initate the razorpay order

// exports.capturePayment = async (req, res) => {
//   //get courseID and userId
//   const { course_id } = req.body;
//   const userId = req.body.id;
//   //validation
//   if (!course_id) {
//     return res.status(404).json({
//       succes: false,
//       message: "cant get course id",
//     });
//   }
//   //valid course id
//   let course;
//   try {
//     course = await Course.findById(course_id);
//     if (!course) {
//       return res.status(404).json({
//         success: false,
//         message: "could find course by id",
//       });
//     }

//     //user already had course
//     const uid = new mongoose.Types.ObjectId(userId);
//     if (course.studentsEnrolled.includes(uid)) {
//       return (
//         res.
//         json(200).json({
//           success: false,
//           message: "student is already enrolled to this course",
//         })
//       );
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }

//   //order create
//   const amount = course.price;
//   const currency = "INR";

//   const options = {
//     amount: amount * 100,
//     currency: currency,
//     reciept: Math.random(Date.now()).toString(),
//     notes: {
//       courseId: course_id,
//       userId,
//     },
//   };

//   try {
//     //initiate the payment using razor pay

//     const paymentResponse = await instance.orders.create(options);
//     console.log(paymentResponse);

//     res.status(200).json({
//       success: true,
//       courseName: course.courseName,
//       courseDesc: course.courseDescription,
//       thumbnail: course.thumbnail,
//       orderId: paymentResponse.id,
//       currency: paymentResponse.currency,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       success: false,
//       message: "couldnot initiate response",
//     });
//   }

//   //return res
// };

// //verify signature

// exports.verifySignature = async (req, res) => {
//   const webHookSecret = "12345678";

//   const signature = req.header["x-razorpay-signature"];

//   const shasum = crypto.createHmac("sha256", "webHookSecret");
//   shasum.update(JSON.stringify(req.body));
//   const digest = shasum.digest("hex");

//   if (signature === digest) {
//     console.log("payment is authorized");

//     const { courseId, userId } = req.body.payload.payment.entity.notes;

//     try {
//       //fulfill the action

//       //find the course and enroll it to student
//       const enrolledCourse = await Course.findByIdAndUpdate(
//         { _id: courseId },
//         {
//           $push: {
//             studentsEnrolled: userId,
//           },
//         },
//         { new: true }
//       );

//       if (!enrolledCourse) {
//         return res.json({
//           success: false,
//           messsage: "cant get the course",
//         });
//       }
//       console.log(enrolledCourse);

//       //find the student and add the course in  the enrolled courses list

//       const enrolledStudent = await User.findOneAndUpdate(
//         { _id: userId },
//         {
//           $push: {
//             courses: courseId,
//           },
//         },
//         { new: true }
//       );

//       console.log(enrolledStudent);

//       //confirmation mail send

//       const emailResponse = await mailSender(
//         enrolledStudent.email,
//         "Congratulations You Are Onboarded",
//         "Congratulations You Are Onboarded"
//       );

//       console.log(emailResponse);

//       res.status(200).json({
//         success: true,
//         message: "payment is successfull and student is enrolled finally",
//       });
//     } catch (error) {
//       console.log(error);
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   } else {
//     return res.status(400).json({
//       success: false,
//       message: "invalid signature",
//     });
//   }
// };

exports.capturePayment = async (req, res) => {
  const { courses } = req.body;
  console.log("req.body->", req.user);
  const userId = req.user.id;

  if (courses.length === 0) {
    return res.status(400).json({
      success: false,
      message: "could not find any course",
    });
  }

  let totalAmount = 0;
  for (const course_id of courses) {
    let course;
    try {
      course = await Course.findById(course_id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "cant find the course",
        });
      }

      let uid = new mongoose.Types.ObjectId(userId);
      console.log("printing uid->", uid);

      console.log("courses student->", course.studentsEnrolled);
      if (course.studentsEnrolled.includes(uid)) {
        return res.status(400).json({
          success: false,
          message: "student is already enrolled in the course",
        });
      }

      totalAmount += course.price;
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "check total amount section",
      });
    }
  }

  const options = {
    amount: totalAmount * 100,
    currency: "INR",
    receipt: Math.random(Date.now()).toString(),
  };

  try {
    const paymentResponse = await instance.orders.create(options);
    res.json({
      success: true,
      message: paymentResponse,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant generate payment",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id;
  const razorpay_payment_id = req.body?.razorpay_payment_id;
  const razorpay_signature = req.body?.razorpay_signature;
  const courses = req.body?.courses;

  const userId = req.user.id;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(200).json({ success: false, message: "Payment Failed" });
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    await enrollStudent(courses, userId, res);
    return res.status(200).json({ success: true, message: "Payment Verified" });
  }

  return res.status(200).json({ success: false, message: "Payment Failed" });
};

const enrollStudent = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res.status(400).json({
      success: false,
      message: "please provide the data",
    });
  }

  try {
    for (const courseId of courses) {
      //find the course and enroll student in it
      const enrolledCourses = await Course.findByIdAndUpdate(
        { _id: courseId },
        {
          $push: {
            studentsEnrolled: userId,
          },
        },
        { new: true }
      );

      if (!enrolledCourses) {
        return res.status(500).json({
          success: false,
          message: "course not found",
        });
      }

      //find the students and add the course to the model

      const enrolledStudent = await User.findByIdAndUpdate(
        { _id: userId },
        {
          $push: {
            courses: courseId,
          },
        },
        { new: true }
      );
      //send mail
      console.log("sending mail->");
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Sucessfully enrolled into ${enrolledCourses.courseName}`,
        courseEnrollmentEmail(
          enrolledCourses.courseName,
          enrolledStudent.firstName
        )
      );

      const res = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      });
      console.log("email sent successfully", emailResponse);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "cant enroll student",
    });
  }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;
  const userId = req.body.id;
  console.log(orderId + " " + paymentId + " " + amount + " " + userId);
  if (!orderId || !paymentId || !amount || !userId) {
    return res.status(400).json({
      success: false,
      message: "please provide all fields",
    });
  }

  //find student

  try {
    const enrolledStudent = await User.findById(userId);
    await mailSender(
      enrolledStudent.email,
      `Payment  Recieved`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "could  not send email",
    });
  }
};
