import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export async function requireUser(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthenticationError();
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) throw new AuthenticationError();

  try {
    const decoded = await getAuth(getFirebaseAdmin()).verifyIdToken(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email || null,
    };
  } catch {
    throw new AuthenticationError('Invalid or expired authentication token.');
  }
}
