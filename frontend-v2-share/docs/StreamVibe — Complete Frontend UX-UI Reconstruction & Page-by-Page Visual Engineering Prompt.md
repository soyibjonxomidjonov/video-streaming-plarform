# STREAMVIBE — COMPLETE FRONTEND UX/UI RECONSTRUCTION

## ROLE

You are acting simultaneously as:

- Principal Frontend Engineer
- Senior React / Next.js Engineer
- Senior UX Designer
- Senior UI Designer
- Design Systems Architect
- Responsive Web Specialist
- Accessibility Engineer
- Frontend QA Engineer
- Visual Regression Engineer
- Codebase Auditor

You are working on an existing production-oriented Next.js 16 + React 19 + TypeScript frontend.

Your job is NOT to make a few CSS adjustments.

Your job is to perform a **complete page-by-page frontend reconstruction** while preserving all existing backend integrations, API contracts, authentication logic, voice-control functionality, and working business logic unless a frontend bug genuinely requires a change.

---

# 1. PRIMARY OBJECTIVE

The current frontend has a major visual and UX problem:

Many page elements are:

- too small;
- incorrectly positioned;
- poorly proportioned;
- inconsistently spaced;
- visually disconnected;
- incorrectly grouped;
- poorly prioritized;
- too compressed on desktop;
- poorly adapted to mobile;
- inconsistent between pages;
- sometimes overflowing their intended containers;
- sometimes using inappropriate typography;
- sometimes using excessive empty space;
- sometimes using components that are technically reusable but visually unsuitable for the context.

The current application must therefore be treated as a **complete UX/UI reconstruction project**.

Do NOT assume that the existing UI hierarchy is correct simply because the code works.

Do NOT preserve bad layout decisions merely because they already exist.

Do NOT perform a superficial global CSS resize.

Do NOT solve everything with one global component.

Every page must be evaluated independently.

Every meaningful visual element must be evaluated independently.

---

# 2. CRITICAL RULE — DO NOT REDESIGN EVERYTHING AT ONCE

You MUST NOT make one giant global redesign and assume that all pages are now correct.

Work in this exact order:

```text
PHASE 1
Codebase Audit
        ↓
PHASE 2
Global Design System Audit
        ↓
PHASE 3
Shared Component Reconstruction
        ↓
PHASE 4
Page-by-Page Reconstruction
        ↓
Desktop Verification
        ↓
Mobile Verification
        ↓
Visual QA
        ↓
Bug Fix
        ↓
Regression Verification
        ↓
Next Page
```

You must finish and verify one page before moving to the next page.

---

# 3. FIRST TASK — COMPLETE CODEBASE AUDIT

Before modifying UI code, inspect the entire frontend.

Read and understand:

- `app/`
- `components/`
- `lib/`
- `types/`
- `globals.css`
- authentication components
- voice assistant components
- video player
- API abstraction
- route structure
- layouts
- shared components
- responsive logic
- loading states
- error states
- empty states
- forms
- admin interface.

Do not guess what a component does.

Read the implementation.

Do not delete functionality because you do not immediately understand it.

Do not replace backend functionality with mock data.

Do not invent API endpoints.

Do not modify backend code.

---

# 4. CURRENT PROJECT STRUCTURE YOU MUST UNDERSTAND

The current frontend contains approximately 26 primary application routes.

Treat every route below as an independent UX/UI target.

## PUBLIC / USER PAGES

### 01 — HOME

`/`

### 02 — MOVIES

`/movies`

### 03 — SERIES

`/series`

### 04 — GENRES

`/genres`

### 05 — GENRE DETAIL

`/genre/[name]`

### 06 — EXPLORE

`/explore`

### 07 — SEARCH

`/search`

### 08 — FAVORITES

`/favorites`

### 09 — HISTORY

`/history`

### 10 — MOVIE DETAIL

`/movie/[id]`

### 11 — SERIES DETAIL

`/series/[id]`

### 12 — UNIVERSAL WATCH

`/watch/[type]/[id]`

### 13 — MOVIE WATCH

`/watch/movie/[id]`

### 14 — SERIES EPISODE WATCH

`/watch/series/[id]/[episodeId]`

### 15 — PROFILE

`/profile`

### 16 — SETTINGS

`/settings`

---

