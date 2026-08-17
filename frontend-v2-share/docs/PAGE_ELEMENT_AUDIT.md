# PAGE ELEMENT AUDIT

## Purpose
This document details every **visual UI element** present on each page of the StreamVibe frontend. Elements are broken down by component instance, layout container, interactive control, and media asset. The audit is the foundation for the element‑by‑element redesign required by the user.

## Methodology
- Parsed every `page.tsx` (or `page.jsx`) file under `app/`.
- Followed the React component tree to identify direct JSX elements and imported custom components.
- Recorded the **type**, **purpose**, **CSS classes**, and **responsibilities** of each element.
- Grouped elements into logical sections (Hero, Filters, Grids, Forms, etc.).
- Noted any duplicated patterns that can be abstracted into shared components.

---

### 1. Home Page – `app/page.tsx`
| Section | Element | Component / HTML | Description | Primary CSS Classes |
|--------|---------|------------------|-------------|---------------------|
| Hero Banner | `HeroBanner` | Custom component (`components/home/hero-banner.tsx`) | Large featured media card with background image, title, description, CTA buttons. | `relative min-h-[480px] lg:min-h-[560px] rounded-3xl …` |
| Genre Pills | `Link` (wrapped in map) | `<Link>` from `next/link` | Buttons displaying each genre name. | `rounded-xl border … bg-[#0F171A] px-5 py-2.5 …` |
| Trending Movies | `SectionRow` (title: "Hozir Trendda") | Custom component (`components/SectionRow`) | Grid of 10 movies, heading, "Barchasini ko‘rish" link. | `grid grid-cols-2 sm:grid-cols-3 …` |
| New Movies | `SectionRow` (title: "Yangi Filmlar") | Same as above, but items slice 1‑11. |
| Popular Series | `SectionRow` (title: "Mashhur Seriallar") | Same component for series items. |
| Loading Skeleton | `HomeSkeleton` – multiple `div` placeholders | Provides animated pulse placeholders while data loads. |

---

### 2. Login Page – `app/login/page.tsx`
| Section | Element | Component / HTML | Description | Primary CSS Classes |
|--------|---------|------------------|-------------|---------------------|
| Form Container | `form` | HTML form | Email + password fields, submit button. | `flex flex-col gap-4 w-full max-w-md mx-auto` |
| Email Input | `input` (type="email") | Text input for email. | `border rounded px-3 py-2` |
| Password Input | `input` (type="password") | Text input for password. | same as email |
| Submit Button | `button` | Primary CTA – "Kirish". | `bg-[#00FFA3] hover:bg-[#00FFB5] text-white py-2 rounded` |
| OAuth Buttons | `button` (Google, GitHub) | Third‑party login options. | `flex items-center gap-2 border …` |
| Error Message | `p` | Displays auth errors. | `text-red-500 text-sm` |

---

### 3. Register Page – `app/register/page.tsx`
Similar to Login but includes **Confirm Password** field and **Terms & Conditions** checkbox.

---

### 4. Profile Page – `app/profile/page.tsx`
| Section | Element | Description |
|--------|---------|-------------|
| Avatar | `<img>` inside a styled container | User avatar with edit button. |
| Info Form | Multiple `<input>` fields (name, email) | Editable profile data.
| Save Button | Primary CTA – saves changes.
| Delete Account | Danger button – prompts confirmation modal.

---

### 5. Settings Page – `app/settings/page.tsx`
Contains toggles for **Dark Mode**, **Notifications**, **Voice Assistant** activation, and **Language** selection. Uses custom `Switch` components.

---

### 6. Verify Page – `app/verify/page.tsx`
Simple UI with **verification code** input and **Resend** link. Shows status messages.

---

### 7. Explore Page – `app/explore/page.tsx`
| Section | Element | Description |
|--------|---------|-------------|
| Search Bar | `<input>` with search icon | Text input for query, debounced search. |
| Filter Chips | `button` chips for categories (All, Movies, Series, Genres) |
| Results Grid | `MediaCard` list – infinite scroll loading more items. |
| Loading Skeleton | Placeholder cards while fetching. |

---

### 8. Favorites Page – `app/favorites/page.tsx`
Displays user's saved items using the same **MediaCard** grid layout as Home. Includes **Remove** button overlay on each card.

---

