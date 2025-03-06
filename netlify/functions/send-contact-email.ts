const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const { name, email, subject, message } = JSON.parse(event.body);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}` // Use Netlify env
      },
      body: JSON.stringify({
        from: 'no-reply@bmatchd.com', // Set up in Resend
        to: 'info@bmatchd.com',
        subject: `Contact Form Submission: ${subject}`,
        html: `
          <h1>Contact Form Submission</h1>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong> ${message}</p>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: data.error || 'Failed to send email' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' })
    };
  } catch (error) {
    console.error('Error in send-contact-email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};