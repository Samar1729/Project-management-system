import { User } from "../models/users.models.js"
import { ApiResponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { emailVerificationMailgenContent, forgotPasswordMailGenContent, sendEmail } from "../utils/mail.js"
import jwt from "jsonwebtoken"
import { validationResult } from "express-validator"
import crypto from "crypto"


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(
            500,
            "something went wrong while generating access token"
        )
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password, role } = req.body

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existingUser) {
        throw new ApiError(409, "user with email or username already exists", [])
    }

    const user = await User.create({
        email: email,
        username: username,
        password: password,
        isEmailVerified: false
    })

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()

    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false })
    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
            )
        }
    )

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registring the user")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200, { user: createdUser }, "user registered successfully and verification email has been sent on your email"
            )
        )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body

    if (!email) {
        throw new ApiError(400, "Email is required!!")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(400, "User with this email doesn't exists!!")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Your Entered Password is incorrect!!")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    )

    //cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User LoggedIn successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: ""
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "user Logged Out")
        )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current User fetched successfully"
            )
        )
})

const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params

    if (!verificationToken) {
        throw new ApiError(400, "Email Verification token is missing")
    }

    let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex")

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() }
    })

    if (!user) {
        throw new ApiError(400, "Token is invalid or expire")
    }

    user.emailVerificationToken = undefined
    user.emailVerificationExpiry = undefined

    user.isEmailVerified = true

    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Congratulations!!,your email has been verified!!"
        ))

})

/*
const resendEmailVerification = asyncHandler(async (req, res) => {
    await User.findById(req.user._id)

    if (!user) {
        throw new ApiError(404, "User doesn't exist")
    }

    if (user.isEmailVerified) {
        throw new ApiError(409, "Email is already verified")
    }
    */

const resendEmailVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User with this email does not exist");
    }

    if (user.isEmailVerified) {
        throw new ApiError(409, "Email is already verified");
    }


    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()

    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false })
    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
            )
        }
    )

    return status(200, json(new ApiResponse(200, {}, "Email has been sent to your email id again")))

})

const resendEmailVerificationAfterLogin = asyncHandler(async (req, res) => {
    await User.findById(req.user._id)

    if (!user) {
        throw new ApiError(404, "User doesn't exist")
    }

    if (user.isEmailVerified) {
        throw new ApiError(409, "Email is already verified")
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()

    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false })
    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
            )
        }
    )

    return status(200, json(new ApiResponse(200, {}, "Email has been sent to your email id again")))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(
            401, "Unauthorized access"
        )
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedRefreshToken._id)

        /*
The Client sends the Briefcase: Insomnia sends the incomingRefreshToken to your server.

Unlocking the Briefcase: jwt.verify takes that token and uses your REFRESH_TOKEN_SECRET master key
to unlock it.

Reading the ID: Once unlocked, jwt.verify looks inside and says, "Ah, I see the _id stored in here!"
It hands that _id over to your decodedRefreshToken variable.

THEN we talk to the database: It's only on the very next
line—User.findById(decodedRefreshToken._id)—that your code actually reaches out
to MongoDB to say, "Hey database, give me the full user profile for this ID".
        */
        if (!user) {
            throw new ApiError(
                401, "Invalid refresh token"
            )
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        user.refreshToken = newRefreshToken
        await user.save()

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Acess Token Refreshed"))


    } catch (error) {
        throw new ApiError(401, "Invalid refresh Token")
    }
})

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User does not exists", [])
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()

    user.forgotPasswordToken = hashedToken
    user.forgotPasswordExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false })

    await sendEmail(
        {
            email: user?.email,
            subject: "Password Reset request",
            mailgenContent: forgotPasswordMailGenContent(
                user.username,
                `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
            )
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been sent to your email successfully please check and verify your email"
            )
        )
})

const resetForgotPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params
    const { newPassword } = req.body

    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    })

    if (!user) {
        throw new ApiError(489, "Token is invalid or expired")
    }

    user.forgotPasswordExpiry = undefined
    user.forgotPasswordToken = undefined

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password Reset successfully"
            )
        )
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    changeCurrentPassword,
    resetForgotPassword,
    resendEmailVerificationAfterLogin
}