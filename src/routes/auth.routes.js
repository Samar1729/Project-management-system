import { Router } from "express";
import { changeCurrentPassword, forgotPasswordRequest, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, resendEmailVerification, resetForgotPassword, verifyEmail, } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegisterValidator, userLoginValidator, userforgotPasswordValidator, userChangeCurrentPasswordValidator , userResetForgotPasswordValidator } from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

//usecured routes
router.route("/register").post(userRegisterValidator(), validate, registerUser)
router.route("/login").post(userLoginValidator(), validate, loginUser)
router.route("/verify-email/:verificationToken").get(verifyEmail)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/forgot-password").post(userforgotPasswordValidator(), validate, forgotPasswordRequest)
router.route("/reset-password/:resetToken").post(userResetForgotPasswordValidator(), validate, resetForgotPassword)
router.route("/resend-email-verification").post(verifyJWT, resendEmailVerification)

//secure routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/current-user").post(verifyJWT, getCurrentUser)
router.route("/change-password").post(verifyJWT, userChangeCurrentPasswordValidator(), validate, changeCurrentPassword)


export default router