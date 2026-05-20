import ChatThread from '../models/ChatThread.js';
import Job from '../models/Job.js';
import Transaction from '../models/Transaction.js';
import { findAccountByEmail, findAccountByIdAndRole, findFirstAccountByRole } from '../services/accountService.js';
import { ensurePendingPaymentsForJob } from '../services/pendingPaymentService.js';
import { createNotification } from '../services/notificationService.js';
import { emitToUser } from '../socket.js';
import { APP_CURRENCY, formatMoney, parseMoneyAmount } from '../utils/money.js';

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

function isValidObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

function parseBudgetNumber(budget) {
  return parseMoneyAmount(budget);
}

function formatCurrency(amount) {
  return formatMoney(amount);
}

function isJobCompleted(job) {
  const contractMilestones = Array.isArray(job?.contractState?.milestones)
    ? job.contractState.milestones
    : [];

  return job?.status === 'closed'
    || job?.contractState?.status === 'Completed'
    || (contractMilestones.length > 0 && contractMilestones.every((milestone) => milestone.status === 'Approved'));
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
    jobId: thread.jobId?.toString?.() || '',
    participantId: counterpart?.userId?.toString?.() || '',
    participant: counterpart?.name || 'Unknown participant',
    participantEmail: counterpart?.email || '',
    participantRoleValue: counterpart?.role || '',
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
    deal: {
      amount: thread.deal?.amount || 0,
      currency: thread.deal?.currency || APP_CURRENCY,
      status: thread.deal?.status || 'none',
      note: thread.deal?.note || '',
      milestoneIndex: Number.isInteger(thread.deal?.milestoneIndex) ? thread.deal.milestoneIndex : null,
      milestoneTitle: thread.deal?.milestoneTitle || '',
      updatedByRole: thread.deal?.updatedByRole || '',
      updatedAt: thread.deal?.updatedAt || null,
    },
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
  const { counterpartyId, counterpartyRole, counterpartyEmail, contract, jobId } = req.body || {};
  const validJobId = isValidObjectId(jobId) ? jobId : '';

  let counterparty = null;

  if (counterpartyId && counterpartyRole) {
    const lookup = await findAccountByIdAndRole(counterpartyId, counterpartyRole);
    counterparty = lookup.account;
  } else if (counterpartyEmail && counterpartyRole) {
    const lookup = await findAccountByEmail(counterpartyEmail);
    if (lookup && lookup.role === counterpartyRole) {
      counterparty = lookup;
    }
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

  const existingThread = candidateThreads.find((thread) => {
    const hasCounterparty = thread.participants.some((participant) => (
      String(participant.userId) === String(counterparty._id)
      && participant.role === counterparty.role
    ));

    if (!hasCounterparty) return false;

    const threadJobId = thread.jobId?.toString?.() || '';
    if (validJobId) {
      return threadJobId === validJobId;
    }

    return !threadJobId;
  });

  if (existingThread) {
    res.status(200).json({
      message: 'Chat thread already exists',
      thread: serializeThread(existingThread, req.user),
    });
    return;
  }

  const thread = await ChatThread.create({
    contract: typeof contract === 'string' && contract.trim() ? contract.trim() : 'General discussion',
    jobId: validJobId || null,
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
        unreadCount: 0,
      },
    ],
    messages: [],
  });

  emitToUser(req.user, 'chat:thread-updated', { thread: serializeThread(thread, req.user) });
  emitToUser(counterparty, 'chat:thread-updated', { thread: serializeThread(thread, counterparty) });
  await createNotification({
    recipient: counterparty,
    actor: req.user,
    type: 'message',
    title: 'New chat started',
    body: `${req.user.fullName || req.user.email} started a conversation about "${thread.contract}".`,
    actionPage: 'chat',
    actionId: thread._id.toString(),
    metadata: { threadId: thread._id.toString(), jobId: validJobId || '', contract: thread.contract },
  });

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

