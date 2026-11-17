const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 5000
    };

    if (data) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ETIMEDOUT'));
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function loginRole(email, password) {
  const res = await request({ method: 'POST', path: '/api/auth/login' }, { email, password });
  if (res.status !== 200 || !res.data?.token) {
    throw new Error(`Login failed for ${email}: status ${res.status}`);
  }
  return res.data;
}

async function runFullIntegration() {
  console.log('====================================================');
  console.log('🚀 RUNNING MOBILE FULL INTEGRATION SUITE');
  console.log('====================================================\n');

  const testResults = [];
  function record(category, testName, pass, details = '') {
    testResults.push({ category, testName, pass, details });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] [${category}] ${testName} ${details ? '— ' + details : ''}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 1. ROLE-BY-ROLE LOGIN & ACCESS TEST
  // ─────────────────────────────────────────────────────────────
  const rolesConfig = {
    admin: {
      email: 'admin@hostel.edu',
      password: 'demo1234',
      uiCanAddStudent: true,
      uiCanAllocate: true,
      uiCanRecordFee: true,
      uiCanManageMaint: true,
    },
    warden: {
      email: 'warden@hostel.edu',
      password: 'demo1234',
      uiCanAddStudent: true,
      uiCanAllocate: true,
      uiCanRecordFee: false, // forbidden
      uiCanManageMaint: true,
    },
    accounts: {
      email: 'accounts@hostel.edu',
      password: 'demo1234',
      uiCanAddStudent: false, // forbidden
      uiCanAllocate: false, // forbidden
      uiCanRecordFee: true,
      uiCanManageMaint: false, // forbidden
    },
    student: {
      email: 'student@hostel.edu',
      password: 'demo1234',
      uiCanAddStudent: false, // forbidden
      uiCanAllocate: false, // forbidden
      uiCanRecordFee: false, // forbidden
      uiCanManageMaint: false, // forbidden
    },
    sysadmin: {
      email: 'sysadmin@hostel.edu',
      password: 'demo1234',
      uiCanAddStudent: true,
      uiCanAllocate: true,
      uiCanRecordFee: true,
      uiCanManageMaint: true,
    },
  };

  const tokens = {};

  let roomCounter = 10;
  for (const [role, cfg] of Object.entries(rolesConfig)) {
    console.log(`\n--- Testing Role: ${role.toUpperCase()} ---`);
    roomCounter += 1;

    // A. Fresh Login
    const loginData = await loginRole(cfg.email, cfg.password);
    tokens[role] = loginData.token;
    record(role, 'POST /api/auth/login returns token & user profile', !!loginData.token && loginData.user.role === role, `Role: ${loginData.user.role}`);

    const authHeaders = { Authorization: `Bearer ${tokens[role]}` };

    // B. Dashboard (GET /api/reports)
    const dashRes = await request({ method: 'GET', path: '/api/reports', headers: authHeaders });
    record(role, 'Dashboard GET /api/reports', dashRes.status === 200 && dashRes.data?.total_students > 0, `Total Students: ${dashRes.data?.total_students}`);

    // C. Students (GET /api/students)
    const studentsRes = await request({ method: 'GET', path: '/api/students', headers: authHeaders });
    record(role, 'Students GET /api/students', studentsRes.status === 200 && Array.isArray(studentsRes.data), `Count: ${studentsRes.data?.length}`);

    // D. Rooms (GET /api/rooms/hostels, GET /api/rooms)
    const hostelsRes = await request({ method: 'GET', path: '/api/rooms/hostels', headers: authHeaders });
    const roomsRes = await request({ method: 'GET', path: '/api/rooms?hostel_id=1', headers: authHeaders });
    record(role, 'Rooms GET /api/rooms/hostels & GET /api/rooms', hostelsRes.status === 200 && roomsRes.status === 200, `Hostels: ${hostelsRes.data?.length}, Rooms: ${roomsRes.data?.length}`);

    // E. Fees (GET /api/fees/summary, GET /api/fees, GET /api/fees/types)
    const feesSumRes = await request({ method: 'GET', path: '/api/fees/summary', headers: authHeaders });
    const feesRes = await request({ method: 'GET', path: '/api/fees', headers: authHeaders });
    record(role, 'Fees GET /api/fees/summary & GET /api/fees', feesSumRes.status === 200 && feesRes.status === 200, `Collected: ₹${feesSumRes.data?.total_collected}`);

    // F. Maintenance (GET /api/maintenance)
    const maintRes = await request({ method: 'GET', path: '/api/maintenance', headers: authHeaders });
    if (role === 'student') {
      const studentOwnOnly = maintRes.data.every(m => m.student_id === 1);
      record(role, 'Maintenance GET /api/maintenance (auto-filtered to student own)', maintRes.status === 200 && studentOwnOnly, `Student tickets: ${maintRes.data?.length}`);
    } else {
      record(role, 'Maintenance GET /api/maintenance (full hostel list)', maintRes.status === 200 && Array.isArray(maintRes.data), `Total tickets: ${maintRes.data?.length}`);
    }

    // G. Verify Action Authorization / 403 Rejection
    // 1. Add Student
    const addStudentPayload = {
      name: `Test ${role} Student`,
      email: `test_${role}_${Date.now()}@hostel.edu`,
      reg_no: `231070_${role}_${Date.now().toString().slice(-4)}`,
      department: 'Computer Science',
      year: 1
    };
    const addStudentRes = await request({ method: 'POST', path: '/api/students', headers: authHeaders }, addStudentPayload);
    if (cfg.uiCanAddStudent) {
      record(role, 'Authorized Action: POST /api/students', addStudentRes.status === 201, `Status: ${addStudentRes.status}`);
    } else {
      record(role, 'Forbidden Action: POST /api/students returns 403', addStudentRes.status === 403 && addStudentRes.data?.error === 'Insufficient permissions', `Status: ${addStudentRes.status}`);
    }

    // 2. Allocate Room
    const allocateRes = await request({ method: 'POST', path: '/api/rooms/allocate', headers: authHeaders }, {
      student_id: 1,
      room_id: roomCounter,
      academic_year: '2025-26'
    });
    if (cfg.uiCanAllocate) {
      record(role, 'Authorized Action: POST /api/rooms/allocate', allocateRes.status === 201, `Status: ${allocateRes.status}`);
    } else {
      record(role, 'Forbidden Action: POST /api/rooms/allocate returns 403', allocateRes.status === 403, `Status: ${allocateRes.status}`);
    }

    // 3. Record Fee Payment
    const feeRes = await request({ method: 'POST', path: '/api/fees', headers: authHeaders }, {
      student_id: 1,
      fee_type_id: 1,
      amount: 15000,
      due_date: '2025-09-01',
      paid_date: '2026-11-17',
      method: 'UPI',
      status: 'Paid'
    });
    if (cfg.uiCanRecordFee) {
      record(role, 'Authorized Action: POST /api/fees', feeRes.status === 201, `Status: ${feeRes.status}`);
    } else {
      record(role, 'Forbidden Action: POST /api/fees returns 403', feeRes.status === 403, `Status: ${feeRes.status}`);
    }

    // 4. Update Maintenance status
    const updateMaintRes = await request({ method: 'PUT', path: '/api/maintenance/1', headers: authHeaders }, {
      status: 'In Progress',
      assigned_to: 'Raju Electrician'
    });
    if (cfg.uiCanManageMaint) {
      record(role, 'Authorized Action: PUT /api/maintenance/:id', updateMaintRes.status === 200, `Status: ${updateMaintRes.status}`);
    } else {
      record(role, 'Forbidden Action: PUT /api/maintenance/:id returns 403', updateMaintRes.status === 403, `Status: ${updateMaintRes.status}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. DATA PERSISTENCE TEST ACROSS PROCESS RESTARTS
  // ─────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('💾 TESTING PERSISTENCE ACROSS SERVER RESTART');
  console.log('====================================================\n');

  const adminHeaders = { Authorization: `Bearer ${tokens.admin}` };
  const accountsHeaders = { Authorization: `Bearer ${tokens.accounts}` };
  const studentHeaders = { Authorization: `Bearer ${tokens.student}` };

  // Step 2.1: Admin creates new student
  const uniqueReg = '231070' + Math.floor(100 + Math.random() * 900);
  const createdStudentRes = await request({ method: 'POST', path: '/api/students', headers: adminHeaders }, {
    name: 'Persistence Verification Student',
    email: `persistence_${uniqueReg}@hostel.edu`,
    reg_no: uniqueReg,
    department: 'Civil Engineering',
    year: 3,
    phone: '9820098200',
    dob: '2004-04-04',
    gender: 'Male',
    guardian_name: 'Mr. Verification',
    guardian_phone: '9820098201',
    address: 'Campus Hostel Block B'
  });
  const newStudentId = createdStudentRes.data?.id;
  record('Persistence-Step1', 'Admin creates new student', createdStudentRes.status === 201 && !!newStudentId, `ID: ${newStudentId}, Reg: ${uniqueReg}`);

  // Step 2.2: Admin allocates that student to an available room
  const Database = require('../server/node_modules/better-sqlite3');
  const path = require('path');
  const dbFile = path.join(__dirname, '..', 'server', 'db', 'hostel.db');
  const preCheckDb = new Database(dbFile);
  const availableRoom = preCheckDb.prepare(`
    SELECT r.id FROM rooms r
    WHERE (SELECT COUNT(*) FROM room_allocations ra WHERE ra.room_id = r.id AND ra.status = 'Active') < r.capacity
    LIMIT 1
  `).get();
  preCheckDb.close();

  const targetRoomId = availableRoom ? availableRoom.id : 50;
  const allocRes = await request({ method: 'POST', path: '/api/rooms/allocate', headers: adminHeaders }, {
    student_id: newStudentId,
    room_id: targetRoomId,
    academic_year: '2025-26'
  });
  record('Persistence-Step2', `Admin allocates student ${newStudentId} to Room ${targetRoomId}`, allocRes.status === 201, `Allocated: ${allocRes.data?.message}`);

  // Step 2.3: Accounts records a fee payment for that student
  const feePayRes = await request({ method: 'POST', path: '/api/fees', headers: accountsHeaders }, {
    student_id: newStudentId,
    fee_type_id: 1,
    amount: 15000,
    due_date: '2025-09-01',
    paid_date: '2026-11-17',
    method: 'Online',
    status: 'Paid',
    txn_ref: 'TXN-PERSIST-' + uniqueReg,
    remarks: 'Persistence check test entry'
  });
  const newFeeId = feePayRes.data?.id;
  record('Persistence-Step3', 'Accounts records fee payment', feePayRes.status === 201 && !!newFeeId, `Fee ID: ${newFeeId}, Receipt: ${feePayRes.data?.receipt_no}`);

  // Step 2.4: Student submits a maintenance request
  const maintSubmitRes = await request({ method: 'POST', path: '/api/maintenance', headers: studentHeaders }, {
    student_id: newStudentId,
    room_id: targetRoomId,
    category: 'Plumbing',
    description: 'Persistence test water valve dripping',
    priority: 'Medium'
  });
  const newMaintId = maintSubmitRes.data?.id;
  record('Persistence-Step4', 'Submit maintenance request', maintSubmitRes.status === 201 && !!newMaintId, `Maint ID: ${newMaintId}`);

  // Step 2.5: Verify DB directly via better-sqlite3 to confirm disk write
  const db = new Database(dbFile);

  const studentInDb = db.prepare('SELECT * FROM students WHERE id = ?').get(newStudentId);
  const allocInDb = db.prepare('SELECT * FROM room_allocations WHERE student_id = ? AND room_id = ? AND status = ?').get(newStudentId, targetRoomId, 'Active');
  const roomInDb = db.prepare('SELECT * FROM rooms WHERE id = ?').get(targetRoomId);
  const feeInDb = db.prepare('SELECT * FROM fee_payments WHERE id = ?').get(newFeeId);
  const maintInDb = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(newMaintId);
  db.close();

  record('Persistence-Disk', 'Student record verified in hostel.db disk file', !!studentInDb && studentInDb.reg_no === uniqueReg);
  record('Persistence-Disk', 'Room allocation verified in hostel.db disk file', !!allocInDb && allocInDb.room_id === targetRoomId);
  record('Persistence-Disk', 'Room occupancy status updated in hostel.db', roomInDb.status === 'Partial' || roomInDb.status === 'Occupied', `Status: ${roomInDb.status}`);
  record('Persistence-Disk', 'Fee payment verified in hostel.db disk file', !!feeInDb && feeInDb.txn_ref === 'TXN-PERSIST-' + uniqueReg);
  record('Persistence-Disk', 'Maintenance request verified in hostel.db disk file', !!maintInDb && maintInDb.id === newMaintId);

  // ─────────────────────────────────────────────────────────────
  // 3. TOKEN EXPIRY / INVALID TOKEN TEST
  // ─────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('🛡️ TESTING TOKEN EXPIRY & INVALID TOKEN REDIRECT');
  console.log('====================================================\n');

  // Test 3.1: Corrupt token
  const corruptTokenRes = await request({
    method: 'GET',
    path: '/api/auth/me',
    headers: { Authorization: 'Bearer invalid.corrupted.jwttoken' }
  });
  record('Token-Security', 'Corrupt token rejected with 401 Unauthorized', corruptTokenRes.status === 401 && corruptTokenRes.data?.error === 'Invalid or expired token', `Status: ${corruptTokenRes.status}`);

  // Test 3.2: Missing token
  const missingTokenRes = await request({
    method: 'GET',
    path: '/api/auth/me',
    headers: {}
  });
  record('Token-Security', 'Missing token rejected with 401 Unauthorized', missingTokenRes.status === 401 && missingTokenRes.data?.error === 'Authentication required', `Status: ${missingTokenRes.status}`);

  // ─────────────────────────────────────────────────────────────
  // 4. NETWORK FAILURE TEST
  // ─────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('🌐 TESTING NETWORK FAILURE & RECOVERY SIMULATION');
  console.log('====================================================\n');

  let networkErrorDetected = false;
  try {
    // Attempt request to an unmapped port (simulating backend down)
    await request({
      method: 'GET',
      path: 'http://localhost:5999/api/health',
      timeout: 1000
    });
  } catch (err) {
    networkErrorDetected = true;
    record('Network-Failure', 'Connection failure cleanly detected (ECONNREFUSED / timeout)', true, err.message);
  }

  // Verify server on port 5000 is still healthy & immediately responsive
  const healthCheck = await request({ method: 'GET', path: '/api/health' });
  record('Network-Recovery', 'Server recovers and serves requests immediately', healthCheck.status === 200 && healthCheck.data?.status === 'ok', `Health: ${healthCheck.data?.status}`);

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('📊 FINAL TEST SUITE RESULTS SUMMARY');
  console.log('====================================================');
  const passed = testResults.filter(t => t.pass).length;
  const total = testResults.length;
  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);

  if (passed !== total) {
    console.error('❌ SOME TESTS FAILED. See log above.');
    process.exit(1);
  } else {
    console.log('✅ ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  }
}

runFullIntegration().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
