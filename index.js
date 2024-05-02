const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const courseRoutes = require("./routes/Course");
const paymentRoutes = require("./routes/Payment");
const contactRoutes = require("./routes/Contact");
const database = require("./configs/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

const { cloudinaryConnect } = require("./configs/cloudinary");

dotenv.config();

const PORT = process.env.PORT || 4000;

//db connetion

database.connectDB();

//middlewares

app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

//cloudinary connect
cloudinaryConnect();

//routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactRoutes);
//activate server

app.listen(PORT, () => {
  console.log("server is running at " + PORT);
});
