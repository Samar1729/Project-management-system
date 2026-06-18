import express from "express"
import dotenv from "dotenv"
dotenv.config({
    path: "./.env",
})
import connectDB from "./db/db.js"
import app from "./app.js"

const port = process.env.PORT || 3000

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`App listening to port ${port}`);
        })
    })
    .catch((error) => {
        console.error("❌Database connection error", error);

    })