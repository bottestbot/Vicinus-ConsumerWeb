import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verifyToken } from '@clerk/backend'
import { Request } from 'express'

interface AuthRequest extends Request {
  userId?: string
  sessionId?: string
}

// Optional-auth counterpart to ClerkAuthGuard: an endpoint guarded by this
// serves both anonymous and signed-in callers. A valid token attaches
// `request.userId`; a missing or invalid token is treated as anonymous
// (`userId` left undefined) rather than a 401. Used by
// GET /neighbourhoods/:slug/detail so the personalized block is added only when
// the caller is signed in.
@Injectable()
export class OptionalClerkAuthGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>()
    const token = this.extractToken(request)
    if (!token) return true

    try {
      const payload = await verifyToken(token, {
        secretKey: this.config.get<string>('CLERK_SECRET_KEY') ?? '',
      })
      request.userId = payload.sub
      request.sessionId = payload.sid
    } catch {
      // Invalid/expired token → fall through as anonymous, don't reject.
    }
    return true
  }

  private extractToken(request: AuthRequest): string | null {
    const auth = request.headers.authorization
    return auth?.startsWith('Bearer ') ? auth.slice(7) : null
  }
}
