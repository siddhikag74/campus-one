const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../.env' });

const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const SavedEvent = require('../models/SavedEvent');
const ImportantEvent = require('../models/ImportantEvent');
const TimetableEntry = require('../models/TimetableEntry');
const { clubsData } = require('./seedData');

/**
 * Idempotent & Non-destructive Seed Script
 * - Preserves existing database collections (NO deleteMany).
 * - Uses atomic upserts (findOneAndUpdate with upsert: true) for idempotency.
 * - Safely adds/updates required demo timetable data for Arjun Sharma.
 */
const seedAll = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Safely upserting Clubs (Idempotent)...');
    const clubMap = {};
    for (const club of clubsData) {
      const savedClub = await Club.findOneAndUpdate(
        { name: club.name },
        { $set: club },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      clubMap[savedClub.name] = savedClub;
    }

    console.log('[Seed] Safely upserting demo student Arjun Sharma (Idempotent)...');
    let demoUser = await User.findOne({ email: 'arjun.sharma@dtu.ac.in' });
    if (!demoUser) {
      const hashedPassword = await bcrypt.hash('campusone123', 10);
      demoUser = await User.create({
        name: 'Arjun Sharma',
        email: 'arjun.sharma@dtu.ac.in',
        rollNumber: '23BCS1042',
        year: '3rd Year',
        branch: 'Computer Science & Engineering',
        college: 'Delhi Technological University',
        phone: '+91 98765 43210',
        avatar: 'AS',
        password: hashedPassword,
        interests: ['Tech', 'Gaming', 'Creativity'],
        interestSubCategories: ['Design', 'Media'],
        onboardingCompleted: true,
        followedClubs: [
          clubMap['ACM Club']?._id,
          clubMap['Developer Student Club (DSC)']?._id,
          clubMap['TEDx']?._id,
        ].filter(Boolean),
        shortlistedCompetitions: [
          {
            competitionName: 'Control the Soils',
            currentRound: 2,
            totalRounds: 3,
            currentRoundName: 'Round 2: Prototype Submission',
            nextRoundName: 'Round 3: Grand Finale Pitch',
            nextRoundDate: 'Sep 18, 2026',
            progressPercent: 66,
          },
          {
            competitionName: 'Hackathon 2026',
            currentRound: 1,
            totalRounds: 2,
            currentRoundName: 'Round 1: Screening & Idea Deck',
            nextRoundName: 'Round 2: 24-Hour Live Hackathon',
            nextRoundDate: 'Sep 24, 2026',
            progressPercent: 50,
          },
        ],
        rejectedCompetitions: [
          {
            competitionName: 'EconTalk',
            roundName: 'Round 1: Macro Policy Case Study',
            message: 'Thank you for your enthusiastic submission. The competition was exceptionally intense with over 450 applicants. While your team was not selected for Round 2, the jury commended your empirical breakdown.',
            date: 'Sep 02, 2026',
          },
        ],
      });
    } else {
      demoUser.onboardingCompleted = true;
      if (!demoUser.interests || demoUser.interests.length === 0) {
        demoUser.interests = ['Tech', 'Gaming', 'Creativity'];
        demoUser.interestSubCategories = ['Design', 'Media'];
      }
      await demoUser.save();
    }

    console.log('[Seed] Safely upserting Events across categories (Idempotent)...');
    const rawEvents = [
      // 1. Control the Soils (ACM Club)
      {
        title: 'Control the Soils',
        club: clubMap['ACM Club']?._id,
        category: 'Competitions',
        status: 'upcoming',
        dateStr: 'Sep 18, 2026',
        isoDate: '2026-09-18',
        time: '10:00 AM - 05:00 PM',
        venue: 'IT Block',
        deadline: 'Sep 08, 2026, 11:59 PM',
        isoDeadline: '2026-09-08',
        teamSize: '2 - 4 Members',
        isTeamEvent: true,
        isPopular: true,
        isCompetition: true,
        deadlineAlert: {
          isExtended: true,
          originalDeadline: 'Sep 05, 2026',
          newDeadline: 'Sep 08, 2026',
          message: 'Registration deadline extended to September 8 due to student requests!',
        },
        venueAlert: { isUpdated: false },
        about: 'Control the Soils is an algorithmic and hardware-software challenge where engineering teams develop precision soil-sensing systems and automation algorithms for smart agriculture.',
        eligibility: 'Open to all engineering undergraduates in teams of 2 to 4. Inter-disciplinary teams are highly encouraged.',
        whatToExpect: [
          'Hands-on sensor telemetry kits provided to top 20 teams',
          'Mentorship from agricultural tech founders & professors',
          'Cash pool of ₹1,50,000 and direct incubation opportunities',
        ],
        importantInformation: 'Final round teams must bring their own laptops and microcontroller hardware. Prototype submission portals close promptly at 6 PM.',
        competitionRounds: [
          {
            roundNumber: 1,
            name: 'Online Quiz & Ideation',
            description: 'Domain test covering microcontrollers, IoT telemetry, and soil bio-chemistry fundamentals.',
            date: 'Aug 28, 2026',
            status: 'Completed',
          },
          {
            roundNumber: 2,
            name: 'Prototype Submission',
            description: 'Working simulator or circuit demonstration with GitHub repository documentation.',
            date: 'Sep 12, 2026',
            status: 'In Progress',
          },
          {
            roundNumber: 3,
            name: 'Grand Finale Pitch',
            description: 'Live physical deployment and 7-minute pitch before jury in IT Block.',
            date: 'Sep 18, 2026',
            status: 'Upcoming',
          },
        ],
        tags: ['IoT', 'Hardware', 'Agriculture', 'Hackathon'],
        popularityScore: 94,
      },

      // 2. Microsoft Innovation Challenge (MSC)
      {
        title: 'Microsoft Innovation Challenge (MSC)',
        club: clubMap['Microsoft Society (MSC)']?._id,
        category: 'Competitions',
        status: 'missed',
        dateStr: 'Sep 04, 2026',
        isoDate: '2026-09-04',
        time: '09:00 AM - 04:00 PM',
        venue: 'Seminar Hall B',
        deadline: 'Sep 01, 2026, 11:59 PM',
        isoDeadline: '2026-09-01',
        teamSize: '1 - 3 Members',
        isTeamEvent: true,
        isPopular: true,
        isCompetition: true,
        venueAlert: {
          isUpdated: true,
          originalVenue: 'Auditorium',
          newVenue: 'Seminar Hall B',
          message: 'Venue relocated from Auditorium to Seminar Hall B for better audiovisual presentation equipment.',
        },
        about: 'The flagship Microsoft Student Summit challenge focused on building serverless cloud backends, Azure OpenAI integration, and modern enterprise developer tools.',
        eligibility: 'Open to all university students who registered before September 1.',
        whatToExpect: [
          'Azure Cloud Credits ($100 per participant)',
          'Certificates of completion co-signed by Microsoft Learn',
          'Keynote from Microsoft Azure Principal Architect',
        ],
        importantInformation: 'This event has concluded. Registered students can review session slides and access certificates below.',
        hasMedia: true,
        slidesTitle: 'MSC_Innovation_Keynote_2026.pdf',
        qrCodeLabel: 'Scan for Azure Sandbox Certificates & Code Samples',
        competitionRounds: [
          {
            roundNumber: 1,
            name: 'Cloud Solution Architecture',
            description: 'System design diagram submission',
            date: 'Sep 02, 2026',
            status: 'Completed',
          },
          {
            roundNumber: 2,
            name: 'Deploy & Pitch',
            description: 'Live deployment on Azure Kubernetes Service',
            date: 'Sep 04, 2026',
            status: 'Completed',
          },
        ],
        tags: ['Cloud', 'Azure', 'AI', 'Completed'],
        popularityScore: 92,
      },

      // 3. She Vibes — AssetMerkle Club
      {
        title: 'She Vibes',
        club: clubMap['AssetMerkle Club']?._id,
        category: 'Events',
        status: 'upcoming',
        dateStr: 'Sep 20, 2026',
        isoDate: '2026-09-20',
        time: '03:00 PM - 07:00 PM',
        venue: 'Auditorium',
        deadline: 'Sep 17, 2026, 05:00 PM',
        isoDeadline: '2026-09-17',
        teamSize: 'Individual',
        isPopular: true,
        about: 'A campus celebration of women in technology, leadership, and entrepreneurship featuring fireside chats, live pitch sessions, and networking high-tea.',
        eligibility: 'All students across campus. Welcoming atmosphere for anyone interested in women-led tech innovation.',
        whatToExpect: ['Fireside chats with top women VCs and Founders', 'Networking dinner and mentor mixer', 'Exclusive swag kit'],
        importantInformation: 'Entry passes are issued upon registration. Gates close at 3:15 PM.',
        tags: ['WomenInTech', 'Leadership', 'Networking'],
        popularityScore: 88,
      },

      // 4. TEDx Bollywood × Hollywood — TEDx
      {
        title: 'TEDx Bollywood × Hollywood',
        club: clubMap['TEDx']?._id,
        category: 'Events',
        status: 'upcoming',
        dateStr: 'Sep 22, 2026',
        isoDate: '2026-09-22',
        time: '11:00 AM - 04:30 PM',
        venue: 'Auditorium',
        deadline: 'Sep 19, 2026, 11:59 PM',
        isoDeadline: '2026-09-19',
        teamSize: 'Individual',
        isPopular: true,
        about: 'Exploring cross-cultural cinema storytelling, visual effects revolution, film scoring, and globalization of mass media.',
        eligibility: 'Open to all university students with valid ID.',
        whatToExpect: ['6 dynamic speaker talks', 'Interactive cinematic soundstage workshop', 'Official TEDx gift box'],
        tags: ['TEDx', 'Media', 'Cinema', 'Storytelling'],
        popularityScore: 96,
      },

      // 5. Tarangana Annual Fest — Art Collective
      {
        title: 'Tarangana Annual Fest',
        club: clubMap['Art Collective']?._id,
        category: 'Events',
        status: 'upcoming',
        dateStr: 'Sep 26, 2026',
        isoDate: '2026-09-26',
        time: '10:00 AM - 10:00 PM',
        venue: 'Main Ground',
        deadline: 'Sep 23, 2026, 11:59 PM',
        isoDeadline: '2026-09-23',
        teamSize: 'Individual or Group',
        isPopular: true,
        about: 'The biggest inter-college cultural fest on campus with street plays, battle of bands, art galleries, food trucks, and star night.',
        tags: ['Fest', 'Music', 'Celebration'],
        popularityScore: 99,
      },

      // 6. Campus Photography Walk — Art Collective
      {
        title: 'Campus Photography Walk',
        club: clubMap['Art Collective']?._id,
        category: 'Events',
        status: 'new',
        dateStr: 'Sep 19, 2026',
        isoDate: '2026-09-19',
        time: '06:30 AM - 09:30 AM',
        venue: 'College Campus',
        deadline: 'Sep 18, 2026, 08:00 PM',
        isoDeadline: '2026-09-18',
        teamSize: 'Individual',
        isPopular: false,
        about: 'Capture golden hour light, brutalist architectural silhouettes, and botanical life across our historic campus grounds.',
        tags: ['Photography', 'Visuals', 'Art'],
        popularityScore: 65,
      },

      // 7. Environmental Awareness Drive — Green Sphere
      {
        title: 'Environmental Awareness Drive',
        club: clubMap['Green Sphere']?._id,
        category: 'Events',
        status: 'upcoming',
        dateStr: 'Sep 21, 2026',
        isoDate: '2026-09-21',
        time: '08:00 AM - 12:00 PM',
        venue: 'Student Activity Centre',
        deadline: 'Sep 20, 2026, 11:59 PM',
        isoDeadline: '2026-09-20',
        teamSize: 'Individual',
        isPopular: false,
        about: 'E-waste segregation campaign, native tree sapling distribution, and zero-single-use-plastic campus pledge.',
        tags: ['Eco', 'Sustainability', 'Green'],
        popularityScore: 70,
      },

      // 8. Cultural Night 2026 — Taranum Music Society
      {
        title: 'Cultural Night 2026',
        club: clubMap['Taranum Music Society']?._id,
        category: 'Events',
        status: 'upcoming',
        dateStr: 'Sep 28, 2026',
        isoDate: '2026-09-28',
        time: '06:00 PM - 09:30 PM',
        venue: 'Auditorium',
        deadline: 'Sep 25, 2026, 11:59 PM',
        isoDeadline: '2026-09-25',
        teamSize: 'Individual',
        isPopular: true,
        about: 'An evening of classical melodies, folk choreography, acoustic sets, and theatrical monologues celebrating campus talent.',
        tags: ['Music', 'Dance', 'Culture'],
        popularityScore: 84,
      },

      // 9. EconTalk — Economics Society
      {
        title: 'EconTalk',
        club: clubMap['Economics Society']?._id,
        category: 'Competitions',
        status: 'upcoming',
        dateStr: 'Sep 23, 2026',
        isoDate: '2026-09-23',
        time: '01:30 PM - 05:00 PM',
        venue: 'Seminar Hall A',
        deadline: 'Sep 17, 2026, 11:59 PM',
        isoDeadline: '2026-09-17',
        teamSize: '1 - 2 Members',
        isPopular: false,
        isCompetition: true,
        about: 'National level policy debate and case study championship on fiscal inflation and emerging market tech equities.',
        tags: ['Economics', 'Policy', 'Debate'],
        popularityScore: 78,
      },

      // 10. Hackathon 2026 — Developer Student Club (DSC)
      {
        title: 'Hackathon 2026',
        club: clubMap['Developer Student Club (DSC)']?._id,
        category: 'Competitions',
        status: 'deadline-approaching',
        dateStr: 'Sep 24, 2026',
        isoDate: '2026-09-24',
        time: '09:00 AM - 09:00 AM',
        venue: 'IT Block',
        deadline: 'Sep 16, 2026, 11:59 PM',
        isoDeadline: '2026-09-16',
        teamSize: '2 - 4 Members',
        isTeamEvent: true,
        isPopular: true,
        isCompetition: true,
        about: 'A 24-hour sprint to build AI-powered solutions, decentralized web platforms, and mobile apps solving real urban challenges.',
        tags: ['Hackathon', 'AI', 'Coding'],
        popularityScore: 98,
      },

      // 11. Synergy Sports League — Synergy
      {
        title: 'Synergy Sports League',
        club: clubMap['Synergy']?._id,
        category: 'Competitions',
        status: 'upcoming',
        dateStr: 'Sep 25, 2026',
        isoDate: '2026-09-25',
        time: '08:00 AM - 06:00 PM',
        venue: 'Main Ground',
        deadline: 'Sep 20, 2026, 06:00 PM',
        isoDeadline: '2026-09-20',
        teamSize: '7 - 11 Members',
        isTeamEvent: true,
        isPopular: true,
        isCompetition: true,
        about: 'Inter-department football, basketball, and athletics league with official trophies and championship jerseys.',
        tags: ['Sports', 'Football', 'Athletics'],
        popularityScore: 89,
      },

      // 12. CodeBlitz — ACM Club
      {
        title: 'CodeBlitz',
        club: clubMap['ACM Club']?._id,
        category: 'Competitions',
        status: 'new',
        dateStr: 'Sep 27, 2026',
        isoDate: '2026-09-27',
        time: '06:00 PM - 09:00 PM',
        venue: 'Lab 3',
        deadline: 'Sep 26, 2026, 02:00 PM',
        isoDeadline: '2026-09-26',
        teamSize: 'Individual',
        isPopular: false,
        isCompetition: true,
        about: 'Speed competitive programming contest on dynamic programming, graphs, and greedy algorithms.',
        tags: ['CP', 'Algorithms', 'ACM'],
        popularityScore: 82,
      },

      // 13. Ideathon — Developer Student Club (DSC)
      {
        title: 'Ideathon',
        club: clubMap['Developer Student Club (DSC)']?._id,
        category: 'Competitions',
        status: 'upcoming',
        dateStr: 'Sep 29, 2026',
        isoDate: '2026-09-29',
        time: '11:00 AM - 04:00 PM',
        venue: 'Seminar Hall A',
        deadline: 'Sep 27, 2026, 11:59 PM',
        isoDeadline: '2026-09-27',
        teamSize: '1 - 3 Members',
        isTeamEvent: true,
        isPopular: false,
        isCompetition: true,
        about: 'Pitch transformative startup ideas in sustainability, healthcare, and EdTech before seed venture investors.',
        tags: ['Startups', 'Pitch', 'Business'],
        popularityScore: 76,
      },

      // 14. AI & Future Workshop — ACM Club
      {
        title: 'AI & Future Workshop',
        club: clubMap['ACM Club']?._id,
        category: 'Workshops',
        status: 'deadline-approaching',
        dateStr: 'Sep 17, 2026',
        isoDate: '2026-09-17',
        time: '02:00 PM - 05:00 PM',
        venue: 'Seminar Hall A',
        deadline: 'Sep 16, 2026, 11:59 PM',
        isoDeadline: '2026-09-16',
        teamSize: 'Individual',
        isPopular: true,
        about: 'Deep dive into LLM fine-tuning, retrieval augmented generation (RAG), and agentic workflows with hands-on Colab notebooks.',
        tags: ['AI', 'LLM', 'HandsOn'],
        popularityScore: 97,
      },

      // 15. Web Dev Bootcamp — Developer Student Club (DSC)
      {
        title: 'Web Dev Bootcamp',
        club: clubMap['Developer Student Club (DSC)']?._id,
        category: 'Workshops',
        status: 'upcoming',
        dateStr: 'Sep 19, 2026',
        isoDate: '2026-09-19',
        time: '10:00 AM - 04:00 PM',
        venue: 'Lab 3',
        deadline: 'Sep 18, 2026, 11:59 PM',
        isoDeadline: '2026-09-18',
        teamSize: 'Individual',
        isPopular: true,
        about: 'Master React, Tailwind CSS, REST APIs, and modern responsive full-stack frontend practices in one day.',
        tags: ['React', 'WebDev', 'Tailwind'],
        popularityScore: 91,
      },

      // 16. Green Campus Initiative — Green Sphere
      {
        title: 'Green Campus Initiative',
        club: clubMap['Green Sphere']?._id,
        category: 'Workshops',
        status: 'new',
        dateStr: 'Sep 23, 2026',
        isoDate: '2026-09-23',
        time: '03:00 PM - 05:00 PM',
        venue: 'Seminar Hall B',
        deadline: 'Sep 22, 2026, 06:00 PM',
        isoDeadline: '2026-09-22',
        teamSize: 'Individual',
        isPopular: false,
        about: 'Hands-on training on measuring solar efficiency, rooftop gardens, and campus carbon auditing methodologies.',
        tags: ['Green', 'Solar', 'Audit'],
        popularityScore: 68,
      },

      // 17. Git & GitHub Workshop — Microsoft Society (MSC)
      {
        title: 'Git & GitHub Workshop',
        club: clubMap['Microsoft Society (MSC)']?._id,
        category: 'Workshops',
        status: 'upcoming',
        dateStr: 'Sep 21, 2026',
        isoDate: '2026-09-21',
        time: '02:00 PM - 04:30 PM',
        venue: 'Lab 3',
        deadline: 'Sep 20, 2026, 11:59 PM',
        isoDeadline: '2026-09-20',
        teamSize: 'Individual',
        isPopular: false,
        about: 'From merge conflicts to GitHub Actions CI/CD and open source contributions: practical developer workflows.',
        tags: ['Git', 'GitHub', 'OpenSource'],
        popularityScore: 85,
      },

      // 18. UI/UX Design Workshop — Art Collective
      {
        title: 'UI/UX Design Workshop',
        club: clubMap['Art Collective']?._id,
        category: 'Workshops',
        status: 'upcoming',
        dateStr: 'Sep 22, 2026',
        isoDate: '2026-09-22',
        time: '11:00 AM - 02:00 PM',
        venue: 'Gallery Hall',
        deadline: 'Sep 21, 2026, 05:00 PM',
        isoDeadline: '2026-09-21',
        teamSize: 'Individual',
        isPopular: true,
        about: 'Wireframing, typography, color palettes, and micro-interactions in Figma with real user research case studies.',
        tags: ['Design', 'Figma', 'UX'],
        popularityScore: 87,
      },

      // 19. Cybersecurity Basics — ACM Club
      {
        title: 'Cybersecurity Basics',
        club: clubMap['ACM Club']?._id,
        category: 'Workshops',
        status: 'new',
        dateStr: 'Sep 30, 2026',
        isoDate: '2026-09-30',
        time: '03:00 PM - 06:00 PM',
        venue: 'Seminar Hall B',
        deadline: 'Sep 28, 2026, 11:59 PM',
        isoDeadline: '2026-09-28',
        teamSize: 'Individual',
        isPopular: false,
        about: 'Introduction to ethical hacking, CTF challenges, web penetration testing, and protecting personal identity online.',
        tags: ['Security', 'EthicalHacking', 'CTF'],
        popularityScore: 79,
      },

      // 20. Product Management 101 — Economics Society
      {
        title: 'Product Management 101',
        club: clubMap['Economics Society']?._id,
        category: 'Workshops',
        status: 'upcoming',
        dateStr: 'Sep 24, 2026',
        isoDate: '2026-09-24',
        time: '04:00 PM - 06:30 PM',
        venue: 'Seminar Hall A',
        deadline: 'Sep 23, 2026, 11:59 PM',
        isoDeadline: '2026-09-23',
        teamSize: 'Individual',
        isPopular: false,
        about: 'Crafting product roadmaps, prioritization matrices, PRDs, and analytics metrics for high-growth tech products.',
        tags: ['Product', 'Strategy', 'Tech'],
        popularityScore: 81,
      },

      // 21. Jamming Session — Taranum Music Society
      {
        title: 'Jamming Session',
        club: clubMap['Taranum Music Society']?._id,
        category: 'Others',
        status: 'upcoming',
        dateStr: 'Sep 18, 2026',
        isoDate: '2026-09-18',
        time: '05:30 PM - 08:30 PM',
        venue: 'Music Room',
        deadline: 'Sep 18, 2026, 01:00 PM',
        isoDeadline: '2026-09-18',
        teamSize: 'Individual',
        isPopular: true,
        about: 'Unplugged acoustic evening where musicians bring guitars, cajons, and vocals for spontaneous musical jam sessions.',
        tags: ['Music', 'Acoustic', 'Chill'],
        popularityScore: 90,
      },

      // 22. Art & Photography Exhibition — Art Collective
      {
        title: 'Art & Photography Exhibition',
        club: clubMap['Art Collective']?._id,
        category: 'Others',
        status: 'upcoming',
        dateStr: 'Sep 20, 2026',
        isoDate: '2026-09-20',
        time: '10:00 AM - 06:00 PM',
        venue: 'Gallery Hall',
        deadline: 'Sep 19, 2026, 05:00 PM',
        isoDeadline: '2026-09-19',
        teamSize: 'Individual',
        isPopular: false,
        about: 'Curated gallery displaying student oil paintings, digital art prints, and darkroom photography series.',
        tags: ['Art', 'Exhibition', 'Gallery'],
        popularityScore: 72,
      },

      // 23. Inter-College Sports Meet — Synergy
      {
        title: 'Inter-College Sports Meet',
        club: clubMap['Synergy']?._id,
        category: 'Others',
        status: 'upcoming',
        dateStr: 'Sep 27, 2026',
        isoDate: '2026-09-27',
        time: '08:00 AM - 07:00 PM',
        venue: 'Main Ground',
        deadline: 'Sep 24, 2026, 08:00 PM',
        isoDeadline: '2026-09-24',
        teamSize: 'Teams',
        isPopular: true,
        about: 'Athletic track events, volleyball championships, and table tennis showdowns with universities across NCR.',
        tags: ['Sports', 'Athletics', 'Tournament'],
        popularityScore: 86,
      },

      // 24. Guest Lecture: Careers in Tech — Microsoft Society (MSC)
      {
        title: 'Guest Lecture: Careers in Tech',
        club: clubMap['Microsoft Society (MSC)']?._id,
        category: 'Others',
        status: 'upcoming',
        dateStr: 'Sep 25, 2026',
        isoDate: '2026-09-25',
        time: '04:00 PM - 06:00 PM',
        venue: 'Auditorium',
        deadline: 'Sep 24, 2026, 11:59 PM',
        isoDeadline: '2026-09-24',
        teamSize: 'Individual',
        isPopular: false,
        about: 'Insider perspective on engineering careers, remote work trends, and navigating software architect interviews.',
        tags: ['Careers', 'Tech', 'Guidance'],
        popularityScore: 75,
      },

      // 25. Film Screening Night — Art Collective
      {
        title: 'Film Screening Night',
        club: clubMap['Art Collective']?._id,
        category: 'Others',
        status: 'upcoming',
        dateStr: 'Sep 29, 2026',
        isoDate: '2026-09-29',
        time: '07:00 PM - 10:00 PM',
        venue: 'Seminar Hall B',
        deadline: 'Sep 28, 2026, 06:00 PM',
        isoDeadline: '2026-09-28',
        teamSize: 'Individual',
        isPopular: false,
        about: 'Open-floor projection of independent classic cinema followed by a director tribute discussion.',
        tags: ['Film', 'Cinema', 'Discussion'],
        popularityScore: 69,
      },

      // 26. Dance Showcase — Taranum Music Society
      {
        title: 'Dance Showcase',
        club: clubMap['Taranum Music Society']?._id,
        category: 'Others',
        status: 'upcoming',
        dateStr: 'Sep 26, 2026',
        isoDate: '2026-09-26',
        time: '05:00 PM - 08:00 PM',
        venue: 'Student Activity Centre',
        deadline: 'Sep 25, 2026, 05:00 PM',
        isoDeadline: '2026-09-25',
        teamSize: 'Individual or Group',
        isPopular: false,
        about: 'High energy hip-hop, contemporary, and fusion performances from college dance crews.',
        tags: ['Dance', 'Performance', 'Showcase'],
        popularityScore: 74,
      },

      // 27. Mental Health Awareness Talk — Green Sphere
      {
        title: 'Mental Health Awareness Talk',
        club: clubMap['Green Sphere']?._id,
        category: 'Others',
        status: 'new',
        dateStr: 'Sep 19, 2026',
        isoDate: '2026-09-19',
        time: '02:00 PM - 03:30 PM',
        venue: 'Seminar Hall A',
        deadline: 'Sep 18, 2026, 11:59 PM',
        isoDeadline: '2026-09-18',
        teamSize: 'Individual',
        isPopular: false,
        about: 'De-stressing techniques, managing academic pressure, and accessing campus counseling resources.',
        tags: ['Wellness', 'MentalHealth', 'Support'],
        popularityScore: 77,
      },

      // 28. Campus Esports Championship — DSC
      {
        title: 'Campus Esports Championship',
        club: clubMap['Developer Student Club (DSC)']?._id,
        category: 'Competitions',
        status: 'upcoming',
        dateStr: 'Sep 27, 2026',
        isoDate: '2026-09-27',
        time: '11:00 AM - 07:00 PM',
        venue: 'Computer Center Lab 4',
        deadline: 'Sep 25, 2026, 11:59 PM',
        isoDeadline: '2026-09-25',
        teamSize: '4 - 5 Members',
        isTeamEvent: true,
        isPopular: true,
        isCompetition: true,
        about: 'The ultimate intra-university esports tournament featuring Valorant 5v5 tactical shooter and FIFA 24 console brackets.',
        tags: ['Gaming', 'Esports', 'Valorant', 'FIFA', 'Tournaments', 'Console'],
        popularityScore: 95,
      },

      // 29. Sustainable Architecture & Urban Design Colloquium — Green Sphere
      {
        title: 'Sustainable Architecture & Urban Space Colloquium',
        club: clubMap['Green Sphere']?._id,
        category: 'Workshops',
        status: 'new',
        dateStr: 'Sep 29, 2026',
        isoDate: '2026-09-29',
        time: '02:00 PM - 05:00 PM',
        venue: 'Architecture Studio 2',
        deadline: 'Sep 28, 2026, 06:00 PM',
        isoDeadline: '2026-09-28',
        teamSize: 'Individual or Pairs',
        isPopular: false,
        about: 'Hands-on architectural drafting, 3D spatial modeling, and passive solar design principles for modern zero-carbon college campuses.',
        tags: ['Architecture', 'Design', 'UrbanPlanning', 'SpatialDesign', 'CAD', 'Drafting'],
        popularityScore: 82,
      },

      // 30. Campus Runway & Fashion Styling Fest — Art Collective
      {
        title: 'Campus Runway & Fashion Styling Fest',
        club: clubMap['Art Collective']?._id,
        category: 'Events',
        status: 'upcoming',
        dateStr: 'Oct 02, 2026',
        isoDate: '2026-10-02',
        time: '06:00 PM - 09:30 PM',
        venue: 'Open Air Amphitheatre',
        deadline: 'Sep 30, 2026, 11:59 PM',
        isoDeadline: '2026-09-30',
        teamSize: 'Individual or Duo',
        isPopular: true,
        about: 'An avant-garde runway show celebrating sustainable thrift-fashion, apparel upcycling, creative cosmetics, and high-street styling.',
        tags: ['Fashion', 'Styling', 'Runway', 'Apparel', 'Creativity', 'Modelling', 'Couture'],
        popularityScore: 91,
      },
    ];

    const eventMap = {};
    for (const event of rawEvents) {
      const savedEvent = await Event.findOneAndUpdate(
        { title: event.title },
        { $set: event },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      eventMap[savedEvent.title] = savedEvent;
    }

    console.log('[Seed] Safely upserting registrations, favorites & bookmarks for Arjun...');
    // Register Arjun for "AI & Future Workshop"
    if (eventMap['AI & Future Workshop']) {
      await Registration.findOneAndUpdate(
        { user: demoUser._id, event: eventMap['AI & Future Workshop']._id },
        {
          user: demoUser._id,
          event: eventMap['AI & Future Workshop']._id,
          fullName: demoUser.name,
          collegeEmail: demoUser.email,
          rollNumber: demoUser.rollNumber,
          phoneNumber: demoUser.phone,
          year: demoUser.year,
          branch: demoUser.branch,
          status: 'Confirmed',
        },
        { upsert: true, new: true }
      );
    }

    // Register Arjun for "Control the Soils" (Team event)
    if (eventMap['Control the Soils']) {
      await Registration.findOneAndUpdate(
        { user: demoUser._id, event: eventMap['Control the Soils']._id },
        {
          user: demoUser._id,
          event: eventMap['Control the Soils']._id,
          fullName: demoUser.name,
          collegeEmail: demoUser.email,
          rollNumber: demoUser.rollNumber,
          phoneNumber: demoUser.phone,
          year: demoUser.year,
          branch: demoUser.branch,
          teamName: 'AgriTech Pioneers',
          teamMembers: ['23BCS1042 (Arjun)', '23BCS1089 (Rohan)', '23BEC1012 (Priya)'],
          status: 'Confirmed',
        },
        { upsert: true, new: true }
      );
    }

    // Saved events (Favorites)
    const favoriteTitles = ['Control the Soils', 'TEDx Bollywood × Hollywood', 'Web Dev Bootcamp'];
    for (const title of favoriteTitles) {
      if (eventMap[title]) {
        await SavedEvent.findOneAndUpdate(
          { user: demoUser._id, event: eventMap[title]._id },
          { user: demoUser._id, event: eventMap[title]._id },
          { upsert: true, new: true }
        );
      }
    }

    // Important events
    const importantTitles = ['Control the Soils', 'Hackathon 2026'];
    for (const title of importantTitles) {
      if (eventMap[title]) {
        await ImportantEvent.findOneAndUpdate(
          { user: demoUser._id, event: eventMap[title]._id },
          { user: demoUser._id, event: eventMap[title]._id },
          { upsert: true, new: true }
        );
      }
    }

    // Pre-existing review for Microsoft Innovation Challenge
    const mscEvent = eventMap['Microsoft Innovation Challenge (MSC)'];
    if (mscEvent) {
      await Review.findOneAndUpdate(
        { user: demoUser._id, event: mscEvent._id },
        {
          user: demoUser._id,
          event: mscEvent._id,
          ratings: { content: 5, organisation: 4, venue: 4, overall: 5 },
          comment: 'Exceptional hands-on experience! The Azure cloud deployment challenges were very realistic, and moving the venue to Seminar Hall B made the AV setup crystal clear.',
        },
        { upsert: true, new: true }
      );
    }

    // Base Notifications (Idempotent)
    const baseNotifications = [
      {
        user: demoUser._id,
        type: 'deadline_extended',
        title: '📢 Deadline Extended',
        body: 'Control the Soils deadline has been extended to Sep 08, 2026! Submit your prototype deck now.',
        event: eventMap['Control the Soils']?._id,
        isRead: false,
        timeAgo: '10m ago',
      },
      {
        user: demoUser._id,
        type: 'registration_confirmed',
        title: '✅ Registration Confirmed',
        body: 'You are confirmed for AI & Future Workshop in Seminar Hall A.',
        event: eventMap['AI & Future Workshop']?._id,
        isRead: false,
        timeAgo: '2h ago',
      },
      {
        user: demoUser._id,
        type: 'shortlisted',
        title: '🏆 Shortlisted',
        body: 'Congratulations! Your team AgriTech Pioneers has advanced to Round 2 of Control the Soils.',
        event: eventMap['Control the Soils']?._id,
        isRead: false,
        timeAgo: '1d ago',
      },
      {
        user: demoUser._id,
        type: 'deadline',
        title: '⏳ Deadline Approaching',
        body: 'Hackathon 2026 registrations close tomorrow at 11:59 PM. Finalize your team entry.',
        event: eventMap['Hackathon 2026']?._id,
        isRead: true,
        timeAgo: '2d ago',
      },
      {
        user: demoUser._id,
        type: 'reminder',
        title: '⏰ Reminder',
        body: 'Jamming Session is tomorrow at 5:30 PM in Music Room.',
        event: eventMap['Jamming Session']?._id,
        isRead: true,
        timeAgo: '3d ago',
      },
      {
        user: demoUser._id,
        type: 'rejection',
        title: '💌 Rejection Update',
        body: 'Selection decisions for EconTalk Round 1 have been released.',
        event: eventMap['EconTalk']?._id,
        isRead: true,
        timeAgo: '4d ago',
      },
      {
        user: demoUser._id,
        type: 'new_event',
        title: '🎉 New Event',
        body: 'TEDx Bollywood × Hollywood has just been announced in Auditorium.',
        event: eventMap['TEDx Bollywood × Hollywood']?._id,
        isRead: true,
        timeAgo: '5d ago',
      },
      {
        user: demoUser._id,
        type: 'announcement',
        title: '📣 Announcement',
        body: 'Tarangana 2026 theme reveal trailer drops this weekend on CampusOne.',
        event: eventMap['Tarangana Annual Fest']?._id,
        isRead: true,
        timeAgo: '1w ago',
      },
    ];

    for (const notif of baseNotifications) {
      await Notification.findOneAndUpdate(
        { user: demoUser._id, title: notif.title, type: notif.type },
        { $set: notif },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log('[Seed] Safely upserting comprehensive Timetable entries for Arjun Sharma (Idempotent)...');
    const demoTimetable = [
      // MONDAY
      {
        user: demoUser._id,
        subject: 'Data Structures & Algorithms',
        courseCode: 'CS201',
        faculty: 'Dr. Sharma',
        venue: 'Room B-204',
        dayOfWeek: 'Monday',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        type: 'Lecture',
        status: 'scheduled',
        colorTag: 'indigo',
      },
      {
        user: demoUser._id,
        subject: 'Database Management Systems',
        courseCode: 'CS305',
        faculty: 'Dr. Mehta',
        venue: 'Lab 2',
        dayOfWeek: 'Monday',
        startTime: '11:00 AM',
        endTime: '12:00 PM',
        type: 'Lab',
        status: 'venue_changed',
        originalVenue: 'Room A-101',
        changeReason: 'Relocated to Lab 2 for high-memory database server practicals.',
        colorTag: 'amber',
      },
      {
        user: demoUser._id,
        subject: 'Computer Networks Lab',
        courseCode: 'CS401',
        faculty: 'Prof. Kapoor',
        venue: 'Network Lab 1',
        dayOfWeek: 'Monday',
        startTime: '02:00 PM',
        endTime: '03:30 PM',
        type: 'Lab',
        status: 'scheduled',
        colorTag: 'violet',
      },

      // TUESDAY
      {
        user: demoUser._id,
        subject: 'Operating Systems',
        courseCode: 'CS301',
        faculty: 'Dr. Verma',
        venue: 'Room C-102',
        dayOfWeek: 'Tuesday',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        type: 'Lecture',
        status: 'cancelled',
        changeReason: 'Faculty attending National Research Symposium on Kernel Architectures.',
        colorTag: 'rose',
      },
      {
        user: demoUser._id,
        subject: 'Software Engineering & Agile',
        courseCode: 'CS309',
        faculty: 'Prof. Iyer',
        venue: 'Room B-204',
        dayOfWeek: 'Tuesday',
        startTime: '01:00 PM',
        endTime: '02:00 PM',
        type: 'Lecture',
        status: 'scheduled',
        colorTag: 'emerald',
      },
      {
        user: demoUser._id,
        subject: 'Discrete Mathematics',
        courseCode: 'MA201',
        faculty: 'Dr. Gupta',
        venue: 'Seminar Hall A',
        dayOfWeek: 'Tuesday',
        startTime: '03:00 PM',
        endTime: '04:00 PM',
        type: 'Lecture',
        status: 'scheduled',
        colorTag: 'sky',
      },

      // WEDNESDAY
      {
        user: demoUser._id,
        subject: 'Theory of Computation',
        courseCode: 'CS303',
        faculty: 'Dr. Reddy',
        venue: 'Room B-204',
        dayOfWeek: 'Wednesday',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        type: 'Lecture',
        status: 'scheduled',
        colorTag: 'indigo',
      },
      {
        user: demoUser._id,
        subject: 'Web Technologies & Cloud UI',
        courseCode: 'CS307',
        faculty: 'Prof. Roy',
        venue: 'Room C-104',
        dayOfWeek: 'Wednesday',
        startTime: '11:15 AM',
        endTime: '12:15 PM',
        type: 'Lecture',
        status: 'scheduled',
        colorTag: 'emerald',
      },
      {
        user: demoUser._id,
        subject: 'Computer Networks',
        courseCode: 'CS401',
        faculty: 'Prof. Kapoor',
        venue: 'Room B-301',
        dayOfWeek: 'Wednesday',
        startTime: '02:00 PM',
        endTime: '03:00 PM',
        type: 'Lecture',
        status: 'postponed',
        originalDay: 'Wednesday',
        originalStartTime: '02:00 PM',
        originalEndTime: '03:00 PM',
        changeReason: 'Postponed to Thursday at 02:00 PM due to departmental accreditation audit.',
        colorTag: 'violet',
      },

      // THURSDAY (2 non-overlapping classes)
      {
        user: demoUser._id,
        subject: 'Design & Analysis of Algorithms',
        courseCode: 'CS302',
        faculty: 'Dr. Sharma',
        venue: 'Room B-204',
        dayOfWeek: 'Thursday',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        type: 'Lecture',
        status: 'scheduled',
        colorTag: 'indigo',
      },
      {
        user: demoUser._id,
        subject: 'Artificial Intelligence & Neural Nets',
        courseCode: 'CS405',
        faculty: 'Dr. Swaminathan',
        venue: 'Room A-204',
        dayOfWeek: 'Thursday',
        startTime: '12:00 PM',
        endTime: '01:00 PM',
        type: 'Lecture',
        status: 'time_changed',
        originalStartTime: '10:00 AM',
        originalEndTime: '11:00 AM',
        changeReason: 'Class time moved to 12:00 PM for combined session with M.Tech AI cohort.',
        colorTag: 'sky',
      },

      // FRIDAY
      {
        user: demoUser._id,
        subject: 'Cloud Computing & DevOps',
        courseCode: 'CS412',
        faculty: 'Dr. Chopra',
        venue: 'Lab 3',
        dayOfWeek: 'Friday',
        startTime: '09:00 AM',
        endTime: '10:30 AM',
        type: 'Lab',
        status: 'scheduled',
        colorTag: 'emerald',
      },
      {
        user: demoUser._id,
        subject: 'Object Oriented Software Design',
        courseCode: 'CS204',
        faculty: 'Prof. Saxena',
        venue: 'Room B-204',
        dayOfWeek: 'Friday',
        startTime: '11:00 AM',
        endTime: '12:00 PM',
        type: 'Lecture',
        status: 'scheduled',
        colorTag: 'indigo',
      },
      {
        user: demoUser._id,
        subject: 'AI Capstone Project Colloquium',
        courseCode: 'CS499',
        faculty: 'Dr. Swaminathan',
        venue: 'Innovation Hub',
        dayOfWeek: 'Friday',
        startTime: '02:30 PM',
        endTime: '04:00 PM',
        type: 'Seminar',
        status: 'scheduled',
        colorTag: 'violet',
      },

      // SATURDAY
      {
        user: demoUser._id,
        subject: 'Competitive Programming Masterclass',
        courseCode: 'CP101',
        faculty: 'Dr. Sharma',
        venue: 'Lab 2',
        dayOfWeek: 'Saturday',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        type: 'Workshop',
        status: 'scheduled',
        colorTag: 'amber',
      },
    ];

    // Clean up any legacy duplicate entries for demoUser
    await TimetableEntry.deleteMany({
      user: demoUser._id,
      subject: /\[Rescheduled\]/i,
    });

    const savedTimetableMap = {};
    for (const item of demoTimetable) {
      const saved = await TimetableEntry.findOneAndUpdate(
        { user: demoUser._id, courseCode: item.courseCode, dayOfWeek: item.dayOfWeek, startTime: item.startTime },
        { $set: item },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      savedTimetableMap[`${item.courseCode}_${item.dayOfWeek}`] = saved;
    }

    // Insert/upsert active schedule change notifications for Arjun
    const dbmsEntry = savedTimetableMap['CS305_Monday'];
    const osEntry = savedTimetableMap['CS301_Tuesday'];

    const cnEntry = savedTimetableMap['CS401_Wednesday'];
    const aiEntry = savedTimetableMap['CS405_Thursday'];

    const timetableNotifications = [
      {
        user: demoUser._id,
        type: 'venue_changed',
        title: '📍 Classroom Moved: Database Management',
        body: 'Your Database Management (CS305) class has moved from Room A-101 to Lab 2.',
        timetableEntry: dbmsEntry?._id,
        isRead: false,
        timeAgo: '15m ago',
      },
      {
        user: demoUser._id,
        type: 'class_cancelled',
        title: '❌ Class Cancelled: Operating Systems',
        body: 'Operating Systems (CS301) on Tuesday at 10:00 AM has been cancelled (Faculty research symposium).',
        timetableEntry: osEntry?._id,
        isRead: false,
        timeAgo: '1h ago',
      },
      {
        user: demoUser._id,
        type: 'class_postponed',
        title: '⏳ Class Postponed: Computer Networks',
        body: 'Computer Networks class on Wednesday has been postponed to Thursday at 2:00 PM.',
        timetableEntry: cnEntry?._id,
        isRead: false,
        timeAgo: '3h ago',
      },
      {
        user: demoUser._id,
        type: 'class_time_changed',
        title: '⏰ Class Time Changed: Artificial Intelligence',
        body: 'Artificial Intelligence (CS405) on Thursday shifted from 10:00 AM to 12:00 PM.',
        timetableEntry: aiEntry?._id,
        isRead: false,
        timeAgo: '5h ago',
      },
    ];

    for (const notif of timetableNotifications) {
      await Notification.findOneAndUpdate(
        { user: demoUser._id, title: notif.title, type: notif.type },
        { $set: notif },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log('[Seed] Database successfully synchronized with idempotent demo data and timetable schedule!');
    return { success: true };
  } catch (error) {
    console.error('[Seed Error]:', error);
    throw error;
  }
};

// Run directly if called via CLI
if (require.main === module) {
  seedAll()
    .then(async () => {
      await closeDB();
      console.log('[Seed] Finished successfully without deleting existing data. Database closed.');
      process.exit(0);
    })
    .catch(async (err) => {
      await closeDB();
      console.error('[Seed] Failed:', err);
      process.exit(1);
    });
}

module.exports = { seedAll };
