export function getClientInfo(req: Request) {
  const fwd = req.headers.get('x-forwarded-for') || '';
  const ip_address = (fwd.split(',')[0] || '').trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-client-ip') || null;
  
  const ua = (req.headers.get('user-agent') || '').toLowerCase();
  const device_type = /mobile|iphone|android/.test(ua)
    ? 'mobile'
    : /ipad|tablet/.test(ua)
    ? 'tablet'
    : 'desktop';
  
  return { ip_address, device_type };
}

export function generateUUID(): string {
  return crypto.randomUUID();
}