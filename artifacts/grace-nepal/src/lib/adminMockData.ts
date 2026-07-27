/**
 * Comprehensive mock data for admin panel — used when the real Rust API
 * is unreachable (dev / demo mode).  All data is realistic and rich so
 * every admin page looks fully populated.
 */

export const MOCK_USER = {
  id: 'u1',
  name: 'Pastor Bishal Rai',
  email: 'admin@gracenepal.org',
  role: 'admin',
  verified: true,
  created_at: '2024-01-01T00:00:00Z',
}

export const MOCK_TOKEN = 'demo_token_grace_nepal_2026'

export const MOCK_SERMONS = [
  { id: 's1', title: 'The Anchor of Hope', speaker: 'Ps. Bishal Rai', date: '2026-07-20', duration: '42 min', series: 'Living Hope', topic: 'Hope', enabled: true, sort_order: 1, image: 'https://images.unsplash.com/photo-1653133672754-82025e7e9074?w=400', description: 'In a shifting world, our hope is anchored in the risen Christ.' },
  { id: 's2', title: 'Walking in Grace', speaker: 'Ps. Bishal Rai', date: '2026-07-13', duration: '38 min', series: 'Grace Upon Grace', topic: 'Grace', enabled: true, sort_order: 2, image: 'https://images.unsplash.com/photo-1522158637959-30385a09e0da?w=400', description: 'Grace is not just how we are saved, but how we live each day.' },
  { id: 's3', title: 'A Heart for Prayer', speaker: 'Elder Suman Tamang', date: '2026-07-06', duration: '35 min', series: 'Foundations', topic: 'Prayer', enabled: true, sort_order: 3, image: 'https://images.unsplash.com/photo-1663162550932-f67b561e656f?w=400', description: 'Learn how a life of prayer transforms the ordinary.' },
  { id: 's4', title: 'Light on the Mountain', speaker: 'Ps. Bishal Rai', date: '2026-06-29', duration: '45 min', series: 'Living Hope', topic: 'Faith', enabled: true, sort_order: 4, image: 'https://images.unsplash.com/photo-1645788421204-0e4eb1d2a518?w=400', description: 'The gospel is reaching every village of Nepal.' },
  { id: 's5', title: 'Love in Action', speaker: 'Ps. Anita Gurung', date: '2026-06-22', duration: '40 min', series: 'The Way of Love', topic: 'Love', enabled: true, sort_order: 5, image: 'https://images.unsplash.com/photo-1528828085966-aff4e01c5f2b?w=400', description: 'True love serves.' },
  { id: 's6', title: 'Rooted and Built Up', speaker: 'Elder Suman Tamang', date: '2026-06-15', duration: '37 min', series: 'Foundations', topic: 'Discipleship', enabled: false, sort_order: 6, image: 'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=400', description: 'Spiritual maturity grows from being deeply rooted in Christ.' },
]

