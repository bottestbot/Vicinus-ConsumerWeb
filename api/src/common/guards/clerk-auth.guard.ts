import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verifyToken } from '@clerk/backend'
import { Request } from 'express'

interface AuthRequest extends Request {
  userId?: string
  sessionId?: string
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>()
    const token = this.extractToken(request)
    if (!token) throw new UnauthorizedException()
    try {
      const payload = await verifyToken(token, {
        secretKey: this.config.get<string>('CLERK_SECRET_KEY') ?? '',
      })
      request.userId = payload.sub
      // `sid` is the Clerk session id — used to count login-sessions (not
      // page loads) for the onboarding re-prompt cadence.
      request.sessionId = payload.sid
      return true
    } catch {
      throw new UnauthorizedException()
    }
  }

  private extractToken(request: AuthRequest): string | null {
    const auth = request.headers.authorization
    return auth?.startsWith('Bearer ') ? auth.slice(7) : null
  }
}
