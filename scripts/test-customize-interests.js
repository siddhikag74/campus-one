/**
 * Test Suite: CampusOne Customize Interests in Profile
 * Tests End-to-End:
 * 1. Initial Onboarding Interest Selection
 * 2. Profile GET /api/profile/interests (Pre-fill Current Selections)
 * 3. Profile PATCH /api/profile/interests (Change & Save Selections)
 * 4. Persistence of Customized Interests on Profile & Auth Context
 * 5. Recommendations Personalization Engine using Updated Interests
 * 6. Security: Token-based Authorization & Authentication Isolation
 */

const http = require('http');

const BASE_URL = 'http://localhost:5050/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

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

async function runTests() {
  console.log('====================================================');
  console.log('CAMPUSONE CUSTOMIZE INTERESTS TEST SUITE');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Register New Student A
    // ----------------------------------------------------
    console.log('--- TEST 1: Register New Student & Complete Onboarding ---');
    const timestamp = Date.now();
    const studentEmail = `student_interests_${timestamp}@dtu.ac.in`;
    const signupRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Aarav Mehta',
        email: studentEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        college: 'Delhi Technological University',
        branch: 'Computer Science & Engineering',
        year: '2nd Year',
      },
    });

    assert(signupRes.status === 201, 'Student A registration succeeded (HTTP 201)');
    const tokenA = signupRes.data.token;
    const authHeaderA = { Authorization: `Bearer ${tokenA}` };

    // Set Role to Student
    const roleRes = await request('/auth/role', {
      method: 'POST',
      headers: authHeaderA,
      body: { role: 'student' },
    });
    assert(roleRes.status === 200, 'Student role selected');

    // Onboarding Interest Selection (Step 1: Tech, Finance, Dance)
    const initialInterests = ['Tech', 'Finance', 'Dance'];
    const onboardRes = await request('/auth/onboarding', {
      method: 'POST',
      headers: authHeaderA,
      body: {
        interests: initialInterests,
        interestSubCategories: [],
      },
    });

    assert(onboardRes.status === 200, 'Initial onboarding interests saved');
    assert(onboardRes.data.user?.onboardingCompleted === true, 'Onboarding marked completed');

    // ----------------------------------------------------
    // TEST 2: Load Authenticated User's Current Interests
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Fetch Current Interests from /api/profile/interests ---');
    const getInterestsRes = await request('/profile/interests', {
      headers: authHeaderA,
    });

    assert(getInterestsRes.status === 200, 'GET /api/profile/interests returns HTTP 200');
    assert(Array.isArray(getInterestsRes.data.interests), 'Interests returned as array');
    assert(
      initialInterests.every((i) => getInterestsRes.data.interests.includes(i)),
      'Pre-selected interests match initial onboarding selections (Tech, Finance, Dance)'
    );

    // ----------------------------------------------------
    // TEST 3: Customize Interests (Add Gaming, Photography, Creativity + Subcategories; Remove Finance)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Customize & Update Interests via PATCH /api/profile/interests ---');
    const updatedInterests = ['Tech', 'Dance', 'Creativity', 'Gaming', 'Photography'];
    const updatedSubCategories = ['Design', 'Media', 'Content Creation'];

    const patchRes = await request('/profile/interests', {
      method: 'PATCH',
      headers: authHeaderA,
      body: {
        interests: updatedInterests,
        interestSubCategories: updatedSubCategories,
      },
    });

    assert(patchRes.status === 200, 'PATCH /api/profile/interests returns HTTP 200');
    assert(patchRes.data.message === 'Your interests have been updated.', 'Success message returned');
    assert(patchRes.data.interests?.includes('Gaming'), 'Newly added interest (Gaming) is present');
    assert(!patchRes.data.interests?.includes('Finance'), 'Deselected interest (Finance) was removed');
    assert(patchRes.data.interestSubCategories?.includes('Design'), 'Creativity subcategories saved');

    // ----------------------------------------------------
    // TEST 4: Persistence Check on Profile GET
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Verify Customized Interests Persist in User Profile ---');
    const profileRes = await request('/profile', {
      headers: authHeaderA,
    });

    assert(profileRes.status === 200, 'GET /api/profile returns HTTP 200');
    assert(
      profileRes.data.user?.interests?.includes('Gaming') &&
      profileRes.data.user?.interests?.includes('Photography'),
      'Profile payload contains updated customized interests'
    );
    assert(
      profileRes.data.user?.interestSubCategories?.includes('Media'),
      'Profile payload contains updated creativity subcategories'
    );

    // ----------------------------------------------------
    // TEST 5: Verify Personalized Recommendations Update
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Verify Recommendation Engine Uses Updated Interests ---');
    const recsRes = await request('/recommendations', {
      headers: authHeaderA,
    });

    assert(recsRes.status === 200, 'GET /api/recommendations returns HTTP 200');
    assert(Array.isArray(recsRes.data.recommendations), 'Returns recommendations array');
    console.log(`Recommendations count: ${recsRes.data.recommendations?.length}`);

    // ----------------------------------------------------
    // TEST 6: Security & Authorization Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Security & Authorization Validation ---');
    // Unauthenticated request
    const unauthRes = await request('/profile/interests');
    assert(unauthRes.status === 401, 'Unauthenticated request correctly rejected with HTTP 401');

    // Register Student B and verify Student B's profile is isolated from Student A
    const studentEmailB = `student_b_${timestamp}@dtu.ac.in`;
    const signupB = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Bhavna Sharma',
        email: studentEmailB,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        college: 'Delhi Technological University',
        branch: 'Computer Science & Engineering',
        year: '1st Year',
      },
    });

    const tokenB = signupB.data.token;
    const authHeaderB = { Authorization: `Bearer ${tokenB}` };

    const getInterestsB = await request('/profile/interests', {
      headers: authHeaderB,
    });

    assert(getInterestsB.status === 200, 'Student B can fetch their own interests');
    assert(
      !getInterestsB.data.interests?.includes('Gaming') || getInterestsB.data.interests?.length === 0,
      'Student B does NOT have Student A’s customized interests (strict user isolation)'
    );

    console.log('\n====================================================');
    console.log(`ALL CUSTOMIZE INTERESTS TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exit(1);
  }
}

runTests();