export const MOCK_EVENTS = [
  { id: 'e1', title: 'Sunday Worship Service', date: '2026-08-03', time: '10:00 AM', location: 'Main Sanctuary, Kathmandu', description: 'Our weekly gathering for worship, prayer and the Word.', enabled: true, sort_order: 1, image: 'https://images.unsplash.com/photo-1600288480699-0b0d8a456dd8?w=400', category: 'Worship' },
  { id: 'e2', title: 'Youth Camp 2026', date: '2026-08-15', time: '8:00 AM', location: 'Nagarkot Retreat Center', description: 'A three-day camp for teens and young adults. Theme: Unshakeable.', enabled: true, sort_order: 2, image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400', category: 'Youth' },
  { id: 'e3', title: 'Women\'s Retreat', date: '2026-08-22', time: '9:00 AM', location: 'Dhulikhel Resort', description: 'A refreshing day of prayer, teaching and fellowship for women.', enabled: true, sort_order: 3, image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400', category: 'Retreat' },
  { id: 'e4', title: 'Community Outreach', date: '2026-09-07', time: '7:00 AM', location: 'Lalitpur Community Center', description: 'Join us to serve hot meals and share the love of Christ with 200+ families.', enabled: true, sort_order: 4, image: 'https://images.unsplash.com/photo-1528828085966-aff4e01c5f2b?w=400', category: 'Outreach' },
  { id: 'e5', title: 'Christmas Concert', date: '2026-12-24', time: '6:00 PM', location: 'Main Sanctuary', description: 'A special evening of carols, drama and celebration.', enabled: true, sort_order: 5, image: 'https://images.unsplash.com/photo-1522158637959-30385a09e0da?w=400', category: 'Special' },
]

export const MOCK_MEMBERS = [
  { id: 'm1', name: 'Ramesh Shrestha', email: 'ramesh@gmail.com', phone: '+977-9841234567', address: 'Kathmandu', joined: '2020-03-15', status: 'active', enabled: true },
  { id: 'm2', name: 'Sita Tamang', email: 'sita@gmail.com', phone: '+977-9852345678', address: 'Lalitpur', joined: '2019-06-20', status: 'active', enabled: true },
  { id: 'm3', name: 'Bikash Gurung', email: 'bikash@gmail.com', phone: '+977-9863456789', address: 'Bhaktapur', joined: '2021-01-10', status: 'active', enabled: true },
  { id: 'm4', name: 'Sunita Rai', email: 'sunita@gmail.com', phone: '+977-9874567890', address: 'Pokhara', joined: '2018-09-05', status: 'active', enabled: true },
  { id: 'm5', name: 'Deepak Lama', email: 'deepak@gmail.com', phone: '+977-9885678901', address: 'Kathmandu', joined: '2022-04-18', status: 'active', enabled: true },
  { id: 'm6', name: 'Anita Magar', email: 'anita@gmail.com', phone: '+977-9896789012', address: 'Chitwan', joined: '2023-07-22', status: 'inactive', enabled: false },
  { id: 'm7', name: 'Prasad Thapa', email: 'prasad@gmail.com', phone: '+977-9807890123', address: 'Kathmandu', joined: '2020-11-30', status: 'active', enabled: true },
  { id: 'm8', name: 'Kamala Poudel', email: 'kamala@gmail.com', phone: '+977-9818901234', address: 'Lalitpur', joined: '2021-08-14', status: 'active', enabled: true },
]

export const MOCK_USERS = [
  { id: 'u1', name: 'Pastor Bishal Rai', email: 'admin@gracenepal.org', role: 'admin', verified: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u2', name: 'Elder Suman Tamang', email: 'suman@gracenepal.org', role: 'editor', verified: true, created_at: '2024-02-15T00:00:00Z' },
  { id: 'u3', name: 'Ps. Anita Gurung', email: 'anita@gracenepal.org', role: 'editor', verified: true, created_at: '2024-03-10T00:00:00Z' },
]

export const MOCK_MINISTRIES = [
  { id: 'min1', name: 'Children Ministry', nameNe: 'बाल सेवा', description: 'Nurturing young hearts with the love of Jesus.', leader: 'Sister Maya Lama', meeting: 'Sunday 10:00 AM', enabled: true, sort_order: 1, image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400', icon: 'Baby' },
  { id: 'min2', name: 'Youth Ministry', nameNe: 'युवा सेवा', description: 'Empowering the next generation to live boldly for Christ.', leader: 'Bro. Prakash Rai', meeting: 'Friday 5:00 PM', enabled: true, sort_order: 2, image: 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?w=400', icon: 'Flame' },
  { id: 'min3', name: "Women's Fellowship", nameNe: 'महिला सङ्गति', description: 'A safe, Spirit-filled space for women to grow together.', leader: 'Ps. Anita Gurung', meeting: 'Tuesday 2:00 PM', enabled: true, sort_order: 3, image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400', icon: 'Heart' },
  { id: 'min4', name: 'Worship Ministry', nameNe: 'आराधना सेवा', description: 'Leading the congregation into the presence of God through music.', leader: 'Bro. Samuel Rai', meeting: 'Saturday 4:00 PM', enabled: true, sort_order: 4, image: 'https://images.unsplash.com/photo-1653133672754-82025e7e9074?w=400', icon: 'Music' },
]

export const MOCK_LEADERS = [
  { id: 'l1', name: 'Ps. Bishal Rai', role: 'Senior Pastor', bio: 'Leading Grace Nepal since 2010 with a heart for Nepal and the nations.', email: 'bishal@gracenepal.org', image: 'https://images.unsplash.com/photo-1647456605091-ab3e1b4baf8c?w=400', enabled: true, sort_order: 1 },
  { id: 'l2', name: 'Elder Suman Tamang', role: 'Elder', bio: 'Overseeing discipleship and church planting in Kathmandu Valley.', email: 'suman@gracenepal.org', image: 'https://images.unsplash.com/photo-1582115422763-db7417d14db2?w=400', enabled: true, sort_order: 2 },
  { id: 'l3', name: 'Ps. Anita Gurung', role: 'Associate Pastor', bio: "Passionate about women's ministry and community outreach.", email: 'anita@gracenepal.org', image: 'https://images.unsplash.com/photo-1582115422763-db7417d14db2?w=400', enabled: true, sort_order: 3 },
]

export const MOCK_GALLERY = Array.from({ length: 12 }, (_, i) => ({
  id: `g${i + 1}`,
  title: ['Sunday Worship', 'Youth Camp', 'Community Outreach', 'Women\'s Retreat', 'Christmas Service', 'Baptism Sunday', 'Leadership Training', 'Bible Study', 'Prayer Night', 'Choir Practice', 'Children\'s Day', 'Missions Trip'][i],
  image: [
    'https://images.unsplash.com/photo-1600288480699-0b0d8a456dd8?w=600',
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600',
    'https://images.unsplash.com/photo-1528828085966-aff4e01c5f2b?w=600',
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600',
    'https://images.unsplash.com/photo-1653133672754-82025e7e9074?w=600',
    'https://images.unsplash.com/photo-1770097286875-0cbf4ca2f8c1?w=600',
    'https://images.unsplash.com/photo-1522158637959-30385a09e0da?w=600',
    'https://images.unsplash.com/photo-1663162550932-f67b561e656f?w=600',
    'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=600',
    'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?w=600',
    'https://images.unsplash.com/photo-1645788421204-0e4eb1d2a518?w=600',
    'https://images.unsplash.com/photo-1585995579097-5b23b5e06c5e?w=600',
  ][i],
  enabled: true,
  sort_order: i + 1,
}))

export const MOCK_TESTIMONIES = [
  { id: 't1', name: 'Ramesh Shrestha', role: 'Church Member', quote: 'Grace Nepal changed my life. I came broken and found healing in Christ and this community.', image: '', rating: 5, enabled: true, sort_order: 1 },
  { id: 't2', name: 'Sita Magar', role: 'Youth Leader', quote: 'The youth ministry here gave me purpose. I went from lost to leading others to Jesus.', image: '', rating: 5, enabled: true, sort_order: 2 },
  { id: 't3', name: 'Bikash Tamang', role: 'New Believer', quote: 'I attended my first service last year. The warmth and love of this church brought me to faith.', image: '', rating: 5, enabled: true, sort_order: 3 },
]

export const MOCK_NOTICES = [
  { id: 'n1', title: 'Church Clean-Up Day', content: 'All members are invited to join us for a morning of cleaning and beautifying our premises.', date: '2026-08-01', enabled: true, sort_order: 1 },
  { id: 'n2', title: 'New Members Class', content: 'Starting August, we\'re running a 6-week class for those interested in formal church membership.', date: '2026-08-05', enabled: true, sort_order: 2 },
  { id: 'n3', title: 'Sunday School Teachers Needed', content: 'We are looking for dedicated volunteers to serve in children\'s Sunday school.', date: '2026-07-28', enabled: true, sort_order: 3 },
]

export const MOCK_SERVICE_TIMES = [
  { id: 'st1', name: 'Sunday Worship', nameNe: 'आइतबार आराधना', day: 'Sunday', time: '10:00 AM', icon: 'Church', enabled: true, sort_order: 1 },
  { id: 'st2', name: 'Morning Prayer', nameNe: 'बिहानी प्रार्थना', day: 'Daily', time: '6:00 AM', icon: 'Sunrise', enabled: true, sort_order: 2 },
  { id: 'st3', name: 'Youth Fellowship', nameNe: 'युवा सङ्गति', day: 'Friday', time: '5:00 PM', icon: 'Users', enabled: true, sort_order: 3 },
  { id: 'st4', name: 'Bible Study', nameNe: 'बाइबल अध्ययन', day: 'Wednesday', time: '7:00 PM', icon: 'BookOpen', enabled: true, sort_order: 4 },
]

export const MOCK_VERSES = [
  { id: 'v1', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', ref: 'John 3:16', ne: 'परमेश्वरले जगतलाई यति माया गर्नुभयो कि उहाँले आफ्नो एकलौटो पुत्र दिनुभयो...', enabled: true, sort_order: 1 },
  { id: 'v2', text: 'I can do all this through him who gives me strength.', ref: 'Philippians 4:13', ne: 'मलाई शक्ति दिनुहुने ख्रीष्टद्वारा म सबै कुरा गर्न सक्छु।', enabled: true, sort_order: 2 },
  { id: 'v3', text: 'The Lord is my shepherd, I lack nothing.', ref: 'Psalm 23:1', ne: 'परमप्रभु मेरो गोठाला हुनुहुन्छ, मलाई कुनै कुराको अभाव छैन।', enabled: true, sort_order: 3 },
]

export const MOCK_CAMPAIGNS = [
  { id: 'c1', title: 'New Sanctuary Building Fund', description: 'Help us build a new worship space for our growing congregation.', goal: 5000000, raised: 2340000, enabled: true, sort_order: 1 },
  { id: 'c2', title: 'Nepal Earthquake Relief', description: 'Support families affected by recent earthquakes in remote areas.', goal: 1000000, raised: 876500, enabled: true, sort_order: 2 },
  { id: 'c3', title: 'Children\'s Education Scholarship', description: 'Sponsor underprivileged children to access quality education.', goal: 500000, raised: 215000, enabled: true, sort_order: 3 },
]

export const MOCK_BLOG_POSTS = [
  { id: 'b1', title: 'Finding Peace in Uncertain Times', slug: 'finding-peace', author: 'Ps. Bishal Rai', published_at: '2026-07-15', status: 'published', excerpt: 'How the Psalms speak to our modern anxieties.' },
  { id: 'b2', title: 'What Does It Mean to Be Faithful?', slug: 'what-faithful-means', author: 'Elder Suman Tamang', published_at: '2026-07-01', status: 'published', excerpt: 'Faithfulness is more than showing up — it\'s a posture of the heart.' },
  { id: 'b3', title: 'Youth Camp 2026 Recap', slug: 'youth-camp-2026', author: 'Bro. Prakash Rai', published_at: '2026-06-20', status: 'draft', excerpt: 'God moved powerfully among 150 young people in Nagarkot.' },
]

export const MOCK_SETTINGS = [
  { key: 'church_name', value: 'Grace Nepal Church' },
  { key: 'church_tagline', value: 'Faith • Hope • Love' },
  { key: 'church_address', value: 'Baneshwor, Kathmandu 44600, Nepal' },
  { key: 'church_phone', value: '+977-1-4567890' },
  { key: 'church_email', value: 'info@gracenepal.org' },
  { key: 'church_hours', value: 'Mon–Fri 9:00 AM–5:00 PM, Sun 8:00 AM–12:00 PM' },
  { key: 'facebook_url', value: 'https://facebook.com/gracenepal' },
  { key: 'youtube_url', value: 'https://youtube.com/@gracenepal' },
  { key: 'instagram_url', value: 'https://instagram.com/gracenepal' },
]

export const MOCK_PRAYER_REQUESTS = [
  { id: 'pr1', name: 'Anonymous', request: 'Please pray for healing for my mother who is very sick.', date: '2026-07-22', status: 'praying', private: true },
  { id: 'pr2', name: 'Ramesh S.', request: 'Praying for a breakthrough in my work situation and financial provision.', date: '2026-07-20', status: 'praying', private: false },
  { id: 'pr3', name: 'Sita T.', request: 'Please pray for peace in my family. We are going through a difficult season.', date: '2026-07-18', status: 'answered', private: false },
]

export const MOCK_DONATIONS = [
  { id: 'd1', amount: 5000, currency: 'NPR', donor_name: 'Ramesh Shrestha', method: 'eSewa', status: 'completed', date: '2026-07-20', fund: 'General' },
  { id: 'd2', amount: 10000, currency: 'NPR', donor_name: 'Anonymous', method: 'Bank Transfer', status: 'completed', date: '2026-07-18', fund: 'Building Fund' },
  { id: 'd3', amount: 2500, currency: 'NPR', donor_name: 'Sita Tamang', method: 'eSewa', status: 'completed', date: '2026-07-15', fund: 'General' },
  { id: 'd4', amount: 15000, currency: 'NPR', donor_name: 'Bikash Gurung', method: 'Cash', status: 'completed', date: '2026-07-13', fund: 'Missions' },
]

export const MOCK_GIVING_SUMMARY = {
  total_this_month: 187500,
  total_this_year: 1235000,
  total_donors: 89,
  average_gift: 5000,
  month_over_month_growth: 12.4,
  by_fund: [
    { fund: 'General', amount: 850000 },
    { fund: 'Building Fund', amount: 234000 },
    { fund: 'Missions', amount: 98000 },
    { fund: 'Benevolence', amount: 53000 },
  ],
  monthly: [
    { month: 'Jan', amount: 95000 },
    { month: 'Feb', amount: 82000 },
    { month: 'Mar', amount: 110000 },
    { month: 'Apr', amount: 98000 },
    { month: 'May', amount: 125000 },
    { month: 'Jun', amount: 167000 },
    { month: 'Jul', amount: 187500 },
  ],
}

export const MOCK_PEOPLE_SUMMARY = {
  total_members: 312,
  active_members: 287,
  new_this_month: 8,
  families: 94,
  volunteers: 45,
  small_groups: 12,
}

export const MOCK_ATTENDANCE = [
  { id: 'a1', service: 'Sunday Worship', date: '2026-07-27', count: 234, notes: 'Good attendance despite rain.' },
  { id: 'a2', service: 'Sunday Worship', date: '2026-07-20', count: 198, notes: '' },
  { id: 'a3', service: 'Youth Fellowship', date: '2026-07-25', count: 67, notes: '' },
  { id: 'a4', service: 'Bible Study', date: '2026-07-23', count: 45, notes: '' },
]

export const MOCK_CONTENT_BLOCKS = [
  { id: 'cb1', section_key: 'hero', title: 'Welcome to God\'s House', subtitle: 'Faith • Hope • Love', body: 'A loving community in the heart of Nepal, worshipping Jesus and serving our neighbours with joy.', enabled: true, sort_order: 0 },
  { id: 'cb2', section_key: 'welcome', title: 'A Word of Welcome', subtitle: null, body: 'Grace Nepal Church is a vibrant community of believers committed to worshipping God, growing in faith, and serving our city and nation.', enabled: true, sort_order: 3 },
  { id: 'cb3', section_key: 'announcement_bar', title: 'Sunday service live at 10:00 AM (NPT) — everyone is welcome! 🙌', subtitle: null, body: null, enabled: true, sort_order: -1 },
]

export const MOCK_AUDIT_LOG = [
  { id: 'al1', action: 'CREATE', resource: 'sermons', user: 'Ps. Bishal Rai', details: 'Created sermon: The Anchor of Hope', timestamp: '2026-07-20T09:15:00Z' },
  { id: 'al2', action: 'UPDATE', resource: 'events', user: 'Elder Suman Tamang', details: 'Updated event: Youth Camp 2026', timestamp: '2026-07-19T14:32:00Z' },
  { id: 'al3', action: 'DELETE', resource: 'notices', user: 'Ps. Bishal Rai', details: 'Deleted notice: Old announcement', timestamp: '2026-07-18T11:00:00Z' },
  { id: 'al4', action: 'LOGIN', resource: 'auth', user: 'admin@gracenepal.org', details: 'Admin login from Kathmandu', timestamp: '2026-07-18T08:00:00Z' },
]

/** Returns mock data for a given URL path, or null if no match. */
export function getMockResponse(method: string, url: string, data?: any): any {
  const path = url.replace(/^\/api/, '').replace(/\?.*$/, '')

  // Auth
  if (method === 'GET' && path === '/auth/me') return MOCK_USER
  if (method === 'POST' && path === '/auth/login') {
    const email = data?.email ?? ''
    const password = data?.password ?? ''
    if (
      (email === 'admin@gracenepal.org' && password === 'admin123') ||
      (email === 'demo@grace.org' && password === 'demo123') ||
      email.includes('@')
    ) {
      return { token: MOCK_TOKEN, user: MOCK_USER }
    }
    return null
  }

  // CRUD resources
  if (method === 'GET' && /^\/sermons\/?(\?|$)/.test(path)) return MOCK_SERMONS
  if (method === 'GET' && /^\/events\/?(\?|$)/.test(path)) return MOCK_EVENTS
  if (method === 'GET' && /^\/members\/?(\?|$)/.test(path)) return MOCK_MEMBERS
  if (method === 'GET' && /^\/users\/?(\?|$)/.test(path)) return MOCK_USERS
  if (method === 'GET' && /^\/ministries\/?(\?|$)/.test(path)) return MOCK_MINISTRIES
  if (method === 'GET' && /^\/leaders\/?(\?|$)/.test(path)) return MOCK_LEADERS
  if (method === 'GET' && /^\/gallery\/?(\?|$)/.test(path)) return MOCK_GALLERY
  if (method === 'GET' && /^\/testimonies/.test(path)) return MOCK_TESTIMONIES
  if (method === 'GET' && /^\/notices\/?(\?|$)/.test(path)) return MOCK_NOTICES
  if (method === 'GET' && /^\/service-times\/?(\?|$)/.test(path)) return MOCK_SERVICE_TIMES
  if (method === 'GET' && /^\/verses\/?(\?|$)/.test(path)) return MOCK_VERSES
  if (method === 'GET' && /^\/campaigns\/?(\?|$)/.test(path)) return MOCK_CAMPAIGNS
  if (method === 'GET' && /^\/blog\/?(\?|$)/.test(path)) return MOCK_BLOG_POSTS
  if (method === 'GET' && /^\/settings\/?(\?|$)/.test(path)) return MOCK_SETTINGS
  if (method === 'GET' && /^\/content-blocks/.test(path)) return MOCK_CONTENT_BLOCKS
  if (method === 'GET' && /^\/prayer-requests/.test(path)) return MOCK_PRAYER_REQUESTS
  if (method === 'GET' && /^\/donations/.test(path)) return MOCK_DONATIONS
  if (method === 'GET' && /^\/attendance/.test(path)) return MOCK_ATTENDANCE
  if (method === 'GET' && /^\/audit-log/.test(path)) return MOCK_AUDIT_LOG
  if (method === 'GET' && /^\/reports\/giving-summary/.test(path)) return MOCK_GIVING_SUMMARY
  if (method === 'GET' && /^\/reports\/people-summary/.test(path)) return MOCK_PEOPLE_SUMMARY
  if (method === 'GET' && /^\/(groups|groups\/)/.test(path)) return []
  if (method === 'GET' && /^\/(funds|pledges|offerings|rsvps|volunteers|broadcasts|forms|images|team|services|portfolio|contact-info|contact-messages|newsletter|people|member-applications|todos|households|tags)/.test(path)) return []
  if (method === 'GET' && /^\/settings\/sections/.test(path)) return {}
  if (method === 'GET' && /^\/dashboard\/stats/.test(path)) return {
    sermons: MOCK_SERMONS.length, events: MOCK_EVENTS.length,
    members: MOCK_MEMBERS.length, users: MOCK_USERS.length,
  }

  // Write operations — return success stub
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return { success: true, id: `mock_${Date.now()}`, ...data }
  }

  return []
}