# AUTHENTICATION

### 17 — LOGIN

`/login`

### 18 — REGISTER

`/register`

### 19 — VERIFY

`/verify`

### 20 — AUTH CALLBACK

`/auth/callback`

---

# ADMIN

### 21 — ADMIN DASHBOARD

`/admin`

### 22 — ADMIN MOVIES

`/admin/movies`

### 23 — ADMIN SERIES

`/admin/series`

### 24 — ADMIN EPISODES

`/admin/episodes`

### 25 — ADMIN GENRES

`/admin/genres`

### 26 — ADMIN USERS

`/admin/users`

### 27 — ADMIN VOICE LOGS

`/admin/voice-logs`

Also fully inspect:

### 404

`not-found.tsx`

---

# 5. SHARED COMPONENTS THAT REQUIRE SPECIAL AUDIT

The following shared components are extremely important because visual mistakes here can propagate across many pages.

Inspect and reconstruct them carefully:

- `components/app-chrome.tsx`
- `components/layout/header.tsx`
- `components/layout/sidebar.tsx`
- `components/media-card.tsx`
- `components/home/hero-banner.tsx`
- `components/voice/voice-widget.tsx`
- `components/voice-orb.tsx`
- `components/voice-assistant-provider.tsx`
- `components/watch-client.tsx`
- `components/profile-client.tsx`
- `components/login-form.tsx`
- `components/register-form.tsx`
- `components/require-auth.tsx`
- `components/auth-provider.tsx`
- `components/ui/button.tsx`
- `components/ui/logo.tsx`
- Google authentication components.

Do NOT blindly modify a shared component to solve a page-specific problem.

First determine:

```text
Is this a GLOBAL design problem?
OR
Is this a PAGE-SPECIFIC design problem?
```

If global:

→ fix the shared component.

If page-specific:

→ create an appropriate variant or page-specific composition.

Never break another page to fix one page.

---

# 6. IMPORTANT EXISTING PROBLEMS ALREADY IDENTIFIED

During the initial audit, the following issues were identified and MUST be investigated rather than ignored.

## MEDIA CARD

The current `MediaCard` has a duration formatting problem.

The existing formatter can produce output conceptually equivalent to:

```text
2s 10d
```

This is incorrect for a media duration.

Correct Uzbek presentation should be human-readable, for example:

```text
2 soat 10 daq
```

or a compact consistent format such as:

```text
2s 10daq
```

Choose one consistent design-system format.

Also audit:

- poster proportions;
- card width;
- card height;
- title size;
- metadata size;
- rating badge;
- content-type badge;
- hover state;
- play overlay;
- card spacing;
- grid density;
- mobile sizing;
- long titles;
- missing poster;
- image failure;
- accessibility;
- keyboard focus.

---

# 7. CURRENT GLOBAL LAYOUT MUST BE RECONSIDERED

The existing application uses:

- desktop sidebar;
- top header;
- mobile bottom navigation;
- floating voice widget.

Do NOT assume their current dimensions are correct.

The entire layout hierarchy must be redesigned so that:

```text
Desktop:
Sidebar
+
Header
+
Main Content
```

and:

```text
Mobile:
Mobile Header
+
Main Content
+
Bottom Navigation
+
Floating Voice Assistant
```

work together without collisions.

The main content must never:

- hide behind navigation;
- become excessively narrow;
- become excessively wide;
- have arbitrary empty margins;
- have text touching viewport edges;
- overlap the voice assistant;
- overlap fixed navigation.

---

# 8. DESIGN SYSTEM RECONSTRUCTION

Before redesigning pages, create a coherent visual system.

The existing visual direction is a dark streaming platform with an emerald/mint accent.

Preserve the general brand direction, but refine it professionally.

## COLOR SYSTEM

Use a coherent hierarchy:

```text
Background
Surface
Surface Elevated
Surface Hover
Border
Primary
Primary Soft
Text Primary
Text Secondary
Text Muted
Success
Warning
Danger
```

Do not randomly use slightly different greens on different pages.

Do not introduce arbitrary accent colors without reason.

---

# 9. TYPOGRAPHY SYSTEM

The current project uses:

- Outfit
- Plus Jakarta Sans

Keep them unless there is a strong technical reason not to.

But create a real hierarchy.

For example:

