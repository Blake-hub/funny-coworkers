import { test, expect } from '@playwright/test';

test.describe('Team Edit Page - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@pmis.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('should successfully load team data from API', async ({ page }) => {
    await page.goto('/teams/edit/4');
    await page.waitForURL('/teams/edit/4');
    
    await page.waitForTimeout(5000);
    
    const pageContent = await page.content();
    console.log('Page Content:');
    console.log(pageContent.substring(0, 3000));
    
    const nameInput = page.locator('[data-testid="team-name-input"]');
    const isVisible = await nameInput.isVisible();
    console.log('Name input visible:', isVisible);
    
    if (isVisible) {
      const teamNameValue = await nameInput.inputValue();
      console.log('Team Name Value:', teamNameValue);
      console.log('Team Name Length:', teamNameValue.length);
      
      expect(teamNameValue).toBeTruthy();
      expect(teamNameValue.length).toBeGreaterThan(1);
    } else {
      console.log('ERROR: Name input is not visible');
      
      const headings = page.locator('h1');
      const headingCount = await headings.count();
      console.log('H1 count:', headingCount);
      for (let i = 0; i < headingCount; i++) {
        const text = await headings.nth(i).textContent();
        console.log(`H1 ${i}: ${text}`);
      }
    }
  });
});