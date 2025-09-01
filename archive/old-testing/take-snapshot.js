const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/yardcard-elite-west-branch/booking');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'booking-page-snapshot.png', fullPage: true });
    
    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    
    console.log(`Page Title: ${title}`);
    console.log(`Page URL: ${url}`);
    console.log('Screenshot saved as booking-page-snapshot.png');
    
    // Get some basic page info
    const bodyText = await page.locator('body').textContent();
    const headings = await page.locator('h1, h2, h3').allTextContents();
    
    console.log('\nHeadings found:');
    headings.forEach((heading, index) => {
      console.log(`  ${index + 1}. ${heading}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();