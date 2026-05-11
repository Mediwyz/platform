// hooks/useSocket.ts
// Fixed version with updated RoomState interface

import { useEffect, useState, useRef } from 'react'
import io, { Socket } from 'socket.io-client'

interface RoomState {
  roomId: string
  userId: string
  userName: string
  userType: string
  sessionId?: string  // Add this line to include sessionId as optional
}

 
const debug = process.env.NODE_ENV === 'development' ? console.log : () => {}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const roomStateRef = useRef<RoomState | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Determine socket URL — points to NestJS backend
    let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

    if (typeof window !== 'undefined') {
      // In production, use env var or derive from current origin
      if (window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1') {
        socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
        debug('Production mode detected, using:', socketUrl)
      } else {
        debug('Development mode, using:', socketUrl)
      }
    }
    
    // Create socket with aggressive reconnection settings
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      
      // Aggressive reconnection settings
      reconnection: true,
      reconnectionAttempts: Infinity, // Infinite retry
      reconnectionDelay: 1000, // Start with 1 second
      reconnectionDelayMax: 5000, // Max 5 seconds between attempts
      randomizationFactor: 0.5,
      timeout: 20000, // 20 second connection timeout
      
      // Auto connect
      autoConnect: true,
      
      // Force new connection
      forceNew: false,
      
      // Upgrade timeout
      upgrade: true,
    })

    socketRef.current = socketInstance

    // Connection event handlers
    socketInstance.on('connect', () => {
      debug('Socket connected! ID:', socketInstance.id)
      setConnected(true)
      setIsReconnecting(false)
      setReconnectAttempts(0)
      
      // Automatically rejoin room if we have room state
      if (roomStateRef.current) {
        debug('Auto-rejoining room after reconnection:', roomStateRef.current.roomId)
        socketInstance.emit('join-room', roomStateRef.current)
      }
    })

    socketInstance.on('disconnect', (reason) => {
      debug(`Socket disconnected. Reason: ${reason}`)
      setConnected(false)
      
      // Only set reconnecting if it's an unintentional disconnect
      if (reason === 'io server disconnect') {
        // Server disconnected us, need manual reconnect
        debug('Server disconnected. Attempting manual reconnect...')
        socketInstance.connect()
      } else if (reason === 'io client disconnect') {
        // We disconnected manually, don't auto-reconnect
        debug('Client initiated disconnect')
      } else {
        // Network issue or other problem, will auto-reconnect
        setIsReconnecting(true)
        debug('Network issue detected. Auto-reconnecting...')
      }
    })

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      debug(`Reconnection attempt #${attemptNumber}`)
      setReconnectAttempts(attemptNumber)
      setIsReconnecting(true)
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      debug(`Reconnected successfully after ${attemptNumber} attempts`)
      setIsReconnecting(false)
      setReconnectAttempts(0)
    })

    socketInstance.on('reconnect_error', (error) => {
      debug('Reconnection error:', error.message)
    })

    socketInstance.on('reconnect_failed', () => {
      debug('Reconnection failed after maximum attempts')
      setIsReconnecting(false)
      // This shouldn't happen with infinite retries, but handle it anyway
      setTimeout(() => {
        debug('Attempting manual reconnection...')
        socketInstance.connect()
      }, 5000)
    })

    socketInstance.on('connect_error', (error) => {
      // During reconnection, treat connection errors as expected behavior
      if (isReconnecting || reconnectAttempts > 0) {
        debug('Server appears to be down, continuing reconnection attempts...')
      } else {
        // Only log as error on first connection attempt
        debug('Unable to connect to server:', error.message)
      }
      
      if (!connected && !isReconnecting) {
        setIsReconnecting(true)
      }
    })

    socketInstance.on('error', (error) => {
      debug('Socket error:', error)
    })

    // Handle ping/pong for connection health (automatic response from client)
    socketInstance.on('ping', () => {
      debug('Ping received from server')
    })
    
    socketInstance.on('pong', (latency) => {
      debug(`Pong received - latency: ${latency}ms`)
    })

    // Listen for room join confirmation
    socketInstance.on('room-joined', ({ roomId }) => {
      debug(`Successfully joined room: ${roomId}`)
    })

    // Custom heartbeat (application-level, not Socket.IO ping/pong)
    const heartbeatInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('heartbeat', { 
          timestamp: Date.now(),
          roomId: roomStateRef.current?.roomId 
        })
      }
    }, 30000) // Every 30 seconds

    setSocket(socketInstance)

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval)
      roomStateRef.current = null
      if (socketInstance) {
        socketInstance.removeAllListeners()
        socketInstance.disconnect()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Function to save room state for reconnection
  const saveRoomState = (state: RoomState) => {
    roomStateRef.current = state
    // Also save to sessionStorage as backup
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('socket_room_state', JSON.stringify(state))
    }
  }

  // Function to clear room state
  const clearRoomState = () => {
    roomStateRef.current = null
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('socket_room_state')
    }
  }

  // Function to manually reconnect
  const manualReconnect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      debug('Manual reconnection triggered')
      socketRef.current.connect()
    }
  }

  // Load room state from session storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('socket_room_state')
      if (savedState) {
        try {
          roomStateRef.current = JSON.parse(savedState)
          debug('Restored room state from session:', roomStateRef.current)
        } catch (e) {
          debug('Failed to parse saved room state:', e)
        }
      }
    }
  }, [])

  return { 
    socket, 
    connected, 
    isReconnecting,
    reconnectAttempts,
    saveRoomState,
    clearRoomState,
    manualReconnect
  }
}