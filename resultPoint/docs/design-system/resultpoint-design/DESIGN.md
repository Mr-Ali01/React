# ResultPoint DESIGN.md

> Auto-generated design system — reverse-engineered via static analysis by skillui.
> Frameworks: None detected
> Colors: 20 · Fonts: 1 · Components: 97
> Icon library: not detected · State: not detected
> Primary theme: dark · Dark mode toggle: yes · Motion: expressive

---

## 1. Visual Theme & Atmosphere

This is a **dark-themed** interface with a warm tone. Depth is expressed through layered shadows and subtle surface color variation. Typography uses **Inter** throughout — a clean, modern choice that maintains consistency. Spacing follows a **4px base grid** (compact density), with scale: 6, 8, 10, 16, 18, 20, 24, 32px. The accent color **#ff6b00** anchors interactive elements (buttons, links, focus rings). Motion is expressive — spring physics, layout animations, and staggered reveals are part of the visual language.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| border | `#1e2a35` | background | Page background, darkest surface |
| bg-secondary | `#0d141f` | surface | Card and panel backgrounds |
| card | `#ffffff` | surface | Card and panel backgrounds |
| card-hover | `#fff7ed` | surface | Card and panel backgrounds |
| card-hover | `#15202d` | surface | Card and panel backgrounds |
| bg-secondary | `#f1f5f9` | text-primary | Headings and body text |
| text-muted | `#a1a1aa` | text-muted | Captions, placeholders, secondary info |
| accent | `#ff6b00` | accent | CTAs, links, focus rings, active states |
| accent-hover | `#ea580c` | accent | CTAs, links, focus rings, active states |
| accent-hover | `#ff8a1a` | accent | CTAs, links, focus rings, active states |
| accent-light | `#ffa042` | accent | CTAs, links, focus rings, active states |
| color-brandPink | `#ec4899` | danger | Error states, destructive actions |
| color-brandGreen | `#10b981` | success | Success states, positive indicators |
| color-brandAmber | `#f59e0b` | warning | Warning states, caution indicators |
| border | `#e2e8f0` | info | Informational highlights |
| unknown | `#000000` | unknown | Palette color |
| color-brandBlue | `#3b82f6` | unknown | Palette color |
| color-brandPurple | `#8b5cf6` | unknown | Palette color |
| color-brandCyan | `#06b6d4` | unknown | Palette color |
| unknown | `#0b0d10` | unknown | Palette color |

### Dark Mode Token Mapping

| Variable | Light | Dark |
|---|---|---|
| `--bg` | `#F8FAFC` | `#0B0D10` |
| `--bg-secondary` | `#F1F5F9` | `#0D141F` |
| `--bg-tertiary` | `#FFFFFF` | `#111A26` |
| `--card` | `#FFFFFF` | `#111418` |
| `--card-hover` | `#FFF7ED` | `#15202D` |
| `--card-elevated` | `#FFFFFF` | `#172433` |
| `--border` | `#E2E8F0` | `#1E2A35` |
| `--border-light` | `#F1F5F9` | `#18232F` |
| `--text-h` | `#0F172A` | `#F8FAFC` |
| `--text-m` | `#475569` | `#94A3B8` |
| `--text-inverse` | `#FFFFFF` | `#080D14` |
| `--accent` | `#FF6B00` | `#FF7300` |
| `--accent-hover` | `#EA580C` | `#FF8A1A` |
| `--accent-light` | `#FF8A32` | `#FFA042` |
| `--accent-soft` | `#FFF1E8` | `rgba(255, 115, 0, 0.12)` |
| `--accent-border` | `#FFD8BE` | `rgba(255, 115, 0, 0.28)` |
| `--shadow` | `rgba(15, 23, 42, 0.06)` | `rgba(0, 0, 0, 0.45)` |
| `--shadow-accent` | `rgba(255, 107, 0, 0.20)` | `rgba(255, 115, 0, 0.35)` |
| `--connector-glow` | `rgba(255, 107, 0, 0.45)` | `rgba(255, 115, 0, 0.85)` |
| `--connector-base` | `#E2E8F0` | `#1E2A35` |

### CSS Variable Tokens

