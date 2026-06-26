import Mailgen from "mailgen"
import nodemailer from "nodemailer"

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Samar",
            link: "https://taskmanagelink.com"
        }
    })

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)
    const emailHTML = mailGenerator.generate(options.mailgenContent)

    const transporter = nodemailer.createTransport({
        host: process.env.ETHEREAL_SMTP_HOST,
        port: process.env.ETHEREAL_SMTP_PORT,
        auth: {
            user: process.env.ETHEREAL_SMTP_USER,
            pass: process.env.ETHEREAL_SMTP_PASS
        }
    })

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHTML
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.error("Email service failed silently, make sure that you have provided your MAILTRAP credentials in the .env file")
        console.error("Error:", error);
    }
}

const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to my App! we are excited to have you on board.",
            action: {
                instructions: "To verify your email, please click on the following button",
                button: {
                    color: "#22BC66",
                    text: 'Verify Your Email',
                    link: verificationUrl
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}


const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "We got a request to reset your Password of your account",
            action: {
                instructions: "to reset your password, click on the following button or link",
                button: {
                    color: "#ff730f",
                    text: 'Verify Your Email',
                    link: passwordResetUrl
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}

export {
    emailVerificationMailgenContent,
    forgotPasswordMailGenContent,
    sendEmail
}