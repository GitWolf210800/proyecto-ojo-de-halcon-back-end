import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_SERVER,
        pass: process.env.EMAIL_SERVER_PASS
    }
})

export default async function sendMail(to, subject, html) {
    
    await transporter.sendMail({
        from: process.env.EMAIL_SERVER,
        to,
        subject,
        html
    });

}