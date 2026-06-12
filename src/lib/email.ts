import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

/**
 * Microsoft 365 SMTP transporter.
 * Requires the following environment variables:
 *   EMAIL_USER     – e.g. muhammad.anas.quershi@convergentbt.com
 *   EMAIL_PASSWORD – Microsoft account password (or app password if MFA is enabled)
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,          // STARTTLS – Office 365 upgrades the connection after EHLO
  pool: true,             // Enable connection pooling
  maxConnections: 3,      // Limit concurrent connections to avoid Office 365 throttling
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASSWORD!,
  },
  tls: {
    ciphers: 'SSLv3',     // Required by Office 365 in some environments
  },
});

function generateICS(title: string, start: Date, end: Date, location: string, description: string) {
  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  // Escape special characters for ICS
  const escape = (str: string) => (str || "").replace(/[\\,;]/g, (match) => `\\${match}`).replace(/\n/g, '\\n');

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CBT Recruitment//Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@cbt-portal.vercel.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${escape(title)}`,
    `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(description)}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

export const sendAssessmentEmail = async (candidateEmail: string, candidateName: string, bookingLink: string) => {
  const mailOptions = {
    from: `"CBT Recruitment" <${process.env.EMAIL_USER}>`,
    to: candidateEmail,
    subject: 'Action Required: Schedule Your CBT Assessment',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #009245;">Congratulations, ${candidateName}!</h2>
        <p>Your application for the CGAP program has been approved. The next step is a technical assessment.</p>
        <p>Please use the link below to select a convenient time slot for your assessment. You can also use this same link to reschedule your assessment if needed.</p>
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
    from: `"CBT Recruitment" <${process.env.EMAIL_USER}>`,
    to: candidateEmail,
    subject: 'Application Update - Convergent Graduate Academy Program',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 28px; border: 1px solid #eee; border-radius: 10px; line-height: 1.7;">
        <p>Hello!</p>
        <p>I hope this email finds you well.</p>
        <p>On behalf of Convergent Business Technologies, I am delighted to inform you that you have cleared the assessment for the <strong>Convergent Graduate Academy Program</strong>.</p>
        <p>However, due to the high volume of applications and limited number of seats, a merit list will be created to select the final candidates. As a next step, your application will be internally reviewed and you will be notified of your application status at least one week before the commencement of the next batch.</p>
        <p>Please feel free to reach out in case of any questions or concerns. We look forward to having you as a part of the CGAP.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 12px; color: #666;">Convergent Business Technologies - Recruitment Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendSelectedEmail = async (candidateEmail: string, candidateName: string) => {
  // Tech Destination Skills URL (PSEB's apprenticeship portal). Allow override via env.
  const techDestinationUrl = process.env.PSEB_TECH_DESTINATION_URL || 'https://skills.techdestination.com/';

  // Try to attach the signed-undertaking PDF if it exists on disk. Lives under
  // public/onboarding/ so the public root stays clean and HR can swap the file
  // without a code change. If the file is missing, the email still sends — the
  // text still mentions the attachment but you'll need to attach manually for
  // that send.
  const attachments: { filename: string; content: Buffer }[] = [];
  try {
    const undertakingPath = path.join(process.cwd(), 'public', 'onboarding', 'cgap-undertaking.pdf');
    if (fs.existsSync(undertakingPath)) {
      attachments.push({
        filename: 'CGAP-Undertaking.pdf',
        content: fs.readFileSync(undertakingPath),
      });
    } else {
      console.warn('[sendSelectedEmail] cgap-undertaking.pdf not found at public/onboarding/ — sending without attachment.');
    }
  } catch (e) {
    console.error('[sendSelectedEmail] Failed to load undertaking attachment:', e);
  }

  const mailOptions = {
    from: `"CBT Recruitment" <${process.env.EMAIL_USER}>`,
    to: candidateEmail,
    subject: 'Application Update - Welcome to CGAP!',
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: auto; padding: 28px; border: 1px solid #eee; border-radius: 10px; line-height: 1.7; color: #1f2937;">
        <p>Dear ${candidateName},</p>

        <p>On behalf of Convergent Business Technologies, we are delighted to inform you that you have been <strong>selected</strong> for the <strong>Convergent Graduate Academy Program (CGAP)</strong>. Congratulations on your selection.</p>

        <p>The CGAP will commence with an orientation session. Details regarding the orientation will be shared with you separately via email. Please note that you will be required to bring your <strong>original CNIC</strong> with you on the day of the orientation session for verification purposes.</p>

        <p>To complete your enrolment process, please follow the steps below to create your profile on the PSEB portal, as this cohort is funded by the <strong>Pakistan Software Export Board (PSEB)</strong>:</p>

        <ol style="padding-left: 22px; margin: 12px 0;">
          <li>Visit <a href="${techDestinationUrl}" style="color: #009245; font-weight: bold;">Tech Destination Skills</a></li>
          <li>Click on <strong>"Register Now"</strong> for Internships/Apprenticeships Program</li>
          <li>Create your account and complete your profile</li>
          <li>Click on <strong>"Apply for Apprenticeship"</strong></li>
          <li>Complete <strong>Step 1 and 2</strong></li>
          <li>Click on <strong>"Confirm &amp; submit"</strong></li>
        </ol>

        <p>Kindly note that, as part of the onboarding process, we require the following documents in soft copy. Please <strong>reply to this email</strong> with:</p>

        <ul style="padding-left: 22px; margin: 12px 0;">
          <li>Your degree's final transcript</li>
          <li>Screenshot of your PSEB profile</li>
          <li>Confirmation email of your PSEB account creation</li>
          <li>Signed undertaking (attached)</li>
        </ul>

        <p>Please ensure that all required documents are submitted in your reply at your earliest convenience.</p>

        <p>Should you have any questions or require any assistance, feel free to reach out.</p>

        <p>We look forward to welcoming you to the CGAP.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 12px; color: #666;">Convergent Business Technologies &mdash; Recruitment Team</p>
      </div>
    `,
    attachments,
  };

  return transporter.sendMail(mailOptions);
};

export const sendNotRecommendedEmail = async (candidateEmail: string, candidateName: string) => {
  const mailOptions = {
    from: `"CBT Recruitment" <${process.env.EMAIL_USER}>`,
    to: candidateEmail,
    subject: 'Update Regarding Your Application - Convergent Graduate Academy Program',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 28px; border: 1px solid #eee; border-radius: 10px; line-height: 1.7; color: #333;">
        <p>Hello ${candidateName},</p>
        <p>I am writing to you as a follow-up to your application for the <strong>Convergent Graduate Academy Program</strong>.</p>
        <p>Thank you for your interest in our program and for taking the time to apply. After careful review of your application, we regret to inform you that you have not been shortlisted to proceed further in the recruitment process.</p>
        <p>However, we strongly encourage you to apply again after six (06) months.</p>
        <p>We appreciate your interest in Convergent and wish you the very best in your future endeavors.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 12px; color: #666;">Convergent Business Technologies - Recruitment Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendTeamNotification = async (recipients: string[], subject: string, html: string) => {
  if (!recipients || recipients.length === 0) return null;

  const results = [];

  for (const email of recipients) {
    const mailOptions = {
      from: `"CBT Recruitment" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          ${html}
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Convergent Business Technologies - Recruitment System</p>
        </div>
      `,
    };
    results.push(transporter.sendMail(mailOptions));
  }

  return Promise.all(results);
};


export const notifyRole = async (emails: string[], subject: string, title: string, body: string, attachments?: any[]) => {
  if (!emails || emails.length === 0) return null;

  const results = [];

  for (const email of emails) {
    const personalizedBody = body.replace(/\[INTERVIEWER_EMAIL\]/g, encodeURIComponent(email));

    const mailOptions: any = {
      from: `"CBT Recruitment" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #009245; margin-bottom: 20px;">${title}</h2>
          <div style="color: #333; line-height: 1.6;">
            ${personalizedBody}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 11px; color: #888;">Automated System Notification from CBT Recruitment Portal</p>
        </div>
      `,
      attachments: attachments || []
    };

    try {
      console.log(`[SMTP] Sending email to ${email}`);
      const info = await transporter.sendMail(mailOptions);
      results.push(info);
    } catch (err) {
      console.error(`[SMTP ERROR] Failed to send email to ${email}:`, err);
    }
  }

  return results;
};

import { supabaseAdmin } from './supabase-admin';

// Helper to queue a notification in the database
async function queueNotification(category: string, eventType: string, details: any) {
  try {
    const { error } = await supabaseAdmin
      .from('notification_queue')
      .insert({
        category,
        event_type: eventType,
        details
      });
    if (error) throw error;
    console.log(`[Notification Queued] Stage: ${eventType} for Role: ${category}`);
  } catch (e) {
    console.error("Failed to queue notification:", e);
  }
}

export const notifyWorkflowStage = async (stage: string, emails: string[], data: any) => {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://cbt-recruitment-portal.vercel.app';

  // Queue administrative notifications instead of sending immediately
  const queuedStages: Record<string, string[]> = {
    'NEW_APPLICATION': ['recruitment_team', 'approver'],
    'APPROVED_PENDING_SLOTS': ['recruitment_team'],
    'INVITE_SENT': ['recruitment_team'],
    'SLOT_BOOKED_INTERNAL': ['recruitment_team'],
    'DECISION': ['recruitment_team'],
  };

  if (stage in queuedStages) {
    const roles = queuedStages[stage];
    for (const role of roles) {
      await queueNotification(role, stage, data);
    }
    // Return a resolved result matching signature expectations
    return [{ accepted: true }];
  }

  let subject = '';
  let title = '';
  let body = '';
  let attachments: any[] = [];

  switch (stage) {
    case 'NEW_APPLICATION':
      subject = `[New Application] ${data.name}`;
      title = 'New Applicant Intake';
      body = `
        <p>A new application has been submitted for the <strong>${data.position}</strong> program.</p>
        <p><strong>Candidate:</strong> ${data.name}<br><strong>Email:</strong> ${data.email}</p>
        <p>Please log in to the dashboard to review the candidate's profile and AI screening score.</p>
      `;
      break;

    case 'APPLICATION_RECEIVED_CANDIDATE':
      subject = `Application Received: Convergent Graduate Academy Program`;
      title = 'Thank You for Applying!';
      body = `
        <p>Hello ${data.name},</p>
        <p>Thank you for applying to the <strong>Convergent Graduate Academy Program (CGAP)</strong>. We have successfully received your application for the <strong>${data.position}</strong> position.</p>
        <p>Our team is currently reviewing your profile and resume. We prioritize quality and technical excellence, so we appreciate your patience during this evaluation phase.</p>
        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>If your profile matches our criteria, you will receive an email to schedule a technical assessment.</li>
          <li>In the meantime, feel free to explore our website to learn more about our culture and projects.</li>
        </ul>
        <p>We look forward to potentially having you join our team!</p>
      `;
      break;

    case 'APPROVED_PENDING_SLOTS':
      subject = `[Action Required] ${data.name} Approved — Slots Needed`;
      title = 'Candidate Approved: Slots Required';
      body = `
        <p><strong>${data.name}</strong> has been approved by the panel and is awaiting an assessment slot.</p>
        <p>Please log in to the dashboard, create the required assessment slots, and then send the booking invite to the candidate.</p>
        <div style="margin: 25px 0;">
          <a href="${origin}/admin/slots" style="background-color: #009245; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Manage Slots</a>
        </div>
        <p style="font-size: 12px; color: #888;">No email has been sent to the candidate yet. You control when they are notified.</p>
      `;
      break;

    case 'INVITE_SENT':
      subject = `[Invite Dispatched] ${data.name}`;
      title = 'Assessment Invite Sent to Candidate';
      body = `
        <p>The assessment booking invite has been sent to <strong>${data.name}</strong> by <strong>${data.sentBy}</strong>.</p>
        <p>The candidate can now select an available assessment slot using their personal booking link.</p>
        <div style="margin: 20px 0;">
          <a href="${origin}/admin/applications" style="color: #009245; font-weight: bold;">View Application Pipeline</a>
        </div>
      `;
      break;

    case 'SLOT_BOOKED_INTERNAL':
      subject = `[Slot Booked] ${data.name} scheduled assessment`;
      title = 'Assessment Scheduled';
      body = `
        <p>A candidate has selected a slot for their technical assessment.</p>
        <p><strong>Candidate:</strong> ${data.name}<br><strong>Time:</strong> ${data.slotTime}</p>
        <div style="margin-top: 20px;">
          <a href="${origin}/admin/applications" style="color: #009245; font-weight: bold;">View Application Pipeline</a>
        </div>
      `;
      break;

    case 'CANDIDATE_ASSESSMENT_CONFIRMED':
      subject = `[Confirmed] Assessment Scheduled: ${data.name}`;
      title = 'Assessment Details & Instructions';
      body = `
        <p>Hello!</p>
        <p>I am writing to you as a follow-up to your application to the <strong>Convergent Graduate Academy Program</strong>.</p>
        <p>It is to inform you that you have been short-listed for the initial assessment.</p>
        <div style="background-color: #f8fafc; border: 1px solid #009245; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Assessment Date/Time:</strong> ${data.slotTime}</p>
          <p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b;">(Followed by an interview after 1:00 PM if the threshold score is achieved)</p>
        </div>
        
        <p>The Assessment Test will be computer-based and consist of multiple-choice questions covering the following topics:</p>
        <ul>
          <li>Reading Comprehension</li>
          <li>Analytical Thinking</li>
          <li>Data Structures</li>
          <li>SQL</li>
          <li>Python Programming</li>
        </ul>

        <h4 style="color: #009245; margin-top: 25px;">Please take note of the following instructions:</h4>
        <ul style="line-height: 1.6;">
          <li>Please make sure to bring your <strong>CNIC</strong></li>
          <li>During the assessment, make sure to <strong>turn off your mobile device</strong>. Using any such device during the assessment will result in immediate disqualification</li>
          <li>Revise the core concepts thoroughly prior to the assessment</li>
          <li>Read through all instructions before attempting the test</li>
          <li>Focus on addressing each question individually</li>
        </ul>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p><strong>Address:</strong><br>
          Convergent Business Technologies<br>
          Fourth floor, Plot. No. 64, Civic Center, Executive Block<br>
          Gulberg Greens, Islamabad</p>
          <a href="https://goo.gl/maps/MxcbdEmMPqopr6UVA" style="color: #009245; font-weight: bold; text-decoration: none;">View on Google Maps &rarr;</a>
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
          Note: When you reach the premises, please feel free to inform the guard of your arrival, or you can contact us on one of the following numbers:<br>
          <strong>Office Admin:</strong> +92 342 937 0603<br>
          <strong>Landline:</strong> (051) 591 2926
        </p>

        <p>Thank you for your attention to these details, and we look forward to your participation.</p>
      `;
      break;

    case 'ASSESSMENT_RESCHEDULED':
      subject = `[Action Required] Your CBT Assessment slot has been cancelled — please re-book`;
      title = 'Assessment Slot Cancelled';
      body = `
        <p>Hello <strong>${data.name}</strong>,</p>
        <p>This email is to confirm that your previously scheduled CBT Convergent Graduate Academy Program assessment slot${data.priorSlotTime ? ` (<strong>${data.priorSlotTime}</strong>)` : ''} has been <strong>cancelled</strong> following a reschedule request.</p>
        <p style="font-weight: bold; color: #b45309;">You are not currently booked into any assessment slot.</p>
        <p>Please use the link below to select a new convenient time for your assessment as soon as possible:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.bookingLink}" style="background-color: #009245; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Choose a New Slot</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">If this reschedule request was made by mistake, you can still re-book the original time (if it is still available) using the same link above.</p>
        <p>If you have any questions, simply reply to this email.</p>
      `;
      break;

    case 'INTERVIEW_L1':
      subject = `[L1 Request] Interview with ${data.name}`;
      title = 'Meeting Request: L1 Interview';
      body = `
        <p>Candidate <strong>${data.name}</strong> has completed their technical assessment.</p>
        <p>They are now ready for the <strong>L1 Interview</strong> phase.</p>
        <p>Please confirm your availability below:</p>
        <div style="margin: 25px 0; display: flex; gap: 10px;">
          <a href="${origin}/respond?id=${data.candidateId}&email=[INTERVIEWER_EMAIL]&available=true" style="background-color: #009245; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Available</a>
          <a href="${origin}/respond?id=${data.candidateId}&email=[INTERVIEWER_EMAIL]&available=false" style="background-color: #eee; color: #333; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Not Available</a>
        </div>
        <p style="font-size: 12px; color: #666;">Note: After clicking, you will be able to suggest a preferred time.</p>
      `;
      break;

    case 'INTERVIEW_L2':
      subject = `[L2 Request] Interview with ${data.name}`;
      title = 'Meeting Request: L2 Interview';
      body = `
        <p>L2 Interview has been requested for candidate <strong>${data.name}</strong>.</p>
        <p>Please confirm your availability for this session:</p>
        <div style="margin: 25px 0;">
          <a href="${origin}/respond?id=${data.candidateId}&email=[INTERVIEWER_EMAIL]&available=true" style="background-color: #009245; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Available</a>
          <a href="${origin}/respond?id=${data.candidateId}&email=[INTERVIEWER_EMAIL]&available=false" style="background-color: #eee; color: #333; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Not Available</a>
        </div>
      `;
      break;

    case 'AVAILABILITY_RESPONSE':
      subject = `[Response] ${data.candidateName} - ${data.isAvailable ? 'Available' : 'Unavailable'}`;
      title = 'Interviewer Availability Update';
      body = `
        <p>An interviewer has responded to the broadcast for <strong>${data.candidateName}</strong>.</p>
        <p><strong>Interviewer:</strong> ${data.interviewerName || data.interviewerEmail}</p>
        ${data.interviewerName ? `<p><strong>Email:</strong> ${data.interviewerEmail}</p>` : ''}
        <p><strong>Status:</strong> ${data.isAvailable ? '<span style="color: #009245; font-weight: bold;">Available</span>' : '<span style="color: #ef4444; font-weight: bold;">Unavailable</span>'}</p>
        ${data.isAvailable && data.preferredTime ? `<p><strong>Suggested Time:</strong> ${data.preferredTime}</p>` : ''}
        <div style="margin-top: 25px;">
          <a href="${origin}/admin/interviews" style="color: #009245; font-weight: bold;">View Candidate Schedule</a>
        </div>
      `;
      break;

    case 'DECISION':
      subject = `[Final Decision] ${data.name}`;
      title = 'Interview Outcome Reached';
      body = `
        <p>A final decision has been recorded for <strong>${data.name}</strong>.</p>
        <p><strong>Status:</strong> ${data.status}<br><strong>Decision by:</strong> ${data.interviewer}</p>
        <p>The recruitment team can now proceed with onboarding or closing the file.</p>
      `;
      break;

    case 'INTERVIEW_CONFIRMED':
      const startTime = data.startTime || data.scheduledAt;
      const start = new Date(startTime);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      // Generate a Google Calendar Link as a fallback
      const gStart = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const gEnd = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`CBT Interview: ${data.candidateName}`)}&dates=${gStart}/${gEnd}&details=${encodeURIComponent(`Meeting Link: ${data.meetingLink}`)}&location=${encodeURIComponent(data.meetingLink)}`;

      // Generate an Outlook Web Link as a fallback
      const outlookUrl = `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(`CBT Interview: ${data.candidateName}`)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${encodeURIComponent(`Meeting Link: ${data.meetingLink}`)}&location=${encodeURIComponent(data.meetingLink)}`;

      const isL2Round = data.round === 'L2';
      const isInterviewerEmail = data.audience === 'interviewer';

      // Shared meeting card used by both audiences.
      const meetingCard = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Scheduled Time:</strong> ${data.scheduledAt}</p>
          <p style="margin: 0 0 10px 0;"><strong>Location:</strong> Microsoft Teams Meeting${isL2Round && !isInterviewerEmail ? ' (or in-person — see below)' : ''}</p>
          ${data.interviewerName ? `<p style="margin: 0 0 15px 0;"><strong>Interviewer:</strong> ${data.interviewerName}</p>` : ''}
          <div style="text-align: center; margin-bottom: 15px;">
            <a href="${data.meetingLink}" style="background-color: #009245; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Join Teams Meeting</a>
          </div>
          <div style="text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;">
             <p style="font-size: 11px; color: #64748b; margin-bottom: 10px;">Add to calendar:</p>
             <div style="display: flex; justify-content: center; gap: 10px;">
                <a href="${outlookUrl}" target="_blank" style="color: #0078d4; font-size: 11px; font-weight: bold; text-decoration: none; border: 1px solid #0078d4; padding: 6px 12px; border-radius: 4px; display: inline-block;">+ Outlook / Teams</a>
                <a href="${googleUrl}" target="_blank" style="color: #009245; font-size: 11px; font-weight: bold; text-decoration: none; border: 1px solid #009245; padding: 6px 12px; border-radius: 4px; display: inline-block;">+ Google Calendar</a>
             </div>
          </div>
        </div>
      `;

      if (isInterviewerEmail) {
        // Interviewer-facing email — neutral briefing, no candidate-targeted copy.
        subject = isL2Round
          ? `[L2 Scheduled] Final round interview with ${data.candidateName}`
          : `[Scheduled] Interview with ${data.candidateName}`;
        title = isL2Round ? 'L2 Interview Scheduled' : 'Interview Scheduled';
        body = `
          <p>Hello${data.interviewerName ? ` <strong>${data.interviewerName}</strong>` : ''},</p>
          <p>You have been confirmed to conduct ${isL2Round ? 'the <strong>final round (L2)</strong> interview' : 'the interview'} for candidate <strong>${data.candidateName}</strong> at the time you indicated as available.</p>
          ${meetingCard}
          ${isL2Round ? `<p style="font-size: 13px; color: #64748b;">The candidate has also been notified that they may attend either online via the Teams link above, or in person at the office.</p>` : `<p style="font-size: 13px; color: #64748b;">The candidate has also been emailed this meeting link separately.</p>`}
          <p style="font-size: 11px; color: #009245; font-weight: bold;">A calendar invite file (.ics) is attached for Desktop users.</p>
        `;
      } else {
        // Candidate-facing email.
        subject = isL2Round
          ? `[Confirmed] Final Round Interview Scheduled: ${data.candidateName}`
          : `[Confirmed] Interview Scheduled: ${data.candidateName}`;
        title = isL2Round ? 'Final Round Interview Invitation' : 'Interview Invitation & Meeting Link';

        const intro = isL2Round
          ? `
            <p>Hello <strong>${data.candidateName}</strong>,</p>
            <p>Congratulations! Based on your successful completion of the technical assessment and your Round 1 interview, you have been advanced to the <strong>final round</strong> of our interview process for the Convergent Graduate Academy Program.</p>
            <p>The details for your final-round interview are below.</p>
          `
          : `<p>This is a formal confirmation that the interview for <strong>${data.candidateName}</strong> has been scheduled.</p>`;

        const attendanceNote = isL2Round
          ? `
            <div style="background-color: #fefce8; border: 1px solid #facc15; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Attendance — your choice:</strong></p>
              <p style="margin: 0; font-size: 13px; line-height: 1.6;">You may join this final-round interview <strong>online</strong> via the Microsoft Teams link above, or attend <strong>in person at our office premises</strong>. Either option works — pick whichever is more convenient for you.</p>
            </div>
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee;">
              <p style="margin: 0 0 6px 0;"><strong>Office Address:</strong></p>
              <p style="margin: 0; font-size: 13px; line-height: 1.6;">
                Convergent Business Technologies<br>
                Fourth floor, Plot. No. 64, Civic Center, Executive Block<br>
                Gulberg Greens, Islamabad
              </p>
              <a href="https://goo.gl/maps/MxcbdEmMPqopr6UVA" style="color: #009245; font-weight: bold; text-decoration: none; font-size: 13px;">View on Google Maps &rarr;</a>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
              If you choose to come on-premises, please inform the guard of your arrival on reaching the building, or contact us on:<br>
              <strong>Office Admin:</strong> +92 342 937 0603<br>
              <strong>Landline:</strong> (051) 591 2926
            </p>
          `
          : '';

        body = `
          ${intro}
          ${meetingCard}
          ${attendanceNote}
          <p><strong>Participants:</strong> Candidate, Interviewer, and Recruitment Team.</p>
          <p style="font-size: 13px; color: #64748b;">Please ensure you have a stable internet connection and your camera/microphone are working correctly${isL2Round ? ' if joining online' : ''}.</p>
          <p style="font-size: 11px; color: #009245; font-weight: bold;">Note: A calendar invite file (.ics) is also attached to this email for Desktop users.</p>
        `;
      }

      try {
        const icsContent = generateICS(
          `CBT Interview: ${data.candidateName}`,
          start,
          end,
          data.meetingLink,
          `Interview scheduled via CBT Recruitment Portal.\nMeeting Link: ${data.meetingLink}`
        );
        attachments.push({
          filename: 'invite.ics',
          content: icsContent,
          contentType: 'application/ics',
          method: 'REQUEST'
        });
      } catch (e) {
        console.error("Failed to generate ICS attachment:", e);
      }
      break;
  }

  return notifyRole(emails, subject, title, body, attachments);
};
