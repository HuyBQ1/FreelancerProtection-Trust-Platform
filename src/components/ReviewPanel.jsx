import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const ReviewPanel = ({
    isOpen,
    onClose,
    onSubmitted,
    contractTitle,
    milestoneTitle,
    recipientName,
    contractId,
    milestoneId,
    recipientId,
    language = 'en',
}) => {
    const isVietnamese = language === 'vi';
    const [rating, setRating] = useState({
        communication: 0,
        quality: 0,
        timeliness: 0,
        professionalism: 0,
    });

    const [comment, setComment] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [hoveredRating, setHoveredRating] = useState({
        communication: 0,
        quality: 0,
        timeliness: 0,
        professionalism: 0,
    });
    const [loading, setLoading] = useState(false);

    const ratingCategories = [
        { key: 'communication', label: isVietnamese ? 'Giao tiếp' : 'Communication' },
        { key: 'quality', label: isVietnamese ? 'Chất lượng công việc' : 'Quality of Work' },
        { key: 'timeliness', label: isVietnamese ? 'Đúng hạn' : 'Timeliness' },
        { key: 'professionalism', label: isVietnamese ? 'Tác phong chuyên nghiệp' : 'Professionalism' },
    ];

    const handleRatingClick = (category, value) => {
        setRating({ ...rating, [category]: value });
    };

    const handleRatingHover = (category, value) => {
        setHoveredRating({ ...hoveredRating, [category]: value });
    };

    const handleRatingLeave = (category) => {
        setHoveredRating({ ...hoveredRating, [category]: 0 });
    };

    const handleSubmit = async () => {
        if (
            rating.communication === 0 ||
            rating.quality === 0 ||
            rating.timeliness === 0 ||
            rating.professionalism === 0
        ) {
            alert(isVietnamese ? 'Vui lòng chấm điểm đầy đủ tất cả tiêu chí' : 'Please rate all categories');
            return;
        }
        if (!contractId || !milestoneId || !recipientId) {
            alert(isVietnamese ? 'Thiếu thông tin đánh giá' : 'Missing IDs!');
            return;
        }

        const fixedContractId = String(contractId);
        const fixedMilestoneId = String(milestoneId);
        const fixedRecipientId = String(recipientId);

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/reviews/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('fptp_token')}`,
                },
                body: JSON.stringify({
                    contractId: fixedContractId,
                    milestoneId: fixedMilestoneId,
                    recipientId: fixedRecipientId,
                    rating,
                    comment,
                    visibility,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                console.error(err);
                throw new Error(err.message || (isVietnamese ? 'Không thể gửi đánh giá' : 'Failed to create review'));
            }

            await response.json();
            alert(isVietnamese ? 'Đánh giá đã được gửi thành công!' : 'Review submitted successfully!');
            onSubmitted?.();
            handleClose();
        } catch (error) {
            console.error('Error:', error);
            alert((isVietnamese ? 'Lỗi khi gửi đánh giá: ' : 'Error submitting review: ') + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setRating({
            communication: 0,
            quality: 0,
            timeliness: 0,
            professionalism: 0,
        });
        setComment('');
        setVisibility('public');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{isVietnamese ? 'Đánh giá freelancer' : 'Review Product'}</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            {contractTitle} - {milestoneTitle}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{isVietnamese ? 'Đang đánh giá:' : 'Reviewing:'} {recipientName}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="rounded-lg p-1 hover:bg-slate-100"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Rating Section */}
                <div className="mt-6 space-y-6">
                    {ratingCategories.map((category) => (
                        <div key={category.key}>
                            <label className="block text-sm font-semibold text-slate-900">
                                {category.label}
                            </label>
                            <div className="mt-2 flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleRatingClick(category.key, star)}
                                        onMouseEnter={() => handleRatingHover(category.key, star)}
                                        onMouseLeave={() => handleRatingLeave(category.key)}
                                        className="rounded-lg p-1 transition-colors hover:bg-slate-100"
                                    >
                                        <Star
                                            className={`h-6 w-6 ${star <=
                                                (hoveredRating[category.key] || rating[category.key] || 0)
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-slate-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Comment Section */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-900">
                        {isVietnamese ? 'Nhận xét thêm (không bắt buộc)' : 'Additional Comments (Optional)'}
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={1000}
                        rows={4}
                        placeholder={isVietnamese ? 'Chia sẻ trải nghiệm khi làm việc với freelancer này...' : 'Share your experience working with this person...'}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm placeholder-slate-400 focus:border-teal-600 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                        {comment.length}/1000 {isVietnamese ? 'ký tự' : 'characters'}
                    </p>
                </div>

                {/* Visibility Section */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-900">
                        {isVietnamese ? 'Hiển thị đánh giá' : 'Review Visibility'}
                    </label>
                    <div className="mt-2 space-y-2">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="visibility"
                                value="public"
                                checked={visibility === 'public'}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="h-4 w-4"
                            />
                            <span className="ml-3 text-sm text-slate-700">
                                {isVietnamese ? 'Công khai - Hiển thị trên hồ sơ' : 'Public - Visible on profile'}
                            </span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="visibility"
                                value="private"
                                checked={visibility === 'private'}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="h-4 w-4"
                            />
                            <span className="ml-3 text-sm text-slate-700">
                                {isVietnamese ? 'Riêng tư - Chỉ người nhận và quản trị viên nhìn thấy' : 'Private - Only visible to the recipient and admins'}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3 border-t border-slate-200 pt-4">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        {isVietnamese ? 'Hủy' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                    >
                        {loading ? (isVietnamese ? 'Đang gửi...' : 'Submitting...') : (isVietnamese ? 'Gửi đánh giá' : 'Submit Review')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewPanel;
