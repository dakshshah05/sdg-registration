/**
 * Google Apps Script to handle Form Submission with Base64 File Upload & Email OTP Authentication
 *
 * Instructions:
 * 1. Go to https://script.google.com/
 * 2. Open your project.
 * 3. Paste this code into Code.gs (replacing previous code).
 * 4. Run the 'setup' function once to create the necessary Sheet structure (if not already created).
 * 5. Deploy as Web App / Manage Deployments -> New Version:
 *    - Click 'Deploy' -> 'Manage deployments' -> Edit (pencil) -> Version: 'New version' -> Deploy
 *    - Execute as: 'Me'
 *    - Who has access: 'Anyone' (IMPORTANT for public access)
 * 6. Copy the URL and ensure it matches VITE_APP_SCRIPT_URL in your React .env file.
 */

// CONFIGURATION
const SHEET_NAME = "registrations";
const FOLDER_ID = "1VyvtmkwrhD3ZL9iAmgPA-bFekSTXXn5x"; // Configured from user link
const SECRET_TOKEN = "SDG_SECURE_TOKEN_2025"; // Shared secret password

// Helper to create JSON Response with CORS headers
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle GET requests (OTP sending and verification via query parameters)
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const token = params.token;
    const action = (params.action || "").toLowerCase();
    const email = (params.email || "").toLowerCase().trim();
    const otp = (params.otp || "").trim();
    const name = params.name || "";

    // Security Check
    if (token !== SECRET_TOKEN) {
      return createJsonResponse({
        status: "error",
        message: "Unauthorized: Invalid Token",
      });
    }

    if (action === "send_otp") {
      return handleSendOtp(email, name);
    } else if (action === "verify_otp") {
      return handleVerifyOtp(email, otp);
    }

    return createJsonResponse({
      status: "error",
      message: "Invalid action specified.",
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString(),
    });
  }
}

// Handle POST requests
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10 seconds

  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    // SECURITY CHECK
    if (data.token !== SECRET_TOKEN) {
      return createJsonResponse({
        status: "error",
        message: "Unauthorized: Invalid Token",
      });
    }

    const action = (data.action || "register").toLowerCase();
    const email = (data.email || "").toLowerCase().trim();

    if (action === "send_otp") {
      return handleSendOtp(email, data.name || "");
    } else if (action === "verify_otp") {
      return handleVerifyOtp(email, data.otp || "");
    } else if (action === "register" || !data.action) {
      return handleRegister(data);
    }

    return createJsonResponse({
      status: "error",
      message: "Unknown action: " + action,
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString(),
    });
  } finally {
    lock.releaseLock();
  }
}

// ----------------------------------------------------
// OTP HANDLERS
// ----------------------------------------------------

function handleSendOtp(email, userName) {
  if (!email || !email.includes("@")) {
    return createJsonResponse({
      status: "error",
      message: "Please enter a valid email address.",
    });
  }

  // Generate 6-digit unique numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP in CacheService (valid for 10 minutes = 600 seconds)
  const cache = CacheService.getScriptCache();
  cache.put("OTP_" + email, otpCode, 600);

  // Backup in PropertiesService
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(
      "OTP_" + email,
      JSON.stringify({
        code: otpCode,
        expiresAt: new Date().getTime() + 10 * 60 * 1000,
      })
    );
  } catch (e) {
    Logger.log("PropertiesService warning: " + e.toString());
  }

  // Send the OTP email to the user
  try {
    sendOtpEmail(email, otpCode, userName);
  } catch (mailErr) {
    Logger.log("Failed to send OTP email: " + mailErr.toString());
    return createJsonResponse({
      status: "error",
      message: "Failed to send email: " + mailErr.toString(),
    });
  }

  return createJsonResponse({
    status: "success",
    message: "A 6-digit verification code has been sent to " + email,
  });
}

