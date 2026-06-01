# Playwright Best Practices

## Locator Priority (most resilient → least resilient)

1. `page.getByRole('button', { name: 'Submit' })` — best: matches accessibility tree
2. `page.getByLabel('Email')` — good: matches form label
3. `page.getByText('Sign In')` — good for visible text
4. `page.getByTestId('submit-btn')` — good when `data-testid` is set
5. `page.locator('#email')` — acceptable for IDs
6. `page.locator('.btn-primary')` — avoid: fragile, breaks on CSS refactor
7. `page.locator('div > span:nth-child(2)')` — never use

## Waiting Correctly

```typescript
// GOOD — waits for network to settle
await page.waitForLoadState('networkidle');

// GOOD — waits for specific URL
await page.waitForURL('**/rooms', { timeout: 10_000 });

// GOOD — waits for element
await page.waitForSelector('[data-testid="room-card"]', { timeout: 8_000 });

// BAD — arbitrary sleep, flaky
await page.waitForTimeout(3000);
```

## API Response Assertions

```typescript
// Assert an API call succeeded AND check status code
const apiResponse = await page.waitForResponse(
  r => r.url().includes('/api/rooms') && r.request().method() === 'GET',
  { timeout: 10_000 }
);
expect(apiResponse.status()).toBe(200);

// Assert Bearer token was sent
const authHeader = apiResponse.request().headers()['authorization'];
expect(authHeader).toMatch(/^Bearer\s+\S+/);
```

## Auth Shortcuts

```typescript
// Fast token injection (skip login form for non-auth tests)
async function injectToken(page: Page, token: string) {
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
}

// Get token via API (faster than UI login)
const res = await page.request.post('/api/auth/login', {
  data: { email: DEMO_EMAIL, password: DEMO_PASS }
});
const { token } = await res.json();
```

## Timezone Testing

```typescript
// For any feature with datetime-local inputs or UTC conversion
test.describe('Date features — UTC-3', () => {
  test.use({ timezoneId: 'America/Sao_Paulo' }); // UTC-3

  test('booking at 21:00 local appears on correct UTC date', async ({ page }) => {
    // 21:00 local in UTC-3 = 00:00 UTC next day
    // Verify the list refreshes to the UTC date, not the local date
  });
});
```

## Test Independence

- Every test must be runnable in isolation — no shared state via `let` at describe level
- Use `beforeEach` for common navigation, not `beforeAll`
- Clean up created data in `afterEach` if it would affect other tests
- Never depend on test execution order
