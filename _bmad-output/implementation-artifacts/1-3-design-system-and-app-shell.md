# Story 1.3: Design System & App Shell

## Status: review

## Story

**As a** developer,
**I want** Tailwind CSS, shadcn/ui, and the Focus Wide layout shell configured,
**So that** all future UI stories start from a consistent, styled foundation.

## Acceptance Criteria

1. Given the frontend is running, When a developer opens `http://localhost:5173`, Then the app renders the Focus Wide layout: a 56px dark (`zinc-900`) icon-only AppSidebar on the left and a main content area filling the rest
2. And Tailwind design tokens are configured: zinc neutral scale, indigo-600 accent, status color palette (zinc-400/blue-500/amber-500/red-500/green-500), Inter font at all 4 typographic levels
3. And shadcn/ui is initialized with the zinc theme and CSS variables
4. And the AppSidebar renders navigation icon buttons with `aria-label` and Tooltip on each
5. And all interactive elements have `focus-visible:ring-2 ring-indigo-500` focus indicators

## Tasks / Subtasks

- [x] Task 1: Install Inter variable font
  - [x] Run `npm install @fontsource-variable/inter` in frontend

- [x] Task 2: Update `frontend/src/index.css` with design tokens
  - [x] Add `@import "@fontsource-variable/inter";`
  - [x] Update `--font-sans` to `'Inter Variable', sans-serif`
  - [x] Add project-specific color tokens in `@theme` block: indigo accent, status colors
  - [x] Keep existing shadcn CSS variables intact

- [x] Task 3: Create `frontend/src/components/AppSidebar.tsx`
  - [x] 56px wide, zinc-900 background, full height
  - [x] Navigation icon buttons with aria-label (LayoutDashboard, Settings from lucide-react)
  - [x] shadcn Tooltip wrapping each button
  - [x] focus-visible:ring-2 ring-indigo-500 on all buttons

- [x] Task 4: Update `frontend/src/App.tsx` with Focus Wide layout
  - [x] flex h-screen layout
  - [x] AppSidebar on left
  - [x] main content area on right (flex-1)
  - [x] Remove all Vite boilerplate

## Dev Notes

### Tailwind v4 Token Configuration

Tailwind v4 uses **no `tailwind.config.js`**. All configuration is done via `@theme` CSS blocks in `index.css`.

The existing `@theme inline { ... }` block maps CSS variables to Tailwind utilities. Project tokens are added as direct values in a separate `@theme { ... }` block.

Example syntax for project tokens:
```css
@theme {
  --color-accent: oklch(0.5 0.24 264);   /* indigo-600 */
  --color-status-todo: oklch(0.55 0 0);  /* zinc-400 */
}
```

### Inter Font

Install: `npm install @fontsource-variable/inter`

Import in CSS: `@import "@fontsource-variable/inter";`

Override font-sans: Add `--font-sans: 'Inter Variable', sans-serif;` in the `@theme inline` block (replaces Geist).

### Typography Levels (per UX-DR3)

| Level      | Size | Weight | Usage     |
|------------|------|--------|-----------|
| heading    | 20px | 600    | h1/h2     |
| subheading | 16px | 500    | h3/labels |
| body       | 14px | 400    | default   |
| label      | 12px | 500    | captions  |

Apply via Tailwind utilities: `text-xl font-semibold`, `text-base font-medium`, `text-sm font-normal`, `text-xs font-medium`.

### AppSidebar Component Spec

```tsx
// frontend/src/components/AppSidebar.tsx
// - w-14 (56px) bg-zinc-900 h-full flex flex-col items-center py-4 gap-2
// - Each item: shadcn <Tooltip> wrapping a <button>
// - Button classes: p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800
//                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
// - Icons: LayoutDashboard (Dashboard), Settings (Settings) from lucide-react
// - aria-label on each button matching tooltip content
```

### Focus Wide Layout (App.tsx)

```tsx
// flex h-screen overflow-hidden
// <AppSidebar /> — fixed 56px width
// <main className="flex-1 overflow-auto bg-zinc-50"> — fills remaining space
```

### shadcn/ui

Already initialized with zinc theme. The `@import "shadcn/tailwind.css"` in index.css provides the component styles. No additional setup needed.

To add Tooltip component if not present: `npx shadcn add tooltip`
