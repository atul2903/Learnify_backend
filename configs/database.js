const mongoose = require("mongoose");
require("dotenv").config();

exports.connectDB = async () => {
  try {
    const url = process.env.MONGODB_URL;
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`successfully connected with db ${url}`);
  } catch (error) {
    console.log("cant connect to database error ->" + error);
    process.exit(1);
  }
};
