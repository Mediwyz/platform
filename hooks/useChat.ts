'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import io, { Socket } from 'socket.io-client'

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderType: string
  content: string
  createdAt: string
}

interface UseChatOptions {
  userId: string
  enabled?: boolean
}

interface TypingUser {
  conversationId: string
  userName: string
}

type MessageCallback = (message: ChatMessage) => void

export function useChat(options: UseChatOptions) {
  const { userId, enabled = true } = options

  const [connected, setConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map())

  const socketRef = useRef<Socket | null>(null)
  const messageListenersRef = useRef<Set<MessageCallback>>(new Set())
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Connect to socket and set up event listeners
  useEffect(() => {
    if (!enabled || !userId) return

    const timers = typingTimersRef.current

    // Points to NestJS backend for Socket.IO
    let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

    if (typeof window !== 'undefined') {
      if (
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      }
    }

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      autoConnect: true,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      // Join user's personal room to receive messages
      socket.emit('chat:join', { userId })
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('reconnect', () => {
      // Re-join personal room after reconnection
      socket.emit('chat:join', { userId })
    })

    // Listen for incoming messages and dispatch to all registered callbacks
    socket.on('chat:message', (message: ChatMessage) => {
      messageListenersRef.current.forEach((callback) => {
        callback(message)
      })
    })

    // Listen for typing indicators
    socket.on(
      'chat:typing',
      (data: { conversationId: string; userId: string; userName: string }) => {
        // Don't show typing indicator for the current user
        if (data.userId === userId) return

        setTypingUsers((prev) => {
          const next = new Map(prev)
          next.set(data.userId, {
            conversationId: data.conversationId,
            userName: data.userName,
          })
          return next
        })

        // Clear any existing timer for this user
        const existingTimer = typingTimersRef.current.get(data.userId)
        if (existingTimer) {
          clearTimeout(existingTimer)
        }

        // Auto-clear typing indicator after 3 seconds
        const timer = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev)
            next.delete(data.userId)
            return next
          })
          typingTimersRef.current.delete(data.userId)
        }, 3000)

        typingTimersRef.current.set(data.userId, timer)
      }
    )

    // Listen for stop-typing events
    socket.on(
      'chat:stop-typing',
      (data: { conversationId: string; userId: string }) => {
        if (data.userId === userId) return

        // Clear the auto-clear timer
        const existingTimer = typingTimersRef.current.get(data.userId)
        if (existingTimer) {
          clearTimeout(existingTimer)
          typingTimersRef.current.delete(data.userId)
        }

        setTypingUsers((prev) => {
          const next = new Map(prev)
          next.delete(data.userId)
          return next
        })
      }
    )

    // Listen for read receipts
    socket.on(
      'chat:read',
      () => {
        // Components can handle read receipts via onNewMessage or separate listeners
      }
    )

    // Cleanup on unmount
    return () => {
      // Clear all typing timers
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()

      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
      setTypingUsers(new Map())
    }
  }, [userId, enabled])

  const sendMessage = useCallback(
    (
      conversationId: string,
      content: string,
      senderName: string,
      senderType: string
    ) => {
      socketRef.current?.emit('chat:send', {
        conversationId,
        content,
        senderId: userId,
        senderName,
        senderType,
      })
    },
    [userId]
  )

  const onNewMessage = useCallback((callback: MessageCallback) => {
    messageListenersRef.current.add(callback)
  }, [])

  const offNewMessage = useCallback((callback: MessageCallback) => {
    messageListenersRef.current.delete(callback)
  }, [])

  const startTyping = useCallback(
    (conversationId: string, userName: string) => {
      socketRef.current?.emit('chat:typing', {
        conversationId,
        userId,
        userName,
      })
    },
    [userId]
  )

  const stopTyping = useCallback(
    (conversationId: string) => {
      socketRef.current?.emit('chat:stop-typing', {
        conversationId,
        userId,
      })
    },
    [userId]
  )

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('chat:join-conversation', { conversationId })
  }, [])

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('chat:leave-conversation', { conversationId })
  }, [])

  const markRead = useCallback(
    (conversationId: string) => {
      socketRef.current?.emit('chat:mark-read', {
        conversationId,
        userId,
      })
    },
    [userId]
  )

  return {
    connected,
    sendMessage,
    onNewMessage,
    offNewMessage,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
    markRead,
    typingUsers,
  }
}
