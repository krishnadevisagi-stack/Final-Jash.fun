export function captureServerError(error: any, context?: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[Production Error Monitor][${timestamp}]${context ? ` [${context}]` : ''}`, {
    message: error?.message || String(error),
    name: error?.name || 'Error',
    code: error?.code,
    stack: error?.stack,
  });
}
