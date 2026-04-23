const transporter = require("../../config/mailer");

const isProduction = process.env.NODE_ENV === "production";

exports.sendVerificationEmail = async ({ email, username, token }) => {
  const frontendUrl = isProduction
    ? process.env.FRONTEND_PROD_URL
    : process.env.FRONTEND_DEV_URL;

  const verificationUrl = `${frontendUrl}/email-verification?token=${token}`;

  const emailTemplate = `
    <div>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Please verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
    </div>
  `;

  await transporter.sendMail({
    from: '"N.A.S.I.R Music System" <nasir.music.system@gmail.com>',
    to: email,
    subject: "Email Verification",
    html: emailTemplate,
  });
};