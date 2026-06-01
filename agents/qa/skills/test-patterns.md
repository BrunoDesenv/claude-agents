# Test Structure Patterns

## Base test structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('[Feature Name]', () => {
  test.beforeEach(async ({ page }) => {
    // common setup (navigate to page, login if needed)
  });

  test('should [expected behavior — golden path]', async ({ page }) => {
    // arrange
    // act
    // assert
    await expect(page.getByRole('...')).toBeVisible();
  });

  test('should handle [edge case]', async ({ page }) => { ... });
  test('should show error when [failure scenario]', async ({ page }) => { ... });
});
```

## Timezone testing (mandatory when feature involves dates/times)
Playwright headless runs in UTC. Users in UTC-3 will have different date behavior.

```typescript
test.describe('Date/time features — UTC-3 timezone', () => {
  test.use({ timezoneId: 'America/Sao_Paulo' }); // UTC-3

  test('booking created at local evening appears on correct UTC date', async ({ page }) => {
    // Test with 21:00 local = 00:00 UTC next day
  });
});
```
