import ChatThread from '../models/ChatThread.js';
import { findAccountByIdAndRole, findFirstAccountByRole } from '../services/accountService.js';
import { emitToUser } from '../socket.js';

function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildParticipantLabel(role) {
  if (role === 'client') return 'Client';
  if (role === 'freelancer') return 'Freelancer';
  return 'Admin';
}

function serializeThread(thread, currentUser) {
  const currentParticipant = thread.participants.find((participant) => (
    String(participant.userId) === String(currentUser._id)
    && participant.role === currentUser.role
  ));
  const counterpart = thread.participants.find((participant) => !(
    String(participant.userId) === String(currentUser._id)
    && participant.role === currentUser.role
  ));
  const lastMessage = thread.messages[thread.messages.length - 1];

  return {
    id: thread._id.toString(),
    participant: counterpart?.name || 'Unknown participant',
    participantRole: buildParticipantLabel(counterpart?.role),
    contract: thread.contract || 'General discussion',
    unread: currentParticipant?.unreadCount || 0,
    lastMessage: lastMessage?.text || 'No messages yet',
    lastTime: lastMessage ? formatMessageTime(lastMessage.createdAt) : '',
    messages: thread.messages.map((message) => ({
      id: message._id.toString(),
      senderId: message.senderId ? message.senderId.toString() : '',
      senderRole: message.senderRole,
      senderName: message.senderName,
      text: message.text,
      time: formatMessageTime(message.createdAt),
    })),
  };
}

async function ensureMembership(threadId, user) {
  const thread = await ChatThread.findById(threadId);

  if (!thread) {
    const error = new Error('Chat thread not found');
    error.statusCode = 404;
    throw error;
  }

  const isMember = thread.participants.some((participant) => (
    String(participant.userId) === String(user._id)
    && participant.role === user.role
  ));

  if (!isMember) {
    const error = new Error('You do not have access to this chat thread');
    error.statusCode = 403;
    throw error;
  }

  return thread;
}

export async function getThreads(req, res) {
  const threads = await ChatThread.find({
    participants: {
      $elemMatch: {
        userId: req.user._id,
        role: req.user.role,
      },
    },
  }).sort({ updatedAt: -1 });

  res.status(200).json({
    message: 'Chat threads fetched successfully',
    threads: threads.map((thread) => serializeThread(thread, req.user)),
  });
}

export async function createThread(req, res) {
  const { counterpartyId, counterpartyRole, contract } = req.body || {};

  let counterparty = null;

  if (counterpartyId && counterpartyRole) {
    const lookup = await findAccountByIdAndRole(counterpartyId, counterpartyRole);
    counterparty = lookup.account;
  } else if (req.user.role === 'client') {
    counterparty = await findFirstAccountByRole('freelancer', req.user);
  } else if (req.user.role === 'freelancer') {
    counterparty = await findFirstAccountByRole('client', req.user);
  }

  if (!counterparty) {
    const error = new Error('No available chat participant found yet');
    error.statusCode = 404;
    throw error;
  }

  const candidateThreads = await ChatThread.find({
    participants: {
      $elemMatch: {
        userId: req.user._id,
        role: req.user.role,
      },
    },
  });

  const existingThread = candidateThreads.find((thread) => (
    thread.participants.some((participant) => (
      String(participant.userId) === String(counterparty._id)
      && participant.role === counterparty.role
    ))
  ));

  if (existingThread) {
    res.status(200).json({
      message: 'Chat thread already exists',
      thread: serializeThread(existingThread, req.user),
    });
    return;
  }

  const starterText = req.user.role === 'client'
    ? 'Hello, I would like to discuss a potential project with you.'
    : 'Hello, thank you for your interest. I am ready to discuss the project details.';
  const replyText = req.user.role === 'client'
    ? 'Thanks for reaching out. I am available to review the project scope and next steps.'
    : 'Thanks for sharing the project. I would like to understand the goals, timeline, and milestone plan.';

  const thread = await ChatThread.create({
    contract: typeof contract === 'string' && contract.trim() ? contract.trim() : 'General discussion',
    participants: [
      {
        userId: req.user._id,
        role: req.user.role,
        name: req.user.fullName || req.user.email,
        email: req.user.email,
        unreadCount: 0,
      },
      {
        userId: counterparty._id,
        role: counterparty.role,
        name: counterparty.fullName || counterparty.email,
        email: counterparty.email,
        unreadCount: 1,
      },
    ],
    messages: [
      {
        senderId: req.user._id,
        senderRole: req.user.role,
        senderName: req.user.fullName || req.user.email,
        text: starterText,
      },
      {
        senderId: counterparty._id,
        senderRole: counterparty.role,
        senderName: counterparty.fullName || counterparty.email,
        text: replyText,
      },
    ],
  });

  emitToUser(req.user, 'chat:thread-updated', { thread: serializeThread(thread, req.user) });
  emitToUser(counterparty, 'chat:thread-updated', { thread: serializeThread(thread, counterparty) });

  res.status(201).json({
    message: 'Chat thread created successfully',
    thread: serializeThread(thread, req.user),
  });
}

export async function markThreadRead(req, res) {
  const thread = await ensureMembership(req.params.threadId, req.user);

  thread.participants = thread.participants.map((participant) => {
    if (String(participant.userId) === String(req.user._id) && participant.role === req.user.role) {
      return {
        ...participant.toObject(),
        unreadCount: 0,
      };
    }

    return participant;
  });

  await thread.save();

  emitToUser(req.user, 'chat:thread-updated', { thread: serializeThread(thread, req.user) });

  res.status(200).json({
    message: 'Chat thread marked as read',
    thread: serializeThread(thread, req.user),
  });
}

export async function sendMessage(req, res) {
  const { text } = req.body;

  if (typeof text !== 'string' || !text.trim()) {
    const error = new Error('Message text is required');
    error.statusCode = 400;
    throw error;
  }

  const thread = await ensureMembership(req.params.threadId, req.user);

  thread.messages.push({
    senderId: req.user._id,
    senderRole: req.user.role,
    senderName: req.user.fullName || req.user.email,
    text: text.trim(),
  });

  thread.participants = thread.participants.map((participant) => {
    if (String(participant.userId) === String(req.user._id) && participant.role === req.user.role) {
      return {
        ...participant.toObject(),
        unreadCount: 0,
      };
    }

    return {
      ...participant.toObject(),
      unreadCount: (participant.unreadCount || 0) + 1,
    };
  });

  await thread.save();

  emitToUser(req.user, 'chat:thread-updated', { thread: serializeThread(thread, req.user) });
  thread.participants
    .filter((participant) => !(
      String(participant.userId) === String(req.user._id)
      && participant.role === req.user.role
    ))
    .forEach((participant) => {
      emitToUser(
        {
          _id: participant.userId,
          role: participant.role,
        },
        'chat:thread-updated',
        { thread: serializeThread(thread, participant) },
      );
    });

  res.status(201).json({
    message: 'Message sent successfully',
    thread: serializeThread(thread, req.user),
  });
}