```text
Display
H1
H2
H3
Section title
Body large
Body
Body small
Metadata
Caption
Badge
```

Typography must be responsive.

Do NOT allow important headings to become tiny simply because the viewport is smaller.

Do NOT use extremely small text for primary actions.

Do NOT allow labels to overflow their components.

---

# 10. SPACING SYSTEM

Create consistent spacing rules.

Use a predictable rhythm for:

- page padding;
- section spacing;
- card spacing;
- title-to-description;
- description-to-actions;
- input spacing;
- button spacing;
- navigation spacing;
- modal spacing.

Do not solve every spacing problem with arbitrary values.

---

# 11. CONTAINER SYSTEM

The application needs a consistent content width strategy.

On large desktop displays:

- content should use available space intelligently;
- avoid excessive empty margins;
- avoid stretching text to an unreadable width;
- allow media grids to grow naturally;
- maintain a comfortable reading width for text-heavy sections.

On smaller desktop screens:

- preserve usable card sizes;
- reduce gaps intelligently;
- do not simply shrink everything.

---

# 12. DESKTOP REQUIREMENT

Every page must be designed and verified for at least:

```text
1440 × 900
1920 × 1080
```

Also verify intermediate desktop widths.

The 1920px version must not look like a stretched 1440px layout.

The 1440px version must not look like a compressed mobile layout.

---

# 13. MOBILE REQUIREMENT

Every page must have an intentionally designed mobile composition.

At minimum verify:

```text
390 × 844
375 × 812
360px width
```

Do NOT simply rely on desktop CSS shrinking.

Mobile may require:

- different navigation;
- different grid;
- horizontal media rows;
- stacked controls;
- collapsed filters;
- bottom sheets;
- full-width buttons;
- smaller but still readable typography;
- different card composition;
- reordered content;
- hidden secondary information;
- expandable information.

Mobile is a separate UX composition.

---

# 14. TOUCH TARGET REQUIREMENT

Interactive controls must be comfortably tappable.

Important buttons should generally have approximately:

```text
44px+
```

touch area.

Do not create tiny mobile buttons simply to save space.

---

# 15. HOME PAGE — COMPLETE RECONSTRUCTION

Route:

`/`

Audit and redesign every single visible element.

## Header

Inspect:

- logo;
- search;
- search icon;
- voice action;
- admin action;
- login button;
- profile button;
- spacing;
- alignment;
- sticky behavior.

## Hero

Inspect:

- backdrop;
- overlays;
- content alignment;
- badge;
- content type;
- rating;
- year;
- duration;
- title;
- description;
- primary CTA;
- secondary CTA;
- optional right-side visual card;
- responsive behavior.

The hero must have a strong visual hierarchy.

The title must be dominant.

The primary action must be obvious.

Do not allow the hero to consume excessive vertical space on mobile.

## Content sections

Audit every section individually:

- section heading;
- optional description;
- action link;
- media row/grid;
- card sizes;
- gaps;
- section-to-section spacing.

Do not use identical spacing blindly for every section.

## Loading

Create proper skeletons matching the final geometry.

## Empty

Create a deliberate empty state.

## Error

Create a deliberate error state with retry where appropriate.

---

# 16. MOVIES PAGE

Route:

`/movies`

Audit:

- page title;
- result count;
- search;
- filter toggle;
- filter panel;
- ordering;
- genres;
- clear filters;
- active filter state;
- loading;
- empty state;
- movie grid;
- load-more;
- mobile behavior.

Desktop:

Use a media grid that keeps cards visually substantial.

Do not create 6 tiny cards simply because the viewport is wide.

Mobile:

Use an intentional 2-column or contextually appropriate layout.

Ensure card titles and metadata remain readable.

---

# 17. SERIES PAGE

Route:

`/series`

Same depth as Movies, but optimize specifically for series.

Audit:

- search;
- filters;
- ordering;
- genres;
- result count;
- series cards;
- pagination/load-more;
- empty state;
- loading state.

Do not copy the Movies page blindly.

---

# 18. GENRES PAGE

Route:

`/genres`

Create a proper browsing experience.

Each genre should have:

- clear visual identity;
- readable name;
- appropriate touch target;
- hover state;
- active/focus state;
- mobile layout.

Do not leave the page as a collection of tiny text links.

---

