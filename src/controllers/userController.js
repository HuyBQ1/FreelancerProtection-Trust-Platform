import User from '../models/User.js';

function sanitizeUser(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    fullName: user.fullName || '',
    avatar: user.avatar || '',
    companyName: user.companyName || '',
    headline: user.headline || '',
    settings: user.settings || {},
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getProfile(req, res) {
  res.status(200).json({
    message: 'Profile fetched successfully',
    user: sanitizeUser(req.user),
  });
}

export async function updateProfile(req, res) {
  const { fullName, email, companyName, headline, language } = req.body;
  const updates = {};

  if (typeof fullName === 'string') {
    updates.fullName = fullName.trim();
  }

  if (typeof companyName === 'string') {
    updates.companyName = companyName.trim();
    updates['settings.clientProfile.companyName'] = companyName.trim();
  }

  if (typeof headline === 'string') {
    updates.headline = headline.trim();
    updates['settings.freelancerProfile.headline'] = headline.trim();
  }

  if (typeof language === 'string' && ['en', 'vi'].includes(language)) {
    updates['settings.language'] = language;
  }

  if (typeof email === 'string' && email.trim()) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      const error = new Error('Email is already in use');
      error.statusCode = 409;
      throw error;
    }

    updates.email = normalizedEmail;
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select('-password');

  res.status(200).json({
    message: 'Profile updated successfully',
    user: sanitizeUser(user),
  });
}

export async function updateAvatar(req, res) {
  const { avatar } = req.body;

  if (!avatar || typeof avatar !== 'string') {
    const error = new Error('Avatar is required');
    error.statusCode = 400;
    throw error;
  }

  if (!avatar.startsWith('data:image/')) {
    const error = new Error('Avatar must be a valid image data URL');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar } },
    { new: true },
  ).select('-password');

  res.status(200).json({
    message: 'Avatar updated successfully',
    user: sanitizeUser(user),
  });
}

export async function updateUserSettings(req, res) {
  const { roleSettings, notifications, language } = req.body;
  const updates = {};

  if (typeof language === 'string' && ['en', 'vi'].includes(language)) {
    updates['settings.language'] = language;
  }

  if (notifications && typeof notifications === 'object') {
    if (typeof notifications.contractAlerts === 'boolean') {
      updates['settings.notifications.contractAlerts'] = notifications.contractAlerts;
    }
    if (typeof notifications.payoutAlerts === 'boolean') {
      updates['settings.notifications.payoutAlerts'] = notifications.payoutAlerts;
    }
    if (typeof notifications.weeklySummary === 'boolean') {
      updates['settings.notifications.weeklySummary'] = notifications.weeklySummary;
    }
  }

  if (roleSettings && typeof roleSettings === 'object') {
    if (typeof roleSettings.companyName === 'string') {
      updates['settings.clientProfile.companyName'] = roleSettings.companyName.trim();
      updates.companyName = roleSettings.companyName.trim();
    }
    if (typeof roleSettings.companyWebsite === 'string') {
      updates['settings.clientProfile.companyWebsite'] = roleSettings.companyWebsite.trim();
    }
    if (typeof roleSettings.billingEmail === 'string') {
      updates['settings.clientProfile.billingEmail'] = roleSettings.billingEmail.trim();
    }
    if (typeof roleSettings.headline === 'string') {
      updates['settings.freelancerProfile.headline'] = roleSettings.headline.trim();
      updates.headline = roleSettings.headline.trim();
    }
    if (typeof roleSettings.portfolioUrl === 'string') {
      updates['settings.freelancerProfile.portfolioUrl'] = roleSettings.portfolioUrl.trim();
    }
    if (Array.isArray(roleSettings.skills)) {
      updates['settings.freelancerProfile.skills'] = roleSettings.skills
        .map((skill) => `${skill}`.trim())
        .filter(Boolean);
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select('-password');

  res.status(200).json({
    message: 'Settings updated successfully',
    user: sanitizeUser(user),
  });
}
