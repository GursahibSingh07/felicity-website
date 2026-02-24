const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE || "false") === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

const sendTicketEmail = async ({
  to,
  participantName,
  eventTitle,
  eventType,
  ticketId,
  eventDate,
  location,
  qrCode,
}) => {
  const mailer = getTransporter();
  if (!mailer) {
    throw new Error("SMTP is not configured. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.");
  }
  if (!to) {
    throw new Error("Recipient email is missing");
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const dateLabel = eventDate ? new Date(eventDate).toLocaleString() : "TBD";
  const safeName = participantName || "Participant";

  const attachments = [];
  let qrHtml = "";

  if (qrCode && qrCode.startsWith("data:image")) {
    const base64Data = qrCode.split(",")[1];
    const mimeType = qrCode.split(";")[0].split(":")[1] || "image/png";
    attachments.push({
      filename: "qr-ticket.png",
      content: Buffer.from(base64Data, "base64"),
      contentType: mimeType,
      cid: "qrticket",
    });
    qrHtml = `<div><p style="margin: 0 0 8px 0; color: #334155;"><strong>QR Ticket</strong></p><img src="cid:qrticket" alt="QR Ticket" style="width: 160px; height: 160px; border: 1px solid #e2e8f0; border-radius: 8px;" /></div>`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="margin: 0 0 12px 0; color: #1e293b;">Ticket Confirmation</h2>
      <p style="margin: 0 0 12px 0; color: #334155;">Hi ${safeName},</p>
      <p style="margin: 0 0 16px 0; color: #334155;">
        Your ${eventType === "merchandise" ? "purchase" : "registration"} is confirmed.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 6px 0; color: #475569;"><strong>Event</strong></td><td style="padding: 6px 0; color: #0f172a;">${eventTitle}</td></tr>
        <tr><td style="padding: 6px 0; color: #475569;"><strong>Type</strong></td><td style="padding: 6px 0; color: #0f172a;">${eventType}</td></tr>
        <tr><td style="padding: 6px 0; color: #475569;"><strong>Ticket ID</strong></td><td style="padding: 6px 0; color: #0f172a;">${ticketId}</td></tr>
        <tr><td style="padding: 6px 0; color: #475569;"><strong>Date</strong></td><td style="padding: 6px 0; color: #0f172a;">${dateLabel}</td></tr>
        <tr><td style="padding: 6px 0; color: #475569;"><strong>Location</strong></td><td style="padding: 6px 0; color: #0f172a;">${location || "TBD"}</td></tr>
      </table>
      ${qrHtml}
    </div>
  `;

  await mailer.sendMail({
    from,
    to,
    subject: `Ticket Confirmation - ${eventTitle}`,
    html,
    attachments,
  });

  return true;
};

module.exports = {
  sendTicketEmail,
};
