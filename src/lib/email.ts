import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'muhammadanasq@gmail.com',
    // Force the new working password to bypass stale Vercel env variables
    pass: 'rshr fqyi nszd vzus',
  },
});

export const sendAssessmentEmail = async (candidateEmail: string, candidateName: string, bookingLink: string) => {
  const mailOptions = {
    from: `"CBT Recruitment" <${process.env.EMAIL_USER || 'muhammadanasq@gmail.com'}>`,
    to: candidateEmail,
    subject: 'Action Required: Schedule Your CBT Assessment',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Congratulations, ${candidateName}!</h2>
        <p>Your application for the CGAP program has been approved. The next step is a technical assessment.</p>
        <p>Please use the link below to select a convenient time slot for your assessment:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Schedule Assessment</a>
        </div>
        <p>If you have any questions, feel free to reply to this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Convergent Business Technologies - Recruitment Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendRecommendedEmail = async (candidateEmail: string, candidateName: string) => {
  const mailOptions = {
    from: `"CBT Recruitment" <${process.env.EMAIL_USER || 'muhammadanasq@gmail.com'}>`,
    to: candidateEmail,
    subject: 'Great News from CBT Recruitment',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #059669;">Good News, ${candidateName}!</h2>
        <p>We are pleased to inform you that the interview panel has recommended you for the next phase of the CGAP program.</p>
        <p>Our team will reach out to you shortly with more details regarding the final onboarding process.</p>
        <p>Congratulations once again!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Convergent Business Technologies - Recruitment Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendNotRecommendedEmail = async (candidateEmail: string, candidateName: string) => {
  const mailOptions = {
    from: `"CBT Recruitment" <${process.env.EMAIL_USER || 'muhammadanasq@gmail.com'}>`,
    to: candidateEmail,
    subject: 'Update Regarding Your Application - CBT',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2>Update on your application, ${candidateName}</h2>
        <p>Thank you for giving us the opportunity to consider you for the CGAP program.</p>
        <p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
        <p>We appreciate your interest in CBT and wish you all the best in your future endeavors.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Convergent Business Technologies - Recruitment Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
