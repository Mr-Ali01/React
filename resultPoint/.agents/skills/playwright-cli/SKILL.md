---
name: playwright-cli
description: Drive real browser sessions and automate end-to-end testing of ResultPoint frontend (login, signup, calculators, responsive layouts) via Playwright CLI.
---

# Playwright CLI Browser Automation

Playwright CLI (`@playwright/cli`) provides a command-line interface designed specifically for AI coding agents and developers to interact with and test real browsers with minimal token overhead.

## When to Use
- Testing frontend features: Login, Signup, Academic Profile Setup, and My Results.
- Validating Calculators: CGPA, SGPA, GPA, Percentage, Grade, Credits, and Target CGPA.
- Testing responsive breakpoints: Mobile (< 1024px) dropdown and popup modal vs Desktop (>= 1024px) 3-column layout.
- Taking page snapshots, element queries, and checking console errors.

## Basic Workflow

### 1. Open Browser
```bash
# Open desktop Chrome
npx playwright-cli open http://localhost:5173 --browser chrome

# Open mobile viewport (emulating mobile device)
npx playwright-cli open http://localhost:5173/calculators/cgpa --browser chrome --mobile
```

### 2. Inspect Elements & State
```bash
# Capture element tree snapshot with reference IDs (e.g. e1, e2, e3)
npx playwright-cli snapshot

# Search for specific text on the page
npx playwright-cli find "Calculate CGPA"
```

### 3. Perform Interactions
```bash
# Click a target element by reference or selector
npx playwright-cli click "button:has-text('Calculate CGPA')"

# Fill input fields
npx playwright-cli fill "input[placeholder='Subject Name']" "Data Structures"

# Resize viewport to test responsiveness
npx playwright-cli resize 390 844    # Mobile (iPhone size)
npx playwright-cli resize 1280 800   # Desktop
```

### 4. Capture Evidence & Close Session
```bash
# Save screenshot
npx playwright-cli screenshot

# Close browser session
npx playwright-cli close
```

## Tips for Windows
- Use `--browser chrome` or `--browser msedge` which use pre-installed Windows browsers without requiring separate binary downloads.
- Browser sessions persist across sequential commands until `playwright-cli close` is executed.
