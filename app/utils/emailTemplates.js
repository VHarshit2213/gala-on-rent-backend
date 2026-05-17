
function registrationEmailTemplate(name) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Welcome to Gala On Rent</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin:0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin: auto; background:#ffffff; border-radius: 10px; overflow:hidden; box-shadow:0px 4px 8px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr>
          <td style="background:#007BFF; padding:20px; text-align:center; color:white; font-size:22px; font-weight:bold;">
            Gala On Rent
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:30px; color:#333;">
            <h2 style="margin-top:0;">Welcome, ${name || "User"}!</h2>
            <p>
              Thank you for joining <strong>Gala On Rent</strong>, your trusted platform 
              to <b>rent</b> and <b>sell properties</b> with ease.
            </p>
            <p>
              You can now explore listings, connect with property owners, and manage your rentals hassle-free.
            </p>
            <p>
              If you have any questions, feel free to reach out to our support team.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f4f4f4; padding:15px; text-align:center; font-size:12px; color:#666;">
            © ${new Date().getFullYear()} Gala On Rent. All Rights Reserved. <br/>
            This is an automated message, please do not reply.
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

function sellerRegistrationEmailTemplate(name, uniqueCode) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Seller Registration Code - Gala On Rent</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin:0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin: auto; background:#ffffff; border-radius: 10px; overflow:hidden; box-shadow:0px 4px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:#007BFF; padding:20px; text-align:center; color:white; font-size:22px; font-weight:bold;">
            Gala On Rent
          </td>
        </tr>
        <tr>
          <td style="padding:30px; color:#333;">
            <h2 style="margin-top:0;">Welcome, ${name || "Seller"}!</h2>
            <p>
              Thank you for registering as a seller on <strong>Gala On Rent</strong>.
            </p>
            <p>Your seller code is:</p>
            <p style="font-size:26px; font-weight:bold; letter-spacing:2px; color:#007BFF; margin:20px 0;">
              ${uniqueCode}
            </p>
            <p>
              Please keep this code for future reference.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f4f4; padding:15px; text-align:center; font-size:12px; color:#666;">
            © ${new Date().getFullYear()} Gala On Rent. All Rights Reserved. <br/>
            This is an automated message, please do not reply.
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

module.exports = {
  registrationEmailTemplate,
  sellerRegistrationEmailTemplate,
};
