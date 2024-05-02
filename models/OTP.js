const mongoose = require("mongoose");
const { mailSender } = require("../utils/mailSender");
const { schema } = require("./User");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now(),
    expires: 5 * 60,
  },
});

//function for sending an email
async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "Verification mail from Learnify",
      otp
    );
    console.log("email sent successfully : ", mailResponse);
  } catch (error) {
    console.log("error occurred while sending mail" + error.message);
    throw error;
  }
}

otpSchema.pre("save", async (next) => {
  await sendVerificationEmail(this.email, this.otp);
  next();
});

module.exports = mongoose.model("OTP", otpSchema);
