const nodemailer = require("nodemailer");
require("dotenv").config();

exports.mailSender = async (email, title, body) => {
  try {
    const tranporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    const response = await tranporter.sendMail({
      from: "Learnify - LMS Platform",
      to: email,
      subject: title,
      html: body,
    });
    console.log(response);
    return response;
  } catch (error) {
    console.log(error.message);
  }
};
