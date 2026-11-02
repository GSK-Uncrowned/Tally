import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error: 'Method not allowed'});
  }

  const to = process.env.EMAIL_TO;
  const from = process.env.EMAIL_FROM;
  if (!process.env.RESEND_API_KEY || !to || !from) {
    return res.status(500).json({error: 'Email service is not configured.'});
  }

  try {
    const data = await resend.emails.send({
      from,
      to: [to],
      subject: '[TALLY RESEND TEST] Email delivery check',
      html: '<p><strong>[TALLY RESEND TEST]</strong></p><p>This message was sent through the Tally Resend endpoint.</p>',
    });

    return res.status(200).json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email could not be sent.';
    return res.status(502).json({error: message});
  }
}