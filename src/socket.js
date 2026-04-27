import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from './config/env.js';
import { findAccountByIdAndRole } from './services/accountService.js';

let ioInstance = null;

function buildUserRoom(user) {
  return `user:${user.role}:${user._id}`;
}

export function getUserRoomByAccount(account) {
  return `user:${account.role}:${account._id}`;
}

export function emitToUser(account, event, payload) {
  if (!ioInstance || !account?._id || !account?.role) return;
  ioInstance.to(getUserRoomByAccount(account)).emit(event, payload);
}

export function initSocketServer(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        const error = new Error('Socket authorization token is missing');
        error.data = { statusCode: 401 };
        next(error);
        return;
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const { account } = await findAccountByIdAndRole(decoded.userId, decoded.role);

      if (!account) {
        const error = new Error('Socket user not found');
        error.data = { statusCode: 401 };
        next(error);
        return;
      }

      socket.user = account;
      next();
    } catch (error) {
      const authError = new Error('Socket authentication failed');
      authError.data = { statusCode: 401 };
      next(authError);
    }
  });

  ioInstance.on('connection', (socket) => {
    socket.join(buildUserRoom(socket.user));

    socket.on('disconnect', () => {
      socket.leave(buildUserRoom(socket.user));
    });
  });

  return ioInstance;
}
