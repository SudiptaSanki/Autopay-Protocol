const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:5173');
  
  try {
    await page.waitForSelector('button:has-text("Connect Wallet")');
    console.log("Clicking button...");
    await page.click('button:has-text("Connect Wallet")');
    await page.waitForTimeout(2000);
  } catch(e) {
    console.error("Test failed:", e);
  }
  
  await browser.close();
})();
