export async function getGmailAccessToken(): Promise<string> {
  let clientId = process.env.GMAIL_CLIENT_ID?.trim().replace(/^["']|["']$/g, '');
  let clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim().replace(/^["']|["']$/g, '');
  let refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim().replace(/^["']|["']$/g, '');

  if (refreshToken && refreshToken.includes('%')) {
    try {
      refreshToken = decodeURIComponent(refreshToken);
    } catch (_) {}
  }

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail API OAuth2 credentials (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) are not fully configured.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error === 'invalid_grant' || parsed.error_description?.includes('expired') || parsed.error_description?.includes('revoked')) {
        errorMessage = 'The GMAIL_REFRESH_TOKEN has expired or been revoked. Please re-authenticate or generate a new Gmail API refresh token via Google OAuth Playground (with https://www.googleapis.com/auth/gmail.send scope) and update your GMAIL_REFRESH_TOKEN variable in Settings.';
      }
    } catch (_) {}
    throw new Error(`Failed to refresh Gmail API access token: ${errorMessage}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function sendEmailViaGmailAPI(toEmail: string, userName: string, amount: number, storyUrl: string, throwOnError: boolean = false): Promise<boolean> {
  try {
    const accessToken = await getGmailAccessToken();
    const senderEmail = process.env.GMAIL_SENDER_EMAIL || 'noreply@jashn.fun';

    const subject = 'Congratulations! Your Celebration Page is Live 🤍';
    
    const textContent = `Hello ${userName},

Congratulations! Your premium celebration page has been successfully created and is now live!

Celebration Page Link: ${storyUrl}

Contribution Amount: ₹${amount}

Thank you for choosing Jashn to celebrate your beautiful, unforgettable memories. We are absolutely honored to be a part of your journey!

Warmest regards,
The Jashn Team`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #d4af37; border-radius: 16px; background-color: #ffffff; color: #2D1010; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">✨</span>
          <h2 style="color: #2A0A0A; margin: 8px 0 0 0; font-size: 24px; font-weight: 700;">Congratulations, ${userName}!</h2>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A; margin-bottom: 20px;">
          Your premium celebration page has been created successfully and is now active!
        </p>
        
        <div style="margin: 28px 0; padding: 20px; background-color: #3D1010; color: #ffffff; border-radius: 12px; text-align: center;">
          <p style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #d4af37; font-weight: 600;">Your Premium Celebration Link</p>
          <a href="${storyUrl}" target="_blank" style="color: #ffffff; font-weight: bold; text-decoration: underline; font-size: 18px; word-break: break-all;">${storyUrl}</a>
        </div>
        
        <div style="background-color: #FDFBF7; border-left: 4px solid #d4af37; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 14px; color: #666666;">
            <strong>Contribution Amount:</strong> <span style="color: #2A0A0A; font-weight: 600;">₹${amount}</span>
          </p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; color: #4A4A4A; margin-bottom: 24px;">
          Thank you for choosing Jashn to celebrate your special moments! We hope this brings endless joy to you and your loved ones.
        </p>
        
        <hr style="border: none; border-top: 1px solid #EAEAEA; margin: 24px 0;" />
        
        <div style="text-align: center; font-size: 12px; color: #999999;">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #d4af37; text-transform: uppercase; letter-spacing: 0.5px;">Jashn</p>
          <p style="margin: 0;">Celebrate with Elegance</p>
        </div>
      </div>
    `;

    // Construct MIME message
    const boundary = 'foo_bar_baz';
    const emailParts = [
      `From: Jashn <${senderEmail}>`,
      `To: ${toEmail}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(textContent).toString('base64'),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(htmlContent).toString('base64'),
      '',
      `--${boundary}--`
    ];

    const rawEmail = emailParts.join('\r\n');
    const encodedEmail = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });

    if (!gmailRes.ok) {
      const errorText = await gmailRes.text();
      throw new Error(`Gmail API send failed: ${errorText}`);
    }

    return true;
  } catch (err: any) {
    console.error('[Gmail API Error] Failed to send email via Gmail API:', err.message);
    if (throwOnError) {
      throw err;
    }
    return false;
  }
}

export async function sendFreeEmailViaGmailAPI(toEmail: string, userName: string, storyUrl: string, throwOnError: boolean = false): Promise<boolean> {
  try {
    const accessToken = await getGmailAccessToken();
    const senderEmail = process.env.GMAIL_SENDER_EMAIL || 'noreply@jashn.fun';

    const subject = 'Congratulations! Your Free Celebration Page is Live 🤍';
    
    const textContent = `Hello ${userName},

Congratulations! Your free celebration page has been successfully created and is now live!

Celebration Page Link: ${storyUrl}

Thank you for choosing Jashn to celebrate your beautiful, unforgettable memories.

Warmest regards,
The Jashn Team`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #d4af37; border-radius: 16px; background-color: #ffffff; color: #2D1010; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">✨</span>
          <h2 style="color: #2A0A0A; margin: 8px 0 0 0; font-size: 24px; font-weight: 700;">Congratulations, ${userName}!</h2>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A; margin-bottom: 20px;">
          Your free celebration page has been created successfully and is now active!
        </p>
        
        <div style="margin: 28px 0; padding: 20px; background-color: #3D1010; color: #ffffff; border-radius: 12px; text-align: center;">
          <p style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #d4af37; font-weight: 600;">Your Celebration Link</p>
          <a href="${storyUrl}" target="_blank" style="color: #ffffff; font-weight: bold; text-decoration: underline; font-size: 18px; word-break: break-all;">${storyUrl}</a>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; color: #4A4A4A; margin-bottom: 24px;">
          Thank you for choosing Jashn to celebrate your special moments! We hope this brings endless joy to you and your loved ones.
        </p>
        
        <hr style="border: none; border-top: 1px solid #EAEAEA; margin: 24px 0;" />
        
        <div style="text-align: center; font-size: 12px; color: #999999;">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #d4af37; text-transform: uppercase; letter-spacing: 0.5px;">Jashn</p>
          <p style="margin: 0;">Celebrate with Elegance</p>
        </div>
      </div>
    `;

    // Construct MIME message
    const boundary = 'foo_bar_baz_free';
    const emailParts = [
      `From: Jashn <${senderEmail}>`,
      `To: ${toEmail}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(textContent).toString('base64'),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(htmlContent).toString('base64'),
      '',
      `--${boundary}--`
    ];

    const rawEmail = emailParts.join('\r\n');
    const encodedEmail = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });

    if (!gmailRes.ok) {
      const errorText = await gmailRes.text();
      throw new Error(`Gmail API send failed: ${errorText}`);
    }

    return true;
  } catch (err: any) {
    console.error('[Gmail API Error] Failed to send free email via Gmail API:', err.message);
    if (throwOnError) {
      throw err;
    }
    return false;
  }
}

// sync
