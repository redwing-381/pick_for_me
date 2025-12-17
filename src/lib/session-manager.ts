// Minimal session manager
import { User as FirebaseUser } from 'firebase/auth';

interface Session {
  sessionId: string;
  startTime: number;
  userId: string;
  method: string;
}

class SessionManager {
  private currentSession: Session | null = null;

  async createSession(
    user: FirebaseUser,
    method: string,
    rememberMe: boolean
  ): Promise<Session> {
    this.currentSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      userId: user.uid,
      method
    };
    return this.currentSession;
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  async clearSession(): Promise<void> {
    this.currentSession = null;
  }
}

export const sessionManager = new SessionManager();
