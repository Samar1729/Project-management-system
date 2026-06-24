import { User } from "../models/users.models.js"
import { ApiResponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js"
import jwt from "jsonwebtoken"


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
        .createHashed("sha256")
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

    res.status(200, json(
        new ApiResponse(
            200, { isEmailVerified: true }, "Email is Verified"
        )
    ))
})

const resendEmailVerification = asyncHandler(async (req, res) => {
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
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(
            401, "Unauthorized access"
        )
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedRefreshToken._id)
        if (!user) {
            throw new ApiError(
                401, "Invalid refresh token"
            )
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh token is expired")
        }

        const options = {
            httpOnly : true,
            secure : true
        }


    } catch (error) {

    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification
}