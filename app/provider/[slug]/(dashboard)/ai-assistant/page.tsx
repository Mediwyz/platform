'use client'

import { useUser } from '@/hooks/useUser'
import HealthTrackerTabs from '@/components/health-tracker/HealthTrackerTabs'

/** The AI Health Assistant page: the reusable Wyzo agent is the first tab,
 *  followed by the daily-logging surfaces (Food Diary, Exercise, Sleep, …). */
export default function AiAssistantPage() {
  const { user } = useUser()
  return <HealthTrackerTabs userName={user?.firstName} />
}