function handleVerifyOtp(email, otp) {
  if (!email || !otp) {
    return createJsonResponse({
      status: "error",
      message: "Email and OTP code are required.",
    });
  }

  const cleanOtp = String(otp).trim();
  const cache = CacheService.getScriptCache();
  let storedOtp = cache.get("OTP_" + email);

  // Check PropertiesService backup if cache expired or not found
  if (!storedOtp) {
    try {
      const prop = PropertiesService.getScriptProperties().getProperty("OTP_" + email);
      if (prop) {
        const parsed = JSON.parse(prop);
        if (parsed.expiresAt > new Date().getTime()) {
          storedOtp = parsed.code;
        }
      }
    } catch (e) {
      Logger.log("Properties read warning: " + e.toString());
    }
  }

  if (!storedOtp) {
    return createJsonResponse({
      status: "error",
      message: "Verification code expired or not found. Please request a new code.",
    });
  }

  if (storedOtp !== cleanOtp) {
    return createJsonResponse({
      status: "error",
      message: "Invalid verification code. Please check and try again.",
    });
  }

  // Verification successful: Mark email as verified for 30 minutes
  cache.put("VERIFIED_" + email, "true", 1800);
  cache.remove("OTP_" + email);

  try {
    PropertiesService.getScriptProperties().deleteProperty("OTP_" + email);
    PropertiesService.getScriptProperties().setProperty(
      "VERIFIED_" + email,
      (new Date().getTime() + 1800000).toString()
    );
  } catch (e) {}

  return createJsonResponse({
    status: "success",
    message: "Email successfully verified!",
  });
}

// ----------------------------------------------------
// REGISTRATION HANDLER
// ----------------------------------------------------

function handleRegister(data) {
  const name = data.name;
  const college = data.college;
  const email = (data.email || "").toLowerCase().trim();
  const mobile = data.mobile;
  const base64File = data.file; // Expecting full Data URL e.g., "data:image/png;base64,....."
  const fileName = data.fileName;
  const mimeType = data.mimeType;

  // 1. Save File to Drive
  let fileUrl = "";
  let fileId = "";
  if (base64File && fileName) {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const encodedData = base64File.split(",")[1];
    const decodedBlob = Utilities.base64Decode(encodedData);
    const blob = Utilities.newBlob(decodedBlob, mimeType, fileName);

    const file = folder.createFile(blob);
    file.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );
    fileUrl = file.getUrl();
    fileId = file.getId();
  }

  // 2. Save Data to Sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "Timestamp",
      "Name",
      "College",
      "Email",
      "Mobile",
      "File URL",
    ]);
  }

  const timestamp = new Date();
  sheet.appendRow([timestamp, name, college, email, mobile, fileUrl]);

  // 3. Send Confirmation Email with ID Card / PDF
  if (email) {
    sendConfirmationEmail(
      email,
      name,
      college,
      fileUrl,
      base64File,
      mimeType,
      fileId
    );
  }

  return createJsonResponse({
    status: "success",
    message: "Registration successful",
    fileUrl: fileUrl,
  });
}

// ----------------------------------------------------
// EMAIL CONFIGURATION & TEMPLATES
// ----------------------------------------------------

const HEADER_LOGO_1_ID = "1My_xJjf-XEb9APKw9A8fNZljGB2s1B4M";
const HEADER_LOGO_CENTER_ID = "1EeJW-CladfWJ8AA5OpU70MkYTp_h96x7";
const HEADER_LOGO_2_ID = "1U1m1U55Zj1WF7cLWCzuhW6prV-wBNunH";
const EVENT_BANNER_ID = "15fCZUqeS0yI0TZqswVWq7KJNWpObcM8j";
const QR_CODE_1_ID = "1K3F6vDxnOIorfK2zxA0UerEBZDtXvwRL";
const QR_CODE_2_ID = "1ih1uRUs2-SGCgsEs-nFUGkNAwj0WLK8r";

const getDriveUrl = (id) => `https://drive.google.com/uc?export=view&id=${id}`;