# 19. GENRE DETAIL PAGE

Route:

`/genre/[name]`

Audit:

- genre title;
- result count;
- navigation;
- media grid;
- filters if present;
- empty state;
- loading state;
- responsive behavior.

---

# 20. EXPLORE PAGE

Route:

`/explore`

Audit every content group.

Make Explore feel like a discovery experience, not simply another list page.

Use:

- strong section hierarchy;
- visually meaningful media groups;
- clear genre navigation;
- large enough cards;
- responsive composition.

---

# 21. SEARCH PAGE

Route:

`/search`

This page requires special attention.

Current functionality includes:

- semantic search;
- movie search;
- series search;
- voice search;
- quick search tags;
- loading state;
- empty state;
- semantic results;
- movie results;
- series results.

Redesign the entire search experience.

## Search bar

It must feel like the primary interaction of the page.

Optimize:

- height;
- icon;
- input typography;
- voice button;
- clear button;
- focus state.

## Quick search tags

Make them readable and visually balanced.

## Semantic results

Create a clear visual distinction between AI/semantic matches and conventional media results.

Display:

- content type;
- title;
- description;
- similarity;
- action.

Do not make semantic result cards smaller than necessary.

## Movie / Series result grids

Use proper media cards.

---

# 22. FAVORITES PAGE

Route:

`/favorites`

Audit:

- page title;
- user context;
- media grid;
- empty state;
- loading state;
- card density;
- mobile behavior.

The empty state must be useful rather than simply saying nothing exists.

Provide an obvious path back to discovery.

---

# 23. HISTORY PAGE

Route:

`/history`

Audit:

- title;
- history cards;
- progress information;
- timestamps;
- continue-watching action;
- empty state;
- responsive layout.

If backend data supports progress, present it visually.

---

# 24. MOVIE DETAIL PAGE

Route:

`/movie/[id]`

This is one of the most important pages.

Audit:

- backdrop;
- poster;
- title;
- content type;
- rating;
- year;
- duration;
- description;
- genres;
- metadata;
- watch CTA;
- favorite CTA;
- rating;
- comments;
- loading;
- error;
- not-found.

Desktop should use a strong cinematic composition.

Do not compress all information into a small column.

Mobile should reorder content intelligently.

Poster, title and primary action must remain immediately understandable.

---

# 25. SERIES DETAIL PAGE

Route:

`/series/[id]`

Audit:

- backdrop;
- poster;
- title;
- metadata;
- description;
- watch CTA;
- first episode CTA;
- favorite;
- rating;
- episodes;
- episode selection;
- comments;
- loading;
- not-found.

Episode browsing must be easy on mobile.

---

# 26. WATCH PAGES

Routes:

```text
/watch/[type]/[id]
/watch/movie/[id]
/watch/series/[id]/[episodeId]
```

These pages require a dedicated UX architecture.

The video player is the primary object.

Do NOT let secondary UI visually compete with the player.

Audit:

- top navigation;
- back button;
- episode previous/next;
- quality/status indicator;
- player;
- loading state;
- stream error;
- retry;
- title;
- type;
- year;
- favorite;
- rating;
- description;
- episode selector;
- comments;
- comment input;
- comments list;
- toast.

## Player

Maintain:

- proper 16:9 ratio;
- strong visual prominence;
- responsive sizing;
- mobile-safe controls;
- no content overlap.

## Series episodes

Episode selector must be highly usable.

Do not make episode labels microscopic.

Use clear active-state styling.

---

# 27. VOICE ASSISTANT — GLOBAL UX RECONSTRUCTION

The voice assistant is a core product feature.

Do NOT remove it.

Do NOT turn it into a one-time microphone button.

It must remain a persistent platform-level control.

Current relevant components:

- `VoiceWidget`
- `VoiceOrb`
- `VoiceAssistantProvider`
- voice tools
- voice commands
- player bridge.

The assistant should exist as a persistent floating interaction.

## Desktop

It should remain in a consistent corner.

It should be visually noticeable but must NOT dominate the interface.

## Mobile

It must avoid:

- bottom navigation;
- browser safe-area;
- important buttons;
- player controls;
- forms.

## States

Design every state:

1. minimized
2. idle
3. active/listening
4. thinking
5. responding
6. muted
7. error
8. confirmation required.

