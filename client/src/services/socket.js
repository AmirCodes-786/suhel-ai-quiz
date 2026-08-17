import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function getSocket(user = null) {
  if (!socket) {
    const token = localStorage.getItem('quizforge_token') || '';
    const storedUser = user || JSON.parse(localStorage.getItem('quizforge_user') || 'null');

    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        token,
        userId: storedUser?._id || storedUser?.id || 'anonymous_user',
        userName: storedUser?.name || 'Challenger',
        userAvatar: storedUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      }
    });
  }
  return socket;
}

export default getSocket;
