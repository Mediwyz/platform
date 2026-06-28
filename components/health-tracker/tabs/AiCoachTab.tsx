'use client'

import WyzoAssistant, { Suggestion } from '@/components/shared/WyzoAssistant'

interface AiCoachTabProps {
  userName?: string
  healthScore?: number
}

// Health-focused starters. The agent is health-aware — when the user is logged
// in it reads their tracker history (via /api/ai/chat) to personalise answers,
// and it can also find a provider and book in-chat.
const HEALTH_SUGGESTIONS: Suggestion[] = [
  { label: 'Suggest a meal plan for the rest of today', kind: 'ask' },
  { label: 'What exercise should I do today?', kind: 'ask' },
  { label: 'How am I doing with hydration today?', kind: 'ask' },
  { label: 'How can I improve my sleep?', kind: 'ask' },
]

const GREETING =
  "Hi! 👋 I'm Wyzo, your health AI. I can see your tracker history — ask me about nutrition, exercise, sleep or your wellness goals. I can also find a provider and book an appointment for you."

/** First tab of the Health & AI Assistant — the same reusable agent used in the
 *  hero, floating widget and Discover panel, rendered inline (no gateway button). */
export default function AiCoachTab(_props: AiCoachTabProps) {
  return (
    <div className="h-full min-h-0 p-2 sm:p-3">
      <WyzoAssistant variant="tab" greeting={GREETING} suggestions={HEALTH_SUGGESTIONS} />
    </div>
  )
}
