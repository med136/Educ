import { io, Socket } from 'socket.io-client'

// @ts-ignore - import.meta est fourni par Vite au runtime
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api/v1'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (socket) return socket

  // Extraire l'origine HTTP (sans /api/v1)
  const url = new URL(API_BASE_URL)
  const origin = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`

  const token = localStorage.getItem('accessToken')

  socket = io(origin, {
    auth: {
      token,
    },
    transports: ['websocket'],
  })

  socket.on('connect_error', (err) => {
    console.error('Erreur de connexion Socket.io:', err.message)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
