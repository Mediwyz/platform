/**
 * E2E + API tests for the 8 UI fixes
 * Run: node scripts/test-ui-fixes.mjs [https://h-wyz.com | http://localhost:3000]
 */
const BASE = process.argv[2] || 'http://localhost:3000';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let passed = 0, failed = 0, skipped = 0;
function ok(label) { passed++; console.log('  \u2705 ' + label); }
function fail(label) { failed++; console.log('  \u274c ' + label); }
function skip(label) { skipped++; console.log('  \u23ed  ' + label); }

async function json(res) { try { return await res.json(); } catch { return null; } }

// ── Auth helper ─────────────────────────────────────────
async function loginAs(email, password) {
  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const cookies = res.headers.getSetCookie?.() || [];
  return { data: await json(res), cookies: cookies.map(c => c.split(';')[0]).join('; ') };
}

async function registerAndLogin(fullName) {
  const email = fullName.toLowerCase().replace(/\s+/g, '.') + '.' + Date.now() + '@test.com';
  await fetch(BASE + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName, email, password: 'Secure123!', confirmPassword: 'Secure123!',
      phone: '+230 5' + String(Date.now()).slice(-7), dateOfBirth: '1990-01-15', gender: 'Male',
      address: 'Test City', agreeToTerms: true, agreeToPrivacy: true, agreeToDisclaimer: true,
      userType: 'patient', documentVerifications: [], skippedDocuments: []
    })
  });
  return loginAs(email, 'Secure123!');
}

