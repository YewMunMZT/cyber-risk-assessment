import nodemailer from 'nodemailer'
import { format } from 'date-fns'

export interface EmailReportData {
  companyName: string
  contactPersonName: string
  contactEmail: string
  website?: string | null
  estimatedEndpoints: number
  overallRiskScore: number
  overallRiskLevel: string
  peopleRawScore: number
  processRawScore: number
  technologyRawScore: number
  peopleWeightedScore: number
  processWeightedScore: number
  technologyWeightedScore: number
  recommendationTitle: string
  recommendationText: string
  submittedAt: Date
  reportReferenceNo: string
}

function getRiskColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'low':
      return '#16a34a'
    case 'moderate':
      return '#d97706'
    case 'high':
      return '#ea580c'
    case 'critical':
      return '#dc2626'
    default:
      return '#6b7280'
  }
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function buildHtml(data: EmailReportData): string {
  const riskColor = getRiskColor(data.overallRiskLevel)
  const dateStr = format(new Date(data.submittedAt), 'dd MMM yyyy, HH:mm')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Cyber Risk Assessment Report</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">

  <!-- Header -->
  <tr>
    <td style="background:#1e1b4b;padding:36px 40px;text-align:center;">
      <div style="font-size:13px;color:#a5b4fc;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Confidential Assessment Report</div>
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">Cyber Risk Assessment</h1>
      <div style="color:#c7d2fe;margin-top:10px;font-size:14px;">Reference No: <strong>${data.reportReferenceNo}</strong></div>
    </td>
  </tr>

  <!-- Risk Score Banner -->
  <tr>
    <td style="background:${riskColor};padding:28px 40px;text-align:center;">
      <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Overall Risk Score</div>
      <div style="color:#fff;font-size:52px;font-weight:700;line-height:1;">${data.overallRiskScore}</div>
      <div style="color:#fff;font-size:22px;font-weight:600;margin-top:6px;">${data.overallRiskLevel} Risk</div>
    </td>
  </tr>

  <!-- Company Info -->
  <tr>
    <td style="padding:32px 40px 0;">
      <h2 style="color:#1e1b4b;font-size:16px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Company Information</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:180px;">Company Name</td><td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">${data.companyName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Contact Person</td><td style="padding:6px 0;color:#111827;font-size:13px;">${data.contactPersonName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Email Address</td><td style="padding:6px 0;color:#111827;font-size:13px;">${data.contactEmail}</td></tr>
        ${data.website ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Website</td><td style="padding:6px 0;color:#111827;font-size:13px;">${data.website}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Est. Endpoints</td><td style="padding:6px 0;color:#111827;font-size:13px;">${data.estimatedEndpoints}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Submitted On</td><td style="padding:6px 0;color:#111827;font-size:13px;">${dateStr}</td></tr>
      </table>
    </td>
  </tr>

  <!-- Score Breakdown -->
  <tr>
    <td style="padding:28px 40px 0;">
      <h2 style="color:#1e1b4b;font-size:16px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Risk Score Breakdown</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tr style="background:#f9fafb;">
          <td style="padding:10px 14px;font-weight:700;font-size:12px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Category</td>
          <td style="padding:10px 14px;font-weight:700;font-size:12px;color:#374151;text-align:center;">Raw Score</td>
          <td style="padding:10px 14px;font-weight:700;font-size:12px;color:#374151;text-align:center;">Weight</td>
          <td style="padding:10px 14px;font-weight:700;font-size:12px;color:#374151;text-align:center;">Weighted Score</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:10px 14px;font-size:13px;">People</td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;">${data.peopleRawScore}</td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;color:#6b7280;">20%</td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;font-weight:600;">${data.peopleWeightedScore}</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;background:#fafafa;">
          <td style="padding:10px 14px;font-size:13px;">Process</td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;">${data.processRawScore}</td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;color:#6b7280;">40%</td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;font-weight:600;">${data.processWeightedScore}</td>
        </tr>
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:10px 14px;font-size:13px;">Technology</td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;">${data.technologyRawScore}</td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;color:#6b7280;">40%</td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;font-weight:600;">${data.technologyWeightedScore}</td>
        </tr>
        <tr style="background:#1e1b4b;border-top:2px solid #312e81;">
          <td style="padding:12px 14px;font-size:14px;font-weight:700;color:#fff;" colspan="3">Overall Risk Score</td>
          <td style="padding:12px 14px;font-size:18px;font-weight:700;color:#fff;text-align:center;">${data.overallRiskScore}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Recommendation -->
  <tr>
    <td style="padding:28px 40px 0;">
      <h2 style="color:#1e1b4b;font-size:16px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Recommendation</h2>
      <div style="background:${riskColor}18;border-left:4px solid ${riskColor};border-radius:0 8px 8px 0;padding:18px 20px;">
        <div style="color:${riskColor};font-size:15px;font-weight:700;margin-bottom:10px;">${data.recommendationTitle}</div>
        <div style="color:#374151;font-size:13px;line-height:1.7;">${data.recommendationText}</div>
      </div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:28px 40px;text-align:center;border-top:1px solid #e5e7eb;margin-top:28px;">
      <div style="color:#9ca3af;font-size:11px;line-height:1.6;">
        This report was automatically generated by the Cyber Risk Assessment System.<br/>
        Report Reference: ${data.reportReferenceNo} &nbsp;|&nbsp; Generated: ${dateStr}
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

export async function sendReportEmails(data: EmailReportData): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP credentials not configured — skipping email.')
    return
  }

  const transporter = createTransporter()
  const subject = `Cyber Risk Assessment Report — ${data.companyName} — ${data.reportReferenceNo}`
  const html = buildHtml(data)

  const tasks: Promise<unknown>[] = []

  tasks.push(
    transporter
      .sendMail({
        from: process.env.SMTP_FROM || 'Cyber Risk Assessment <noreply@example.com>',
        to: data.contactEmail,
        subject,
        html,
      })
      .then(() => console.log(`[Email] Report sent to ${data.contactEmail}`))
      .catch((err) => console.error('[Email] Failed to send user email:', err))
  )

  if (process.env.ADMIN_REPORT_EMAIL) {
    tasks.push(
      transporter
        .sendMail({
          from: process.env.SMTP_FROM || 'Cyber Risk Assessment <noreply@example.com>',
          to: process.env.ADMIN_REPORT_EMAIL,
          subject: `[Admin Copy] ${subject}`,
          html,
        })
        .then(() => console.log(`[Email] Admin copy sent to ${process.env.ADMIN_REPORT_EMAIL}`))
        .catch((err) => console.error('[Email] Failed to send admin email:', err))
    )
  }

  await Promise.allSettled(tasks)
}
