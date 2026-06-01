# Visual Quality Check

## Why This Matters

E2E tests verify behavior but not visual quality. A page can pass all behavioral tests while looking completely broken if the CSS file is empty, missing, or misconfigured. This happened in the TesteFinal project: all tests passed, but the app had no styles.

## Mandatory Visual Check (add to first post-login test)

After navigating to the main authenticated page, always verify the page is not unstyled:

```typescript
test('Page is visually styled (not blank/unstyled)', async ({ page }) => {
  // Navigate to main app page after login
  await page.goto('/login');
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/[main-route]', { timeout: 10_000 });
  await page.waitForLoadState('networkidle');

  // Check 1: At least one styled container exists
  const containers = await page.locator('main, .container, .page, [role="main"], [class*="container"]').count();
  expect(containers).toBeGreaterThan(0);

  // Check 2: Body is not raw white with no structure
  const bodyBg = await page.evaluate(() =>
    window.getComputedStyle(document.body).backgroundColor
  );
  const bodyPadding = await page.evaluate(() =>
    window.getComputedStyle(document.body).padding
  );
  // If body has no background AND no padding, likely missing CSS
  const isUnstyled = bodyBg === 'rgba(0, 0, 0, 0)' && bodyPadding === '0px';
  if (isUnstyled) {
    console.warn('WARNING: Body appears unstyled — possible missing global CSS');
  }

  // Check 3: Page has visible content beyond bare text
  const interactiveElements = await page.locator('button, a, input, [role="button"]').count();
  expect(interactiveElements).toBeGreaterThan(0);
});
```

## When a Page Fails Visual Check

If the visual check fails:
1. Check that `styles.css` (or equivalent) is correctly linked in `index.html` or `angular.json`
2. Check that the global CSS file is not empty
3. Check that the CSS custom properties `:root {}` block exists
4. Report as: `Owner: frontend`, Severity: HIGH, "Page is missing global CSS styles"

## Screenshot Review Guidance

After every test run, scan the screenshots in `evidence/`:
- Look for pages that are just black text on white
- Look for unstyled form inputs (default browser style, no border-radius, no padding)
- Look for missing color on buttons (grey default browser buttons)
- Look for missing navigation bar or layout structure

Any of these are visual regressions that warrant a bug report.
