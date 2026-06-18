import mongoose, { mongo } from "mongoose";
import { timeStamps } from "express"
import bcrypt from "bcrypt"
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: true,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        refreshToken: {
            type: String
        },
        forgotPasswordToken: {
            type: String
        },
        forgotPasswordExpiry: {
            type: Date,
        },
        emailVerificationToken: {
            type: Date
        },
        emailVerificationExpiry: {
            type: Date
        },
        avatar: {
            type: {
                url: String,
                localPath: String
            },
            default: {
                url: `https://placehold.co/200x200`,
                localPath: ""
            }
        }
    },
    {
        timestamps : true
    }
)



export const User = mongoose.model("User", userSchema)

