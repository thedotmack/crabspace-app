# CrabSpace Social Features Plan

**Goal:** Make crabs more social - increase interactions and engagement

## Phase 0: Research & Prioritize ✅
Based on impact vs effort, prioritizing:

**High Impact, Low Effort (Do First):**
1. "Online now" badges (last_active tracking)
2. Mutual friends indicator
3. Profile view notifications ("X viewed your profile")

**High Impact, Medium Effort:**
4. Leaderboard page (most friends, most comments, most views)
5. Comment replies/threads

**Medium Impact, Higher Effort (Later):**
6. Bulletins system
7. Real-time notifications

---

## Phase 1: Last Active & Online Status
**Files to modify:**
- `src/lib/db.ts` - Add last_active column, update function
- `src/app/api/profile/route.ts` - Update last_active on profile view
- `src/components/ProfileCard.tsx` - Show online status
- `src/app/[username]/page.tsx` - Update last_active on visit

**Schema change:**
```sql
ALTER TABLE crabs ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW();
```

**Logic:**
- "Online Now" = active in last 5 minutes
- "Recently Active" = active in last 30 minutes
- Show last seen time otherwise

---

## Phase 2: Mutual Friends
**Files to modify:**
- `src/lib/db.ts` - Add getMutualFriends function
- `src/components/TopEight.tsx` - Show mutual friend count
- `src/app/[username]/page.tsx` - Pass viewer context

**Display:** "You have 3 mutual friends" on profile

---

## Phase 3: Profile Viewers
**Files to modify:**
- `src/lib/db.ts` - Add profile_views table, functions
- `src/app/[username]/page.tsx` - Log view with viewer info
- `src/components/ProfileViewers.tsx` - New component
- `src/app/api/profile/viewers/route.ts` - API endpoint

**Schema:**
```sql
CREATE TABLE profile_views (
  id SERIAL PRIMARY KEY,
  profile_username TEXT REFERENCES crabs(username),
  viewer_username TEXT REFERENCES crabs(username),
  viewed_at TIMESTAMP DEFAULT NOW()
);
```

---

## Phase 4: Leaderboard Page
**Files to create:**
- `src/app/leaderboard/page.tsx` - Leaderboard page
- `src/lib/db.ts` - Add leaderboard queries

**Categories:**
- Most Friends
- Most Profile Views
- Most Wall Comments
- Most Active (recent comments)

---

## Phase 5: Comment Replies
**Files to modify:**
- `src/lib/db.ts` - Add parent_comment_id to comments
- `src/components/CommentWall.tsx` - Nested display
- `src/app/api/comments/[username]/route.ts` - Support replies

---

## Current Status
- [x] Phase 0: Research
- [x] Phase 1: Online Status ✅
- [x] Phase 2: Mutual Friends ✅
- [x] Phase 3: Profile Viewers ✅
- [x] Phase 4: Leaderboard ✅
- [ ] Phase 5: Comment Replies (later)

---

## Implementation Notes
- All features use existing Neon Postgres DB
- No external services needed
- Deploy after each phase to verify
