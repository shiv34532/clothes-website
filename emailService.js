/**
 * Little to Large - Automated Email Notification & Delivery Service
 * Uses Google Gmail SMTP (100% Free - up to 500 emails/day)
 * Sender: indiancloths980@gmail.com
 */

const nodemailer = require('nodemailer');

const DEFAULT_SENDER_EMAIL = 'indiancloths980@gmail.com';
const BRAND_NAME = 'Little to Large';
const WEBSITE_URL = 'https://littletolargee.com';

// Cache for db settings fallback
let cachedSmtpPass = null;
let cachedSmtpUser = null;

/**
 * Configure or get the nodemailer SMTP transporter
 */
async function getTransporter(db = null) {
  let user = process.env.GMAIL_USER || process.env.SMTP_USER || cachedSmtpUser || DEFAULT_SENDER_EMAIL;
  let pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || cachedSmtpPass;

  // If not in env, check database settings table
  if (!pass && db) {
    try {
      const passRow = await db.get("SELECT value FROM settings WHERE key = 'smtp_password'");
      if (passRow && passRow.value) {
        cachedSmtpPass = passRow.value;
        pass = cachedSmtpPass;
      }
      const userRow = await db.get("SELECT value FROM settings WHERE key = 'smtp_email'");
      if (userRow && userRow.value) {
        cachedSmtpUser = userRow.value;
        user = cachedSmtpUser;
      }
    } catch (e) {
      // Ignore DB lookup error
    }
  }

  if (!pass) {
    return {
      isSimulated: true,
      user,
      sendMail: async (options) => {
        console.log(`[Email Simulation - Set GMAIL_APP_PASSWORD to send live]`);
        console.log(`To: ${options.to} | Subject: ${options.subject}`);
        return { simulated: true, messageId: 'simulated-' + Date.now() };
      }
    };
  }

  // Live Gmail SMTP Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  });

  return transporter;
}

/**
 * Common HTML Email Wrapper with Little to Large Indian Aesthetic Branding
 */
