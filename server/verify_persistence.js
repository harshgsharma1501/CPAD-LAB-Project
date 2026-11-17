const http = require('http');

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

function login(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function verifyPersistence() {
  const loginRes = await login('admin@hostel.edu', 'demo1234');
  const token = loginRes.token;

  console.log('=== VERIFYING PERSISTENCE POST-RESTART ===');

  // 1. Check Student created (ID: 11, reg_no: '231070999')
  const student = await get('/api/students/11', token);
  console.log('Student ID 11:', student.status === 200 && student.data?.reg_no === '231070999' ? 'PERSISTED OK' : 'FAILED', student.data?.name);

  // 2. Check Maintenance request (ID: 7)
  const maintList = await get('/api/maintenance', token);
  const maintItem = maintList.data.find(m => m.id === 7);
  console.log('Maintenance ID 7:', maintItem && maintItem.assigned_to === 'Electrician Shankar' && maintItem.status === 'In Progress' ? 'PERSISTED OK' : 'FAILED', maintItem?.description);

  // 3. Check Fee payment (ID: 15)
  const feeList = await get('/api/fees', token);
  const feeItem = feeList.data.find(f => f.id === 15);
  console.log('Fee payment ID 15:', feeItem && feeItem.txn_ref === 'UPI-VERIFY-12345' && feeItem.amount === 8000 ? 'PERSISTED OK' : 'FAILED', feeItem?.receipt_no);

  // 4. Check Config curfew_time update ('22:30')
  const configList = await get('/api/config', token);
  const curfew = configList.data.find(c => c.key === 'curfew_time');
  console.log('Config curfew_time:', curfew && curfew.value === '22:30' ? 'PERSISTED OK' : 'FAILED', curfew?.value);
}

verifyPersistence().catch(console.error);
