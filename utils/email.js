const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

// Configure mail transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  tls: {
    rejectUnauthorized: false,
  },
  auth: {
    user: "sohaibsipra869@gmail.com",
    pass: "bscs tyov hnug aznw",
  },
});

// Convert Google Drive share link to direct image URL
const getGoogleDriveImageUrl = (fileId) => {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

const LOGO_URL = getGoogleDriveImageUrl("1uZnHdMchbW675k1v0u--YkpYQ-rFRAR3");

const STAR_URL = getGoogleDriveImageUrl("1bFyhjO4mDLKBrR9PYHPS8Abx3vGxFNPP");

// Email templates
const getPointsEmailTemplate = (
  studentName,
  points,
  reason,
  awarderName,
  awarderRole,
  comments,
  grade
) => {
  const isPenalty = points < 0;
  const pointType = isPenalty ? "demerit" : "merit";
  const pointWord = Math.abs(points) === 1 ? "point" : "points";
  const showStar = grade <= 6;

  console.log(grade);

  console.log(isPenalty, pointType, pointWord, showStar);
  return {
    subject: `There are Updates to your Merit Points!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Points Update</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background-color: #a00c0c;
            padding: 20px;
            text-align: center;
          }
          .header img {
            max-width: 200px;
            height: auto;
          }
          .content {
            padding: 30px;
            color: #333333;
          }
          .details {
            background-color: #f8f8f8;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            background-color: #a00c0c;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .footer img {
            max-width: 150px;
            height: auto;
            margin-bottom: 15px;
          }
          .footer-text {
            margin: 10px 0;
            color: #ffffff;
          }
          ul {
            list-style-type: none;
            padding-left: 0;
          }
          li {
            margin-bottom: 10px;
          }
          .star-image {
            width: 200px;
            height: 200px;
            vertical-align: middle;
            margin-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${LOGO_URL}" alt="Roots Garden School Logo">
            </div>
            <div class="header">
            ${
              showStar && !isPenalty
                ? ` <img src="${STAR_URL}" alt="Star" class="star-image">`
                : ""
            }
            </div>
          
          <div class="content">
            <p>Dear <strong>${studentName}</strong>,</p>
            
            <p>This is to inform you that you have been ${
              isPenalty ? "given" : "awarded"
            } 
               <strong>${Math.abs(
                 points
               )} ${pointType} ${pointWord}</strong>.</p>
            
            <div class="details">
              <h3 style="margin-top: 0;">Details:</h3>
              <ul>
                <li><strong>Points:</strong> ${Math.abs(points)}</li>
                <li><strong>Reason:</strong> ${reason}</li>
                <li><strong>Awarded by:</strong> ${awarderName} (${awarderRole})</li>
                ${
                  comments
                    ? `<li><strong>Additional Comments:</strong> ${comments}</li>`
                    : ""
                }
              </ul>
            </div>
            
            <p>If you have any questions, please contact your branch administrator.</p>
          </div>
       
        </div>
      </body>
      </html>
    `.trim(),
  };
};

// Send email function
const sendPointsEmail = async (
  studentEmail,
  studentName,
  points,
  reason,
  awarderName,
  awarderRole,
  comments,
  grade
) => {
  try {
    const { subject, html } = getPointsEmailTemplate(
      studentName,
      points,
      reason,
      awarderName,
      awarderRole,
      comments,
      grade
    );

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: studentEmail,
      subject,
      html,
    });
    console.log("Email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

const getPasswordEmailTemplate = (email, password) => {
  return {
    subject: "Your New Password",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #a00c0c;
            padding: 20px;
            text-align: center;
            color: #ffffff;
          }
          .content {
            padding: 30px;
            color: #333333;
          }
          .footer {
            background-color: #a00c0c;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <p>Dear User,</p>
            <p>Your password has been reset. Please use the following password to log in:</p>
            <p><strong>${password}</strong></p>
            <p>If you did not request a password reset, please contact support immediately.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `.trim(),
  };
};
const sendPasswordEmail = async (email, password) => {
  try {
    const { subject, html } = getPasswordEmailTemplate(email, password);

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject,
      html,
    });
    console.log("Email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPointsEmail, };
