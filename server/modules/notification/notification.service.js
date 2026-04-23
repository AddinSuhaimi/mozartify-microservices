const transporter = require("../../config/mailer");

const isProduction = process.env.NODE_ENV === "production";

exports.sendVerificationEmail = async ({ email, username, token }) => {
  const frontendUrl = isProduction
    ? process.env.FRONTEND_PROD_URL
    : process.env.FRONTEND_DEV_URL;

  const verificationUrl = `${frontendUrl}/email-verification?token=${token}`;

  const emailTemplate = `
    <div style="border: 2px solid #8BD3E6; border-radius: 10px; padding: 20px; font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9FBFC;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #8BD3E6; font-size: 20px; margin: 0; font-weight: bold;">A Musicians' Notation And Score Integration Resource</h1>
            <p style="color: #6C757D; font-size: 16px; margin: 5px 0 0;">Your Registration Portal</p>
        </div>
        <div style="padding: 20px; background: #FFFFFF; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);">
            <p style="color: #333333; font-size: 16px; margin: 0;">Hi <strong>${username}</strong>,</p>
            <p style="color: #555555; font-size: 14px; line-height: 1.6;">
                Thank you for registering with <strong style="color: #8BD3E6;">N.A.S.I.R </strong>! Please verify your email address to complete your registration.
            </p>
            <p style="color: #333333; font-size: 14px; margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="color: #555555; font-size: 14px; line-height: 1.6;">
                Click the button below to verify your email address:
            </p>
        <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 25px; font-size: 14px; font-weight: bold; color: #FFFFFF; background-color: #8BD3E6; border-radius: 5px; text-decoration: none;">
            VERIFY EMAIL
            </a>
        </div>
            <p style="color: #6C757D; font-size: 12px; text-align: center; margin-top: 20px;">
                If you did not register for this account, please disregard this email.
            </p>
        </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"N.A.S.I.R Music System" <nasir.music.system@gmail.com>',
    to: email,
    subject: "Email Verification",
    html: emailTemplate,
  });
};

exports.sendAdminApprovalEmail = async ({ adminEmail, username, email }) => {
  const emailTemplate = `
    <div style="border: 2px solid #8BD3E6; border-radius: 10px; padding: 20px; font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9FBFC;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #8BD3E6; font-size: 28px; margin: 0; font-weight: bold;">A Musicians' Notation And Score Integration Resource</h1>
        </div>
        <div style="padding: 20px; background: #FFFFFF; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: left;">
            <p style="color: #333333; font-size: 16px;">Admin,</p>
            <p style="color: #555555; font-size: 14px; line-height: 1.6;">
                A new user has requested to become a Music Entry Clerk.
            </p>
            <p style="color: #333333; font-size: 14px; margin: 10px 0;"><strong>Username:</strong> ${username}</p>
            <p style="color: #333333; font-size: 14px; margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="color: #555555; font-size: 14px; line-height: 1.6;">
                Please review and approve their request in the admin panel.
            </p>
        </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"N.A.S.I.R Music System" <nasir.music.system@gmail.com>',
    to: adminEmail,
    subject: "Music Entry Clerk Approval Needed",
    html: emailTemplate,
  });
};