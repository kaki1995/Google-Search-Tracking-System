export interface RequestContext {
  sessionId: string;
  ipAddress: string | null;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  nowUtc: Date;
}

export function getReqContext(req: Request): RequestContext {
  // Extract IP address, prioritizing x-forwarded-for
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor 
    ? forwardedFor.split(',')[0].trim()
    : req.headers.get('cf-connecting-ip') || 
      req.headers.get('x-real-ip') || 
      req.headers.get('x-client-ip') || 
      null;

  // Parse user agent for device type
  const userAgent = req.headers.get('user-agent')?.toLowerCase() || '';
  let deviceType: 'mobile' | 'tablet' | 'desktop';
  
  if (/mobile|iphone|android/.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/ipad|tablet/.test(userAgent)) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  // Extract session ID from header or cookie, generate if not present
  const sessionIdFromHeader = req.headers.get('x-session-id');
  const cookieHeader = req.headers.get('cookie');
  let sessionIdFromCookie: string | null = null;
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    sessionIdFromCookie = cookies.sid || null;
  }

  const sessionId = sessionIdFromHeader || sessionIdFromCookie || crypto.randomUUID();

  return {
    sessionId,
    ipAddress,
    deviceType,
    nowUtc: new Date()
  };
}