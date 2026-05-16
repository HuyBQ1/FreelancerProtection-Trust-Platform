import Review from '../models/Review.js';
import mongoose from 'mongoose';
import { findAnyAccountById } from '../services/accountService.js';

async function serializeReview(review) {
  const reviewer = await findAnyAccountById(review.reviewerId);
  const recipient = await findAnyAccountById(review.recipientId);

  return {
    _id: review._id,
    contractId: review.contractId,
    milestoneId: review.milestoneId,
    reviewerId: reviewer
      ? {
          _id: reviewer._id,
          fullName: reviewer.fullName,
          avatar: reviewer.avatar || '',
          email: reviewer.email,
          role: reviewer.role,
        }
      : null,
    recipientId: recipient
      ? {
          _id: recipient._id,
          fullName: recipient.fullName,
          avatar: recipient.avatar || '',
          email: recipient.email,
          role: recipient.role,
        }
      : null,
    reviewerRole: review.reviewerRole,
    rating: review.rating,
    comment: review.comment,
    visibility: review.visibility,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}



export const createReview = async (req, res) => {
  try {
    const { contractId, milestoneId, recipientId, rating, comment, visibility } = req.body;


    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const reviewerId = req.user.id;
    const reviewerRole = req.user.role;

    if (
      !mongoose.Types.ObjectId.isValid(contractId) ||
      !mongoose.Types.ObjectId.isValid(recipientId)
    ) {
      return res.status(400).json({ message: 'Invalid contractId or recipientId' });
    }

    if (!milestoneId || typeof milestoneId !== 'string') {
      return res.status(400).json({ message: 'Invalid milestoneId' });
    }


    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    if (
      rating.communication < 1 || rating.communication > 5 ||
      rating.quality < 1 || rating.quality > 5 ||
      rating.timeliness < 1 || rating.timeliness > 5 ||
      rating.professionalism < 1 || rating.professionalism > 5
    ) {
      return res.status(400).json({ message: 'Invalid rating scores (must be 1-5)' });
    }


    const existingReview = await Review.findOne({
      contractId,
      milestoneId,
      reviewerId,
      recipientId,
    });

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment || '';
      existingReview.visibility = visibility || 'public';
      existingReview.status = 'approved';
      await existingReview.save();

      return res.status(200).json({
        message: 'Review updated successfully',
        review: await serializeReview(existingReview),
      });
    }

    const newReview = new Review({
      contractId,
      milestoneId,
      reviewerId,
      reviewerRole,
      recipientId,
      rating,
      comment: comment || '',
      visibility: visibility || 'public',
      status: 'approved',
    });

    await newReview.save();

    return res.status(201).json({
      message: 'Review created successfully',
      review: await serializeReview(newReview),
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get reviews for a specific user
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const visibility = req.query.visibility || 'public';

    const reviews = await Review.find({
      recipientId: userId,
      visibility,
      status: 'approved',
    })
      .sort({ createdAt: -1 });

    const serializedReviews = await Promise.all(reviews.map(serializeReview));

    return res.status(200).json({
      message: 'User reviews fetched successfully',
      reviews: serializedReviews,
      totalReviews: serializedReviews.length,
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const getMilestoneReviews = async (req, res) => {
  try {
    const { contractId, milestoneId } = req.params;

    // ✅ FIX: validate ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(contractId) ||
      !milestoneId
    ) {
      return res.status(400).json({ message: 'Invalid contractId or milestoneId' });
    }

    const reviews = await Review.find({
      contractId,
      milestoneId,
      status: 'approved',
    })
      .sort({ createdAt: -1 });

    const serializedReviews = await Promise.all(reviews.map(serializeReview));

    return res.status(200).json({
      message: 'Milestone reviews fetched successfully',
      reviews: serializedReviews,
      totalReviews: serializedReviews.length,
    });
  } catch (error) {
    console.error('Error fetching milestone reviews:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get pending reviews for moderation (admin only)
export const getPendingReviews = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const reviews = await Review.find({ status: 'pending' }).sort({ createdAt: -1 });
    const serializedReviews = await Promise.all(reviews.map(serializeReview));

    return res.status(200).json({
      message: 'Pending reviews fetched successfully',
      reviews: serializedReviews,
      totalPending: serializedReviews.length,
    });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve a review (admin only)
export const approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: 'approved' },
      { new: true },
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({
      message: 'Review approved successfully',
      review,
    });
  } catch (error) {
    console.error('Error approving review:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject a review (admin only)
export const rejectReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: 'rejected' },
      { new: true },
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({
      message: 'Review rejected successfully',
      review,
      reason: reason || 'No reason provided',
    });
  } catch (error) {
    console.error('Error rejecting review:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Calculate average rating for a user
export const getUserAverageRating = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({
      recipientId: userId,
      status: 'approved',
      visibility: 'public',
    });

    if (reviews.length === 0) {
      return res.status(200).json({
        userId,
        averageRating: 0,
        totalReviews: 0,
        breakdown: {
          communication: 0,
          quality: 0,
          timeliness: 0,
          professionalism: 0,
        },
      });
    }

    const avgCommunication =
      reviews.reduce((sum, r) => sum + r.rating.communication, 0) / reviews.length;
    const avgQuality = reviews.reduce((sum, r) => sum + r.rating.quality, 0) / reviews.length;
    const avgTimeliness =
      reviews.reduce((sum, r) => sum + r.rating.timeliness, 0) / reviews.length;
    const avgProfessionalism =
      reviews.reduce((sum, r) => sum + r.rating.professionalism, 0) / reviews.length;

    const overallAverage =
      (avgCommunication + avgQuality + avgTimeliness + avgProfessionalism) / 4;

    return res.status(200).json({
      userId,
      averageRating: Math.round(overallAverage * 100) / 100,
      totalReviews: reviews.length,
      breakdown: {
        communication: Math.round(avgCommunication * 100) / 100,
        quality: Math.round(avgQuality * 100) / 100,
        timeliness: Math.round(avgTimeliness * 100) / 100,
        professionalism: Math.round(avgProfessionalism * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a review (reviewer or admin only)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewerId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this review' });
    }

    await Review.findByIdAndDelete(reviewId);

    return res.status(200).json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
