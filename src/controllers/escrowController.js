import mongoose from 'mongoose';
import Contract from '../models/Contract.js';
import Transaction from '../models/Transaction.js';
import { findAccountByIdAndRole } from '../services/accountService.js';

// Global mock state to allow UI state to sync without DB
export const mockState = {
  escrowBalance: 18400,
  balance: 24600
};

export const depositToEscrow = async (req, res, next) => {
  try {
    // If DB is not connected yet, mock the response so the UI works instantly
    if (mongoose.connection.readyState !== 1) {
      mockState.escrowBalance += req.body.amount || 0;
      return res.status(200).json({ message: 'Mock Deposit successful', transaction: { _id: 'mock-tx-id', amount: req.body.amount, type: 'deposit' } });
    }

    const { contractId, milestoneId, amount } = req.body;
    const clientId = req.user._id;
    const depositAmount = Number(amount) || 0;

    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can deposit to escrow' });
    }

    if (depositAmount <= 0) {
      return res.status(400).json({ message: 'A valid deposit amount is required' });
    }

    let contract = null;
    let milestone = null;

    // Check if contractId is a valid MongoDB ObjectId (24 hex characters)
    const isMock = contractId === 'mock' || typeof contractId === 'number' || String(contractId).length !== 24;

    if (!isMock) {
      contract = await Contract.findById(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      milestone = contract.milestones.id(milestoneId);
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }
    }

    // Simulate charging client's external payment method and storing in virtual escrow
    req.user.escrowBalance = (req.user.escrowBalance || 0) + depositAmount;
    await req.accountModel.findByIdAndUpdate(req.user._id, {
      $set: { escrowBalance: req.user.escrowBalance },
    });

    if (milestone && contract) {
      milestone.isFunded = true;
      milestone.status = 'In Progress';
      await contract.save();
    }

    const transaction = await Transaction.create({
      type: 'deposit',
      amount: depositAmount,
      fromUser: clientId,
      contractId: contractId !== 'mock' ? contractId : null,
      milestoneId: milestoneId !== 'mock' ? milestoneId : null,
      description: `Deposit for milestone${milestone ? ': ' + milestone.title.en : ''}`
    });

    res.status(200).json({ message: 'Deposit successful', transaction, milestone });
  } catch (error) {
    next(error);
  }
};

export const releaseToFreelancer = async (req, res, next) => {
  try {
    // If DB is not connected yet, mock the response so the UI works instantly
    if (mongoose.connection.readyState !== 1) {
      mockState.escrowBalance -= 800;
      mockState.balance += 800;
      return res.status(200).json({ message: 'Mock Release successful', transaction: { _id: 'mock-tx-id', amount: 800, type: 'release' } });
    }

    const { contractId, milestoneId } = req.body;
    const clientId = req.user._id;

    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can release funds' });
    }

    let amount = 0;
    let contract = null;
    let milestone = null;

    // Check if contractId is a valid MongoDB ObjectId (24 hex characters)
    const isMock = contractId === 'mock' || typeof contractId === 'number' || String(contractId).length !== 24;

    if (!isMock) {
      contract = await Contract.findById(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      milestone = contract.milestones.id(milestoneId);
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }

      if (!milestone.isFunded) {
        return res.status(400).json({ message: 'Milestone is not funded yet' });
      }
      amount = milestone.amount;
    } else {
      amount = 800; // Mock release amount if no real DB hit
    }

    const currentEscrowBalance = req.user.escrowBalance || 0;

    if (currentEscrowBalance < amount) {
       return res.status(400).json({ message: 'Insufficient escrow balance' });
    }

    // Release funds
    req.user.escrowBalance = currentEscrowBalance - amount;
    await req.accountModel.findByIdAndUpdate(req.user._id, {
      $set: { escrowBalance: req.user.escrowBalance },
    });

    let toUser = null;
    if (contract) {
      const { account: freelancer, model: freelancerModel } = await findAccountByIdAndRole(contract.freelancerId, 'freelancer');
      if (freelancer && freelancerModel) {
        const nextBalance = (freelancer.balance || 0) + amount;
        await freelancerModel.findByIdAndUpdate(freelancer._id, {
          $set: { balance: nextBalance },
        });
        toUser = freelancer._id;
      }

      milestone.status = 'Approved';
      await contract.save();
    }

    const transaction = await Transaction.create({
      type: 'release',
      amount,
      fromUser: clientId,
      toUser,
      contractId: contractId !== 'mock' ? contractId : null,
      milestoneId: milestoneId !== 'mock' ? milestoneId : null,
      description: `Release funds for milestone${milestone ? ': ' + milestone.title.en : ''}`
    });

    res.status(200).json({ message: 'Funds released successfully', transaction, milestone });
  } catch (error) {
    next(error);
  }
};

export const getEscrowSummary = async (req, res, next) => {
  try {
    // If DB is not connected yet, mock the response so the UI works instantly
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ summary: { escrowBalance: mockState.escrowBalance, balance: mockState.balance, recentTransactions: [] } });
    }

    const userId = req.user._id;
    
    let summary = {};
    if (req.user.role === 'client') {
      summary.escrowBalance = req.user.escrowBalance || 0;
      const transactions = await Transaction.find({ fromUser: userId }).sort({ createdAt: -1 }).limit(10);
      summary.recentTransactions = transactions;
    } else {
      summary.balance = req.user.balance || 0;
      const transactions = await Transaction.find({ toUser: userId }).sort({ createdAt: -1 }).limit(10);
      summary.recentTransactions = transactions;
    }

    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
};
