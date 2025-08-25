const nodemailer = require('nodemailer');

// Create transporter from environment variables
function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[email] SMTP configuration missing, email notifications disabled');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Send song completion email
async function sendSongCompletionEmail(record) {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('[email] Skipping email notification - no SMTP configured');
      return;
    }

    if (!record.email) {
      console.log('[email] No email address for record', record.id);
      return;
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: record.email,
      subject: '🎵 Your Song is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">🎵 Your Song is Ready!</h2>
          <p>Hello ${record.name || 'there'},</p>
          <p>Great news! Your song request has been completed and is ready for you.</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Song Details:</h3>
            <p><strong>Style:</strong> ${record.songStyle || 'N/A'}</p>
            <p><strong>Mood:</strong> ${record.mood || 'N/A'}</p>
            <p><strong>Occasion:</strong> ${record.specialOccasion || 'N/A'}</p>
            <p><strong>Request ID:</strong> ${record.id}</p>
          </div>
          
          <p>You can now:</p>
          <ul>
            <li>Listen to your song on the status page</li>
            <li>Download the audio file</li>
            <li>Share it with friends and family</li>
          </ul>
          
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000'}/song-status/${record.id}" 
               style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              🎵 Listen to Your Song
            </a>
          </p>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Thank you for using our AI song generation service!
          </p>
        </div>
      `,
      text: `
        Your Song is Ready!
        
        Hello ${record.name || 'there'},
        
        Great news! Your song request has been completed and is ready for you.
        
        Song Details:
        - Style: ${record.songStyle || 'N/A'}
        - Mood: ${record.mood || 'N/A'}
        - Occasion: ${record.specialOccasion || 'N/A'}
        - Request ID: ${record.id}
        
        Listen to your song: ${process.env.FRONTEND_URL || process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000'}/song-status/${record.id}
        
        Thank you for using our AI song generation service!
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[email] Song completion email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('[email] Failed to send song completion email:', error.message);
    // Don't throw - email failure shouldn't break the callback
    return null;
  }
}

module.exports = {
  sendSongCompletionEmail
};
