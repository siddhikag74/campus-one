const API_BASE = 'http://localhost:5050/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, data: json };
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const str = timeStr.trim().toUpperCase();
  const isPM = str.includes('PM');
  const isAM = str.includes('AM');
  const cleanStr = str.replace(/AM|PM/g, '').trim();
  const parts = cleanStr.split(':');
  if (parts.length < 2) return null;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function doTimeSlotsOverlap(s1Str, e1Str, s2Str, e2Str) {
  const s1 = parseTimeToMinutes(s1Str);
  let e1 = parseTimeToMinutes(e1Str);
  const s2 = parseTimeToMinutes(s2Str);
  let e2 = parseTimeToMinutes(e2Str);
  if (s1 === null || e1 === null || s2 === null || e2 === null) return false;
  if (e1 <= s1) e1 += 60;
  if (e2 <= s2) e2 += 60;
  return Math.max(s1, s2) < Math.min(e1, e2);
}

async function runTimetableTests() {
  console.log('====================================================');
  console.log('CAMPUSONE TIMETABLE DE-DUPLICATION & TIME CLASH SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as Student & Reset to default scenario
    console.log('--- TEST 1: Authenticate Student & Reset Timetable ---');
    const studentLogin = await request('/auth/demo-login', {
      method: 'POST',
      body: { role: 'student' },
    });
    assert(studentLogin.status === 200, 'Student login succeeded');
    const studentAuthHeader = { Authorization: `Bearer ${studentLogin.data.token}` };

    const resetRes = await request('/timetable/reset-demo', {
      method: 'POST',
      headers: studentAuthHeader,
    });
    assert(resetRes.status === 200, 'Timetable reset to canonical state');

    // 2. Verify Weekly Schedule: zero duplicates & zero time clashes across all days
    console.log('\n--- TEST 2: Inspect Weekly Timetable for Duplicates and Clashes ---');
    const weekRes = await request('/timetable/week', { headers: studentAuthHeader });
    assert(weekRes.status === 200, 'Weekly timetable fetched');

    const days = weekRes.data.days || {};
    let totalClassesCount = 0;
    const globalClassKeys = new Set();
    let duplicateCount = 0;
    let clashCount = 0;

    for (const [dayName, classList] of Object.entries(days)) {
      console.log(`Checking ${dayName} (${classList.length} classes)...`);
      for (let i = 0; i < classList.length; i++) {
        const c1 = classList[i];
        totalClassesCount++;

        // Duplicate check
        const key = `${c1.courseCode}_${c1.dayOfWeek}_${c1.startTime}`;
        if (globalClassKeys.has(key)) {
          console.error(`  Duplicate class found: ${c1.subject} (${c1.courseCode}) on ${c1.dayOfWeek} at ${c1.startTime}`);
          duplicateCount++;
        }
        globalClassKeys.add(key);

        // Check if there are duplicate rescheduled placeholders
        if (c1.subject.includes('[Rescheduled]')) {
          console.error(`  Legacy duplicate rescheduled entry found: ${c1.subject}`);
          duplicateCount++;
        }

        // Time clash check with all other classes on same day
        for (let j = i + 1; j < classList.length; j++) {
          const c2 = classList[j];
          if (c1.status !== 'cancelled' && c2.status !== 'cancelled') {
            if (doTimeSlotsOverlap(c1.startTime, c1.endTime, c2.startTime, c2.endTime)) {
              console.error(`  Time clash on ${dayName} between: '${c1.subject}' (${c1.startTime}-${c1.endTime}) and '${c2.subject}' (${c2.startTime}-${c2.endTime})`);
              clashCount++;
            }
          }
        }
      }
    }

    assert(duplicateCount === 0, `Zero duplicate class entries found (found: ${duplicateCount})`);
    assert(clashCount === 0, `Zero time clashes found across all days (found: ${clashCount})`);
    assert(totalClassesCount === 15, `Timetable has exactly 15 unique classes (found: ${totalClassesCount})`);

    // 3. Authenticate as Professor & Test Clash Prevention during Schedule Change
    console.log('\n--- TEST 3: Professor Attempts to Move Class into Occupied Time Slot (Clash Prevention) ---');
    const profLogin = await request('/auth/demo-login', {
      method: 'POST',
      body: { role: 'professor' },
    });
    assert(profLogin.status === 200, 'Professor login succeeded');
    const profAuthHeader = { Authorization: `Bearer ${profLogin.data.token}` };

    const profWeek = await request('/timetable/week', { headers: profAuthHeader });
    const mondayClasses = profWeek.data.days?.Monday || [];
    const cs201Entry = mondayClasses.find(c => c.courseCode === 'CS201'); // 09:00 AM - 10:00 AM
    const cs305Entry = mondayClasses.find(c => c.courseCode === 'CS305'); // 11:00 AM - 12:00 PM

    assert(!!cs201Entry && !!cs305Entry, 'Found Monday classes CS201 (09-10 AM) and CS305 (11-12 PM)');

    // Attempt to reschedule CS305 into CS201's time slot (Monday 09:00 AM - 10:00 AM)
    const clashAttempt = await request(`/timetable/${cs305Entry._id}/change`, {
      method: 'PATCH',
      headers: profAuthHeader,
      body: {
        action: 'time_change',
        newStartTime: '09:00 AM',
        newEndTime: '10:00 AM',
        reason: 'Attempting to shift to 9:00 AM',
      },
    });

    assert(
      clashAttempt.status === 400,
      `Time clash correctly rejected with HTTP 400 (Message: ${clashAttempt.data.message})`
    );
    assert(
      clashAttempt.data.message.includes('Time slot conflict') || clashAttempt.data.message.includes('conflict'),
      'Error message identifies conflicting class'
    );

    // 4. Test Postponing to an occupied time slot on another day
    console.log('\n--- TEST 4: Attempt to Postpone Class into an Occupied Time Slot on Another Day ---');
    // On Tuesday, MA201 is at 03:00 PM - 04:00 PM
    // Attempt to postpone CS305 to Tuesday 03:00 PM - 04:00 PM
    const postponeClashAttempt = await request(`/timetable/${cs305Entry._id}/change`, {
      method: 'PATCH',
      headers: profAuthHeader,
      body: {
        action: 'postpone',
        newDay: 'Tuesday',
        newStartTime: '03:00 PM',
        newEndTime: '04:00 PM',
        reason: 'Attempting clash on Tuesday',
      },
    });

    assert(
      postponeClashAttempt.status === 400,
      `Postponing into occupied slot correctly rejected with HTTP 400 (Message: ${postponeClashAttempt.data.message})`
    );

    // 5. Test Valid Schedule Change into an Unoccupied Time Slot
    console.log('\n--- TEST 5: Apply Valid Non-Conflicting Schedule Change ---');
    // Monday 04:00 PM - 05:00 PM is free
    const validChange = await request(`/timetable/${cs305Entry._id}/change`, {
      method: 'PATCH',
      headers: profAuthHeader,
      body: {
        action: 'time_change',
        newStartTime: '04:00 PM',
        newEndTime: '05:00 PM',
        reason: 'Shifted to 4:00 PM lab slot without any conflict.',
      },
    });

    assert(validChange.status === 200, 'Valid non-conflicting time change succeeded (HTTP 200)');
    assert(validChange.data.entry?.startTime === '04:00 PM', 'Start time updated to 04:00 PM');
    assert(validChange.data.entry?.status === 'time_changed', 'Status updated to time_changed');

    // 6. Test Class Creation with Conflict Prevention (POST /api/timetable)
    console.log('\n--- TEST 6: Create New Class with Conflict Prevention ---');
    const duplicateCreateAttempt = await request('/timetable', {
      method: 'POST',
      headers: profAuthHeader,
      body: {
        subject: 'Data Structures & Algorithms',
        courseCode: 'CS201',
        venue: 'Room B-204',
        dayOfWeek: 'Monday',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
      },
    });
    assert(
      duplicateCreateAttempt.status === 409 || duplicateCreateAttempt.status === 400,
      `Duplicate class creation correctly rejected (HTTP ${duplicateCreateAttempt.status}: ${duplicateCreateAttempt.data.message})`
    );

    console.log('\n====================================================');
    console.log(`ALL TIMETABLE TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Timetable test run failed:', err);
    process.exit(1);
  }
}

runTimetableTests();
