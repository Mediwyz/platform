import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentService, AgentInput } from './agent.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

type AgentBody = {
  message: string;
  history?: { role: 'user' | 'bot'; text: string }[];
  sessionId?: string;
  lastProviderIds?: string[];
  lat?: number;
  lng?: number;
};

/**
 * The Wyzo agent endpoints. Mirrors the chat split:
 *   POST /api/ai/agent         — authenticated (health-aware Q&A + personal context)
 *   POST /api/ai/agent-public  — public visitors (no user context)
 * Both delegate to the same orchestrator.
 */
@ApiTags('AI Agent')
@Controller('ai')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);
  constructor(private agent: AgentService) {}

  @Post('agent')
  @HttpCode(HttpStatus.OK)
  async agentChat(@Body() body: AgentBody, @CurrentUser() user: JwtPayload) {
    return this.handle({ ...body, userId: user?.sub });
  }

  @Public()
  @Post('agent-public')
  @HttpCode(HttpStatus.OK)
  async agentPublic(@Body() body: AgentBody) {
    return this.handle(body);
  }

  /**
   * One-shot maintenance: geo-tag providers missing GPS so "near me" works.
   * Idempotent (no-op once every provider has coords). Guarded by a token;
   * remove this route once prod is backfilled.
   */
  @Public()
  @Post('agent/admin/backfill-coords')
  @HttpCode(HttpStatus.OK)
  async backfillCoords(@Body() body: { secret?: string }) {
    if (body?.secret !== (process.env.MAINTENANCE_SECRET || 'wyzo-coords-2026')) {
      return { success: false, error: 'forbidden' };
    }
    return { success: true, data: await this.agent.backfillCoordinatesNow() };
  }

  private async handle(input: AgentInput) {
    if (!input?.message?.trim()) {
      return { success: false, data: { reply: 'Please type a message.' } };
    }
    try {
      const data = await this.agent.run(input);
      return { success: true, data };
    } catch (err) {
      this.logger.error('POST /ai/agent error:', err);
      return {
        success: true,
        data: { intent: 'OUT_OF_SCOPE', entities: {}, reply: "I'm having trouble right now. Please try again in a moment.", followUps: [] },
      };
    }
  }
}
