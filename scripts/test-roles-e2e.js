const http = require('http');

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

async function runTests() {
  console.log('====================================================');
  console.log('CAMPUSONE 3-ROLES ONBOARDING & RBAC E2E TEST SUITE');
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
    // ----------------------------------------------------
    // TEST 1: Register New User & Verify Role Selection Prompt
    // ----------------------------------------------------
    const uniqueEmail = `testuser_${Date.now()}@dtu.ac.in`;
    console.log(`\n--- TEST 1: Register New Student (${uniqueEmail}) ---`);
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Priya Sharma',
        email: uniqueEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        college: 'Delhi Technological University',
        branch: 'Computer Science & Engineering',
        year: '2nd Year',
      },
    });

    assert(regRes.status === 201, 'Registration returns HTTP 201');
    assert(regRes.data.user?.roleSelected === false, 'New user roleSelected is false (prompts RoleSelectionScreen)');
    assert(regRes.data.user?.onboardingCompleted === false, 'New user onboardingCompleted is false');

    const studentToken = regRes.data.token;
    const studentAuthHeader = { Authorization: `Bearer ${studentToken}` };

    // ----------------------------------------------------
    // TEST 2: Select Student Role & Complete Onboarding
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Student Role Selection & Interest Onboarding ---');
    const setRoleRes = await request('/auth/role', {
      method: 'POST',
      headers: studentAuthHeader,
      body: { role: 'student' },
    });

    assert(setRoleRes.status === 200, 'POST /api/auth/role returns HTTP 200');
    assert(setRoleRes.data.user?.role === 'student', 'User role updated to student');
    assert(setRoleRes.data.user?.roleSelected === true, 'User roleSelected set to true');

    const interestRes = await request('/auth/onboarding', {
      method: 'POST',
      headers: studentAuthHeader,
      body: {
        interests: ['Tech', 'Gaming', 'Creativity'],
        interestSubCategories: ['AI', 'UI/UX Design'],
      },
    });

    assert(interestRes.status === 200, 'POST /api/auth/onboarding saves interests');
    assert(interestRes.data.user?.onboardingCompleted === true, 'Student onboardingCompleted set to true');

    // ----------------------------------------------------
    // TEST 3: RBAC Restrictions for Student
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Verify Student is Blocked from Organizer & Professor Actions ---');
    
    // Attempt to post resource (Organizer only)
    const eventRes = await request('/events', { headers: studentAuthHeader });
    const sampleEventId = eventRes.data.events?.[0]?._id;
    assert(!!sampleEventId, 'Fetched sample event ID from feed');

    const unauthorizedResourceRes = await request(`/events/${sampleEventId}/resources`, {
      method: 'POST',
      headers: studentAuthHeader,
      body: {
        title: 'Unauthorized Handout',
        type: 'pdf',
        url: 'https://example.com/handout.pdf',
      },
    });
    assert(
      unauthorizedResourceRes.status === 403,
      `Student blocked from adding resources (HTTP 403 Forbidden: ${unauthorizedResourceRes.data.message})`
    );

    // Attempt to cancel a class (Professor only)
    const timetableRes = await request('/timetable', { headers: studentAuthHeader });
    const sampleClassId = timetableRes.data.entries?.[0]?._id;
    assert(!!sampleClassId, 'Fetched student timetable entry');

    const unauthorizedCancelRes = await request(`/timetable/${sampleClassId}/change`, {
      method: 'PATCH',
      headers: studentAuthHeader,
      body: {
        action: 'cancel',
        reason: 'Student attempting cancellation',
      },
    });
    assert(
      unauthorizedCancelRes.status === 403,
      `Student blocked from cancelling class (HTTP 403 Forbidden: ${unauthorizedCancelRes.data.message})`
    );

    // ----------------------------------------------------
    // TEST 4: Organizer Role & Post-Event Resource Management
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Organizer Demo Login & Resource Hub ---');
    const orgLoginRes = await request('/auth/demo-login', {
      method: 'POST',
      body: { role: 'organizer' },
    });

    assert(orgLoginRes.status === 200, 'Organizer Demo Login succeeds (HTTP 200)');
    assert(orgLoginRes.data.user?.role === 'organizer', 'Organizer account role is organizer');
    const orgToken = orgLoginRes.data.token;
    const orgAuthHeader = { Authorization: `Bearer ${orgToken}` };

    // Organizer creates an event
    const createEventRes = await request('/events', {
      method: 'POST',
      headers: orgAuthHeader,
      body: {
        title: 'AI Robotics Symposium 2026',
        category: 'Workshops',
        venue: 'Robotics Lab & Auditorium',
        dateStr: 'Sep 25, 2026',
        time: '10:00 AM - 05:00 PM',
        about: 'National robotics and automation workshop with hardware kits.',
        teamSize: '1 - 3 Members',
        isTeamEvent: true,
        tags: ['Robotics', 'Tech', 'AI'],
      },
    });

    assert(createEventRes.status === 201, 'Organizer creates event successfully (HTTP 201)');
    const createdEventId = createEventRes.data.event?._id;

    // Organizer adds multiple post-event resources
    const addPdfRes = await request(`/events/${createdEventId}/resources`, {
      method: 'POST',
      headers: orgAuthHeader,
      body: {
        title: 'Robotics_Lab_Manual_v2.pdf',
        type: 'pdf',
        url: 'https://campusone.dtu.ac.in/resources/robotics-manual.pdf',
        description: 'Complete hands-on schematics and source code',
      },
    });
    assert(addPdfRes.status === 201, 'Organizer posts PDF resource successfully');

    const addDriveRes = await request(`/events/${createdEventId}/resources`, {
      method: 'POST',
      headers: orgAuthHeader,
      body: {
        title: 'Session Slides & Recording Drive Folder',
        type: 'drive',
        url: 'https://drive.google.com/drive/folders/sample123',
        description: 'Google Drive folder containing full lecture recordings and PPTs',
      },
    });
    assert(addDriveRes.status === 201, 'Organizer posts Google Drive link successfully');

    const addFormRes = await request(`/events/${createdEventId}/resources`, {
      method: 'POST',
      headers: orgAuthHeader,
      body: {
        title: 'Sub-Team Recruitment & Feedback Form',
        type: 'form',
        url: 'https://forms.gle/sampleform123',
        description: 'Apply for core robotics subsystem positions',
      },
    });
    assert(addFormRes.status === 201, 'Organizer posts Google/Recruitment Form successfully');

    // ----------------------------------------------------
    // TEST 5: Verify Student Can View Organizer's Resources
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Verify Student Can View & Access Attached Resources ---');
    const getEventRes = await request(`/events/${createdEventId}`, { headers: studentAuthHeader });
    assert(getEventRes.status === 200, 'Student reads event details (HTTP 200)');
    assert(getEventRes.data.event?.resources?.length === 3, 'Event contains all 3 attached resources');
    assert(getEventRes.data.event?.resources?.some(r => r.type === 'drive'), 'Drive folder link accessible to students');
    assert(getEventRes.data.event?.resources?.some(r => r.type === 'form'), 'Recruitment form link accessible to students');

    // ----------------------------------------------------
    // TEST 6: Professor Role & Timetable Controls
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Professor Demo Login & Schedule Modifications ---');
    const profLoginRes = await request('/auth/demo-login', {
      method: 'POST',
      body: { role: 'professor' },
    });

    assert(profLoginRes.status === 200, 'Professor Demo Login succeeds (HTTP 200)');
    assert(profLoginRes.data.user?.role === 'professor', 'Professor account role is professor');
    const profToken = profLoginRes.data.token;
    const profAuthHeader = { Authorization: `Bearer ${profToken}` };

    const profScheduleRes = await request('/timetable/week', { headers: profAuthHeader });
    assert(profScheduleRes.status === 200, 'Professor retrieves weekly teaching timetable');
    
    // Find CS201 / Data Structures class to cancel
    const mondayClasses = profScheduleRes.data.days?.Monday || [];
    const targetClass = mondayClasses[0];
    assert(!!targetClass, 'Found Monday lecture class to manage');

    // Professor Cancels Class
    const cancelRes = await request(`/timetable/${targetClass._id}/change`, {
      method: 'PATCH',
      headers: profAuthHeader,
      body: {
        action: 'cancel',
        reason: 'Professor presenting research paper at IEEE ICDE Conference.',
      },
    });

    assert(cancelRes.status === 200, 'Professor cancelled class successfully (HTTP 200)');
    assert(cancelRes.data.entry?.status === 'cancelled', 'Class status updated to cancelled');

    // Professor Postpones Another Class
    const wednesdayClasses = profScheduleRes.data.days?.Wednesday || [];
    const targetClass2 = wednesdayClasses[0] || targetClass;

    const postponeRes = await request(`/timetable/${targetClass2._id}/change`, {
      method: 'PATCH',
      headers: profAuthHeader,
      body: {
        action: 'postpone',
        newDay: 'Friday',
        newStartTime: '04:30 PM',
        newEndTime: '05:30 PM',
        reason: 'Postponed to Friday afternoon for departmental faculty meeting.',
      },
    });

    assert(postponeRes.status === 200, 'Professor postponed class successfully');
    assert(postponeRes.data.entry?.status === 'postponed', 'Class status updated to postponed');
    assert(postponeRes.data.entry?.dayOfWeek === 'Friday', 'Class day updated to Friday');

    // ----------------------------------------------------
    // TEST 7: Verify Student Receives Professor Updates & Notifications
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Verify Student Receives Real-Time Schedule Alerts ---');
    const studentNotifRes = await request('/notifications', { headers: studentAuthHeader });
    assert(studentNotifRes.status === 200, 'Student retrieved live notifications');
    const notificationsList = studentNotifRes.data.all || studentNotifRes.data.notifications || [];
    assert(
      notificationsList.some(n => n.type?.includes('cancel') || n.type?.includes('postpone') || n.type?.includes('timetable')),
      'Student notification inbox contains live professor timetable alerts'
    );


    console.log('\n====================================================');
    console.log(`ALL TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exit(1);
  }
}

runTests();
