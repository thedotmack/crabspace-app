# CrabSpace UI Modernization Plan

> Strip MySpace theming, create clean modern social feed

---

## Phase 0: Current State Analysis (Complete)

### Files with MySpace Styling

| File | Issue |
|------|-------|
| `src/app/globals.css` | Glitter/sparkle/rainbow animations, purple scrollbars |
| `src/app/page.tsx` | Marquee, sparkles, #000080 bg, Impact font |
| `src/app/feed/page.tsx` | Purple/green colors, sparkles, Impact font |
| `src/app/post/[id]/page.tsx` | MySpace colors (likely) |
| `src/app/create/page.tsx` | MySpace colors (likely) |
| `src/components/Sparkles.tsx` | Remove entirely |
| `src/components/PostGrid.tsx` | #FF00FF/#00FF00 colors |

### What to Keep
- All backend logic (untouched)
- $CMEM economy
- Engagement system
- API routes
- Database schema

---

## Phase 1: Clean globals.css

### Tasks
1. Remove all MySpace animations (glitter, sparkle, rainbow, blink, marquee)
2. Set clean color scheme:
   - Background: `#000` (dark) or `#fafafa` (light)
   - Foreground: `#fff` or `#171717`
   - Accent: `#f97316` (orange - crab color)
3. Clean scrollbars (default or subtle)
4. Modern body font (Inter or system)

### New globals.css
```css
@import "tailwindcss";

:root {
  --background: #000000;
  --foreground: #ffffff;
  --accent: #f97316;
  --muted: #a1a1aa;
  --border: #27272a;
  --card: #18181b;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, sans-serif;
}

/* Remove all MySpace animations - delete everything else */
```

### Verification
- [ ] No animation keyframes in globals.css
- [ ] No #FF00FF or #00FF00 colors
- [ ] Dark, clean appearance

### Anti-Patterns
- Do NOT add new animations
- Do NOT use Impact font
- Do NOT use neon colors

---

## Phase 2: Modern Homepage (Feed-First)

### Tasks
1. Replace page.tsx with feed-first design
2. Remove Sparkles component import
3. Remove marquee
4. Clean header with minimal nav
5. Show feed directly on homepage

### New Structure
```tsx
// Simple clean header
<header className="border-b border-zinc-800 bg-black/50 backdrop-blur sticky top-0 z-50">
  <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
    <Link href="/" className="text-xl font-bold">🦀 CrabSpace</Link>
    <nav className="flex gap-4">
      <Link href="/create">Create</Link>
      <Link href="/signup">Join</Link>
    </nav>
  </div>
</header>

// Feed is the main content
<main className="max-w-2xl mx-auto px-4 py-6">
  <PostGrid posts={posts} />
</main>
```

### Verification
- [ ] No sparkles
- [ ] No marquee
- [ ] Feed visible on homepage
- [ ] Clean typography

---

## Phase 3: Modern Feed Page

### Tasks
1. Strip MySpace colors from feed/page.tsx
2. Use Tailwind dark theme colors
3. Clean card-based layout
4. Subtle hover effects (no borders, just opacity)

### Color Updates
```
OLD → NEW
#000080 → black
#FF00FF → zinc-700 (borders) or orange-500 (accent)
#00FF00 → zinc-400 (text) or white
Impact → system-ui
```

### Verification
- [ ] Dark theme, not neon
- [ ] No purple/green
- [ ] Cards have subtle styling

---

## Phase 4: Modern PostGrid Component

### Tasks
1. Remove accentColor/textColor props (use CSS vars)
2. Clean hover state (opacity change, not colored border)
3. Rounded corners on images
4. Subtle shadows

### Updated Component
```tsx
<div className="grid grid-cols-3 gap-1">
  {posts.map((post) => (
    <Link
      key={post.id}
      href={`/post/${post.id}`}
      className="relative aspect-square overflow-hidden rounded-sm group"
    >
      <img src={post.imageUrl} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
        <span className="text-white font-semibold">❤️ {post.likeCount}</span>
        <span className="text-white font-semibold">💬 {post.commentCount}</span>
      </div>
    </Link>
  ))}
</div>
```

### Verification
- [ ] No color props
- [ ] Hover shows overlay with opacity transition
- [ ] Clean grid gaps

---

## Phase 5: Modern Post Detail Page

### Tasks
1. Clean post/[id]/page.tsx styling
2. Full-width image
3. Clean comment section
4. Minimal chrome

### Layout
```
┌─────────────────────────────┐
│ ← Back          @username   │ Header
├─────────────────────────────┤
│                             │
│         [IMAGE]             │ Full width
│                             │
├─────────────────────────────┤
│ ❤️ 42   💬 8               │ Stats
│ Caption text here...        │
├─────────────────────────────┤
│ Comments                    │
│ @user1: comment...          │
│ @user2: comment...          │
├─────────────────────────────┤
│ [Add a comment...]    Post  │ Input
└─────────────────────────────┘
```

### Verification
- [ ] No MySpace colors
- [ ] Image is prominent
- [ ] Comments are readable

---

## Phase 6: Modern Create Page

### Tasks
1. Clean create/page.tsx
2. Simple form layout
3. Clear cost indicator
4. Clean preview

### Verification
- [ ] No neon colors
- [ ] Clean form
- [ ] Balance/cost clearly visible

---

## Phase 7: Delete Sparkles Component

### Tasks
1. Delete src/components/Sparkles.tsx
2. Remove all imports of Sparkles from pages
3. Check for any remaining MySpace components

### Verification
- [ ] Sparkles.tsx deleted
- [ ] No import errors
- [ ] grep -r "Sparkles" returns nothing

---

## Phase 8: Final Cleanup & Verify

### Tasks
1. `npm run build` succeeds
2. Grep for remaining MySpace artifacts:
   - `#FF00FF`
   - `#00FF00`
   - `#000080`
   - `Impact`
   - `sparkle`
   - `glitter`
   - `marquee`
3. Visual review of all pages

### Pages to Check
- [ ] / (homepage)
- [ ] /feed
- [ ] /post/[id]
- [ ] /create
- [ ] /signup
- [ ] /onboard
- [ ] /browse
- [ ] /[username] (profile)

### Verification
- [ ] Build passes
- [ ] No MySpace colors in grep
- [ ] All pages look clean

---

## Design System Summary

### Colors
```
Background: #000000
Card: #18181b
Border: #27272a
Text: #ffffff
Muted text: #a1a1aa
Accent: #f97316 (orange)
Success: #22c55e
Error: #ef4444
```

### Typography
```
Font: system-ui, -apple-system, sans-serif
Sizes: text-sm (14px), text-base (16px), text-xl (20px)
Weight: normal, semibold, bold
```

### Spacing
```
Container: max-w-2xl mx-auto px-4
Gaps: gap-1 (grid), gap-4 (sections)
Padding: py-3 (header), py-6 (sections)
```

### Effects
```
Hover: opacity-80 or bg-zinc-800
Transitions: transition (150ms default)
Borders: border border-zinc-800
Rounded: rounded-sm (subtle), rounded-lg (cards)
```

---

## Execution Order

| Phase | Effort |
|-------|--------|
| 1. globals.css | 15 min |
| 2. Homepage | 30 min |
| 3. Feed page | 20 min |
| 4. PostGrid | 15 min |
| 5. Post detail | 30 min |
| 6. Create page | 20 min |
| 7. Delete Sparkles | 5 min |
| 8. Final cleanup | 15 min |

**Total: ~2.5 hours**

---

*Ready for execution with `/do-plan`*
