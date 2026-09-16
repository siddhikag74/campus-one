/**
 * Test Suite: CampusOne Write a Review Feature
 * Tests End-to-End:
 * 1. Student Auth & Event Discovery
 * 2. 4-Category Rating Validation (Overall, Content, Presentation, Engagement)
 * 3. Review Submission with Review Text & Suggestions
 * 4. Duplicate Review Prevention & Seamless Review Editing / Updating
 * 5. Event Reviews & Stats API (Category Averages, Breakdown, userReview)
 * 6. Character Limit & Invalid Rating Validation
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
  console.log('CAMPUSONE WRITE A REVIEW FEATURE TEST SUITE');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Authenticate Student
    // ----------------------------------------------------
    console.log('--- TEST 1: Student Authentication & Event Fetch ---');
    const loginRes = await request('/auth/demo-login', {
      method: 'POST',
      body: { role: 'student' },
    });
    assert(loginRes.status === 200, 'Student demo login succeeded');
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    const eventsRes = await request('/events', { headers: authHeaders });
    assert(eventsRes.status === 200 && eventsRes.data.events?.length > 0, 'Fetched events list');
    const targetEvent = eventsRes.data.events[0];
    const eventId = targetEvent._id;
    console.log(`Target Event: "${targetEvent.title}" (${eventId})`);

    // ----------------------------------------------------
    // TEST 2: Validate 4 Rating Criteria Requirement
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Validate 4 Mandatory Rating Categories ---');
    const incompleteRes = await request(`/events/${eventId}/reviews`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        ratings: {
          overall: 5,
          contentQuality: 4,
          // Missing presentation and engagement
        },
        reviewText: 'Great event!',
      },
    });
    assert(incompleteRes.status === 400, 'Rejects incomplete rating categories with HTTP 400');
    assert(
      incompleteRes.data.message?.includes('Overall') || incompleteRes.data.message?.includes('mandatory') || incompleteRes.data.message?.includes('between 1 and 5'),
      'Error message specifies 4 rating categories are required'
    );

    // ----------------------------------------------------
    // TEST 3: Submit Complete 4-Criteria Review
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Submit New Review with 4 Categories & Suggestions ---');
    const submitRes = await request(`/events/${eventId}/reviews`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        ratings: {
          overall: 5,
          contentQuality: 4,
          presentation: 5,
          engagement: 4,
        },
        reviewText: 'Outstanding session! The mentors explained complex cloud architectures in very simple terms.',
        suggestions: 'Would love an extended hands-on coding lab in the next session.',
      },
    });

    assert(submitRes.status === 200 || submitRes.status === 201, 'Review submitted successfully (HTTP 200/201)');
    assert(submitRes.data.review?.ratings?.overall === 5, 'Overall rating saved as 5');
    assert(submitRes.data.review?.ratings?.contentQuality === 4, 'Content Quality saved as 4');
    assert(submitRes.data.review?.ratings?.presentation === 5, 'Presentation saved as 5');
    assert(submitRes.data.review?.ratings?.engagement === 4, 'Engagement saved as 4');
    assert(submitRes.data.review?.averageRating === 4.5, 'Average rating computed accurately as 4.5');
    assert(submitRes.data.review?.suggestions?.includes('extended hands-on'), 'Suggestions for improvement saved');

    // ----------------------------------------------------
    // TEST 4: Prevent Duplicates & Allow Review Editing / Updating
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Duplicate Prevention & Review Editing / Updating ---');
    const updateRes = await request(`/events/${eventId}/reviews`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        ratings: {
          overall: 5,
          contentQuality: 5,
          presentation: 5,
          engagement: 5,
        },
        reviewText: 'Updated: Absolute 5/5 perfection! The workshop exceeded all expectations.',
        suggestions: 'Organize advanced Part 2 next month!',
      },
    });

    assert(updateRes.status === 200, 'Updating existing review returns HTTP 200');
    assert(updateRes.data.isUpdate === true, 'Response flags isUpdate as true (no duplicate created)');
    assert(updateRes.data.review?.ratings?.contentQuality === 5, 'Updated content quality to 5');
    assert(updateRes.data.review?.averageRating === 5.0, 'Updated average rating to 5.0');
    assert(updateRes.data.review?.reviewText?.includes('Updated: Absolute 5/5'), 'Updated review text stored');

    // ----------------------------------------------------
    // TEST 5: Verify Event Reviews Endpoint & Calculated Stats
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Verify Event Reviews Endpoint & Category Breakdown ---');
    const reviewsRes = await request(`/events/${eventId}/reviews`, {
      headers: authHeaders,
    });
    assert(reviewsRes.status === 200, 'GET /events/:id/reviews returns HTTP 200');
    assert(reviewsRes.data.reviews?.length >= 1, 'Contains submitted review');
    assert(reviewsRes.data.stats?.categoryAverages?.overall >= 1, 'Calculates category average for Overall');
    assert(reviewsRes.data.stats?.categoryAverages?.contentQuality >= 1, 'Calculates category average for Content Quality');
    assert(reviewsRes.data.stats?.categoryAverages?.presentation >= 1, 'Calculates category average for Presentation');
    assert(reviewsRes.data.stats?.categoryAverages?.engagement >= 1, 'Calculates category average for Engagement');
    assert(!!reviewsRes.data.userReview, 'Returns current userReview for edit pre-fill');

    // ----------------------------------------------------
    // TEST 6: Verify Event Details Contains Reviews & User Review State
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Verify Event Details Page Review Aggregation ---');
    const detailRes = await request(`/events/${eventId}`, {
      headers: authHeaders,
    });
    assert(detailRes.status === 200, 'GET /events/:id returns HTTP 200');
    assert(detailRes.data.event?.reviews?.length >= 1, 'Event details contains reviews array');
    assert(detailRes.data.event?.averageRating >= 1, 'Event details contains calculated average rating');
    assert(detailRes.data.event?.categoryAverages !== undefined, 'Event details contains category averages');
    assert(detailRes.data.event?.userReview !== null, 'Event details provides userReview');

    // ----------------------------------------------------
    // TEST 7: Character Limit & Boundary Checks
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Character Limits & Validation Checks ---');
    const oversizedText = 'A'.repeat(1005);
    const oversizedRes = await request(`/events/${eventId}/reviews`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        ratings: { overall: 5, contentQuality: 5, presentation: 5, engagement: 5 },
        reviewText: oversizedText,
      },
    });
    assert(oversizedRes.status === 400, 'Rejects review text > 1000 characters with HTTP 400');

    console.log('\n====================================================');
    console.log(`ALL REVIEW TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exit(1);
  }
}

runTests();
