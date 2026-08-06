export function validateStartupEnv(): { valid: boolean; missing: string[] } {
  const requiredVars = [
    'RAZORPAY_KEY_SECRET',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'CRON_SECRET',
  ];

  const optionalVars = [
    'GEMINI_API_KEY',
    'GCS_BUCKET_NAME',
    'GMAIL_CLIENT_ID',
  ];

  const missingRequired = requiredVars.filter(v => !process.env[v]);
  const missingOptional = optionalVars.filter(v => !process.env[v]);

  if (missingRequired.length > 0) {
    console.warn(`[Startup Env Guard] WARNING: Mandatory production environment variables are missing: ${missingRequired.join(', ')}`);
  }

  if (missingOptional.length > 0) {
    console.info(`[Startup Env Guard] NOTICE: Optional service integration environment variables are unconfigured: ${missingOptional.join(', ')}`);
  }

  return { valid: missingRequired.length === 0, missing: missingRequired };
}

// Run boot check when loaded on Node.js server
if (typeof window === 'undefined') {
  validateStartupEnv();
}
