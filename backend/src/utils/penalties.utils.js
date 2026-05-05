const STRIKE_THRESHOLD = 3
const BLOCK_DAYS = 7

function getBlockedUntil() {
  const d = new Date()
  d.setDate(d.getDate() + BLOCK_DAYS)
  return d
}

function isCurrentlyBlocked(user) {
  return user.blockedUntil && user.blockedUntil > new Date()
}

module.exports = { STRIKE_THRESHOLD, BLOCK_DAYS, getBlockedUntil, isCurrentlyBlocked }
