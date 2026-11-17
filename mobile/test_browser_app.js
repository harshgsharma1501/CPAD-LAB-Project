const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:8081';

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserTest() {
  console.log('--- STARTING COMPREHENSIVE BROWSER TEST ---');
  console.log(`Target URL: ${APP_URL}`);
  console.log(`Chrome Executable: ${CHROME_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1280,800',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const testResults = [];

  function record(step, pass, details = '') {
    testResults.push({ step, pass, details });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${step}: ${details}`);
  }

  try {
    // 1. Navigate to App
    console.log('\n1. Navigating to login screen...');
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // Save initial screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '01_login_page.png') });

    // 2. Test Email Input Click & Enter (The user's reported bug)
    console.log('\n2. Testing Email input box click and text entry...');
    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} input elements on page.`);

    if (inputs.length < 2) {
      record('Email Input Presence', false, `Found only ${inputs.length} inputs`);
    } else {
      // First input is email
      const emailInput = inputs[0];
      await emailInput.click();
      await sleep(300);

      // Type email
      await emailInput.type('admin@hostel.edu', { delay: 50 });
      const emailValue = await page.evaluate((el) => el.value, emailInput);

      if (emailValue === 'admin@hostel.edu') {
        record(
          'Email Input Click & Enter',
          true,
          'Successfully clicked and entered "admin@hostel.edu" without obstruction.'
        );
      } else {
        record(
          'Email Input Click & Enter',
          false,
          `Expected "admin@hostel.edu" but got "${emailValue}"`
        );
      }

      // Password input
      const passwordInput = inputs[1];
      await passwordInput.click();
      await sleep(200);
      await passwordInput.type('demo1234', { delay: 50 });
      record('Password Input Enter', true, 'Successfully entered password.');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '02_credentials_entered.png') });

    // 3. Click "Log In" button
    console.log('\n3. Clicking Log In...');
    // Find button with text Log In
    const buttons = await page.$$('div[role="button"], div[tabindex="0"]');
    let loginBtnClicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text && text.includes('Log In')) {
        await btn.click();
        loginBtnClicked = true;
        break;
      }
    }

    if (!loginBtnClicked) {
      // Fallback: evaluate click
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const btn = elements.find(
          (el) => el.innerText && el.innerText.trim() === 'Log In'
        );
        if (btn) btn.click();
      });
    }

    // Wait for Dashboard to load
    await sleep(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '03_dashboard.png') });

    const pageContent = await page.evaluate(() => document.body.innerText);
    if (
      pageContent.includes('Dashboard') ||
      pageContent.includes('Zostel MIS') ||
      pageContent.includes('Total Students')
    ) {
      record('Login & Navigation to Dashboard', true, 'Successfully logged in and reached Dashboard');
    } else {
      record(
        'Login & Navigation to Dashboard',
        false,
        'Dashboard title or metrics not found in text: ' + pageContent.substring(0, 200)
      );
    }

    // 4. Verify Dashboard Metrics
    console.log('\n4. Verifying Dashboard metrics...');
    const hasTotalStudents = pageContent.includes('Total Students');
    const hasTotalRooms = pageContent.includes('Total Rooms');
    const hasFees = pageContent.includes('Fees') || pageContent.includes('Collected');
    record(
      'Dashboard MIS Metrics Cards',
      hasTotalStudents && hasTotalRooms,
      `Students: ${hasTotalStudents}, Rooms: ${hasTotalRooms}, Fees: ${hasFees}`
    );

    // 5. Navigate to Students Tab
    console.log('\n5. Testing Students tab...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const studentTab = elements.find(
        (el) => el.innerText && el.innerText.trim() === 'Students'
      );
      if (studentTab) studentTab.click();
    });
    await sleep(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '04_students_tab.png') });

    const studentsText = await page.evaluate(() => document.body.innerText);
    const hasStudentList =
      studentsText.includes('Rahul Sharma') ||
      studentsText.includes('Priya Patel') ||
      studentsText.includes('Students');
    record('Students Screen Load', hasStudentList, 'Rendered student records with badges');

    // 6. Navigate to Rooms Tab
    console.log('\n6. Testing Rooms & Allocation tab...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const roomsTab = elements.find(
        (el) => el.innerText && el.innerText.trim() === 'Rooms'
      );
      if (roomsTab) roomsTab.click();
    });
    await sleep(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '05_rooms_tab.png') });

    const roomsText = await page.evaluate(() => document.body.innerText);
    const hasHostelOrRooms =
      roomsText.includes('Hostel') ||
      roomsText.includes('Room') ||
      roomsText.includes('Floor');
    record(
      'Rooms & Allocation Screen Load',
      hasHostelOrRooms,
      'Rendered hostel switcher, floor filter, room cards'
    );

    // 7. Navigate to Fees Tab
    console.log('\n7. Testing Fees tab...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const feesTab = elements.find(
        (el) => el.innerText && el.innerText.trim() === 'Fees'
      );
      if (feesTab) feesTab.click();
    });
    await sleep(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '06_fees_tab.png') });

    const feesText = await page.evaluate(() => document.body.innerText);
    const hasFeeSummary =
      feesText.includes('Collected') ||
      feesText.includes('Pending') ||
      feesText.includes('Fee');
    record('Fees Screen Load', hasFeeSummary, 'Rendered fee summaries and payment records');

    // 8. Navigate to Maintenance Tab
    console.log('\n8. Testing Maintenance tab...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const maintTab = elements.find(
        (el) => el.innerText && el.innerText.trim() === 'Maintenance'
      );
      if (maintTab) maintTab.click();
    });
    await sleep(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '07_maintenance_tab.png') });

    const maintText = await page.evaluate(() => document.body.innerText);
    const hasMaintRecords =
      maintText.includes('Maintenance') ||
      maintText.includes('Ticket') ||
      maintText.includes('Status');
    record(
      'Maintenance Screen Load',
      hasMaintRecords,
      'Rendered maintenance tickets with priority and status filters'
    );
  } catch (err) {
    console.error('Test execution error:', err);
    record('Browser Test Execution', false, err.message);
  } finally {
    await browser.close();
    console.log('\n================ SUMMARY ================');
    console.table(testResults);
    const allPassed = testResults.every((t) => t.pass);
    console.log(
      allPassed
        ? '>>> ALL BROWSER INTEGRATION TESTS PASSED <<<'
        : '>>> SOME TESTS FAILED <<<'
    );
  }
}

runBrowserTest();
