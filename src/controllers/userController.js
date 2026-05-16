import { ensureEmailIsAvailable, findAccountByIdAndRole } from '../services/accountService.js';

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

function sanitizePublicProfile(user) {
  const freelancerProfile = user.settings?.freelancerProfile || {};

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    fullName: user.fullName || user.email || '',
    avatar: user.avatar || '',
    headline: user.headline || freelancerProfile.headline || '',
    settings: {
      freelancerProfile: {
        headline: freelancerProfile.headline || user.headline || '',
        skills: Array.isArray(freelancerProfile.skills) ? freelancerProfile.skills : [],
        portfolioUrl: freelancerProfile.portfolioUrl || '',
        cvFileName: freelancerProfile.cvFileName || '',
        cvFileType: freelancerProfile.cvFileType || '',
        cvDataUrl: freelancerProfile.cvDataUrl || '',
      },
    },
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

export async function getPublicProfile(req, res) {
  const { role, userId } = req.params;

  if (!['client', 'freelancer'].includes(role)) {
    const error = new Error('Unsupported profile role');
    error.statusCode = 400;
    throw error;
  }

  const { account } = await findAccountByIdAndRole(userId, role);

  if (!account) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    message: 'Profile fetched successfully',
    user: sanitizePublicProfile(account),
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
    await ensureEmailIsAvailable(normalizedEmail, req.user);

    updates.email = normalizedEmail;
  }

  const user = await req.accountModel.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select('-password');

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

  const user = await req.accountModel.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar } },
    { new: true },
  ).select('-password');

  res.status(200).json({
    message: 'Avatar updated successfully',
    user: sanitizeUser(user),
  });
}

export async function updateCv(req, res) {
  const { cvFileName, cvFileType, cvDataUrl } = req.body;

  if (!cvFileName || typeof cvFileName !== 'string') {
    const error = new Error('CV file name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!cvDataUrl || typeof cvDataUrl !== 'string') {
    const error = new Error('CV file data is required');
    error.statusCode = 400;
    throw error;
  }

  if (!cvDataUrl.startsWith('data:')) {
    const error = new Error('CV must be uploaded as a valid file data URL');
    error.statusCode = 400;
    throw error;
  }

  const user = await req.accountModel.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        'settings.freelancerProfile.cvFileName': cvFileName.trim(),
        'settings.freelancerProfile.cvFileType': typeof cvFileType === 'string' ? cvFileType.trim() : '',
        'settings.freelancerProfile.cvDataUrl': cvDataUrl,
      },
    },
    { new: true },
  ).select('-password');

  res.status(200).json({
    message: 'CV uploaded successfully',
    user: sanitizeUser(user),
  });
}

export async function getCv(req, res) {
  const { role, userId } = req.params;
  const { account } = await findAccountByIdAndRole(userId, role);

  if (!account) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  const profile = account.settings?.freelancerProfile || {};
  if (!profile.cvDataUrl) {
    const error = new Error('CV not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    cvFileName: profile.cvFileName || 'cv',
    cvFileType: profile.cvFileType || '',
    cvDataUrl: profile.cvDataUrl,
  });
}

export async function updateUserSettings(req, res) {
  const { roleSettings, notifications, language, bankAccount } = req.body;
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
    if (typeof roleSettings.cvFileName === 'string') {
      updates['settings.freelancerProfile.cvFileName'] = roleSettings.cvFileName.trim();
    }
    if (typeof roleSettings.cvFileType === 'string') {
      updates['settings.freelancerProfile.cvFileType'] = roleSettings.cvFileType.trim();
    }
    if (typeof roleSettings.cvDataUrl === 'string') {
      updates['settings.freelancerProfile.cvDataUrl'] = roleSettings.cvDataUrl;
    }
    if (Array.isArray(roleSettings.skills)) {
      updates['settings.freelancerProfile.skills'] = roleSettings.skills
        .map((skill) => `${skill}`.trim())
        .filter(Boolean);
    }
  }

  if (bankAccount && typeof bankAccount === 'object') {
    if (typeof bankAccount.bankName === 'string') {
      updates['settings.bankAccount.bankName'] = bankAccount.bankName.trim();
    }
    if (typeof bankAccount.accountName === 'string') {
      updates['settings.bankAccount.accountName'] = bankAccount.accountName.trim();
    }
    if (typeof bankAccount.accountNumber === 'string') {
      updates['settings.bankAccount.accountNumber'] = bankAccount.accountNumber.trim();
    }
    if (typeof bankAccount.swiftCode === 'string') {
      updates['settings.bankAccount.swiftCode'] = bankAccount.swiftCode.trim();
    }
  }

  const user = await req.accountModel.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select('-password');

  res.status(200).json({
    message: 'Settings updated successfully',
    user: sanitizeUser(user),
  });
}
