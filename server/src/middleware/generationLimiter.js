const mongoose = require('mongoose');

// Admin emails - unrestricted unlimited generation
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'justforfun09786@gmail.com')
  .toLowerCase()
  .split(',')
  .map(e => e.trim());

// In-memory counter cache: `${userId/email}_${YYYY-MM-DD}` -> count
const dailyGenerationCounts = new Map();

function getTodayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function isUserAdmin(user, email, headers) {
  if (user?.role === 'admin' || user?.plan === 'enterprise') return true;
  const userEmail = (user?.email || email || headers?.['x-user-email'] || '').toLowerCase().trim();
  if (userEmail && ADMIN_EMAILS.some(adm => userEmail === adm || userEmail.startsWith(adm.split('@')[0]))) {
    return true;
  }
  return false;
}

function getUserDailyUsage(userId, userEmail, user, headers) {
  const today = getTodayKey();
  const idKey = (userEmail || userId || user?._id || user?.id || 'guest_user').toLowerCase().trim();
  const fullKey = `${idKey}_${today}`;
  const isAdmin = isUserAdmin(user, userEmail, headers);

  const used = dailyGenerationCounts.get(fullKey) || 0;
  const limit = 10;
  const left = isAdmin ? 'Unlimited' : Math.max(0, limit - used);

  return {
    today,
    isAdmin,
    dailyLimit: limit,
    generationsUsed: used,
    generationsLeft: left,
    canGenerate: isAdmin || used < limit
  };
}

function recordGeneration(userId, userEmail, user, headers) {
  const today = getTodayKey();
  const idKey = (userEmail || userId || user?._id || user?.id || 'guest_user').toLowerCase().trim();
  const fullKey = `${idKey}_${today}`;
  const current = dailyGenerationCounts.get(fullKey) || 0;
  dailyGenerationCounts.set(fullKey, current + 1);
  return getUserDailyUsage(userId, userEmail, user, headers);
}

module.exports = {
  ADMIN_EMAILS,
  getUserDailyUsage,
  recordGeneration,
  isUserAdmin
};
