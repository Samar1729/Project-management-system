import express, { urlencoded } from "express"
import cors from "cors"

const app = express()

//middlewares

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))

//cors configurations
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"]
}),
);

// import the routes

import healthCheckRouter from "./routes/healthCheck.routes.js"
import authRouter from "./routes/auth.routes.js"

app.use("/api/v1/healthcheck" , healthCheckRouter) 
app.use("/api/v1/auth" , authRouter)

app.get("/", (req, res) => {
    res.send("welcome home sir")
})


export default app