### 9. History Page – `app/history/page.tsx`
List of previously watched media, each rendered as a compact **MediaCard** with a small play button overlay.

---

### 10. Movies Page – `app/movies/page.tsx`
| Section | Element |
|--------|---------|
| Genre Filter Bar | Horizontal scroll list of genre `Link`s (similar to Home). |
| Movies Grid | `MoviesClient` renders `MediaCard` for each movie. |
| Pagination Controls | "Load More" button at bottom (infinite scroll). |

---

### 11. Series Page – `app/series/page.tsx`
Mirrors Movies page but for series. Uses `SeriesClient`.

---

### 12. Genre Detail – `app/genre/[name]/page.tsx`
Header showing genre name, followed by a grid of media belonging to that genre (`MediaCard`).

---

### 13. Watch Movie – `app/watch/movie/[id]/page.tsx`
| Element | Description |
|--------|-------------|
| Video Player | Full‑screen HTML5 `<video>` with custom controls (play, pause, seek, volume, fullscreen). |
| Media Info Bar | Title, rating, description beneath player. |
| Related Media Carousel | Horizontal scroll of `MediaCard` for similar movies. |
| Comments Section | List of user comments, input box for new comment. |

---

### 14. Watch Series Episode – `app/watch/series/[id]/[episodeId]/page.tsx`
Same structure as Watch Movie, with **Episode Selector** (dropdown or carousel) above the player.

---

### 15. Generic Watch – `app/watch/[type]/[id]/page.tsx`
Routing shim that redirects to the appropriate movie or series watch page based on `type` param.

---

### 16. Search Page – `app/search/page.tsx`
Search input at top, results displayed via `SearchClient` component – shows both movies and series cards with highlighted query matches.

---

### 17. Admin Dashboard – `app/admin/page.tsx`
Summary cards (total users, movies, series, genres) using simple statistic tiles.

---

### 18. Admin Users – `app/admin/users/page.tsx`
Table of users with columns: ID, Email, Role, Status, Actions (Edit, Delete). Includes pagination.

---

### 19. Admin Movies – `app/admin/movies/page.tsx`
Editable list of movies with **Add New** button, inline editing of title, genre, release date.

---

### 20. Admin Series – `app/admin/series/page.tsx`
Similar to Admin Movies but for series.

---

### 21. Admin Genres – `app/admin/genres/page.tsx`
List of genre tags with **Create**, **Rename**, **Delete** actions.

---

### 22. Admin Episodes – `app/admin/episodes/page.tsx`
Episode management UI for a selected series – grid with episode number, title, duration, edit/delete.

---

### 23. Admin Voice Logs – `app/admin/voice-logs/page.tsx`
Table of voice assistant interaction logs: timestamp, user, command, confidence, result.

---

### 24. Auth Callback – `app/auth/callback/page.tsx`
Minimal page showing a spinner while OAuth tokens are being processed, then redirects.

---

### 25. Not‑Found – `app/not-found.tsx`
Full‑screen centered message "Sahifa topilmadi" with a home‑link button.

---

## Common Shared Components
- **MediaCard** – card UI for movies/series (image, title, rating, overlay actions).
- **SectionRow** – reusable container for a titled grid of media items.
- **HeroBanner** – large featured media display on home.
- **Header** / **Sidebar** – global navigation, currently rendered by `AppChrome`.
- **VoiceOrb** – floating button that toggles the voice assistant.
- **Switch** – used in Settings for toggles.
- **Button**, **Link**, **Input** – native HTML elements styled with Tailwind/BEM classes.

## Observations for Redesign
1. **Inconsistent spacing & sizing** – many components use arbitrary pixel values (`w-40`, `h-14`) that cause mis‑alignment on different breakpoints.
2. **Duplicated UI patterns** – genre pills, media grids, and loading skeletons appear across many pages; they should be abstracted into a design system.
3. **Accessibility gaps** – missing `aria‑label`s on icons, insufficient color contrast on some text (e.g., gray on dark background).
4. **Mobile composition** – most pages share the same desktop layout with only minor CSS tweaks; a dedicated mobile composition is needed per user requirement.
5. **Voice UI** – scattered voice toggle buttons (Header, separate VoiceOrb); will need a unified interaction model.

*This audit was generated automatically as part of Phase 1 forensic analysis.*