```css
--bg-secondary: #F1F5F9;
--card: #FFFFFF;
--card-hover: #FFF7ED;
--card-elevated: #FFFFFF;
--border: #E2E8F0;
--border-light: #F1F5F9;
--accent: #FF6B00;
--accent-hover: #EA580C;
--accent-light: #FF8A32;
--accent-soft: #FFF1E8;
--accent-border: #FFD8BE;
--shadow-accent: rgba(255,107,0,0.20);
--color-card: var(--card);
--color-border: var(--border);
--color-text-primary: var(--text-h);
--color-text-secondary: var(--text-m);
--color-text-muted: var(--text-light);
--color-accent: var(--accent);
--color-accent-hover: var(--accent-hover);
--color-accent-soft: var(--accent-soft);
```


---

## 3. Typography Rules

**Font Stack:**
- **Inter** — Heading 1, Heading 2, Heading 3, Body, Caption

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | Inter | 48px / 3rem | 700 |
| Heading 2 | Inter | 32px / 2rem | 600 |
| Heading 3 | Inter | 24px / 1.5rem | 600 |
| Body | Inter | 16px / 1rem | 400 |
| Caption | Inter | 12px / 0.75rem | 400 |

**Typographic Rules:**
- Use **Inter** for all text — do not mix font families
- Maintain consistent hierarchy: no more than 3-4 font sizes per screen
- Headings use bold (600-700), body uses regular (400)
- Line height: 1.5 for body text, 1.2 for headings
- Use color and opacity for secondary hierarchy, not additional font sizes


---

## 4. Component Stylings

### Layout (27)

**AdminWelcomeBanner** — `components/admin/AdminWelcomeBanner.jsx`
- Key Styles: `rounded-2xl`, `border-orange-200/70`, `bg-gradient-to-r`, `gap-4`, `text-xl`, `font-black`, `shadow-2xs`, `pointer-events-none`
- Animation: tw-animate-pulse

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Main Welcome Card (~75% width
```

**PlatformUsageChart** — `components/admin/PlatformUsageChart.jsx`
- Props: `x`, `y`
- Key Styles: `rounded-2xl`, `border-slate-200/80`, `bg-white`, `p-4`, `text-sm`, `font-bold`, `shadow-2xs`, `select-none`
- Animation: tw-transitions: transition-all
- State: useState

```tsx
<div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header with Title and Date Range Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1E2A35]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Platform Usage Overview
          </h2>
        </div>
```

**SystemOverview** — `components/admin/SystemOverview.jsx`
- Key Styles: `rounded-2xl`, `border-slate-200/80`, `bg-white`, `p-4`, `text-sm`, `font-bold`, `shadow-2xs`

```tsx
<div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#1E2A35]/80">
        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <Settings className="w-4 h-4 stroke-[2.2]" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          System Overview
        </h2>
      </div>

      {/* 2x2 Metric Cards Grid */}