async function test() {
  console.log('');
  console.log('\u2550'.repeat(60));
  console.log('  UI FIXES: Integration + API Tests');
  console.log('  Target: ' + BASE);
  console.log('\u2550'.repeat(60));

  // ═════════════════════════════════════════════════════════
  // FIX 1: Stats API should return meaningful numbers
  // ═════════════════════════════════════════════════════════
  console.log('\n--- FIX 1: Stats API (no zeros) ---\n');

  let res = await fetch(BASE + '/api/stats');
  let data = await json(res);

  if (res.status === 200 && data?.success) {
    ok('Stats API responds 200');
    const stats = data.data || [];
    const doctors = stats.find(s => s.label?.includes('Doctor'));
    const patients = stats.find(s => s.label?.includes('Patient'));
    const consultations = stats.find(s => s.label?.includes('Consultation'));
    const cities = stats.find(s => s.label?.includes('Cit'));

    if (doctors?.number > 0) ok('Doctors count > 0: ' + doctors.number);
    else fail('Doctors count is 0 or missing');

    if (patients?.number > 0) ok('Patients count > 0: ' + patients.number);
    else fail('Patients count is 0 or missing');

    if (consultations?.number > 0) ok('Consultations count > 0: ' + consultations.number);
    else fail('Consultations count is 0 or missing');

    if (cities?.number > 0) ok('Cities count > 0: ' + cities.number);
    else fail('Cities count is 0 or missing');
  } else {
    fail('Stats API failed: ' + res.status);
  }

  // ═════════════════════════════════════════════════════════
  // FIX 3: Search links should work within dashboard context
  // ═════════════════════════════════════════════════════════
  console.log('\n--- FIX 3: Search routes accessible under /patient/ ---\n');

  const searchPaths = [
    '/patient/search/doctors',
    '/patient/search/nurses',
    '/patient/search/childcare',
    '/patient/search/lab',
    '/patient/search/emergency',
    '/search/medicines',
  ];

  for (const path of searchPaths) {
    res = await fetch(BASE + path, { redirect: 'manual' });
    if (res.status === 200 || res.status === 307 || res.status === 308) {
      ok(path + ' -> ' + res.status);
    } else {
      fail(path + ' -> ' + res.status);
    }
  }

  // ═════════════════════════════════════════════════════════
  // FIX 6: Notifications API returns referenceId/referenceType
  // ═════════════════════════════════════════════════════════
  console.log('\n--- FIX 6: Notifications API structure ---\n');

  const { data: loginData, cookies: authCookies } = await loginAs('emma.johnson@mediwyz.com', 'Patient123!');

  if (loginData?.success) {
    ok('Logged in as Emma Johnson');
    const userId = loginData.user?.id || loginData.data?.id;

    res = await fetch(BASE + '/api/users/' + userId + '/notifications', {
      headers: { 'Cookie': authCookies }
    });
    data = await json(res);

    if (res.status === 200 && data) {
      ok('Notifications API responds 200');
      const notifs = data.data || data.notifications || [];
      if (notifs.length > 0) {
        ok('Has ' + notifs.length + ' notifications');
        const hasRefFields = notifs.some(n => n.referenceId !== undefined || n.referenceType !== undefined);
        if (hasRefFields) ok('Notifications include referenceId/referenceType fields');
        else fail('Notifications missing referenceId/referenceType fields');
      } else {
        skip('No notifications to test structure');
      }
    } else {
      fail('Notifications API failed: ' + res.status);
    }

    // ═════════════════════════════════════════════════════════
    // FIX 7: Connections API — check for duplicates
    // ═════════════════════════════════════════════════════════
    console.log('\n--- FIX 7: Connections API (no duplicates) ---\n');

    res = await fetch(BASE + '/api/connections?userId=' + userId + '&type=all&status=accepted', {
      headers: { 'Cookie': authCookies }
    });
    data = await json(res);

    if (res.status === 200 && data?.success !== false) {
      ok('Connections API responds 200');
      const connections = data.connections || data.data || data || [];
      if (Array.isArray(connections) && connections.length > 0) {
        ok('Has ' + connections.length + ' connection(s)');
        // Fix 7 is a frontend component fix — the UI deduplicates via senderId check.
        // The API returns sender/receiver objects; verify they exist for UI dedup.
        const hasDedup = connections.every(c => (c.senderId || c.sender) && (c.receiverId || c.receiver));
        if (hasDedup) ok('Connections include sender/receiver data for UI dedup');
        else fail('Connections missing sender/receiver fields');
      } else {
        skip('No accepted connections to check');
      }
    } else {
      fail('Connections API failed: ' + res.status);
    }

    // ═════════════════════════════════════════════════════════
    // FIX 8: Wallet Reset API
    // ═════════════════════════════════════════════════════════
    console.log('\n--- FIX 8: Wallet Reset API ---\n');

    // Get current wallet
    res = await fetch(BASE + '/api/users/' + userId + '/wallet', {
      headers: { 'Cookie': authCookies }
    });
    data = await json(res);

    if (res.status === 200 && data?.success) {
      ok('Wallet API responds 200');
      const walletData = data.data || data.wallet || data;
      const initialBalance = walletData?.balance;
      const initialCredit = walletData?.initialCredit ?? 4500;
      console.log('    Current balance: Rs ' + initialBalance + ' / Rs ' + initialCredit);

      // Test reset endpoint
      res = await fetch(BASE + '/api/users/' + userId + '/wallet/reset', {
        method: 'POST',
        headers: { 'Cookie': authCookies }
      });

      if (res.status === 200) {
        data = await json(res);
        if (data?.success) {
          ok('Reset endpoint responds 200 with success');

          // Verify balance was restored
          res = await fetch(BASE + '/api/users/' + userId + '/wallet', {
            headers: { 'Cookie': authCookies }
          });
          data = await json(res);
          const wd = data?.data || data?.wallet || data;
          const newBalance = wd?.balance;
          if (newBalance === initialCredit) {
            ok('Balance restored to Rs ' + newBalance);
          } else {
            fail('Balance after reset: Rs ' + newBalance + ' (expected ' + initialCredit + ')');
          }
        } else {
          fail('Reset returned success=false: ' + data?.message);
        }
      } else if (res.status === 404) {
        fail('Reset endpoint not found (404) — needs to be created');
      } else {
        fail('Reset endpoint returned: ' + res.status);
      }
    } else {
      fail('Wallet API failed: ' + res.status);
    }

    // ═════════════════════════════════════════════════════════
    // FIX 8b: Wallet Reset — unauthorized access
    // ═════════════════════════════════════════════════════════
    console.log('\n--- FIX 8b: Wallet Reset — security ---\n');

    // Unauthenticated reset should fail
    res = await fetch(BASE + '/api/users/' + userId + '/wallet/reset', { method: 'POST' });
    if (res.status === 401) ok('Unauthenticated reset -> 401');
    else fail('Unauthenticated reset -> ' + res.status + ' (expected 401)');

    // Reset another user's wallet should fail
    const { cookies: otherCookies } = await registerAndLogin('Other Test User');
    if (otherCookies) {
      res = await fetch(BASE + '/api/users/' + userId + '/wallet/reset', {
        method: 'POST',
        headers: { 'Cookie': otherCookies }
      });
      if (res.status === 403 || res.status === 401) {
        ok('Cross-user reset blocked -> ' + res.status);
      } else {
        fail('Cross-user reset should be blocked, got: ' + res.status);
      }
    }
  } else {
    skip('Could not login — skipping notification/connection/wallet tests');
  }

  // ═════════════════════════════════════════════════════════
  // FIX 5: Quick Actions removed (check page renders)
  // ═════════════════════════════════════════════════════════
  console.log('\n--- FIX 5: Health Records page renders ---\n');

  res = await fetch(BASE + '/patient/health-records');
  if (res.status === 200 || res.status === 307) {
    ok('Health Records page accessible');
  } else {
    fail('Health Records page: ' + res.status);
  }

  // ═════════════════════════════════════════════════════════
  // FIX 2: Feed page renders (sidebar alignment is visual)
  // ═════════════════════════════════════════════════════════
  console.log('\n--- FIX 2: Feed page renders ---\n');

  res = await fetch(BASE + '/patient/feed');
  if (res.status === 200 || res.status === 307) {
    ok('Patient feed page accessible');
  } else {
    fail('Patient feed page: ' + res.status);
  }

  // ═════════════════════════════════════════════════════════
  // FIX 4: Emergency/Health tabs pages render
  // ═════════════════════════════════════════════════════════
  console.log('\n--- FIX 4: Tab pages render ---\n');

  res = await fetch(BASE + '/patient/emergency');
  if (res.status === 200 || res.status === 307) ok('Emergency page accessible');
  else fail('Emergency page: ' + res.status);

  res = await fetch(BASE + '/patient/health-records');
  if (res.status === 200 || res.status === 307) ok('Health Records page accessible');
  else fail('Health Records page: ' + res.status);

  // ═════════════════════════════════════════════════════════
  // SUMMARY
  // ═════════════════════════════════════════════════════════
  console.log('\n' + '\u2550'.repeat(60));
  console.log('  RESULTS: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped');
  console.log('\u2550'.repeat(60));
  console.log('');
  console.log('  Note: Fixes 2 (alignment) and 4 (bottom tabs) are visual —');
  console.log('  verify manually in the browser on mobile viewport.');
  console.log('');

  if (failed > 0) process.exit(1);
}

test().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
