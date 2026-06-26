import mongoose, { mongo } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"


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
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
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
            type: String
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
    if (!this.isModified("password")) return
    this.password = await bcrypt.hash(this.password, 10)
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

//generating the access token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn : process.env.ACCESS_TOKEN_EXPIRY}
    )
}

//generating refresh token

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn : process.env.REFRESH_TOKEN_EXPIRY}
    )
}

//generating temporary token when user clicks forgot password

userSchema.methods.generateTemporaryToken = function(){
    const unHashedToken = crypto.randomBytes(20).toString("hex")

    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex")
    
    const tokenExpiry = Date.now() + (20*60*1000) //20minutes
    return {unHashedToken, hashedToken, tokenExpiry}
}

export const User = mongoose.model("User", userSchema)


/* 

Scenario 1: Alex Logs In (Access vs. Refresh Tokens)
Imagine Alex opens your app, types in their username and password, and hits "Login."

Step 1: The Initial Handshake
The server checks Alex's password using the isPasswordCorrect method. It matches! Now, the server calls both token functions from your file:

generateAccessToken() creates a short-lived token (usually lasts 15 minutes).

generateRereshToken() creates a long-lived token (usually lasts 7 to 30 days).

The Analogy: > * The Access Token is like a Theme Park Wristband. Once you have it on, you can jump on any ride instantly without showing your ID every single time.

The Refresh Token is like the Paper Receipt locked in your wallet. You don't show it to ride the rollercoasters, but if your wristband snaps, you use the receipt to get a new one.

The server sends both tokens back to Alex’s browser.

Step 2: Surfing the App (Using the Access Token)
Alex wants to post a comment or view their dashboard.

Alex's browser automatically attaches that Access Token (the wristband) to the request.

The server looks at the token, verifies the digital signature, and says, "Awesome, I see this belongs to Alex. Request approved!"

Because the token contains Alex's ID and username inside it, the server doesn't even need to ask the database who Alex is. This keeps your app lightning-fast.

Step 3: The Wristband Expires
After 15 minutes, Alex clicks "View Profile."

The server looks at the Access Token and says, "Nope, this wristband expired 1 minute ago. Access Denied."

The Magic Behind the Scenes: Alex's browser catches this denial. Instead of kicking Alex out to the login screen, the frontend code silently sends Alex's Refresh Token (the paper receipt) to a special hidden route on your server.

Your server checks the database to ensure Alex's refresh token is still valid. If it is, the server generates a brand new Access Token and sends it right back.

Alex’s profile page loads seamlessly. Alex has no idea this happened; to them, they just stayed logged in!

Scenario 2: Alex Forgets Their Password (Temporary Tokens)
Now, let's say Alex logs out, comes back a month later, and completely forgets their password. They click "Forgot Password."

Step 1: Creating the Breadcrumb Trail
Your server looks up Alex's email and triggers the generateTemporaryToken() method. This function does three things:

Generates a raw, random string (e.g., crypto makes something like a1b2c3d4...). This is the unHashedToken.

Scrambles it into a hashedToken using SHA-256. This hashed version is saved securely into Alex's user file in your database under forgotPasswordToken.

Sets a doomsday clock (tokenExpiry) for exactly 20 minutes into the future and saves it to forgotPasswordExpiry.

Step 2: The Email Link
The server sends an email to Alex containing a link that looks like this:

https://myapp.com/reset-password?token=a1b2c3d4...

🧠 Why do we hash it in the database? Security! If a hacker sneaks into your database, they will only see the hashed version. They can't use that hashed version to guess the real link in Alex's email.

Step 3: Resetting the Password
Alex opens their email 5 minutes later and clicks the link.

Your server grabs the raw a1b2c3d4... token from the URL bar.

The server hashes it and looks in the database for a user that matches that hash. It finds Alex!

The server checks the clock. It has only been 5 minutes, which is less than the 20-minute forgotPasswordExpiry.

The server allows Alex to type a new password, hashes it using bcrypt, clears out the temporary tokens, and says, "Password successfully changed!"

*/

/*
i know that i have to generate three token for building a authentication system which is access token
which will be for 1st time when user logs in and after few minutes the refresh token will come in the
picture and hand the user a new access token to do his work without the hassle of logging in again
and if after few days the user forgets the password then by using the temporary tokens server will 
create a random string and save in the database of the user's email and then send a link to the 
email of user which he used to login but forgets it password and that link will contain the hashed 
random string and if that string matches with the saved random string which will be going to expire 
in 20 minutes.

*/