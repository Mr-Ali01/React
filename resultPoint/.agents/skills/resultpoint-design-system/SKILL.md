---
name: resultpoint-design-system
description: ResultPoint official design tokens, typography, dark/light theme variables, and component guidelines reverse-engineered via Skill UI.
---

# ResultPoint Design System Specification

Generated via **Skill UI** static extraction of ResultPoint. Use this skill whenever constructing or modifying frontend UI components to ensure 100% aesthetic consistency with ResultPoint's navy & vibrant orange design language.

## 1. Visual Theme & Atmosphere
- **Primary Aesthetics**: Deep navy dark mode with warm orange accents (`#FF7300` / `#FF6B00`), subtle glassmorphism, rounded card borders (`rounded-2xl`), and clean micro-interactions.
- **Typography**: Inter (modern sans-serif font).
- **Grid & Spacing**: 4px baseline grid (scale: 4, 6, 8, 10, 12, 16, 20, 24, 32px).
- **Radius**: `rounded-xl` for form inputs/buttons, `rounded-2xl` for cards, `rounded-full` for badges.

## 2. Color Palette & CSS Variables

| CSS Token | Light Mode | Dark Mode (Default) | Role |
| :--- | :--- | :--- | :--- |
| `--bg` | `#F8FAFC` | `#0B0D10` | Main canvas / page background |
| `--bg-secondary` | `#F1F5F9` | `#0D141F` | Secondary panels / active tabs |
| `--card` | `#FFFFFF` | `#111418` | Standard card surface |
| `--card-hover` | `#FFF7ED` | `#15202D` | Hovered surface |
| `--border` | `#E2E8F0` | `#1E2A35` | Borders and dividers |
| `--text-h` | `#0F172A` | `#F8FAFC` | Primary text and headings |
| `--text-m` | `#475569` | `#94A3B8` | Subtext, captions, placeholders |
| `--accent` | `#FF6B00` | `#FF7300` | Primary action color, CTA, active borders |
| `--accent-hover` | `#EA580C` | `#FF8A1A` | Button hover state |
| `--accent-soft` | `#FFF1E8` | `rgba(255, 115, 0, 0.12)` | Subtle highlight backgrounds |

### Status Colors
- **Success / Outstanding**: `#10B981` (Emerald / `text-brandGreen`)
- **Warning / Manageable**: `#F59E0B` (Amber / `text-brandAmber`)
- **Danger / Backlog**: `#EC4899` (Pink / `text-brandPink`)
- **Info / Primary Metric**: `#3B82F6` (Blue / `text-brandBlue`)

## 3. Responsive Breakpoints
- **Mobile (`< 1024px`)**:
  - Single column stacked layout.
  - Sidebar replaced by `MobileCalculatorDropdown` (`block lg:hidden`).
  - Calculate results displayed in `MobileResultModal`.
  - Top pending banners and wide SVG charts hidden with `hidden lg:block`.
- **Desktop & Tablet (`>= 1024px`)**:
  - 12-column grid (`lg:grid-cols-12`).
  - Left directory sidebar (`lg:col-span-3`).
  - Sticky right result column (`lg:col-span-3 lg:sticky lg:top-20`).

## 4. Re-running Skill UI Extraction
To re-extract and update the design system after new UI features:
```bash
npx skillui --dir ./src --out ./docs/design-system --name ResultPoint --format design-md
```
