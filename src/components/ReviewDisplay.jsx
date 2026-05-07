import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const ReviewDisplay = ({ contractId, milestoneId, refreshToken = 0 }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!contractId || !milestoneId) {
            setReviews([]);
            setLoading(false);
            return;
        }

        loadReviews();
    }, [contractId, milestoneId, refreshToken]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/reviews/milestone/${contractId}/${milestoneId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }

            const data = await response.json();
            setReviews(data.reviews || []);
        } catch (error) {
            console.error('Error loading reviews:', error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const getAverageRating = () => {
        if (reviews.length === 0) return 0;
        const totalRating = reviews.reduce((sum, review) => {
            const avg =
                (review.rating.communication +
                    review.rating.quality +
                    review.rating.timeliness +
                    review.rating.professionalism) /
                4;
            return sum + avg;
        }, 0);
        return (totalRating / reviews.length).toFixed(1);
    };

    const getRatingBreakdown = () => {
        if (reviews.length === 0) {
            return {
                communication: 0,
                quality: 0,
                timeliness: 0,
                professionalism: 0,
            };
        }

        return {
            communication: (
                reviews.reduce((sum, r) => sum + r.rating.communication, 0) / reviews.length
            ).toFixed(1),
            quality: (
                reviews.reduce((sum, r) => sum + r.rating.quality, 0) / reviews.length
            ).toFixed(1),
            timeliness: (
                reviews.reduce((sum, r) => sum + r.rating.timeliness, 0) / reviews.length
            ).toFixed(1),
            professionalism: (
                reviews.reduce((sum, r) => sum + r.rating.professionalism, 0) / reviews.length
            ).toFixed(1),
        };
    };

    const breakdown = getRatingBreakdown();
    const averageRating = getAverageRating();

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= Math.round(rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return <div className="text-center py-8 text-slate-500">Loading reviews...</div>;
    }

    if (!contractId || !milestoneId) {
        return (
            <div className="text-center py-8 text-slate-500">
                Select a milestone to view reviews.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            {reviews.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-600">Average Rating</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">{averageRating}</p>
                            {renderStars(averageRating)}
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-600">Communication</p>
                            <p className="mt-2 text-lg font-bold text-slate-900">{breakdown.communication}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-600">Quality</p>
                            <p className="mt-2 text-lg font-bold text-slate-900">{breakdown.quality}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-600">Timeliness</p>
                            <p className="mt-2 text-lg font-bold text-slate-900">{breakdown.timeliness}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-600">Professionalism</p>
                            <p className="mt-2 text-lg font-bold text-slate-900">{breakdown.professionalism}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Individual Reviews */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 py-12 text-center">
                        <div>
                            <p className="text-sm text-slate-500">No reviews yet</p>
                        </div>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div
                            key={review._id}
                            className="rounded-lg border border-slate-200 bg-white p-4"
                        >
                            {/* Reviewer Info */}
                            <div className="flex items-center gap-3">
                                {review.reviewerId?.avatar ? (
                                    <img
                                        src={review.reviewerId.avatar}
                                        alt={review.reviewerId.fullName}
                                        className="h-10 w-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                        <User className="h-5 w-5 text-slate-500" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900">
                                        {review.reviewerId?.fullName || 'Anonymous'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {review.createdAt && new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Ratings */}
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Communication</span>
                                    <div className="flex gap-1">
                                        {renderStars(review.rating.communication)}
                                        <span className="ml-2 text-sm font-semibold text-slate-900">
                                            {review.rating.communication}/5
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Quality of Work</span>
                                    <div className="flex gap-1">
                                        {renderStars(review.rating.quality)}
                                        <span className="ml-2 text-sm font-semibold text-slate-900">
                                            {review.rating.quality}/5
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Timeliness</span>
                                    <div className="flex gap-1">
                                        {renderStars(review.rating.timeliness)}
                                        <span className="ml-2 text-sm font-semibold text-slate-900">
                                            {review.rating.timeliness}/5
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Professionalism</span>
                                    <div className="flex gap-1">
                                        {renderStars(review.rating.professionalism)}
                                        <span className="ml-2 text-sm font-semibold text-slate-900">
                                            {review.rating.professionalism}/5
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Comment */}
                            {review.comment && (
                                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                                    <p className="break-words whitespace-pre-wrap text-sm text-slate-700">
                                        {review.comment}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewDisplay;
