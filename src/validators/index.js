import { body } from "express-validator"
import { AvailableUserRole } from "../utils/constants.js"

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is mandatory to register")
            .isEmail()
            .withMessage("Email's format is wrong or invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is mandatory to register")
            .isLowercase()
            .withMessage("Username must be in lowercase")
            .isLength({ min: 3 })
            .withMessage("Username must be in minimum 3 characters long"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required"),
        body("fullname")
            .trim()
            .optional()
    ]
}

const userLoginValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required to login")
            .isEmail()
            .withMessage("Email's format is wrong or invalid"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required")
    ]
}
export {
    userRegisterValidator,
    userLoginValidator
}