function wrapHtmlTemplate(title, bodyContent, preheader = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f9; color: #1e1b4b; }
    .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .email-header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
    .email-header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }
    .email-header .tagline { font-size: 13px; color: #ffb703; margin-top: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .email-body { padding: 30px 25px; line-height: 1.6; font-size: 15px; color: #334155; }
    .email-btn { display: inline-block; background-color: #f97316; color: #ffffff !important; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 18px 0; text-align: center; }
    .email-footer { background-color: #0f172a; color: #94a3b8; padding: 24px 20px; text-align: center; font-size: 12px; line-height: 1.5; }
    .email-footer a { color: #ffb703; text-decoration: none; }
    .coupon-box { background: #fffbeb; border: 2px dashed #f59e0b; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .coupon-code { font-size: 22px; font-weight: 800; color: #b45309; letter-spacing: 2px; }
    .otp-code { font-size: 34px; font-weight: 900; color: #1e1b4b; letter-spacing: 6px; text-align: center; padding: 12px; background: #f1f5f9; border-radius: 8px; margin: 20px 0; }
    .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .order-table th { background: #f8fafc; color: #475569; text-align: left; padding: 10px; font-size: 13px; border-bottom: 2px solid #e2e8f0; }
    .order-table td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <div class="email-container">
    <div class="email-header">
      <h1>${BRAND_NAME}</h1>
      <div class="tagline">India's Premium Family Clothing E-Store</div>
    </div>
    <div class="email-body">
      ${bodyContent}
    </div>
    <div class="email-footer">
      <p>&copy; ${new Date().getFullYear()} ${BRAND_NAME} E-Commerce. Made with ❤️ in India.<br>
      HQ Little to Large, Sector 4, Gandhidham, Gujarat - 370201<br>
      Contact: <a href="mailto:${DEFAULT_SENDER_EMAIL}">${DEFAULT_SENDER_EMAIL}</a> | Tel: +91 7383874045</p>
      <p><a href="${WEBSITE_URL}">Visit Website</a> | <a href="${WEBSITE_URL}/products">Shop Collections</a> | <a href="${WEBSITE_URL}/account">My Account</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Send Welcome Email upon Customer Registration
 */
async function sendWelcomeEmail(toEmail, customerName = 'Valued Customer', db = null) {
  try {
    if (!toEmail || !toEmail.includes('@') || toEmail.includes('guest_')) return;

    const transporter = await getTransporter(db);
    const firstName = customerName.split(' ')[0] || 'Valued Customer';

    const bodyContent = `
      <h2 style="color:#1e1b4b; margin-top:0;">Welcome to the Family, ${firstName}! 🎉</h2>
      <p>Thank you for creating an account with <strong>${BRAND_NAME}</strong>. We are thrilled to welcome you to our family fashion journey, bringing handcrafted ethnic elegance and contemporary western styles right to your doorstep across India.</p>
      
      <div class="coupon-box">
        <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:#78350f; margin-bottom:4px;">Special Welcome Gift for You</div>
        <div class="coupon-code">FAMILY10</div>
        <div style="font-size:13px; color:#92400e; margin-top:4px;">Get Flat 10% OFF on your first family collection order!</div>
      </div>

      <p>Here is what you can do with your account:</p>
      <ul style="color:#475569; padding-left:20px;">
        <li>✨ <strong>Explore Handcrafted Ethnic Sets:</strong> Matching family twinning kurtas & sets.</li>
        <li>🚚 <strong>Fast & Safe Dispatch:</strong> Reliable tracking and cash on delivery availability.</li>
        <li>❤️ <strong>Wishlist & Save:</strong> Bookmark outfits for upcoming festivals and celebrations.</li>
      </ul>

      <div style="text-align:center; margin: 25px 0;">
        <a href="${WEBSITE_URL}/products" class="email-btn">Start Exploring Collections &rarr;</a>
      </div>

      <p style="font-size:13px; color:#64748b; margin-top:20px;">Have questions or need sizing assistance? Simply reply to this email or write to us at <a href="mailto:${DEFAULT_SENDER_EMAIL}">${DEFAULT_SENDER_EMAIL}</a>.</p>
    `;

    const mailOptions = {
      from: `"${BRAND_NAME}" <${DEFAULT_SENDER_EMAIL}>`,
      to: toEmail,
      subject: `🎉 Welcome to Little to Large, ${firstName}! Here is 10% OFF your first order`,
      html: wrapHtmlTemplate(`Welcome to ${BRAND_NAME}`, bodyContent, `Welcome to ${BRAND_NAME}! Enjoy 10% OFF your first family order with code FAMILY10`)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Welcome Email Sent] To: ${toEmail} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Welcome Email Error] ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 2. Send Order Confirmation & Thank You Email
 */
async function sendOrderConfirmationEmail(orderData, db = null) {
  try {
    const toEmail = orderData.customer_email || orderData.email;
    if (!toEmail || !toEmail.includes('@') || toEmail.includes('guest_')) return;

    const transporter = await getTransporter(db);
    const customerName = orderData.customer_name || 'Valued Customer';
    const firstName = customerName.split(' ')[0] || 'Valued Customer';
    const orderId = orderData.order_id || orderData.id;
    const items = orderData.items || [];
    const totalAmount = parseFloat(orderData.total_amount || 0).toLocaleString('en-IN');
    const paymentMethod = orderData.payment_method || 'Online';
    const shippingAddress = orderData.shipping_address || 'Provided address';

    let itemsRows = '';
    items.forEach(item => {
      const price = parseFloat(item.price || 0).toLocaleString('en-IN');
      const itemTotal = (parseFloat(item.price || 0) * parseInt(item.quantity || 1)).toLocaleString('en-IN');
      const itemTitle = item.product_name || item.name || `Product #${item.product_id}`;
      const sizeVariant = item.size ? `Size: ${item.size}` : '';
      const color = item.color && item.color !== 'Default' ? `Color: ${item.color}` : '';
      const meta = [sizeVariant, color].filter(Boolean).join(' | ');

      itemsRows += `
        <tr>
          <td>
            <strong>${itemTitle}</strong>
            ${meta ? `<br><small style="color:#64748b;">${meta}</small>` : ''}
          </td>
          <td style="text-align:center;">${item.quantity || 1}</td>
          <td style="text-align:right;">₹${price}</td>
          <td style="text-align:right; font-weight:700;">₹${itemTotal}</td>
        </tr>
      `;
    });

    const bodyContent = `
      <h2 style="color:#1e1b4b; margin-top:0;">Thank You for Your Order, ${firstName}! 🙏</h2>
      <p>We are delighted to confirm that your order <strong>#L2L-${orderId}</strong> has been received and is being prepared with utmost care by our craftspeople.</p>
      
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin:20px 0;">
        <div style="font-size:13px; color:#64748b;">ORDER SUMMARY</div>
        <div style="font-size:18px; font-weight:800; color:#1e1b4b; margin:4px 0;">Order #L2L-${orderId}</div>
        <div style="font-size:13px; color:#475569;">Payment Method: <strong>${paymentMethod}</strong></div>
      </div>

      <table class="order-table">
        <thead>
          <tr>
            <th>Item Details</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="3" style="text-align:right; font-weight:700; padding-top:15px;">Grand Total:</td>
            <td style="text-align:right; font-weight:900; font-size:17px; color:#1e1b4b; padding-top:15px;">₹${totalAmount}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:20px; padding:15px; background:#f1f5f9; border-radius:8px;">
        <strong style="color:#1e1b4b; font-size:13px;">📍 Delivery Address:</strong>
        <p style="margin:4px 0 0 0; font-size:14px; color:#475569;">${shippingAddress}</p>
      </div>

      <div style="text-align:center; margin: 25px 0;">
        <a href="${WEBSITE_URL}/account?tab=orders&success_id=${orderId}" class="email-btn">Track Your Order &rarr;</a>
      </div>

      <p style="font-size:13px; color:#64748b; margin-top:20px;">
        You will receive another update as soon as your shipment is dispatched with your tracking link.<br>
        Thank you for choosing Indian craftsmanship and supporting family fashion!
      </p>
    `;

    const mailOptions = {
      from: `"${BRAND_NAME}" <${DEFAULT_SENDER_EMAIL}>`,
      to: toEmail,
      subject: `✅ Order Confirmed #L2L-${orderId} | Thank you from Little to Large`,
      html: wrapHtmlTemplate(`Order Confirmation #L2L-${orderId}`, bodyContent, `Your Little to Large order #L2L-${orderId} is confirmed. Total: ₹${totalAmount}`)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Order Confirmation Sent] Order #${orderId} To: ${toEmail} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Order Email Error] Order #${orderData.order_id}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 3. Send Login / Authentication OTP via Email
 */
async function sendEmailOtp(toEmail, otp, db = null) {
  try {
    if (!toEmail || !toEmail.includes('@')) throw new Error('Invalid recipient email address');

    const transporter = await getTransporter(db);

    const bodyContent = `
      <h2 style="color:#1e1b4b; margin-top:0;">Your Login Verification Code 🔒</h2>
      <p>We received a sign-in request for your <strong>${BRAND_NAME}</strong> account. Please use the 6-digit verification code below to securely authenticate your session:</p>
      
      <div class="otp-code">${otp}</div>

      <p style="text-align:center; color:#64748b; font-size:13px;">
        ⏱️ This verification code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.
      </p>

      <p style="font-size:13px; color:#94a3b8; margin-top:25px; border-top:1px solid #f1f5f9; padding-top:15px;">
        If you did not request this login code, you can safely ignore this email. Your account remains protected.
      </p>
    `;

    const mailOptions = {
      from: `"${BRAND_NAME}" <${DEFAULT_SENDER_EMAIL}>`,
      to: toEmail,
      subject: `🔑 ${otp} is your Little to Large verification code`,
      html: wrapHtmlTemplate(`Little to Large Login Code: ${otp}`, bodyContent, `Your Little to Large verification code is ${otp}. Valid for 10 minutes.`)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email OTP Sent] To: ${toEmail} | Code: ${otp} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email OTP Error] ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 4. Send 3-Day / Weekly Promotional Offers Campaign
 */
async function sendPromotionalOffersEmail(toEmail, customerName, offerData = {}, db = null) {
  try {
    if (!toEmail || !toEmail.includes('@') || toEmail.includes('guest_')) return;

    const transporter = await getTransporter(db);
    const firstName = (customerName || 'Valued Customer').split(' ')[0];

    const title = offerData.title || 'Weekend Family Special: Up to 30% Off!';
    const subtitle = offerData.subtitle || 'Handcrafted collections curated for every generation in your family.';
    const coupon = offerData.coupon_code || 'FAMILYFEST';
    const discountText = offerData.discount_text || 'Get Extra 15% OFF on Orders Above ₹1,499';

    const bodyContent = `
      <h2 style="color:#1e1b4b; margin-top:0;">${title} 🌟</h2>
      <p>Hello ${firstName}, we noticed you have an eye for fine fashion! Discover fresh additions to our family twinning and ethnic collections, handpicked for you:</p>
      
      <p style="color:#475569; font-size:15px;">${subtitle}</p>

      <div class="coupon-box">
        <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:#78350f; margin-bottom:4px;">Limited Time Offer Code</div>
        <div class="coupon-code">${coupon}</div>
        <div style="font-size:13px; color:#92400e; margin-top:4px;">${discountText}</div>
      </div>

      <div style="text-align:center; margin: 25px 0;">
        <a href="${WEBSITE_URL}/offers" class="email-btn">View Special Offers &rarr;</a>
      </div>

      <p style="font-size:12px; color:#94a3b8; text-align:center; margin-top:25px;">
        You received this email because you are a registered customer at Little to Large.
      </p>
    `;

    const mailOptions = {
      from: `"${BRAND_NAME}" <${DEFAULT_SENDER_EMAIL}>`,
      to: toEmail,
      subject: `✨ Special Offer for You, ${firstName}: ${title}`,
      html: wrapHtmlTemplate(title, bodyContent, `${title} - Exclusive deals for the Little to Large family!`)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Promotional Email Sent] To: ${toEmail} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Promotional Email Error] ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  getTransporter,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendEmailOtp,
  sendPromotionalOffersEmail,
  DEFAULT_SENDER_EMAIL
};