```

**Footer** — `components/layout/Footer.jsx`
- Key Styles: `rounded-xl`, `border-[#272B32]`, `bg-[#0B0D10]`, `mx-auto`, `text-lg`, `font-extrabold`, `shadow-sm`, `hover:text-accent`
- Animation: tw-transitions: transition-colors, transition-all
- State: useState

```tsx
<footer className="border-t border-[#272B32] bg-[#0B0D10] text-[#A1A1AA] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#272B32]">
          
          {/* Col 1 */}
          <div className="lg:col-span-1 text-left space-y-2.5">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-[#F4F4F5]">
                Result<span className="text-accent">Point</span>
```

**Header** — `components/layout/Header.jsx`
- Props: `onOpenMobileMenu`
- Key Styles: `rounded-xl`, `bg-bg/85`, `mx-auto`, `font-extrabold`, `backdrop-blur-md`, `focus:outline-none`
- Animation: tw-transitions: transition-colors, transition-transform, duration-300, transition-all, duration-200, hover-transforms

```tsx
<header className="sticky top-0 z-50 w-full border-b border-border bg-bg/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[70px] flex items-center justify-between">
        
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
          aria-label="ResultPoint Home"
        >
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white shadow-accent transition-transform duration-300 group-hover:scale-105 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
```

**MobileDrawer** — `components/layout/MobileDrawer.jsx`
- Props: `isOpen`, `onClose`
- Key Styles: `rounded-lg`, `border-l`, `bg-accent`, `px-5`, `text-lg`, `font-bold`, `shadow-accent`, `hover:bg-bg-sec`
- Animation: tw-transitions: transition-opacity, duration-300, transition-transform, ease-in-out, transition-colors

**GradeDistributionDonut** — `components/student/analytics/GradeDistributionDonut.jsx`
- Props: `distributionData`
- Key Styles: `rounded-2xl`, `border-emerald-500/25`, `bg-card`, `p-5`, `text-xs`, `font-bold`, `shadow-subtle`, `cursor-pointer`
- Animation: tw-animate-in, tw-transitions: transition-all, duration-300, duration-200
- State: useState

```tsx
<div className="rounded-2xl bg-card border border-border p-5 text-center text-xs text-text-light">
        No grade distribution data available.
      </div>
```

**PerformanceInsightsCard** — `components/student/analytics/PerformanceInsightsCard.jsx`
- Props: `insights`
- Key Styles: `rounded-2xl`, `bg-card`, `p-4`, `text-sm`, `font-bold`, `shadow-subtle`, `hover:border-accent/40`
- Animation: tw-transitions: transition-all, transition-transform, hover-transforms

```tsx
<div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-h">Performance Insights</h3>
            <p className="text-[11px] text-text-light">
              Automated data-driven observations on semester velocity, strengths, and areas for focus.
            </p>
```

*...and 19 more layout components.*

### Navigation (32)

**AdminSidebar** — `components/admin/AdminSidebar.jsx`
- Props: `isCollapsed`, `isMobileOpen`, `onCloseMobile`
- Key Styles: `rounded-xl`, `border-slate-800/80`, `bg-[#0B111E]`, `px-4`, `text-base`, `font-extrabold`, `shadow-sm`, `select-none`
- Animation: tw-transitions: transition-transform, transition-opacity, duration-200, transition-all, duration-300, ease-out, transition-colors, hover-transforms

**QuickManagementActions** — `components/admin/QuickManagementActions.jsx`
- Key Styles: `rounded-lg`, `border-slate-200/80`, `bg-orange-50`, `space-y-3`, `text-sm`, `font-bold`, `shadow-2xs`, `hover:shadow-subtle`
- Animation: tw-transitions: transition-all, transition-transform, transition-colors, hover-transforms

```tsx
<div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 stroke-[2.2]" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          Quick Management Actions
        </h2>
      </div>

      {/* 6 Actions Grid */}
```

**RecentActivities** — `components/admin/RecentActivities.jsx`
- Key Styles: `rounded-2xl`, `border-slate-200/80`, `bg-white`, `p-4`, `text-sm`, `font-bold`, `shadow-2xs`, `hover:text-[#EA580C]`
- Animation: tw-transitions: transition-colors, transition-transform, hover-transforms

```tsx
<div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Recent Activities
          </h2>
        </div>
```

**PendingCalculationBanner** — `components/common/PendingCalculationBanner.jsx`
- Variants: `calculation`
- Key Styles: `rounded-xl`, `border-accent/25`, `bg-accent`, `mx-auto`, `text-xs`, `font-bold`, `shadow-subtle`, `hover:bg-accent-hover`
- Animation: tw-animate-fadeIn, tw-animate-spin, tw-transitions: transition-all
- State: useState

**AcademicGoalCard** — `components/student/AcademicGoalCard.jsx`
- Props: `metrics`
- Key Styles: `rounded-2xl`, `border-amber-500/20`, `bg-card`, `p-4`, `text-sm`, `font-bold`, `shadow-subtle`, `hover:text-accent-hover`
- Animation: tw-transitions: transition-colors, transition-all, duration-500

```tsx
<div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brandPink/15 text-brandPink flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-text-h">Your Academic Goal</h3>
        </div>

        <Link
          to="/student/goals"
```

**AcademicProfileGate** — `components/student/AcademicProfileGate.jsx`
- Props: `children`, `title`, `description`, `please`, `Course`, `and`, `credit`
- Key Styles: `rounded-3xl`, `border-accent/20`, `bg-accent/10`, `mx-auto`, `text-xl`, `font-bold`, `shadow-subtle`, `hover:bg-accent-hover`
- Animation: tw-transitions: transition-all

```tsx
<div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-subtle">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-h">{title}</h2>
        <p className="text-xs sm:text-sm text-text-light max-w-md mx-auto leading-relaxed">
          {description}
        </p>
        <div className="pt-2">
          <Link
            to="/student/profile-setup"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-accent hover:bg-accent-hover shadow-accent transition-all cursor-pointer active:scale-95"
```

**PerformanceInsights** — `components/student/PerformanceInsights.jsx`
- Props: `insights`
- Key Styles: `rounded-2xl`, `bg-card`, `p-4`, `text-sm`, `font-bold`, `shadow-subtle`, `hover:text-accent-hover`
- Animation: tw-transitions: transition-colors

```tsx
<div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-text-h">Performance Insights</h3>
        </div>

        <Link
          to="/student/analytics"
```

**QuickActions** — `components/student/QuickActions.jsx`
- Key Styles: `rounded-2xl`, `bg-card`, `p-4`, `text-sm`, `font-bold`, `shadow-subtle`, `hover:border-accent/40`
- Animation: tw-transitions: transition-all, transition-colors, hover-transforms

```tsx
<div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/70">
        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-brandBlue flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-text-h">Quick Actions</h3>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
        {ACTIONS.map((action
```

*...and 24 more navigation components.*

### Data Display (21)

**PopularToolsTable** — `components/admin/PopularToolsTable.jsx`
- Key Styles: `rounded-2xl`, `border-slate-200/80`, `bg-white`, `p-4`, `text-sm`, `font-bold`, `shadow-2xs`, `hover:text-[#EA580C]`
- Animation: tw-transitions: transition-colors

```tsx
<div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Popular Calculators & Tools
          </h2>
        </div>
```

**RecentUsersTable** — `components/admin/RecentUsersTable.jsx`
- Key Styles: `rounded-2xl`, `border-slate-200/80`, `bg-white`, `p-4`, `text-sm`, `font-bold`, `shadow-2xs`, `hover:text-[#EA580C]`
- Animation: tw-transitions: transition-colors

```tsx
<div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A35]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Recent Users
          </h2>
        </div>
```

**StatCard** — `components/admin/StatCard.jsx`
- Props: `title`, `value`, `growth`, `subtitle`, `icon`, `iconBg`, `isPositive`
- Key Styles: `rounded-2xl`, `border-slate-200/80`, `bg-white`, `p-4`, `text-xs`, `font-semibold`, `shadow-2xs`, `hover:shadow-subtle`
- Animation: tw-transitions: transition-all

```tsx
<div className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-[#1E2A35] rounded-2xl p-4 shadow-2xs hover:shadow-subtle transition-all flex items-center gap-3.5">
      {/* Colored Left Icon */}
      <div className={`w-12 h-12 rounded-2xl ${iconBg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
        <Icon className="w-5 h-5 stroke-[2.2]" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
          {title}
        </span>
```

**CGPAProjectionSimulator** — `components/student/analytics/CGPAProjectionSimulator.jsx`
- Props: `overview`, `projections`, `targetCGPA`, `onTargetChange`
- Key Styles: `rounded-2xl`, `border-accent/25`, `bg-card`, `p-4`, `text-sm`, `font-bold`, `shadow-subtle`, `cursor-pointer`
- Animation: tw-transitions: transition-all, transition-colors
- State: useState

```tsx
<div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-h flex items-center gap-2">
              <span>CGPA Projection & What-If Simulator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-bold">
                Interactive
```

**ProjectedTrendAndTargets** — `components/student/goals/ProjectedTrendAndTargets.jsx`
- Props: `details`, `targetCGPA`
- Key Styles: `rounded-2xl`, `border-dashed`, `bg-card`, `space-y-4`, `text-xs`, `font-bold`, `shadow-subtle`, `select-none`
- Animation: tw-transitions: transition-transform, hover-transforms
- State: useState

```tsx
<div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Projected CGPA Trend Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-text-h">Projected CGPA Trend</h3>
```

**SubjectPriorityAndProgress** — `components/student/goals/SubjectPriorityAndProgress.jsx`
- Props: `details`
- Key Styles: `rounded-2xl`, `bg-card`, `gap-4`, `text-xs`, `font-bold`, `shadow-subtle`, `hover:bg-bg-sec/40`
- Animation: tw-transitions: transition-colors, transition-all, duration-700, ease-out

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Subject-Wise Priority: Takes full width on 1005px screens (lg
```

**TargetSetterAndFeasibility** — `components/student/goals/TargetSetterAndFeasibility.jsx`
- Props: `details`, `targetCGPA`, `onTargetChange`, `onSaveGoal`
- Key Styles: `rounded-2xl`, `bg-card`, `gap-4`, `text-xs`, `font-bold`, `shadow-subtle`, `cursor-pointer`
- Animation: tw-transitions: transition-all, transition-colors
- State: useState

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Set Your Target CGPA Slider */}
      <div className="col-span-12 lg:col-span-7 xl:col-span-5 rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-text-h">Set Your Target CGPA</h3>
                <p className="text-[11px] text-text-light">
```

**StatCard** — `components/student/StatCard.jsx`
- Props: `type`, `data`
- Key Styles: `rounded-2xl`, `bg-card`, `p-4`, `text-xs`, `font-bold`, `shadow-subtle`, `hover:border-accent/40`
- Animation: tw-transitions: transition-all, duration-500

```tsx
<div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle hover:border-accent/40 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-text-light uppercase tracking-wider">
              Current CGPA
            </span>
          </div>
        </div>
```

*...and 13 more data display components.*

### Data Input (11)

**AdminHeader** — `components/admin/AdminHeader.jsx`
- Props: `onToggleSidebar`, `searchQuery`, `onSearchChange`, `onLogoutRequest`
- Key Styles: `rounded-xl`, `border-slate-200/80`, `bg-white`, `px-4`, `text-xs`, `font-bold`, `hover:text-[#FF6B00]`
- Animation: tw-animate-pulse, tw-animate-in, tw-transitions: transition-colors, transition-all
- State: useState, useRef

**AcademicCatalogManager** — `pages/admin/AcademicCatalogManager.jsx`
- Variants: `jntuh`
- Props: `initialTab`
- Key Styles: `rounded-xl`, `border-accent/20`, `bg-card`, `space-y-6`, `text-xl`, `font-extrabold`, `hover:text-text-h`
- Animation: tw-transitions: transition-all, transition-colors
- State: useState

```tsx
<div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-h flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-accent" />
            <span>Academic Catalog & Regulation Registry</span>
          </h1>
          <p className="text-xs text-text-light mt-0.5">
            Manage official universities, courses, duration constraints, regulations, and immutable calculation rule versions.
          </p>
        </div>
```

**LoginSignup** — `pages/Auth/LoginSignup/index.jsx`
- Variants: `student`, `admin`, `calculation`
- Props: `email`, `password`, `remember`
- Key Styles: `rounded-xl`, `bg-bg`, `mx-auto`, `font-extrabold`, `backdrop-blur-md`, `focus:outline-none`
- Animation: tw-transitions: transition-transform, transition-all, hover-transforms
- State: useState

```tsx
<div className="min-h-screen bg-bg text-text-h flex flex-col antialiased selection:bg-accent selection:text-white relative overflow-x-hidden">
      {/* ==================== MINIMAL AUTH HEADER ==================== */}
      <header className="w-full border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Main Logo & ResultPoint Branding */}
          <Link to="/" className="inline-flex items-center gap-2.5 group focus:outline-none" aria-label="ResultPoint Home">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-accent transition-transform group-hover:scale-105 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <div className="text-[19px] font-extrabold tracking-tight text-text-h leading-none">
                Result<span className="text-accent">Point</span>
```

**SaveModal** — `pages/Calculators/CGPA/components/SaveModal.jsx`
- Variants: `login`, `signup`
- Props: `isOpen`, `onClose`, `calculationData`, `onSaveSuccess`
- Key Styles: `rounded-2xl`, `border-accent/25`, `bg-black/60`, `p-4`, `text-base`, `font-bold`, `backdrop-blur-xs`, `hover:text-text-h`
- Animation: tw-animate-fadeIn, tw-transitions: transition-all, transition-colors
- State: useState

```tsx
<div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative text-left"
        onClick={(e
```

**Directory** — `pages/Calculators/Directory/index.jsx`
- Key Styles: `rounded-full`, `border-accent/25`, `bg-card/40`, `mx-auto`, `text-xs`, `font-semibold`, `shadow-subtle`, `hover:text-accent`
- Animation: tw-animate-pulse, tw-transitions: transition-colors, transition-all, duration-200, transition-transform, hover-transforms
- State: useState

```tsx
<>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-semibold text-text-h" aria-current="page">Calculators & Tools</li>
          </ol>
```

**GPA** — `pages/Calculators/GPA/index.jsx`
- Variants: `Good`
- Key Styles: `bg-card/40`, `mx-auto`, `text-xs`, `font-bold`, `hover:text-accent`
- Animation: tw-transitions: transition-colors
- State: useState

```tsx
<>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li><Link to="/calculators" className="hover:text-accent transition-colors">Calculators</Link></li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
```

**SGPA** — `pages/Calculators/SGPA/index.jsx`
- Variants: `Good`, `JNTUH`, `R18`
- Key Styles: `rounded-2xl`, `bg-card/40`, `mx-auto`, `text-xs`, `font-bold`, `shadow-subtle`, `hover:text-accent`
- Animation: tw-transitions: transition-colors, transition-all, duration-300
- State: useState

```tsx
<>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li><Link to="/calculators" className="hover:text-accent transition-colors">Calculators</Link></li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
```

**SubjectFormTable** — `pages/Calculators/SubjectFormTable.jsx`
- Props: `regulationName`
- Key Styles: `rounded-2xl`, `bg-card`, `space-y-3.5`, `text-xs`, `font-semibold`, `shadow-subtle`, `cursor-pointer`
- Animation: tw-transitions: transition-colors, transition-all

```tsx
<div className="lg:col-span-6 xl:col-span-7 space-y-3.5">
      <div id="result-component" className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle">
        
        {/* Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3.5 border-b border-border/80">
          <div>
            <label className="block text-xs font-semibold text-text-h mb-1">Select University</label>
            <div className="relative">
              <select
                value={university}
                onChange={(e
```

*...and 3 more data input components.*

### Feedback (2)

**Toast** — `components/ui/Toast.jsx`
- Key Styles: `rounded-xl`, `bg-card`, `px-4`, `text-xs`, `font-semibold`, `shadow-theme`, `pointer-events-none`
- Animation: tw-transitions: transition-all, duration-300

```tsx
<div
      className={`fixed bottom-5 right-5 z-50 bg-card border border-border text-text-h px-4 py-3 rounded-xl shadow-theme transition-all duration-300 flex items-center gap-2.5 text-xs font-semibold pointer-events-none ${
        toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="w-4 h-4 text-emerald-500 shrink-0">
        <CheckCircle className="w-4 h-4" />
      </div>
      <span>{toast.message}</span>
    </div>
```

**NotificationsPage** — `pages/student/NotificationsPage.jsx`
- Variants: `ALL`
- Key Styles: `rounded-2xl`, `border-[#FF6B00]/25`, `bg-[#FF6B00]/10`, `mx-auto`, `text-xl`, `font-extrabold`, `shadow-sm`, `hover:text-white`
- Animation: tw-animate-fadeIn, tw-transitions: transition-all, transition-colors
- State: useState

### Other (4)

**AmbientGradients** — `pages/Home/components/AmbientGradients.jsx`
- Key Styles: `rounded-full`, `bg-orange-500/5`, `blur-[140px]`, `pointer-events-none`

```tsx
<>
      <div className="fixed top-0 right-0 w-[550px] h-[550px] bg-orange-500/5 dark:bg-orange-400/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 -left-32 w-[580px] h-[580px] bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[160px] pointer-events-none -z-10" />
    </>
```

**Home** — `pages/Home/index.jsx`

```tsx
<>
      <AmbientGradients />
      <Hero />
      <CalculatorsSection />
      <HowItWorks />
      <PerformanceSection />
      <UniversitiesSection />
      <ToolsSection />
      <ResourcesSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCtaSection />
```

**EducationRecords** — `pages/student/EducationRecords.jsx`

**SettingsPage** — `pages/student/SettingsPage.jsx`



---

## 5. Layout Principles

- **Base spacing unit:** 4px
- **Spacing scale:** 6, 8, 10, 16, 18, 20, 24, 32, 48, 88
- **Border radius:** 4px, 5px, 6px, 8px, 12px, 16px, 24px
- **Max content width:** 1024px
- **Grid usage:** `grid-cols-1`, `grid-cols-2`, `grid-cols-3`, `col-span-12`, `col-span-1`

**Spacing as Meaning:**
| Spacing | Use |
|---|---|
| 4-8px | Tight: related items within a group |
| 12-16px | Medium: between groups |
| 24-32px | Wide: between sections |
| 48px+ | Vast: major section breaks |


---

## 6. Depth & Elevation

### Flat — subtle depth hints

- `0 0 0 2px var(--accent-soft)`

### Floating — dropdowns, popovers, modals

- `0 0 12px var(--connector-glow)`

### Z-Index Scale

`0, 1, 9998, 9999`



---

## 7. Animation & Motion

This project uses **expressive motion**. Animations are an integral part of the experience.

### CSS Animations

- `@keyframes animate-pulse`
- `@keyframes animate-in`
- `@keyframes animate-fadeIn`
- `@keyframes animate-spin`
- `@keyframes animate-scaleUp`
- `@keyframes animate-bounce`

### Animated Components

- **AdminHeader**: tw-animate-pulse, tw-animate-in, tw-transitions: transition-colors, transition-all
- **AdminSidebar**: tw-transitions: transition-transform, transition-opacity, duration-200, transition-all, duration-300, ease-out, transition-colors, hover-transforms
- **AdminWelcomeBanner**: tw-animate-pulse
- **PlatformUsageChart**: tw-transitions: transition-all
- **PopularToolsTable**: tw-transitions: transition-colors

### Motion Guidelines

- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions
- Easing: `ease-out` for enters, `ease-in` for exits
- Always respect `prefers-reduced-motion`


---

## 8. Do's and Don'ts

### Do's

- Use `#ff6b00` for interactive elements (buttons, links, focus rings)
- Use `#1e2a35` as the primary page background
- Use **Inter** for all UI text
- Follow the **4px** spacing grid for all margins, padding, and gaps
- Use the defined shadow tokens for elevation — see Section 6
- Use border-radius from the scale: 4px, 5px, 6px, 8px, 12px
- Reuse existing components from Section 4 before creating new ones
- Always use CSS variables for colors — never hardcode hex
- Test both light and dark modes for contrast

### Don'ts

- Don't introduce colors outside this palette — extend the design tokens first
- Don't mix font families — use Inter consistently
- Don't use arbitrary spacing values — stick to multiples of 4px
- Don't create custom box-shadow values outside the system tokens
- Don't use arbitrary border-radius values — pick from the defined scale
- Don't duplicate component patterns — check Section 4 first


---

## 9. Responsive Behavior

| Name | Value | Source |
|---|---|---|
| breakpoint-1024px | 1024px | css |

**Approach:** Use `@media (min-width: ...)` queries matching the breakpoints above.


---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #0d141f
Border: 1px solid var(--border)
Radius: 8px
Padding: 16px
Font: Inter
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg #ff6b00, text white
Ghost: bg transparent, border var(--border)
Padding: 8px 16px
Radius: 8px
Hover: opacity 0.9 or lighter shade
Focus: ring with #ff6b00
```

### Build a Page Layout

```
Background: #1e2a35
Max-width: 1024px, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #0d141f
Label: #a1a1aa (muted, 12px, uppercase)
Value: #f1f5f9 (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #1e2a35
Input border: 1px solid var(--border)
Focus: border-color #ff6b00
Label: #a1a1aa 12px
Spacing: 16px between fields
Radius: 8px
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: Inter, type scale from Section 3
4. Spacing: 4px grid
5. Components: match patterns from Section 4
6. Elevation: shadow tokens
```
