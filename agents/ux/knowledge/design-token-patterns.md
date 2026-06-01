# Design Token Patterns

## CSS Custom Property Naming Convention

### Color Tokens
```css
:root {
  /* Brand / Interactive */
  --color-primary:        #4f46e5;
  --color-primary-hover:  #4338ca;
  --color-primary-active: #3730a3;

  /* Surfaces */
  --color-bg:             #f8fafc;   /* page background */
  --color-surface:        #ffffff;   /* card/panel background */
  --color-surface-raised: #f1f5f9;   /* elevated surface */

  /* Text */
  --color-text:           #0f172a;   /* primary text */
  --color-text-secondary: #475569;   /* secondary/label text */
  --color-text-muted:     #64748b;   /* placeholder/disabled */
  --color-text-on-primary:#ffffff;   /* text on primary color */

  /* Borders */
  --color-border:         #e2e8f0;
  --color-border-focus:   #4f46e5;   /* focus ring color */

  /* Semantic States */
  --color-error:          #dc2626;
  --color-error-bg:       #fef2f2;
  --color-success:        #16a34a;
  --color-success-bg:     #f0fdf4;
  --color-warning:        #d97706;
  --color-warning-bg:     #fffbeb;
}
```

### Spacing Scale
```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Typography
```css
:root {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Cascadia Code', 'Fira Code', Consolas, monospace;

  --text-xs:   0.75rem;   /* 12px */
  --text-sm:   0.875rem;  /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg:   1.125rem;  /* 18px */
  --text-xl:   1.25rem;   /* 20px */
  --text-2xl:  1.5rem;    /* 24px */
  --text-3xl:  1.875rem;  /* 30px */

  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed:1.75;
}
```

### Borders & Radii
```css
:root {
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;  /* pill / badge */

  --border-width: 1px;
  --border-width-2: 2px;
}
```

### Shadows
```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

---

## How to Use in UX Plans

When specifying a component, always reference tokens:

**Do:**
> "The card background should use `--color-surface` with `--shadow-sm`. The title uses `--text-lg` weight `--font-semibold`. The border on hover changes to `--color-primary`."

**Don't:**
> "The card is white with a subtle shadow. The title is slightly larger."

Token-based specs give frontend agents exact, unambiguous values to implement.

---

## Dark Mode Support

To support dark mode, add a `[data-theme="dark"]` override:
```css
[data-theme="dark"] {
  --color-bg:             #0f172a;
  --color-surface:        #1e293b;
  --color-text:           #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-border:         #334155;
}
```
All components automatically adopt dark mode if they use tokens correctly.