## Transcript

The transcript must remain readable.

## AI response

The response bubble must not cover important content.

## Confirmation

Confirmation dialogs must be clear and accessible.

## Watch page

The voice assistant must work together with the player.

Voice control must not visually interfere with video controls.

---

# 28. HEADER RECONSTRUCTION

Current Header is shared across many pages.

Rebuild it carefully.

Audit:

- desktop;
- tablet;
- mobile;
- logo;
- search;
- voice action;
- admin action;
- login;
- profile;
- spacing;
- sticky behavior.

Do not duplicate voice controls unnecessarily.

The UX must clearly distinguish:

```text
Search voice action
```

from

```text
Persistent AI Voice Assistant
```

if both are retained.

---

# 29. SIDEBAR RECONSTRUCTION

Current desktop sidebar is narrow.

Do NOT assume narrowness is good.

Evaluate whether:

- icon labels;
- navigation;
- active state;
- logo;
- AI voice;
- settings;
- admin;
- profile

have enough visual room.

The sidebar should feel like intentional product navigation, not a compressed icon strip.

Mobile bottom navigation must be redesigned independently.

---

# 30. AUTH PAGES

Routes:

- `/login`
- `/register`
- `/verify`
- `/auth/callback`

Audit:

## Login

- branding;
- title;
- subtitle;
- email;
- password;
- show/hide password;
- submit;
- loading;
- validation;
- error;
- Google authentication;
- navigation to register.

## Register

Audit:

- all fields;
- validation;
- password rules;
- confirm password;
- submit;
- loading;
- errors;
- Google sign-in;
- navigation to login.

## Verify

Audit:

- email context;
- 6-digit code;
- input behavior;
- resend if supported;
- submit;
- error;
- loading;
- success.

These pages should NOT inherit the full browsing layout if that hurts focus.

They need a dedicated authentication composition.

---

# 31. PROFILE PAGE

Route:

`/profile`

Audit:

- title;
- subtitle;
- avatar;
- avatar upload;
- user name;
- email;
- admin badge;
- quick links;
- statistics;
- personal information;
- first name;
- last name;
- age;
- email read-only;
- save button;
- logout;
- favorites preview.

Do not allow profile content to become an excessively long narrow column on desktop.

Use a strong information hierarchy.

Mobile must stack intelligently.

---

# 32. SETTINGS PAGE

Route:

`/settings`

Audit every setting independently.

Current groups include:

## AI Voice Assistant

- TTS switch;
- voice language;
- voice speed.

## Notifications

- new episode notification.

## Account & Security

- email;
- permission level.

## Save

- saved confirmation;
- save button.

Make each setting visually understandable.

Switches must look like real modern switches.

Select fields must be large enough for touch interaction.

Mobile settings must stack cleanly.

---

# 33. ADMIN LAYOUT

Admin must feel separate from the consumer streaming experience.

Current admin navigation includes:

- Dashboard
- Movies
- Series
- Episodes
- Genres
- Users
- Voice Logs

Do not accidentally expose the consumer mobile navigation inside Admin if it creates confusion.

Create a clear admin information architecture.

---

# 34. ADMIN DASHBOARD

Route:

`/admin`

Audit:

- page heading;
- system status;
- Go Streamer;
- Django REST API;
- AI WebSocket Agent;
- status indicators;
- cards;
- metrics;
- links;
- responsive layout.

Do not simply show raw backend strings.

Turn system information into a professional operational dashboard.

---

# 35. ADMIN MOVIES

Route:

`/admin/movies`

Audit:

- heading;
- add movie;
- search if appropriate;
- table;
- poster;
- title;
- duration;
- channel;
- actions;
- edit;
- delete;
- create form;
- validation;
- loading;
- empty;
- error;
- confirmation.

Desktop should prioritize table readability.

Mobile should NOT force a massive desktop table into a 360px viewport.

Use:

- responsive cards;
- horizontal scrolling only where justified;
- or a mobile-specific row composition.

---

# 36. ADMIN SERIES

Route:

`/admin/series`

Audit:

- title;
- create;
- edit;
- delete;
- title;
- description;
- poster;
- backdrop;
- actions;
- forms;
- validation;
- loading;
- empty;
- errors.

---

# 37. ADMIN EPISODES

Route:

`/admin/episodes`

Audit:

- series selector;
- all-series filter;
- episode number;
- title;
- series ID;
- duration;
- actions;
- create;
- edit;
- delete;
- loading;
- empty;
- validation.

Episode management must be easy to understand even when many episodes exist.

---

# 38. ADMIN GENRES

Route:

`/admin/genres`

Audit:

- list;
- add;
- delete;
- input;
- validation;
- confirmation;
- loading;
- empty;
- error.

Do not leave CRUD controls visually scattered.

---

# 39. ADMIN USERS

Route:

`/admin/users`

Audit:

- user;
- email;
- age;
- role/status;
- loading;
- empty;
- error.

Make user rows highly scannable.

---

# 40. ADMIN VOICE LOGS

Route:

`/admin/voice-logs`

This is especially important because voice functionality is a product differentiator.

Audit:

- timestamp;
- user speech/STT;
- executed tool;
- processing layer;
- latency/speed;
- status;
- filtering;
- readability;
- responsive behavior.

Do not allow logs to become unreadable tiny text.

---

# 41. 404 PAGE

Route:

`not-found.tsx`

Create a polished branded error page.

Include:

- 404;
- explanation;
- primary return action;
- secondary discovery action if appropriate;
- responsive layout.

---

# 42. LOADING STATES

Every asynchronous page must have a designed loading state.

Do NOT use random generic spinners everywhere.

Prefer skeletons that match final geometry.

Examples:

Media card skeleton:

```text
Poster skeleton
+
Title skeleton
+
Metadata skeleton
```

Detail page:

```text
Backdrop skeleton
Poster skeleton
Title skeleton
Description skeleton
Actions skeleton
```

Admin:

```text
Table/header skeleton
```

---

# 43. EMPTY STATES

Every list page must have an intentional empty state.

Examples:

- no movies;
- no series;
- no favorites;
- no history;
- no genres;
- no search results;
- no episodes;
- no users;
- no logs.

Each empty state should answer:

1. What happened?
2. Why is the page empty?
3. What can the user do next?

---

# 44. ERROR STATES

Every API-dependent page must have an appropriate error state.

Include:

- understandable message;
- retry;
- navigation where appropriate.

Do not expose raw backend errors to users.

---

# 45. ACCESSIBILITY

Audit:

- keyboard navigation;
- focus states;
- button labels;
- aria-labels;
- input labels;
- color contrast;
- touch targets;
- semantic headings;
- dialog accessibility;
- screen-reader clarity.

Do not use color alone to communicate status.

---

# 46. RESPONSIVE RULE

Never use this logic:

```text
Desktop UI
↓
Shrink everything
↓
Mobile
```

Instead:

```text
Desktop information architecture
+
Mobile information architecture
```

Mobile may reorder elements.

Mobile may hide secondary metadata.

Mobile may change grids into horizontal rows.

Mobile may convert filter panels into sheets.

Mobile may move actions below content.

This is expected.

---

# 47. VISUAL QUALITY STANDARD

The final result should feel like a professional modern streaming platform.

Target qualities:

- cinematic;
- premium;
- spacious;
- readable;
- confident;
- modern;
- coherent;
- consistent;
- responsive;
- accessible.

Avoid:

- cramped cards;
- tiny text;
- excessive neon;
- excessive borders;
- random rounded corners;
- inconsistent radius;
- inconsistent spacing;
- oversized empty areas;
- tiny controls;
- visually noisy UI;
- unnecessary gradients;
- excessive glassmorphism;
- excessive shadows.

The emerald accent should be used strategically, not everywhere.

---

# 48. COMPONENT PROPORTION RULE

For every component ask:

```text
Is this element large enough for its importance?
```

Primary title:

→ large.

Primary CTA:

→ clearly visible.

Secondary metadata:

→ smaller.

Tertiary information:

→ subtle.

Navigation:

→ readable.

Cards:

→ large enough to identify content.

Do not make every element visually equal.

---

# 49. ELEMENT-BY-ELEMENT AUDIT METHOD

For every page, create an internal checklist:

```text
PAGE
├── Page shell
├── Header
├── Navigation
├── Breadcrumb
├── Title
├── Subtitle
├── Search
├── Filters
├── Tabs
├── Hero
├── Cards
├── Grid
├── Actions
├── Metadata
├── Empty state
├── Loading state
├── Error state
├── Modal
├── Toast
├── Voice assistant
├── Footer
└── Mobile navigation
```

