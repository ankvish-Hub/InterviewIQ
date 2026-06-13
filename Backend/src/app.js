const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
    origin: ['https://interview-iq-virid.vercel.app/'],
    credentials: true
}))

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" })
})

// Agar aapke code mein ye root route nahi hai, toh browser "Cannot GET /" dikhaega
app.get('/', (req, res) => {
    res.send("Backend is running successfully!");
});

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app