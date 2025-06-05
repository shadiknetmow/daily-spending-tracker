
import { BN_UI_TEXT } from '../constants';
import { sendBackendEmailRequest } from '../apiService'; // Import the request function

export const sendWelcomeEmail = async (to_email: string, to_name: string): Promise<void> => {
  const subject = BN_UI_TEXT.WELCOME_EMAIL_SUBJECT;
  const appTitle = BN_UI_TEXT.APP_TITLE;
  // Basic HTML email template
  const message = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>প্রিয় ${to_name},</p>
        <p>আমাদের '${appTitle}' অ্যাপ্লিকেশনে আপনাকে স্বাগতম!</p>
        <p>আপনার দৈনন্দিন আয় এবং ব্যয়ের হিসাব সহজে ট্র্যাক করতে এই অ্যাপ্লিকেশনটি ব্যবহার করুন। AI দ্বারা চালিত আর্থিক পরামর্শও এখানে পাবেন।</p>
        <p>ধন্যবাদ!</p>
        <p>শুভেচ্ছান্তে,<br/><strong>${appTitle} টিম</strong></p>
      </body>
    </html>`;
  
  const headers = `From: "${appTitle}" <no-reply@medha4u.com>\r\nContent-Type: text/html; charset=UTF-8\r\nMIME-Version: 1.0`;

  try {
    // console.log(`Attempting to send welcome email to ${to_email} via backend...`); // Removed
    const response = await sendBackendEmailRequest({ 
      method: 'sendEmail',
      table: 'system_email_action', 
      to: to_email,
      subject: subject,
      message: message,
      headers: headers,
    });

    if (response.success) {
      // console.log(`Backend reported email sent successfully to ${to_email}:`, response.message); // Removed
    } else {
      // console.error(`Backend reported failure to send email to ${to_email}:`, response.error || response.message); // Retained critical for service
    }
  } catch (error: any) {
    // console.error('Failed to send welcome email via backend:', error.message); // Retained critical for service
  }
};

export const sendPasswordChangedEmail = async (to_email: string, user_name?: string): Promise<void> => {
  const subject = BN_UI_TEXT.PASSWORD_CHANGED_EMAIL_SUBJECT;
  const appTitle = BN_UI_TEXT.APP_TITLE;
  const greetingName = user_name || "ব্যবহারকারী"; 

  const messageHtml = BN_UI_TEXT.PASSWORD_CHANGED_EMAIL_MESSAGE_HTML
    .replace(/{USER_NAME}/g, greetingName)
    .replace(/{APP_TITLE}/g, appTitle);

  const headers = `From: "${appTitle}" <no-reply@medha4u.com>\r\nContent-Type: text/html; charset=UTF-8\r\nMIME-Version: 1.0`;

  try {
    // console.log(`Attempting to send password changed confirmation email to ${to_email} via backend...`); // Removed
    const response = await sendBackendEmailRequest({
      method: "sendEmail",
      to: to_email,
      subject: subject,
      message: messageHtml,
      headers: headers,
    });

    if (response.success) {
      // console.log(`Password changed confirmation email sent successfully to ${to_email}:`, response.message); // Removed
    } else {
      // console.warn(`Backend reported failure to send password changed email to ${to_email}:`, response.error || response.message); // Retained
    }
  } catch (error: any) {
    // console.error('Error sending password changed confirmation email via backend:', error.message); // Retained
  }
};
