const { chromium } = require('playwright');

(async () => {
  console.log('Testing booking flow with Chromium...');
  
  try {
    // Launch Chromium (not Chrome)
    const browser = await chromium.launch({ 
      headless: true, // Set to true for headless mode
      channel: undefined // Explicitly no channel to avoid Chrome
    });
    
    console.log('✅ Chromium launched successfully!');
    
    const page = await browser.newPage();
    
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('Attempting to navigate to booking flow...');
    
    try {
      await page.goto('http://192.168.1.171:3000/yardcard-elite-west-branch/booking', {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      console.log('✅ Successfully navigated to booking flow!');
      
      // Take screenshot
      await page.screenshot({ 
        path: 'booking-flow-step1.png', 
        fullPage: true 
      });
      console.log('📸 Screenshot saved as booking-flow-step1.png');
      
      // Get page title and basic info
      const title = await page.title();
      console.log(`Page title: ${title}`);
      
      // Check for form elements and shadows
      const formContainer = await page.locator('.shadow-default').count();
      console.log(`Found ${formContainer} elements with shadow-default class`);
      
      // Check for step indicators
      const progressDots = await page.locator('[class*="progress"], [class*="step"]').count();
      console.log(`Found ${progressDots} progress/step elements`);
      
      // Check for form fields
      const inputs = await page.locator('input').count();
      console.log(`Found ${inputs} input fields`);
      
      // Fill out Step 1 to navigate to Step 2
      await page.fill('input[id="fullName"]', 'John Doe');
      await page.fill('input[id="email"]', 'john@example.com');
      await page.fill('input[id="phone"]', '(555) 123-4567');
      
      // Click Continue to go to Step 2
      await page.click('button:has-text("Continue")');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of Step 2
      await page.screenshot({ 
        path: 'booking-flow-step2.png', 
        fullPage: true 
      });
      console.log('📸 Step 2 screenshot saved as booking-flow-step2.png');
      
      // Count shadows in Step 2
      const step2Shadows = await page.locator('.shadow-default').count();
      console.log(`Step 2: Found ${step2Shadows} elements with shadow-default class`);
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({ 
        path: 'booking-flow-mobile.png', 
        fullPage: true 
      });
      console.log('📱 Mobile screenshot saved as booking-flow-mobile.png');
      
    } catch (navError) {
      console.log('❌ Could not navigate to booking flow:', navError.message);
      console.log('💡 Make sure the dev server is running: npm run dev');
    }
    
    await browser.close();
    console.log('✅ Browser closed successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();