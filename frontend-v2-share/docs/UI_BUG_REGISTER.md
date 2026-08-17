# UI BUG REGISTER

## Overview
This register enumerates **visual and interaction bugs** discovered across the StreamVibe frontend during Phase 1 forensic analysis. Each entry includes:
- **Location** (page / component)
- **Description** of the defect
- **Impact** (UI disruption, accessibility, performance, etc.)
- **Suggested Fix** (high‑level guidance for later implementation)

---

### 1. Header / Sidebar Layout Collisions
- **Location:** `components/app-chrome.tsx`, `components/layout/header.tsx`, `components/layout/sidebar.tsx`
- **Description:** The `Sidebar` and `Header` are forced‑rendered on every route, causing overlapping UI on auth pages, admin pages, and full‑screen watch pages. The sidebar does not collapse properly on mobile, leading to hidden content.
- **Impact:** Content overflow, unusable navigation on small screens, violates mobile‑first requirement.
- **Suggested Fix:** Introduce route‑aware layout using Next.js **layout nesting**; render `Header` globally, `Sidebar` only on pages that need it. Add responsive drawer for mobile.

---

### 2. Inconsistent Spacing & Sizing
- **Location:** Multiple pages (`app/page.tsx`, `app/genre/[name]/page.tsx`, `app/admin/*`)
- **Description:** Hard‑coded pixel classes (`w-40`, `h-14`, `text-[#00FFA3]`) cause mis‑alignment across breakpoints. Elements appear too small on high‑resolution displays and cramped on mobile.
- **Impact:** Poor visual hierarchy, broken layout, violates design standards.
- **Suggested Fix:** Replace absolute sizes with design‑system tokens (`spacing-4`, `size-10`), use `rem`/`clamp()` for scalable typography.

---

### 3. Color Contrast Issues
- **Location:** Genre pill links (`bg-[#0F171A] text-[#94A3B8]`), button hover states.
- **Description:** Light gray text over dark backgrounds fails WCAG AA contrast, especially in dark mode.
- **Impact:** Accessibility violation, readability problems for users with visual impairments.
- **Suggested Fix:** Use approved palette from design system (e.g., `text-zinc-100` on `bg-zinc-800`). Apply `focus-visible` outlines.

---

### 4. Missing ARIA Labels & Alt Text
- **Location:** Icon components (`<Flame/>`, `<Film/>`, `<Tv/>`), image elements inside `MediaCard` and `HeroBanner`.
- **Description:** Icons lack `aria-label`, images lack descriptive `alt` attributes, screen readers cannot convey meaning.
- **Impact:** Accessibility regression for blind users.
- **Suggested Fix:** Add `aria-label="Trending"` etc., provide meaningful alt text derived from media titles.

---

### 5. Voice UI Fragmentation
- **Location:** `Header` voice toggle button, floating `VoiceOrb` component, `VoiceAssistantProvider`.
- **Description:** Multiple entry points lead to inconsistent state; voice activation overlay sometimes covers important UI elements.
- **Impact:** Confusing user experience, potential overlay clipping.
- **Suggested Fix:** Consolidate to a single, globally positioned `VoiceOrb` that toggles via a unified context. Ensure overlay respects safe‑area insets.

---

### 6. Watch Page Layout Overflow
- **Location:** `app/watch/movie/[id]/page.tsx`, `app/watch/series/[id]/[episodeId]/page.tsx`
- **Description:** Video player is constrained by parent containers with fixed width, causing black bars and clipped controls on wide screens. Controls overlap with related carousel.
- **Impact:** Media playback experience feels like a generic player, not a premium streaming platform.
- **Suggested Fix:** Use a responsive container (`aspect-w-16 aspect-h-9`) that expands to full width on desktop, with a detachable mini‑player for picture‑in‑picture.

---

### 7. Loading Skeleton Mismatch
- **Location:** `HomeSkeleton` (in `app/page.tsx`), other skeleton components.
- **Description:** Skeleton shapes do not match the final content (e.g., height/width differ), causing jarring layout shifts when data loads.
- **Impact:** CLS (Cumulative Layout Shift) penalty, visual disruption.
- **Suggested Fix:** Align skeleton dimensions exactly with the component they replace; use `aspect-[2/3]` for media cards.

---

### 8. Form Validation Feedback Missing
- **Location:** Login, Register, Profile forms.
- **Description:** No inline validation messages; errors only displayed after submission.
- **Impact:** Poor UX, users unaware of required fields until submit.
- **Suggested Fix:** Implement real‑time validation with accessible error messages (`aria-describedby`).

---

### 9. Pagination / Load‑More Buttons Not Keyboard Accessible
- **Location:** Movies, Series, Admin tables.
- **Description:** Buttons lack `tabindex`/focus styles, making them invisible to keyboard navigation.
- **Impact:** Accessibility breach, fails WCAG 2.1.
- **Suggested Fix:** Ensure all interactive elements are focusable and have visible focus rings.

---

### 10. Dark‑Mode Color Bleed
- **Location:** Many components use hard‑coded hex colors for text (`#F8FAFC` on dark bg) that do not adapt.
- **Description:** In dark mode, certain texts become too bright, causing eye strain; some backgrounds use near‑black `#0F171A` which lacks depth.
- **Impact:** Inconsistent theme, visual fatigue.
- **Suggested Fix:** Define theme tokens (`color-primary`, `color-surface`) that switch between light/dark values via CSS variables.

---

## Prioritization (High → Low)
1. Header/Sidebar layout (critical navigation) 
2. Accessibility fixes (ARIA, contrast) 
3. Watch page layout (core product experience) 
4. Responsive sizing & spacing 
5. Voice UI consolidation 
6. Loading skeleton alignment 
7. Form validation 
8. Pagination keyboard support 
9. Color tokenization for dark mode 
10. Minor spacing inconsistencies

*Generated by Antigravity during Phase 1 forensic analysis.*
