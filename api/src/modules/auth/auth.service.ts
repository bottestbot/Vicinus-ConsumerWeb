import { Injectable, Logger } from '@nestjs/common'
import { UsersService } from '../users/users.service'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses: { email_address: string }[]
    first_name?: string
    last_name?: string
    image_url?: string
    public_metadata?: { role?: string }
  }
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private users: UsersService) {}

  async handleWebhook(event: ClerkWebhookEvent) {
    const { type, data } = event

    if (type === 'user.created' || type === 'user.updated') {
      const email = data.email_addresses?.[0]?.email_address
      if (!email) return { received: true }

      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined

      await this.users.upsertFromClerk({
        clerkId: data.id,
        email,
        fullName,
        avatarUrl: data.image_url,
        role: data.public_metadata?.role ?? 'buyer',
      })

      this.logger.log(`User ${type}: ${email}`)
    }

    return { received: true }
  }
}