export async function deleteThread(req, res) {
  const thread = await ensureMembership(req.params.threadId, req.user);
  const threadId = thread._id.toString();
  const recipients = thread.participants.filter((participant) => !(
    String(participant.userId) === String(req.user._id) && participant.role === req.user.role
  ));

  await ChatThread.findByIdAndDelete(thread._id);

  recipients.forEach((participant) => {
    emitToUser(
      { _id: participant.userId, role: participant.role },
      'chat:thread-removed',
      { threadId },
    );
  });

  res.status(200).json({
    message: 'Chat thread deleted successfully',
    threadId,
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
  const messageRecipients = thread.participants
    .filter((participant) => !(
      String(participant.userId) === String(req.user._id)
      && participant.role === req.user.role
    ));

  await Promise.all(messageRecipients.map((participant) => createNotification({
    recipient: { _id: participant.userId, role: participant.role },
    actor: req.user,
    type: 'message',
    title: 'New message',
    body: `${req.user.fullName || req.user.email}: ${text.trim().slice(0, 110)}`,
    actionPage: 'chat',
    actionId: thread._id.toString(),
    metadata: { threadId: thread._id.toString(), jobId: thread.jobId?.toString?.() || '', contract: thread.contract },
  })));

  messageRecipients.forEach((participant) => {
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

export async function updateDeal(req, res) {
  const { action, amount, jobId, milestoneIndex } = req.body || {};

  if (!['propose', 'accept', 'update'].includes(action)) {
    const error = new Error('Unsupported deal action');
    error.statusCode = 400;
    throw error;
  }

  const parsedAmount = parseMoneyAmount(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    const error = new Error('A valid deal amount is required');
    error.statusCode = 400;
    throw error;
  }

  const thread = await ensureMembership(req.params.threadId, req.user);
  const resolvedJobId = isValidObjectId(jobId)
    ? jobId
    : thread.jobId?.toString?.() || '';
  const parsedMilestoneIndex = Number.parseInt(milestoneIndex, 10);

  if (!resolvedJobId) {
    const error = new Error('A linked job is required before negotiating a milestone price');
    error.statusCode = 400;
    throw error;
  }

  if (thread.jobId && String(thread.jobId) !== String(resolvedJobId)) {
    const error = new Error('This deal belongs to another project chat');
    error.statusCode = 409;
    throw error;
  }

  if (!Number.isInteger(parsedMilestoneIndex) || parsedMilestoneIndex < 0) {
    const error = new Error('Please select a valid milestone before updating the deal price');
    error.statusCode = 400;
    throw error;
  }

  const job = await Job.findById(resolvedJobId);
  if (!job) {
    const error = new Error('Linked job not found');
    error.statusCode = 404;
    throw error;
  }

  const clientParticipant = thread.participants.find((participant) => participant.role === 'client');
  const freelancerParticipant = thread.participants.find((participant) => participant.role === 'freelancer');

  if (!clientParticipant || String(job.clientId) !== String(clientParticipant.userId)) {
    const error = new Error('This job does not belong to this client chat');
    error.statusCode = 403;
    throw error;
  }

  if (job.assignedFreelancerId && (!freelancerParticipant || String(job.assignedFreelancerId) !== String(freelancerParticipant.userId))) {
    const error = new Error('This job is assigned to another freelancer');
    error.statusCode = 403;
    throw error;
  }

  if (isJobCompleted(job)) {
    const error = new Error('Completed jobs cannot negotiate deal prices');
    error.statusCode = 409;
    throw error;
  }

  const targetMilestone = Array.isArray(job.milestones) ? job.milestones[parsedMilestoneIndex] : null;
  if (!targetMilestone) {
    const error = new Error('Selected milestone was not found on this job post');
    error.statusCode = 404;
    throw error;
  }

  if (action === 'propose' && req.user.role !== 'freelancer') {
    const error = new Error('Only freelancers can propose a price');
    error.statusCode = 403;
    throw error;
  }

  if (['accept', 'update'].includes(action) && req.user.role !== 'client') {
    const error = new Error('Only clients can accept or edit the deal price');
    error.statusCode = 403;
    throw error;
  }

  const nextStatus = action === 'accept' || (action === 'update' && thread.deal?.status === 'accepted')
    ? 'accepted'
    : 'proposed';
  const milestoneTitle = targetMilestone.title || `Milestone ${parsedMilestoneIndex + 1}`;
  const formattedAmount = formatCurrency(parsedAmount);

  if (nextStatus === 'accepted') {
    if (String(job.clientId) !== String(req.user._id)) {
      const error = new Error('Only the client who owns this job can accept and apply a deal price');
      error.statusCode = 403;
      throw error;
    }

    targetMilestone.amount = formattedAmount;
    job.set(`milestones.${parsedMilestoneIndex}.amount`, formattedAmount);
    job.markModified('milestones');

    const nextBudgetAmount = Array.isArray(job.milestones)
      ? job.milestones.reduce((sum, milestone) => sum + parseBudgetNumber(milestone.amount), 0)
      : parsedAmount;
    job.budget = formatCurrency(nextBudgetAmount);

    if (job.contractState?.milestones?.[parsedMilestoneIndex]) {
      job.contractState.milestones[parsedMilestoneIndex].amount = formattedAmount;
      job.set(`contractState.milestones.${parsedMilestoneIndex}.amount`, formattedAmount);
      job.markModified('contractState.milestones');
      job.markModified('contractState');
    }

    const pendingTransaction = await Transaction.findOne({
      type: 'release',
      status: 'pending',
      jobId: job._id,
      milestoneIndex: parsedMilestoneIndex,
      fromUser: job.clientId,
      toUser: job.assignedFreelancerId,
    });

    if (pendingTransaction) {
      const difference = parsedAmount - (pendingTransaction.amount || 0);

      if (difference !== 0 && req.accountModel && req.user?._id) {
        const currentBalance = req.user.balance || 0;

        if (difference > 0 && currentBalance < difference) {
          const error = new Error('Insufficient available balance to reserve the updated deal price');
          error.statusCode = 400;
          throw error;
        }

        const nextClientBalance = currentBalance - difference;
        req.user.balance = nextClientBalance;
        await req.accountModel.findByIdAndUpdate(req.user._id, {
          $set: { balance: nextClientBalance },
        });
      }

      pendingTransaction.amount = parsedAmount;
      pendingTransaction.description = `Pending milestone payment for job: ${job.title} - ${milestoneTitle}`;
      await pendingTransaction.save();
    }

    if (!thread.jobId) {
      thread.jobId = job._id;
    }

    await job.save();
    await ensurePendingPaymentsForJob(job, { strict: true });
  }

  thread.deal = {
    amount: parsedAmount,
    currency: APP_CURRENCY,
    status: nextStatus,
    note: milestoneTitle,
    milestoneIndex: parsedMilestoneIndex,
    milestoneTitle,
    proposedBy: action === 'propose' ? req.user._id : thread.deal?.proposedBy || null,
    acceptedBy: nextStatus === 'accepted' ? req.user._id : thread.deal?.acceptedBy || null,
    updatedByRole: req.user.role,
    updatedAt: new Date(),
  };

  const actionLabel = action === 'propose'
    ? 'proposed'
    : action === 'accept'
      ? 'accepted'
      : 'updated';

  thread.messages.push({
    senderId: req.user._id,
    senderRole: req.user.role,
    senderName: req.user.fullName || req.user.email,
    text: `Deal ${actionLabel}: ${formattedAmount} for ${milestoneTitle}`,
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
  const recipients = thread.participants
    .filter((participant) => !(
      String(participant.userId) === String(req.user._id)
      && participant.role === req.user.role
    ));

  await Promise.all(recipients.map((participant) => createNotification({
    recipient: { _id: participant.userId, role: participant.role },
    actor: req.user,
    type: 'deal_updated',
    title: action === 'accept' ? 'Deal price accepted' : 'Deal price updated',
    body: `${req.user.fullName || req.user.email} ${actionLabel} ${formattedAmount} for "${milestoneTitle}".`,
    actionPage: 'chat',
    actionId: thread._id.toString(),
    metadata: { threadId: thread._id.toString(), jobId: thread.jobId?.toString?.() || '', contract: thread.contract },
  })));

  recipients.forEach((participant) => {
      emitToUser(
        {
          _id: participant.userId,
          role: participant.role,
        },
        'chat:thread-updated',
        { thread: serializeThread(thread, participant) },
      );
    });

  res.status(200).json({
    message: 'Deal updated successfully',
    thread: serializeThread(thread, req.user),
  });
}
