const express = require("express")
const app = express();

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const userRoute = require("./routes/user")
const authRoute = require("./routes/auth")
const postRoute = require("./routes/posts");
const cloudinary = require('cloudinary').v2;


dotenv.config();

// Connecting to database
try {
    mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true});
    console.log("connected to MongoDb");
} catch (error) {
    console.error("Error connecting to MongoDB: ", error);
}


// middleware
app.use(express.json());// parse incoming request bodies in JSON format
app.use(helmet()); // set various HTTP headers to enhance security
app.use(morgan("common")); // logging middleware

// add cors middleware with specific allowed origins
const allowedOrigins = [
    'http://localhost:3000',
    'https://bindsocial.onrender.com'
];

app.use(cors({
    origin: allowedOrigins
}));


app.use("/api/user", userRoute)
app.use("/api/auth", authRoute)
app.use("/api/posts", postRoute);


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.listen(8800, ()=> {
    console.log("Backend server is running at the port 8800! ");
})