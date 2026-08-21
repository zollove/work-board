const https = require('https');
const fs = require('fs');
const path = require('path');

const STORE_CD = 'b9001';
const ACCOUNT_ID = 'yhwan7301';
const ACCOUNT_PWD = 'rladbsghks1!';

function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      store_cd: STORE_CD,
      account_id: ACCOUNT_ID,
      account_pwd: ACCOUNT_PWD,
      hp_auth_required: '',
      auth_no: ''
    });

    const req = https.request({
      hostname: 'xtouch.xpartners.co.kr',
      port: 443,
      path: '/loginProc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }, (res) => {
      const cookies = res.headers['set-cookie'] || [];
      const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
      resolve(cookieHeader);
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function fetchPage(cookieHeader, pagePath) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'xtouch.xpartners.co.kr',
      port: 443,
      path: pagePath,
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.end();
  });
}

function fetchJson(cookieHeader, apiPath) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'xtouch.xpartners.co.kr',
      port: 443,
      path: apiPath,
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) {
          resolve({ raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function collectXtouchData() {
  console.log('Logging in to xtouch.xpartners.co.kr...');
  const cookie = await login();
  console.log('Login successful!');

  // Fetch real-time seat stats & seats list
  console.log('Fetching real-time seat stats and seats list...');
  const seatStats = await fetchJson(cookie, `/api/seatDashboard/getSeatStats?store_cd=B9001`);
  const seatList = await fetchJson(cookie, `/api/seatDashboard/getSeatList?store_cd=B9001`);

  const resultData = {
    timestamp: new Date().toISOString(),
    store: '파스텔골프클럽 (B9001)',
    realtimeStats: seatStats.response || {},
    realtimeSeatsCount: Array.isArray(seatList.response) ? seatList.response.length : 0,
    seatsSample: Array.isArray(seatList.response) ? seatList.response.slice(0, 5) : []
  };

  const outputDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'xtouch_snapshot.json');
  fs.writeFileSync(outputPath, JSON.stringify(resultData, null, 2), 'utf8');
  console.log(`Saved xtouch snapshot data to ${outputPath}`);
  return resultData;
}

if (require.main === module) {
  collectXtouchData().catch(console.error);
}

module.exports = { collectXtouchData, login, fetchPage, fetchJson };
