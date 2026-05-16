const express = require('express');
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

const AuthRouter = require("./routes/auth.routes");
const InterviewRouter = require("./routes/interview.route");

app.use("/api/auth", AuthRouter);
app.use("/api/interview", InterviewRouter);

module.exports = app;
