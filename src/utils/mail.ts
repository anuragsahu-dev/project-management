import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import { config } from "../config/config";
import type { Content } from "mailgen";
import { ApiError } from "../middlewares/error.middleware";
import logger from "../config/logger";

interface Options {
  email: string;
  subject: string;
  mailgenContent: Content;
}

const sendEmail = async (options: Options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://taskmanagelink.com",
    },
  });
  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  const mail = {
    from: config.smtp.user,
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    logger.error("Failed to send email", { mail, error });
    throw new ApiError(500, "Email service failed. Please try again later.");
  }
};

const emailVerificationMailgenContent = (
  fullName: string,
  verficationUrl: string
) => {
  return {
    body: {
      name: fullName,
      intro: "Welcome to our App! we'are excited to have you on board.",
      action: {
        instructions:
          "To verify your email please click on the following button",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: verficationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

const forgotPasswordMailgenContent = (
  fullName: string,
  passwordResetUrl: string
) => {
  return {
    body: {
      name: fullName,
      intro: "We got a request to reset the password of your account",
      action: {
        instructions:
          "To reset your password click on the following button or link",
        button: {
          color: "#22BC66",
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
};