const HEADER_LOGO_1_URL = getDriveUrl(HEADER_LOGO_1_ID);
const HEADER_LOGO_CENTER_URL = getDriveUrl(HEADER_LOGO_CENTER_ID);
const HEADER_LOGO_2_URL = getDriveUrl(HEADER_LOGO_2_ID);
const EVENT_BANNER_URL = getDriveUrl(EVENT_BANNER_ID);
const QR_CODE_1_URL = getDriveUrl(QR_CODE_1_ID);
const QR_CODE_2_URL = getDriveUrl(QR_CODE_2_ID);

// ----------------------------------------------------
// SEND OTP EMAIL TEMPLATE
// ----------------------------------------------------

function sendOtpEmail(recipientEmail, otpCode, userName) {
  const subject = `${otpCode} is your SDG Registration Verification Code`;
  const greeting = userName ? `Hello <strong>${userName}</strong>,` : "Hello,";

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
      
      <!-- Top SDG Color Bar -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td height="6" style="background: linear-gradient(90deg, #4C9F38, #FCC30B, #FD9D24);"></td>
        </tr>
      </table>

      <!-- Header with Logos -->
      <div style="background-color: #f7faf7; padding: 20px 24px; text-align: center; border-bottom: 1px solid #edf2ed;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td width="33%" align="left" valign="middle">
              <img src="${HEADER_LOGO_1_URL}" alt="Event Logo" style="height: 50px; max-width: 100%; object-fit: contain;">
            </td>
            <td width="34%" align="center" valign="middle">
              <img src="${HEADER_LOGO_CENTER_URL}" alt="Center Logo" style="height: 50px; max-width: 100%; object-fit: contain;">
            </td>
            <td width="33%" align="right" valign="middle">
              <img src="${HEADER_LOGO_2_URL}" alt="SDG Cell Logo" style="height: 50px; max-width: 100%; object-fit: contain;">
            </td>
          </tr>
        </table>
      </div>

      <!-- Main Body -->
      <div style="padding: 32px 28px; text-align: center;">
        <h2 style="color: #1B5E20; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">Email Verification Code</h2>
        
        <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0; text-align: left;">
          ${greeting}
        </p>
        
        <p style="font-size: 14px; color: #4B5563; line-height: 1.6; margin: 0 0 24px 0; text-align: left;">
          You are one step away from registering for <strong>Prithvi 2026</strong>. Please use the following 6-digit verification code to authenticate your email address:
        </p>

        <!-- OTP Code Card -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%); border: 2px dashed #4C9F38; border-radius: 12px; padding: 22px 16px; margin: 20px auto; max-width: 360px;">
          <div style="font-size: 12px; font-weight: 700; color: #1B5E20; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
            Your Verification Code
          </div>
          <div style="font-size: 38px; font-weight: 800; color: #1B5E20; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace; margin: 8px 0;">
            ${otpCode}
          </div>
          <div style="font-size: 12px; color: #6B7280; margin-top: 8px;">
            ⏱️ Valid for <strong>10 minutes</strong>
          </div>
        </div>

        <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin: 24px 0 0 0; text-align: left;">
          🔒 <em>If you did not request this code, you can safely ignore this email. Do not share this code with anyone.</em>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #1B5E20; padding: 18px 16px; text-align: center; color: white;">
        <p style="margin: 0; font-size: 13px; font-weight: 600;">SDG Cell, Christ University</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #c8e6c9;">Building a sustainable future together 🌱</p>
      </div>

    </div>
  `;

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    body: `Your SDG registration verification code is: ${otpCode}. It is valid for 10 minutes.`,
    htmlBody: htmlBody,
  });
}

// ----------------------------------------------------
// SEND CONFIRMATION EMAIL (WITH ID CARD PDF)
// ----------------------------------------------------

function sendConfirmationEmail(
  recipientEmail,
  userName,
  college,
  fileUrl,
  base64FileRaw,
  mimeType,
  fileId
) {
  const subject = "Welcome to the SDG Movement! Registration Confirmed";

  let userImageCid = "userPhoto";
  let inlineImages = {};

  let base64Clean = "";
  if (base64FileRaw && base64FileRaw.includes("base64,")) {
    base64Clean = base64FileRaw.split(",")[1];
  } else {
    base64Clean = base64FileRaw;
  }

  if (base64Clean) {
    const decodedBlob = Utilities.base64Decode(base64Clean);
    const blob = Utilities.newBlob(decodedBlob, mimeType, "userphoto");
    inlineImages[userImageCid] = blob;
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      
      <!-- HEADER -->
      <div style="background-color: #f1f8e9; padding: 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td width="33%" align="left" valign="middle">
               <img src="${HEADER_LOGO_1_URL}" alt="Event Logo" style="height: 80px; max-width: 100%; object-fit: contain;">
            </td>
            <td width="34%" align="center" valign="middle">
               <img src="${HEADER_LOGO_CENTER_URL}" alt="Event Logo Center" style="height: 80px; max-width: 100%; object-fit: contain;">
            </td>
            <td width="33%" align="right" valign="middle">
               <img src="${HEADER_LOGO_2_URL}" alt="SDG Cell Logo" style="height: 80px; max-width: 100%; object-fit: contain;">
            </td>
          </tr>
        </table>
      </div>

      <!-- BODY (CENTER) -->
      <div style="padding: 30px; text-align: center; background-color: #ffffff;">

        <!-- Event Banner -->
        <div style="margin-bottom: 20px;">
          <img src="${EVENT_BANNER_URL}" alt="Event Banner" style="width: 100%; max-width: 500px; height: auto; border-radius: 8px;">
        </div>
        
        <!-- User Photo in View Mode -->
        <div style="margin-bottom: 20px;">
          <img src="cid:${userImageCid}" alt="Your Photo" style="width: 200px; height: 200px; object-fit: cover; border-radius: 50%; border: 4px solid #5D4037; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        </div>

        <!-- User Info -->
        <h2 style="color: #1B5E20; margin-bottom: 5px;">${userName}</h2>
        <p style="color: #5D4037; font-size: 16px; margin-top: 0;">${college}</p>

        <!-- Punchy Line -->
        <div style="margin-top: 30px; padding: 20px; background-color: #e8f5e9; border-radius: 8px; border-left: 5px solid #2E7D32;">
          <p style="font-size: 18px; font-weight: bold; color: #1B5E20; margin: 0;">
            "You have successfully registered for Prithvi 2026. Let's build a sustainable future together!"
          </p>
        </div>

      </div>

      <!-- FOOTER -->
      <div style="background-color: #1B5E20; padding: 20px 10px; text-align: center; color: white;">
        <p style="margin-bottom: 20px; font-size: 14px;">Scan to connect with us:</p>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td width="50%" align="center" valign="top" style="padding: 5px;">
               <img src="${QR_CODE_1_URL}" alt="QR 1" style="width: 100%; max-width: 120px; height: auto; background: white; padding: 5px; border-radius: 4px; box-sizing: border-box;">
               <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold; color: white;">Wi-Fi</p>
            </td>
            <td width="50%" align="center" valign="top" style="padding: 5px;">
               <img src="${QR_CODE_2_URL}" alt="QR 2" style="width: 100%; max-width: 120px; height: auto; background: white; padding: 5px; border-radius: 4px; box-sizing: border-box;">
               <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold; color: white;">Feedback</p>
            </td>
          </tr>
        </table>

        <p style="margin-top: 25px; font-size: 12px; color: #c8e6c9;">© 2025 SDG Cell, Christ University. All rights reserved.</p>
      </div>

    </div>
  `;

  if (fileId) {
    try {
      const getBase64Image = (id) => {
        try {
          const cache = CacheService.getScriptCache();
          const cached = cache.get(id);
          if (cached) return cached;

          const file = DriveApp.getFileById(id);
          const blob = file.getBlob();
          const b64 = Utilities.base64Encode(blob.getBytes());
          const result = `data:${blob.getContentType()};base64,${b64}`;

          try {
            cache.put(id, result, 21600); // 6 hours
          } catch (e) {}

          return result;
        } catch (e) {
          return "";
        }
      };

      const logo1B64 = getBase64Image(HEADER_LOGO_1_ID);
      const logoCenterB64 = getBase64Image(HEADER_LOGO_CENTER_ID);
      const logo2B64 = getBase64Image(HEADER_LOGO_2_ID);
      const bannerB64 = getBase64Image(EVENT_BANNER_ID);
      const userPhotoB64 = base64FileRaw;
      const qr1B64 = getBase64Image(QR_CODE_1_ID);
      const qr2B64 = getBase64Image(QR_CODE_2_ID);

      let pdfHtml = htmlBody
        .replace(HEADER_LOGO_1_URL, logo1B64)
        .replace(HEADER_LOGO_CENTER_URL, logoCenterB64)
        .replace(HEADER_LOGO_2_URL, logo2B64)
        .replace(EVENT_BANNER_URL, bannerB64)
        .replace(`src="cid:${userImageCid}"`, `src="${userPhotoB64}"`)
        .replace(QR_CODE_1_URL, qr1B64)
        .replace(QR_CODE_2_URL, qr2B64);

      pdfHtml = pdfHtml.replace(
        /background-color:/g,
        "-webkit-print-color-adjust: exact; print-color-adjust: exact; background-color:"
      );

      pdfHtml = pdfHtml.replace("max-width: 600px;", "max-width: 100%; width: 550px;");
      pdfHtml = pdfHtml.replace("padding: 20px;", "padding: 10px;");
      pdfHtml = pdfHtml.replace("padding: 30px;", "padding: 15px;");
      pdfHtml = pdfHtml.replace(/height: 80px;/g, "height: 60px;");
      pdfHtml = pdfHtml.replace("width: 200px; height: 200px;", "width: 120px; height: 120px;");
      pdfHtml = pdfHtml.replace("max-width: 500px;", "max-width: 350px;");
      pdfHtml = pdfHtml.replace(/margin-bottom: 20px;/g, "margin-bottom: 10px;");
      pdfHtml = pdfHtml.replace(/margin-top: 30px;/g, "margin-top: 15px;");
      pdfHtml = pdfHtml.replace("font-size: 18px;", "font-size: 14px;");
      pdfHtml = pdfHtml.replace("font-size: 16px;", "font-size: 12px;");
      pdfHtml = pdfHtml.replace("<h2>", '<h2 style="font-size: 18px; margin: 5px 0;">');

      const pdfBlob = Utilities.newBlob(pdfHtml, MimeType.HTML)
        .getAs(MimeType.PDF)
        .setName("Prithvi_2026_ID_Card.pdf");

      MailApp.sendEmail({
        to: recipientEmail,
        subject: subject + " (ID Card)",
        body: "Please find your ID Card attached.",
        htmlBody: htmlBody,
        inlineImages: inlineImages,
        attachments: [pdfBlob],
      });
    } catch (e) {
      Logger.log("PDF Generation Warning: " + e.toString());
      MailApp.sendEmail({
        to: recipientEmail,
        subject: subject,
        htmlBody: htmlBody,
        inlineImages: inlineImages,
      });
    }
  } else {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      htmlBody: htmlBody,
      inlineImages: inlineImages,
    });
  }
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "Timestamp",
      "Name",
      "College",
      "Email",
      "Mobile",
      "File URL",
    ]);
    Logger.log("Sheet created.");
  } else {
    Logger.log("Sheet already exists.");
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .append("Access-Control-Allow-Origin: *")
    .append("Access-Control-Allow-Methods: POST, GET, OPTIONS")
    .append("Access-Control-Allow-Headers: Content-Type");
}