Only include elements that actually exist on that page, but inspect every visible element.

Do not skip small elements.

---

# 50. SCREENSHOT-BASED QA

After implementing each page:

1. Run the application.
2. Open the page.
3. Verify desktop.
4. Capture/inspect the rendered result.
5. Identify visual problems.
6. Fix them.
7. Verify again.
8. Test mobile.
9. Capture/inspect mobile.
10. Fix mobile-specific problems.
11. Verify again.
12. Only then move to the next page.

Do NOT consider the page complete because TypeScript compiles.

Compilation is NOT visual QA.

---

# 51. DESKTOP VISUAL QA CHECKLIST

For each page inspect:

- alignment;
- spacing;
- proportions;
- typography;
- hierarchy;
- content width;
- grid density;
- component size;
- header;
- navigation;
- cards;
- buttons;
- forms;
- overflow;
- fixed elements;
- voice assistant;
- scroll behavior.

---

# 52. MOBILE VISUAL QA CHECKLIST

For each page inspect:

- viewport overflow;
- text wrapping;
- button width;
- card size;
- touch target;
- bottom navigation;
- voice assistant collision;
- safe area;
- header;
- filter layout;
- modal width;
- input width;
- grid density;
- long titles;
- long descriptions;
- keyboard interaction.

---

# 53. DO NOT BREAK BUSINESS LOGIC

You are primarily changing:

- UI;
- UX;
- layout;
- responsive behavior;
- component composition;
- visual design.

Preserve:

- API contracts;
- authentication;
- backend communication;
- existing voice architecture;
- WebSocket logic;
- streaming logic;
- favorites;
- ratings;
- comments;
- history;
- profile update;
- admin CRUD.

Do not replace real API calls with mock data.

Do not create fake success states.

Do not remove working features simply because they complicate the redesign.

---

# 54. NEXT.JS REQUIREMENTS

This project uses:

- Next.js 16.3
- React 19
- TypeScript 5.7
- Tailwind CSS 4
- Lucide React

Read the repository's `AGENTS.md`.

Because this project uses a newer Next.js version, follow the repository's current Next.js conventions and inspect the installed Next.js documentation when needed.

Do not blindly apply patterns from old Next.js versions.

---

# 55. CODE QUALITY

While redesigning:

- remove unnecessary duplication;
- keep components understandable;
- preserve type safety;
- avoid `any` unless genuinely unavoidable;
- use semantic HTML;
- avoid giant page components where decomposition improves maintainability;
- keep page-specific components isolated;
- keep shared components genuinely reusable.

But do NOT over-engineer.

Do not create abstractions merely for abstraction's sake.

---

# 56. IMPORTANT — DO NOT MASS-EDIT WITH BLIND GLOBAL RULES

Do NOT do things like:

```text
increase every font size by 20%
```

or:

```text
increase every card width
```

or:

```text
change every padding value
```

or:

```text
make every heading 48px
```

Instead, evaluate each component based on its role.

---

# 57. DESIGN SYSTEM CONSISTENCY

The following should be globally consistent unless there is a strong UX reason otherwise:

- button heights;
- input heights;
- border radii;
- card radii;
- typography;
- icon sizing;
- focus states;
- primary color;
- surface hierarchy;
- spacing rhythm;
- animation speed.

---

# 58. ANIMATION

Use animation purposefully.

Good:

- hover;
- focus;
- card elevation;
- modal entrance;
- loading;
- voice listening;
- state transitions.

Avoid:

- excessive animation;
- distracting constant motion;
- unnecessary page-wide effects.

Respect:

```text
prefers-reduced-motion
```

---

# 59. VOICE CONTROL MUST REMAIN A CORE PRODUCT FEATURE

The voice system is not decorative.

The UI must communicate:

```text
User
↓
Voice Assistant
↓
Listening
↓
Understanding
↓
Action
↓
Response
```

The assistant should feel like a persistent platform control.

Do not make it a dead microphone icon.

---

# 60. FINAL REGRESSION AUDIT

After all pages are redesigned, revisit every route.

Verify:

