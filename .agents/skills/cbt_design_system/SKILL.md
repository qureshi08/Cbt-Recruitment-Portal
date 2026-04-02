---
name: CBT Design & Brand Guidelines
description: Strict design system, typography, color palette, component spacing, and brand identity for the Convergent Business Technologies (CBT) website.
---

# CBT Brand & Design Guidelines

## OVERVIEW
Convergent Business Technologies (CBT) is a Data, Cloud & AI Consultancy. When working on any frontend components or layouts for CBT, you MUST strictly adhere to this design system. Do not invent styles, sizes, or colors.

## 1. BRAND IDENTITY
- **Visual Style**: "Editorial Intelligence" (Clean, high-contrast, structural)
- **Tone of Voice**: Confident but accessible. Smart but not cold.
- **Audiences**: Enterprise Clients, Global Partners, Graduate Talent.

## 2. COLOR SYSTEM
Never hardcode hex values. Use CSS custom properties:
- **Primary Palette**:
  - `--color-primary`: `#00994D` (CBT Botanical Green)
  - `--color-heading`: `#0C1A10` (Ink — High-contrast premium black)
  - `--color-surface`: `#F7F8F7` (Bone — Tonal background shifts)
  - `--color-border`: `#E2E8E4` (Muted Grey — minimal usage)
- **Neutrals**:
  - `--color-white`: `#FFFFFF`
  - `--color-text-body`: `#374151` (Graphite — primary body copy)
  - `--color-text-muted`: `#6B7280` (Steel)
- **Sectioning Policy**: ABANDON 1px borders for main sections. Use alternating White and `#F7F8F7` backgrounds to define content blocks.

## 3. TYPOGRAPHY
Google Fonts import containing Playfair Display, DM Sans, JetBrains Mono is standard.
- **Font Families**:
  - **Editorial Headings** (`--font-heading`): `Playfair Display`, serif.
  - **Primary UI & Text** (`--font-body`): `DM Sans`, sans-serif. 400 for body, 500/700 for labels.
  - **Monospace** (`--font-mono`): `JetBrains Mono`.
- **Type Scale**:
  - `--text-xs`: 0.75rem (12px) - Labels, legal
  - `--text-sm`: 0.875rem (14px) - Captions, metadata
  - `--text-base`: 1rem (16px) - Body default
  - `--text-lg`: 1.125rem (18px) - Lead paragraphs
  - `--text-xl`: 1.25rem (20px) - Card titles
  - `--text-2xl`: 1.5rem (24px) - Section subtitles
  - `--text-3xl`: 1.875rem (30px) - Section headings
  - `--text-4xl`: 2.25rem (36px) - Page titles
  - `--text-5xl`: 3rem (48px) - Hero headings
  - `--text-6xl`: 3.75rem (60px) - Large hero display

## 4. SPACING & LAYOUT
- **Spacing Scale**:
  - `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-5` (20px)
  - `--space-6` (24px), `--space-8` (32px), `--space-10` (40px)
  - `--space-12` (48px), `--space-16` (64px), `--space-20` (80px), `--space-24` (96px)
- **Layout Containers**:
  - `--container-max`: 1200px (standard)
  - `--container-wide`: 1440px
  - `--container-prose`: 720px
  - `--section-py`: `var(--space-20)` (Standard vertical padding)
  - `--section-py-lg`: `var(--space-24)` (Hero & major sections)
- **Grid Layout**: 12-column Desktop (gap: `--space-8`), 8-col Tablet, 4-col/single Mobile.
- **Breakpoints**: `--bp-sm` (640px), `--bp-md` (768px), `--bp-lg` (1024px), `--bp-xl` (1280px), `--bp-2xl` (1536px).

## 5. REUSABLE COMPONENTS
- **Buttons**:
  - `.btn-primary`: bg `--color-primary`, color `--color-white`, `var(--text-base)` 600, padding `--space-3` var(--space-8), border-radius 6px. Hover: bg `#007a3d`, translateY(-1px).
  - `.btn-secondary`: bg transparent, border 2px solid `--color-primary`, text `--color-primary`. Hover: bg `rgba(0, 153, 77, 0.05)`.
  - `.btn-ghost`: text underline with underline offset 3px, color `--color-text-body`.
- **Cards**: 
  - `.card`: bg `--color-white`, border 1px solid `--color-border`, border-radius 12px, padding `--space-8`, shadow. Hover: 0 8px 24px rgba(0, 153, 77, 0.12), translateY(-2px).
- **Forms**: input & select border `--color-border`, focus border `--color-primary` (shadow ring).
- **Accents**: 3px solid `--color-primary` left border for quotes/stats.
- **Animations**: Subtle, staggered reveals. NO aggressive animations. Observe `prefers-reduced-motion`.

## 6. ACCOMPANYING ASSETS
- **Logo**: Minimalist "cbt" block (`public/logo.png`).
- **Marquee**: Use custom `MarqueeRail` with `|` dividers and dark mode support.
- **Icons**: Lucide Icons, stroke width 1.5px. 24px default.
