'use client'

import { useDashboardUser } from '@/hooks/useDashboardUser'
import PostFeed from '@/components/posts/PostFeed'
import ChatContactsSidebar from '@/components/chat/ChatContactsSidebar'
import UserSuggestions from '@/components/social/UserSuggestions'
import OrgSuggestions from '@/components/social/OrgSuggestions'
import { usePathname } from 'next/navigation'

function LoadingSpinner() {
 return (
 <div className="flex items-center justify-center h-full">
 <div className="animate-spin h-8 w-8 border-4 border-[#0C6780] dark:border-accent border-t-transparent rounded-full" />
 </div>
 )
}

export default function GenericFeedPage() {
 const user = useDashboardUser()
 const pathname = usePathname()

 if (!user) return <LoadingSpinner />

 // Derive messages path from current route: /doctor/feed -> /doctor/messages
 const baseSlug = pathname.split('/')[1] // e.g., 'doctor', 'patient'
 const messagesPath = baseSlug === 'patient' ? `/${baseSlug}/chat` : `/${baseSlug}/messages`

 return (
 <div className="flex gap-6">
 <div className="flex-1 min-w-0">
 <PostFeed currentUserId={user.id} currentUserType={user.userType} showCreateButton={true} />
 </div>
 <div className="hidden lg:block w-72 flex-shrink-0 space-y-4">
 <UserSuggestions currentUserId={user.id} maxResults={7} />
 <OrgSuggestions maxResults={6} />
 <ChatContactsSidebar currentUserId={user.id} messagesPath={messagesPath} />
 </div>
 </div>
 )
}