```text
Home
Movies
Series
Genres
Genre Detail
Explore
Search
Favorites
History
Movie Detail
Series Detail
Watch Movie
Watch Series
Profile
Settings
Login
Register
Verify
Auth Callback
Admin Dashboard
Admin Movies
Admin Series
Admin Episodes
Admin Genres
Admin Users
Admin Voice Logs
404
```

Check shared components again.

Especially:

- Header
- Sidebar
- Mobile Navigation
- MediaCard
- Hero
- Voice Assistant
- Watch Client
- Auth Forms
- Admin Layout.

---

# 61. FINAL ACCEPTANCE CRITERIA

The task is NOT complete until:

### UI

- every page has a clear hierarchy;
- no important element is unnecessarily tiny;
- no element overflows its intended container;
- no important text is clipped;
- cards have appropriate proportions;
- buttons have appropriate proportions;
- spacing is consistent;
- pages feel visually related.

### Desktop

- 1440px is polished;
- 1920px is polished;
- no excessive empty areas;
- no cramped layout.

### Mobile

- 390px is polished;
- 375px is polished;
- 360px does not break;
- no horizontal overflow;
- bottom navigation does not cover content;
- voice assistant does not cover important UI.

### Functionality

- navigation works;
- authentication works;
- search works;
- filters work;
- favorites work;
- ratings work;
- comments work;
- video playback works;
- episode switching works;
- voice control remains functional;
- admin CRUD remains functional.

### Code

- TypeScript passes;
- build passes;
- lint passes where applicable;
- no obvious runtime errors;
- no broken routes;
- no accidental backend changes.

---

# 62. EXECUTION ORDER

Follow this exact implementation sequence.

## STEP 0

Audit the complete repository.

Do not edit yet.

## STEP 1

Identify:

- all routes;
- all shared components;
- all page-specific components;
- all API dependencies;
- all authentication dependencies;
- all voice dependencies;
- all responsive behavior.

## STEP 2

Audit and reconstruct:

- typography;
- colors;
- spacing;
- container;
- buttons;
- inputs;
- cards;
- navigation.

## STEP 3

Reconstruct shared components:

- Header
- Sidebar
- Mobile Navigation
- MediaCard
- Hero
- Voice Assistant.

## STEP 4

Redesign and verify pages one-by-one.

## STEP 5

Run desktop visual QA.

## STEP 6

Run mobile visual QA.

## STEP 7

Run functionality regression.

## STEP 8

Run final build/lint/type checks.

---

# 63. PAGE COMPLETION RULE

A page is considered COMPLETE only when:

```text
CODE
✓

DESKTOP
✓

MOBILE
✓

LOADING
✓

EMPTY
✓

ERROR
✓

INTERACTION
✓

ACCESSIBILITY
✓

VISUAL QA
✓

REGRESSION
✓
```

Do not move forward merely because the page compiles.

---

# 64. MOST IMPORTANT INSTRUCTION

Think like a senior designer AND a senior frontend engineer.

Do not ask:

> "How can I minimally modify the existing page?"

Ask:

> "If this page were being designed professionally from scratch today, what should every element look like, where should it be placed, how large should it be, what should its hierarchy be, and how should it behave on desktop and mobile?"

Then implement that answer using the existing application architecture and backend contracts.

---

# 65. FINAL DESIGN PHILOSOPHY

The finished StreamVibe frontend should not look like:

```text
many independently generated pages
```

It should look like:

```text
ONE PROFESSIONAL PRODUCT
│
├── One design language
├── One spacing system
├── One typography hierarchy
├── One component language
├── One navigation system
├── One voice-assistant experience
├── One responsive philosophy
└── Many carefully designed pages
```

Every page can have its own composition.

But the product must feel like one coherent platform.

---

# 66. DO NOT STOP AFTER THE FIRST SUCCESSFUL PAGE

The purpose of this task is not to make Home look good.

The purpose is to reconstruct the ENTIRE frontend.

Continue page-by-page until every route listed above has been individually audited, redesigned, implemented, visually verified, and regression-tested.

Do not silently skip pages.

Do not silently skip mobile.

Do not silently skip loading/error/empty states.

Do not silently skip small components.

Do not silently skip the admin interface.

Do not silently skip voice UI.

The final result must be a complete frontend reconstruction, not a cosmetic patch.