import { User } from "../models/users.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken._id)
            .select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")

        if (!user) {
            throw new ApiError(401, "Invalid access token")
        }

        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401, "Invalid access token")

    }
})

/*So I realize that instead of decoding this access token every single time in my controller, I thought

to create a middleware.

This is a middleware code.

And what we have here is you can see this is the middleware which intercept the request in between.

And this is my auth middleware.

What it does, it validates whether the access token is actually good or not if it is present or not.

And if it is present, it just adds the information into this request.

Request dot user.

You can call it whatever you like.

We happen to call it as request dot user and that's all what we are doing.

*/