'use client'

import { useSearchParams } from 'next/navigation'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import { ChatView } from '@/components/chat'

function LoadingSpinner() {
 return (
 <div className="flex items-center justify-center h-full">
 <div className="animate-spin h-8 w-8 border-4 border-[#0C6780] dark:border-accent border-t-transparent rounded-full" />
 </div>
 )
}

export default function GenericMessagesPage() {
 const user = useDashboardUser()
 const searchParams = useSearchParams()
 const conversationId = searchParams.get('conversationId')

 if (!user) return <LoadingSpinner />

 return <ChatView currentUser={user} initialConversationId={conversationId} />
}
