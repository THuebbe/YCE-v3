const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Comprehensive Shadow Assessment: Steps 3-6 Focus');
  
  try {
    const browser = await chromium.launch({ 
      headless: true,
      channel: undefined
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    
    await page.goto('http://192.168.1.171:3000/yardcard-elite-west-branch/booking', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    console.log('✅ Booking flow loaded');

    // Helper to assess each step
    async function assessStep(stepName, stepNumber) {
      console.log(`\n📊 Assessing ${stepName} (Step ${stepNumber})...`);
      
      await page.waitForTimeout(2000); // Wait for step to fully load
      
      // Count shadow elements
      const shadowCount = await page.locator('.shadow-default, .shadow-medium, .shadow-large').count();
      console.log(`   Shadow elements: ${shadowCount}`);
      
      // Count card containers
      const cardCount = await page.locator('.bg-white').count();
      console.log(`   White background elements: ${cardCount}`);
      
      // Count form inputs
      const inputCount = await page.locator('input, textarea, select').count();
      console.log(`   Form inputs: ${inputCount}`);
      
      // Take desktop screenshot
      const filename = `step-${stepNumber}-${stepName.toLowerCase().replace(/\s+/g, '-')}-desktop.png`;
      await page.screenshot({ 
        path: filename, 
        fullPage: true 
      });
      console.log(`   📸 Desktop screenshot: ${filename}`);
      
      // Take mobile screenshot
      await page.setViewportSize({ width: 375, height: 667 });
      const mobileFilename = `step-${stepNumber}-${stepName.toLowerCase().replace(/\s+/g, '-')}-mobile.png`;
      await page.screenshot({ 
        path: mobileFilename, 
        fullPage: true 
      });
      console.log(`   📱 Mobile screenshot: ${mobileFilename}`);
      
      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      
      return { shadowCount, cardCount, inputCount };
    }

    // Quick fill Steps 1 & 2 to get to Step 3
    console.log('\n⚡ Quick navigation to Step 3...');
    
    // Fill Step 1
    await page.fill('input[id="fullName"]', 'John Doe');
    await page.fill('input[id="email"]', 'john.doe@example.com');
    await page.fill('input[id="phone"]', '(555) 123-4567');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForLoadState('networkidle');
    
    // Fill Step 2 - be more careful with date and required fields
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateString = futureDate.toISOString().split('T')[0];
    
    await page.fill('input[id="eventDate"]', dateString);
    await page.fill('input[id="street"]', '123 Main Street');
    await page.fill('input[id="city"]', 'Anytown');
    await page.fill('input[id="state"]', 'CA');
    await page.fill('input[id="zipCode"]', '90210');
    
    // For time window, try to click the container instead of the hidden radio
    try {
      await page.click('text=Morning (8AM - 12PM)');
    } catch (e) {
      console.log('   ⚠️ Using alternative time selection...');
      await page.locator('input[value="morning"]').check({ force: true });
    }
    
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Reached Step 3');

    // Now assess each step in detail
    const step3Results = await assessStep('Display Customization', 3);
    
    // Try to navigate to Step 4 by making basic selections
    console.log('\n⚡ Attempting to navigate to Step 4...');
    try {
      // Look for name input and fill it
      const nameInputs = await page.locator('input[placeholder*="name"], input[placeholder*="Name"]').all();
      if (nameInputs.length > 0) {
        await nameInputs[0].fill('Sarah');
        console.log('   ✅ Filled name field');
      }
      
      // Look for message input and fill it
      const messageInputs = await page.locator('input[placeholder*="message"], input[placeholder*="Message"], textarea[placeholder*="message"]').all();
      if (messageInputs.length > 0) {
        await messageInputs[0].fill('Happy Birthday');
        console.log('   ✅ Filled message field');
      }
      
      // Try to find and select a sign option
      const signOptions = await page.locator('button:has-text("Select"), input[type="radio"]').all();
      if (signOptions.length > 0) {
        await signOptions[0].click();
        console.log('   ✅ Selected sign option');
      }
      
      // Wait a moment for any validation
      await page.waitForTimeout(1000);
      
      // Try to continue to Step 4
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.waitForLoadState('networkidle');
      
      const step4Results = await assessStep('Payment Information', 4);
      
      // Try to navigate to Step 5 (Review) - may require payment info
      console.log('\n⚡ Attempting to navigate to Step 5...');
      try {
        // For payment step, we might just need to scroll down or select payment method
        // Let's just try to continue and see what happens
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.waitForLoadState('networkidle');
        
        const step5Results = await assessStep('Review Order', 5);
        
        // Step 6 would require actual payment processing, so let's stop here
        console.log('\n📋 COMPREHENSIVE ASSESSMENT RESULTS:');
        console.log('==========================================');
        console.log(`Step 3 (Display): ${step3Results.shadowCount} shadows, ${step3Results.cardCount} cards, ${step3Results.inputCount} inputs`);
        console.log(`Step 4 (Payment): ${step4Results.shadowCount} shadows, ${step4Results.cardCount} cards, ${step4Results.inputCount} inputs`);
        console.log(`Step 5 (Review): ${step5Results.shadowCount} shadows, ${step5Results.cardCount} cards, ${step5Results.inputCount} inputs`);
        
      } catch (step5Error) {
        console.log('⚠️ Could not reach Step 5:', step5Error.message);
        console.log('📋 ASSESSMENT RESULTS (Steps 3-4):');
        console.log('===================================');
        console.log(`Step 3 (Display): ${step3Results.shadowCount} shadows, ${step3Results.cardCount} cards, ${step3Results.inputCount} inputs`);
        console.log(`Step 4 (Payment): ${step4Results.shadowCount} shadows, ${step4Results.cardCount} cards, ${step4Results.inputCount} inputs`);
      }
      
    } catch (step4Error) {
      console.log('⚠️ Could not reach Step 4:', step4Error.message);
      console.log('📋 ASSESSMENT RESULTS (Step 3 only):');
      console.log('====================================');
      console.log(`Step 3 (Display): ${step3Results.shadowCount} shadows, ${step3Results.cardCount} cards, ${step3Results.inputCount} inputs`);
    }
    
    await browser.close();
    console.log('\n✅ Assessment completed! Check screenshots for detailed visual analysis.');
    
  } catch (error) {
    console.error('❌ Error during assessment:', error.message);
  }
})();