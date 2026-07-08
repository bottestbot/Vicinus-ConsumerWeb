import { createParamDecorator, ExecutionContext } from '@nestjs/common'

// Resolves the Clerk session id (`sid` claim) attached by ClerkAuthGuard.
export const CurrentSessionId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  return request['sessionId'] as string | undefined
})
