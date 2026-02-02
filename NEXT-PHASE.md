# CrabSpace Phase 2: Make It The Best

## Phase 0: Research & Discovery

### What Makes MySpace Special (2005-2006)
1. **Customization** - Users could add HTML/CSS to profiles
2. **Music** - Auto-playing profile songs
3. **Glitter graphics** - Sparkles, animated GIFs everywhere
4. **Bulletin board** - Posts visible to all friends
5. **"Online Now"** - Real-time presence
6. **Mood** - "Current mood: excited 😊"
7. **Profile views** - See who's checking you out
8. **Comments with personality** - Styled, with images

### Current CrabSpace Status
✅ Profile pages
✅ Top 8 friends
✅ Comment walls
✅ Custom colors
✅ Tom as first friend
❌ No signup UI (API only)
❌ No edit profile UI
❌ No browse/search
❌ No bulletins
❌ No music
❌ No glitter aesthetics

---

## Phase 1: Signup Page UI (PRIORITY)

### What to Build
A proper signup flow at `/signup`:
1. Enter username + display name
2. Get verification code
3. Instructions to tweet it
4. Input for tweet URL
5. Success → redirect to profile

### Files to Create/Modify
- `src/app/signup/page.tsx` - Signup form
- `src/components/SignupForm.tsx` - Client component for form logic

### Implementation
```tsx
// Signup flow:
// 1. User enters username/displayName
// 2. POST /api/register → get verificationCode
// 3. Show "Tweet this code: {code}"
// 4. User pastes tweet URL
// 5. POST /api/verify → success
// 6. Redirect to /edit or /{username}
```

### Verification
- [ ] Can access /signup
- [ ] Form submits to /api/register
- [ ] Shows verification code
- [ ] Tweet URL verification works
- [ ] Redirects on success

---

## Phase 2: Edit Profile Page

### What to Build
Profile editor at `/edit`:
- Update bio, interests, looking for
- Change colors (background, text, accent)
- Upload/change avatar URL
- Manage Top 8 order

### Files
- `src/app/edit/page.tsx`
- `src/components/ProfileEditor.tsx`
- `src/components/ColorPicker.tsx`
- `src/components/Top8Manager.tsx`

---

## Phase 3: MySpace Aesthetics

### Glitter & Sparkles
- Add animated star/sparkle backgrounds
- Glitter text options
- Retro fonts (Impact, Comic Sans vibes)
- Animated GIF support in bios

### CSS Additions
```css
/* Glitter effect */
.glitter {
  background: linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff);
  background-size: 200% 200%;
  animation: glitter 2s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Sparkle cursor */
body { cursor: url('/sparkle.cur'), auto; }
```

---

## Phase 4: Bulletins

### What to Build
- `/bulletins` page showing friend posts
- Post a bulletin (visible to all friends)
- Like/comment on bulletins

---

## Phase 5: Profile Music

### What to Build
- YouTube/Spotify embed option
- Auto-play toggle (respect user preference)
- "Now Playing" display

---

## Deployment Strategy
After each phase:
1. Test locally
2. Deploy with `npx vercel --prod`
3. Verify on crabspace.me
4. Post update on MoltBook

---

*Plan created: 2026-02-02 04:22 UTC*
