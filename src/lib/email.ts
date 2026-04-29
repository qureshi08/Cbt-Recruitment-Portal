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
        <h2 style="color: #009245;">Congratulations, ${candidateName}!</h2>
        <p>Your application for the CGAP program has been approved. The next step is a technical assessment.</p>
        <p>Please use the link below to select a convenient time slot for your assessment:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingLink}" style="background-color: #009245; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Schedule Assessment</a>
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
        <h2 style="color: #009245;">Good News, ${candidateName}!</h2>
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

export const sendTeamNotification = async (recipients: string[], subject: string, html: string) => {
  if (!recipients || recipients.length === 0) return null;

  const mailOptions = {
    from: `"CBT Recruitment" <${process.env.EMAIL_USER || 'muhammadanasq@gmail.com'}>`,
    to: recipients.join(','),
    subject: subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        ${html}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Convergent Business Technologies - Recruitment System</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const notifyRecruitmentTeam = async (teamEmails: string[], type: 'NEW_APPLICATION' | 'SLOT_BOOKED', data: any) => {
  const subject = type === 'NEW_APPLICATION'
    ? `New Application: ${data.name}`
    : `Assessment Scheduled: ${data.name}`;

  const content = type === 'NEW_APPLICATION'
    ? `
      <h2 style="color: #009245;">New Application Received</h2>
      <p><strong>Candidate:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Position:</strong> ${data.position}</p>
      <p>A new application has been submitted and is ready for initial screening.</p>
    `
    : `
      <h2 style="color: #009245;">Assessment Slot Booked</h2>
      <p><strong>Candidate:</strong> ${data.name}</p>
      <p><strong>Time:</strong> ${data.slotTime}</p>
      <p>The candidate has selected a slot for their technical assessment.</p>
    `;

  return sendTeamNotification(teamEmails, subject, content);
};

export const notifyInterviewers = async (interviewerEmails: string[], candidateName: string, candidateId: string) => {
  const subject = `Meeting Request: Interview with ${candidateName}`;
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const feedbackLink = `${origin}/admin/interviews`;

  const content = `
    <h2 style="color: #009245;">Assessment Completed</h2>
    <p><strong>Candidate:</strong> ${candidateName}</p>
    <p>The candidate has successfully completed their assessment and is now ready for the interview phase.</p>
    <p>Please coordinate a meeting time and provide your feedback in the recruitment portal.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${feedbackLink}" style="background-color: #009245; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Provide Feedback</a>
    </div>
  `;

  return sendTeamNotification(interviewerEmails, subject, content);
};
