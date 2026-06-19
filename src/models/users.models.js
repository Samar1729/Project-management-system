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
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next() 
})

/*
How it is working in your code
Let’s trace the execution:

The Trigger: Somewhere in your controllers folder, you call await newUser.save().

The Interception: Before Mongoose actually sends the data to MongoDB, it stops and checks if there are any pre("save") hooks registered. It finds yours.

The Logic:

It checks if(!this.isModified("password")). This is a clever optimization. If you are updating the user's email but not their password, you don't need to re-hash the password. It skips the heavy hashing work.

If the password was modified, it runs bcrypt.hash(this.password, 10).

It updates this.password with the secure, hashed version.

The Release: Only after the hashing is finished, next() is called, and Mongoose proceeds to write the document to your MongoDB collection.

*/

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password , this.password)
}

export const User = mongoose.model("User", userSchema)
