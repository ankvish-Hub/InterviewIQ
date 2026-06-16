const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

// Configure CORS for both development and production
const allowedOrigins = [
    "http://localhost:5173",           // Local development
    "http://localhost:3000",           // Alternative local
    process.env.FRONTEND_URL || "https://interview-iq-virid.vercel.app" // Production
]

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)


app.get('/', (req, res) => {
    res.send('Server is running smoothly!');
});



module.exports = app