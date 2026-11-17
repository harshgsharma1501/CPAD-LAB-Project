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
      headers: options.headers || {}
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

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  const results = [];
  function log(testName, passed, details = '') {
    results.push({ testName, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName} ${details ? '- ' + details : ''}`);
  }

  const accounts = {
    admin: { email: 'admin@hostel.edu', password: 'demo1234', expectedRole: 'admin' },
    warden: { email: 'warden@hostel.edu', password: 'demo1234', expectedRole: 'warden' },
    accounts: { email: 'accounts@hostel.edu', password: 'demo1234', expectedRole: 'accounts' },
    student: { email: 'student@hostel.edu', password: 'demo1234', expectedRole: 'student' },
    sysadmin: { email: 'sysadmin@hostel.edu', password: 'demo1234', expectedRole: 'sysadmin' }
  };

  const tokens = {};
  const userProfiles = {};

  // 1. Test POST /api/auth/login for each role
  for (const [role, creds] of Object.entries(accounts)) {
    const res = await request({ method: 'POST', path: '/api/auth/login' }, { email: creds.email, password: creds.password });
    const ok = res.status === 200 && res.data && !!res.data.token && res.data.user?.role === creds.expectedRole;
    if (ok) {
      tokens[role] = res.data.token;
      userProfiles[role] = res.data.user;
    }
    log(`POST /api/auth/login (${role})`, ok, `Status ${res.status}`);
  }

  // 2. Test GET /api/auth/me for each role
  for (const [role, token] of Object.entries(tokens)) {
    const res = await request({
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${token}` }
    });
    const ok = res.status === 200 && res.data?.role === accounts[role].expectedRole && (role !== 'student' || !!res.data.student);
    log(`GET /api/auth/me (${role})`, ok, `Role: ${res.data?.role}, Student profile: ${!!res.data?.student}`);
  }

  // 3. Test Read Endpoints with admin token
  const adminToken = tokens.admin;

  const studentsRes = await request({ method: 'GET', path: '/api/students', headers: { Authorization: `Bearer ${adminToken}` } });
  log('GET /api/students', studentsRes.status === 200 && Array.isArray(studentsRes.data) && studentsRes.data.length > 0, `Count: ${studentsRes.data?.length}`);

  const roomsRes = await request({ method: 'GET', path: '/api/rooms', headers: { Authorization: `Bearer ${adminToken}` } });
  log('GET /api/rooms', roomsRes.status === 200 && Array.isArray(roomsRes.data) && roomsRes.data.length > 0, `Count: ${roomsRes.data?.length}`);

  const feesSummaryRes = await request({ method: 'GET', path: '/api/fees/summary', headers: { Authorization: `Bearer ${adminToken}` } });
  log('GET /api/fees/summary', feesSummaryRes.status === 200 && feesSummaryRes.data?.total_collected !== undefined, `Collected: ${feesSummaryRes.data?.total_collected}`);

  const maintRes = await request({ method: 'GET', path: '/api/maintenance', headers: { Authorization: `Bearer ${adminToken}` } });
  log('GET /api/maintenance', maintRes.status === 200 && Array.isArray(maintRes.data), `Count: ${maintRes.data?.length}`);

  const reportsRes = await request({ method: 'GET', path: '/api/reports', headers: { Authorization: `Bearer ${adminToken}` } });
  log('GET /api/reports', reportsRes.status === 200 && reportsRes.data?.total_students > 0, `Total Students: ${reportsRes.data?.total_students}`);

  // 4. One write per role that's authorized for it
  // Student write: POST /api/maintenance
  const studentToken = tokens.student;
  const studentMaintPayload = {
    student_id: 1,
    room_id: 241,
    category: 'Electrical',
    description: 'Desk lamp flicker test from student automated verification',
    priority: 'Low'
  };
  const studentMaintRes = await request({
    method: 'POST',
    path: '/api/maintenance',
    headers: { Authorization: `Bearer ${studentToken}` }
  }, studentMaintPayload);
  log('POST /api/maintenance (student authorized write)', studentMaintRes.status === 201 && !!studentMaintRes.data?.id, `Created ID: ${studentMaintRes.data?.id}`);
  const createdMaintId = studentMaintRes.data?.id;

  // Admin write: POST /api/students
  const adminStudentPayload = {
    name: 'Test Candidate Student',
    email: 'testcandidate@hostel.edu',
    reg_no: '231070999',
    department: 'Information Technology',
    year: 2,
    phone: '9988776655',
    dob: '2005-08-14',
    gender: 'Male',
    guardian_name: 'Parent Name',
    guardian_phone: '9988776600',
    address: 'Mumbai Test Address'
  };
  const adminStudentRes = await request({
    method: 'POST',
    path: '/api/students',
    headers: { Authorization: `Bearer ${adminToken}` }
  }, adminStudentPayload);
  log('POST /api/students (admin authorized write)', adminStudentRes.status === 201 && !!adminStudentRes.data?.id, `Created ID: ${adminStudentRes.data?.id}`);
  const createdStudentId = adminStudentRes.data?.id;

  // Warden write: PUT /api/maintenance/:id
  const wardenToken = tokens.warden;
  const wardenUpdateRes = await request({
    method: 'PUT',
    path: `/api/maintenance/${createdMaintId}`,
    headers: { Authorization: `Bearer ${wardenToken}` }
  }, { status: 'In Progress', assigned_to: 'Electrician Shankar' });
  log('PUT /api/maintenance/:id (warden authorized write)', wardenUpdateRes.status === 200, `Response: ${wardenUpdateRes.data?.message}`);

  // Accounts write: POST /api/fees
  const accountsToken = tokens.accounts;
  const accountsFeePayload = {
    student_id: 1,
    fee_type_id: 2,
    amount: 8000,
    due_date: '2026-12-01',
    paid_date: '2026-11-17',
    method: 'UPI',
    status: 'Paid',
    txn_ref: 'UPI-VERIFY-12345',
    remarks: 'Verified fee payment entry'
  };
  const accountsFeeRes = await request({
    method: 'POST',
    path: '/api/fees',
    headers: { Authorization: `Bearer ${accountsToken}` }
  }, accountsFeePayload);
  log('POST /api/fees (accounts authorized write)', accountsFeeRes.status === 201 && !!accountsFeeRes.data?.receipt_no, `Receipt: ${accountsFeeRes.data?.receipt_no}`);
  const createdFeeId = accountsFeeRes.data?.id;

  // Sysadmin write: PUT /api/config/:key
  const sysadminToken = tokens.sysadmin;
  const sysadminConfigRes = await request({
    method: 'PUT',
    path: '/api/config/curfew_time',
    headers: { Authorization: `Bearer ${sysadminToken}` }
  }, { value: '22:30' });
  log('PUT /api/config/:key (sysadmin authorized write)', sysadminConfigRes.status === 200, `Response: ${sysadminConfigRes.data?.message}`);

  // 5. Authorization checks: 403 Forbidden checks
  // A. Student trying POST /api/students (requires admin, sysadmin, warden)
  const forbiddenStudentCreate = await request({
    method: 'POST',
    path: '/api/students',
    headers: { Authorization: `Bearer ${studentToken}` }
  }, adminStudentPayload);
  log('403 Check: Student POST /api/students', forbiddenStudentCreate.status === 403, `Status: ${forbiddenStudentCreate.status}`);

  // B. Student trying POST /api/fees (requires admin, accounts, sysadmin)
  const forbiddenStudentFee = await request({
    method: 'POST',
    path: '/api/fees',
    headers: { Authorization: `Bearer ${studentToken}` }
  }, accountsFeePayload);
  log('403 Check: Student POST /api/fees', forbiddenStudentFee.status === 403, `Status: ${forbiddenStudentFee.status}`);

  // C. Accounts trying PUT /api/maintenance/:id (requires admin, warden, sysadmin)
  const forbiddenAccountsMaint = await request({
    method: 'PUT',
    path: `/api/maintenance/${createdMaintId}`,
    headers: { Authorization: `Bearer ${accountsToken}` }
  }, { status: 'Closed' });
  log('403 Check: Accounts PUT /api/maintenance/:id', forbiddenAccountsMaint.status === 403, `Status: ${forbiddenAccountsMaint.status}`);

  // D. Warden trying PUT /api/config/curfew_time (requires admin, sysadmin)
  const forbiddenWardenConfig = await request({
    method: 'PUT',
    path: '/api/config/curfew_time',
    headers: { Authorization: `Bearer ${wardenToken}` }
  }, { value: '23:00' });
  log('403 Check: Warden PUT /api/config/:key', forbiddenWardenConfig.status === 403, `Status: ${forbiddenWardenConfig.status}`);

  // E. Admin trying PUT /api/config/users/:id/toggle (requires sysadmin only)
  const forbiddenAdminToggle = await request({
    method: 'PUT',
    path: '/api/config/users/1/toggle',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  log('403 Check: Admin PUT /api/config/users/:id/toggle', forbiddenAdminToggle.status === 403, `Status: ${forbiddenAdminToggle.status}`);

  console.log('\nAll tests complete.');
  return { createdMaintId, createdStudentId, createdFeeId };
}

runTests().then(data => {
  console.log('RECORD_IDS=' + JSON.stringify(data));
}).catch(err => {
  console.error('Test script failure:', err);
  process.exit(1);
});
