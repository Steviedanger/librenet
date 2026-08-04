/**
 * Badge Engine for LibreNet.
 * Checks and awards badges to a user based on their activity.
 * Call `awardBadges(user)` after any action that might unlock a badge.
 */

const BADGES = [
  // --- Borrowing Badges ---
  {
    id: 'new_member',
    name: 'New Member',
    description: 'Borrowed your first book',
    icon: '🆕',
    check: (user) => user.totalBorrows >= 1,
  },
  {
    id: 'regular_reader',
    name: 'Regular Reader',
    description: 'Borrowed 10 books',
    icon: '⭐',
    check: (user) => user.totalBorrows >= 10,
  },
  {
    id: 'power_reader',
    name: 'Power Reader',
    description: 'Borrowed 25 books',
    icon: '🔥',
    check: (user) => user.totalBorrows >= 25,
  },

  // --- Reading Badges ---
  {
    id: 'first_read',
    name: 'First Read',
    description: 'Finished your first book',
    icon: '🥇',
    check: (user) => user.totalBooksRead >= 1,
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Read 5 books',
    icon: '📚',
    check: (user) => user.totalBooksRead >= 5,
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Read 10 books',
    icon: '🎓',
    check: (user) => user.totalBooksRead >= 10,
  },
  {
    id: 'bibliophile',
    name: 'Bibliophile',
    description: 'Read 25 books',
    icon: '📖',
    check: (user) => user.totalBooksRead >= 25,
  },

  // --- Good Behaviour Badges ---
  {
    id: 'on_time',
    name: 'On Time',
    description: 'Returned 5 books before the due date',
    icon: '✅',
    check: (user) => user.onTimeReturns >= 5,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Returned 10 books before the due date',
    icon: '⚡',
    check: (user) => user.onTimeReturns >= 10,
  },
  {
    id: 'perfect_record',
    name: 'Perfect Record',
    description: 'Never received a fine',
    icon: '🏅',
    check: (user) => user.neverHadFine === true && user.totalBorrows >= 3,
  },
];

/**
 * Check all badges and award any that the user has earned but not yet received.
 * Mutates the user object and saves it if new badges were awarded.
 * Returns the list of newly awarded badges.
 */
export const awardBadges = async (user) => {
  const existingIds = new Set(user.badges.map((b) => b.id));
  const newBadges = [];

  for (const badge of BADGES) {
    if (!existingIds.has(badge.id) && badge.check(user)) {
      newBadges.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        earnedAt: new Date(),
      });
    }
  }

  if (newBadges.length > 0) {
    user.badges.push(...newBadges);
    await user.save();
  }

  return newBadges;
};

export const ALL_BADGES = BADGES;