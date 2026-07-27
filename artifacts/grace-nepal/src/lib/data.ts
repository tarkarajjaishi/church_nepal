// Shared mock content for the church website.

export const images = {
  hero: "https://images.unsplash.com/photo-1600288480699-0b0d8a456dd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
  worship1: "https://images.unsplash.com/photo-1653133672754-82025e7e9074?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  worship2: "https://images.unsplash.com/photo-1770097286875-0cbf4ca2f8c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  worship3: "https://images.unsplash.com/photo-1769755410067-a1ea14b0602a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  praise: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  band: "https://images.unsplash.com/photo-1522158637959-30385a09e0da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  crowd: "https://images.unsplash.com/photo-1528828085966-aff4e01c5f2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  mountains: "https://images.unsplash.com/photo-1645788421204-0e4eb1d2a518?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
  village: "https://images.unsplash.com/photo-1721165578169-390db9ee2fba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  pastor: "https://images.unsplash.com/photo-1647456605091-ab3e1b4baf8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  pastor2: "https://images.unsplash.com/photo-1582115422763-db7417d14db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  pastor3: "https://images.unsplash.com/photo-1753455598828-482a9b029ed3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  study: "https://images.unsplash.com/photo-1663162550932-f67b561e656f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  study2: "https://images.unsplash.com/photo-1609234656388-0ff363383899?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  children: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  children2: "https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  bible: "https://images.unsplash.com/photo-1703292227601-d57b5b845c14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  cross: "https://images.unsplash.com/photo-1585995579097-5b23b5e06c5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
};

export interface ServiceTime {
  id: string;
  name: string;
  nameNe: string;
  day: string;
  time: string;
  icon: string;
}

export const serviceTimes: ServiceTime[] = [
  { id: "sun", name: "Sunday Worship", nameNe: "आइतबार आराधना", day: "Sunday", time: "10:00 AM", icon: "Church" },
  { id: "morn", name: "Morning Prayer", nameNe: "बिहानी प्रार्थना", day: "Daily", time: "6:00 AM", icon: "Sunrise" },
  { id: "youth", name: "Youth Fellowship", nameNe: "युवा सङ्गति", day: "Friday", time: "5:00 PM", icon: "Users" },
  { id: "bible", name: "Bible Study", nameNe: "बाइबल अध्ययन", day: "Wednesday", time: "7:00 PM", icon: "BookOpen" },
  { id: "women", name: "Women's Fellowship", nameNe: "महिला सङ्गति", day: "Tuesday", time: "2:00 PM", icon: "Flower2" },
  { id: "men", name: "Men's Fellowship", nameNe: "पुरुष सङ्गति", day: "Saturday", time: "4:00 PM", icon: "HandHelping" },
  { id: "kids", name: "Children Ministry", nameNe: "बाल सेवा", day: "Sunday", time: "10:00 AM", icon: "Baby" },
];

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  duration: string;
  series: string;
  topic: string;
  image: string;
  description: string;
  videoUrl?: string;
  audioUrl?: string;
  enabled?: boolean;
}

export const sermons: Sermon[] = [
  { id: "s1", title: "The Anchor of Hope", speaker: "Ps. Bishal Rai", date: "July 6, 2026", duration: "42 min", series: "Living Hope", topic: "Hope", image: images.worship1, description: "In a shifting world, our hope is anchored in the risen Christ. Discover what it means to hold fast.", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", enabled: true },
  { id: "s2", title: "Walking in Grace", speaker: "Ps. Bishal Rai", date: "June 29, 2026", duration: "38 min", series: "Grace Upon Grace", topic: "Grace", image: images.band, description: "Grace is not just how we are saved, but how we live each day. A message on daily dependence on God.", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", enabled: true },
  { id: "s3", title: "A Heart for Prayer", speaker: "Elder Suman Tamang", date: "June 22, 2026", duration: "35 min", series: "Foundations", topic: "Prayer", image: images.study, description: "Learn how a life of prayer transforms the ordinary into the extraordinary.", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", enabled: true },
  { id: "s4", title: "Light on the Mountain", speaker: "Ps. Bishal Rai", date: "June 15, 2026", duration: "45 min", series: "Living Hope", topic: "Faith", image: images.mountains, description: "The gospel is reaching every village of Nepal. A stirring call to be light where God has placed us.", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", enabled: true },
  { id: "s5", title: "Love in Action", speaker: "Ps. Anita Gurung", date: "June 8, 2026", duration: "40 min", series: "The Way of Love", topic: "Love", image: images.crowd, description: "True love serves. A challenge to move from good intentions to faithful action.", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", enabled: true },
  { id: "s6", title: "Rooted and Built Up", speaker: "Elder Suman Tamang", date: "June 1, 2026", duration: "37 min", series: "Foundations", topic: "Discipleship", image: images.study2, description: "Spiritual maturity grows from being deeply rooted in Christ. A message on discipleship.", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", enabled: true },
];

export interface Ministry {
  id: string;
  name: string;
  nameNe: string;
  description: string;
  leader: string;
  meeting: string;
  image: string;
  icon: string;
}

export const ministries: Ministry[] = [
  { id: "children", name: "Children Ministry", nameNe: "बाल सेवा", description: "Nurturing young hearts with the love of Jesus through stories, songs and play.", leader: "Sister Maya Lama", meeting: "Sunday 10:00 AM", image: images.children, icon: "Baby" },
  { id: "youth", name: "Youth Ministry", nameNe: "युवा सेवा", description: "Empowering the next generation to live boldly for Christ in Nepal.", leader: "Bro. Prakash Rai", meeting: "Friday 5:00 PM", image: images.children2, icon: "Flame" },
  { id: "women", name: "Women Ministry", nameNe: "महिला सेवा", description: "A sisterhood growing together in faith, prayer and fellowship.", leader: "Ps. Anita Gurung", meeting: "Tuesday 2:00 PM", image: images.study, icon: "Flower2" },
  { id: "men", name: "Men Ministry", nameNe: "पुरुष सेवा", description: "Building godly men who lead their families and community with integrity.", leader: "Elder Suman Tamang", meeting: "Saturday 4:00 PM", image: images.study2, icon: "HandHelping" },
  { id: "worship", name: "Worship Team", nameNe: "आराधना समूह", description: "Leading the congregation into the presence of God through music.", leader: "Bro. David Thapa", meeting: "Thursday 6:00 PM", image: images.band, icon: "Music" },
  { id: "prayer", name: "Prayer Ministry", nameNe: "प्रार्थना सेवा", description: "Interceding for our church, city and nation day and night.", leader: "Sister Grace Magar", meeting: "Daily 6:00 AM", image: images.worship3, icon: "HandHeart" },
  { id: "outreach", name: "Outreach Ministry", nameNe: "प्रचार सेवा", description: "Sharing the good news and serving villages across Nepal.", leader: "Bro. Samuel Rai", meeting: "Monthly", image: images.village, icon: "Handshake" },
  { id: "media", name: "Media Ministry", nameNe: "मिडिया सेवा", description: "Telling God's story through sound, video and live streaming.", leader: "Bro. John Sherpa", meeting: "As needed", image: images.praise, icon: "Video" },
  { id: "bibleschool", name: "Bible School", nameNe: "बाइबल विद्यालय", description: "Equipping believers with a deep foundation in God's Word.", leader: "Ps. Bishal Rai", meeting: "Wednesday 7:00 PM", image: images.bible, icon: "GraduationCap" },
  { id: "mission", name: "Mission Ministry", nameNe: "मिसन सेवा", description: "Taking the gospel to unreached people groups in the Himalayas.", leader: "Ps. Bishal Rai", meeting: "Quarterly", image: images.mountains, icon: "Globe" },
];

export interface ChurchEvent {
  id: string;
  title: string;
  date: string; // ISO
  displayDate: string;
  time: string;
  location: string;
  image: string;
  description: string;
  capacity?: number;
}

export const events: ChurchEvent[] = [
  { id: "e1", title: "Sunday Celebration Service", date: "2026-07-19T10:00:00", displayDate: "July 19, 2026", time: "10:00 AM", location: "Main Sanctuary, Kathmandu", image: images.worship2, description: "Join us for a Spirit-filled morning of worship, the Word, and community." },
  { id: "e2", title: "Youth Summer Camp", date: "2026-08-02T09:00:00", displayDate: "Aug 2–5, 2026", time: "9:00 AM", location: "Nagarkot Retreat Centre", image: images.children2, description: "Four days of adventure, worship and life-changing encounters with God." },
  { id: "e3", title: "Community Baptism Service", date: "2026-08-16T11:00:00", displayDate: "Aug 16, 2026", time: "11:00 AM", location: "Bagmati Riverside", image: images.worship3, description: "Celebrating new life in Christ as believers take the step of baptism." },
  { id: "e4", title: "Annual Mission Conference", date: "2026-09-05T09:30:00", displayDate: "Sep 5–6, 2026", time: "9:30 AM", location: "Main Sanctuary, Kathmandu", image: images.mountains, description: "Two days focused on God's heart for the nations, with guest speakers." },
];

export interface Leader {
  id: string;
  name: string;
  role: string;
  category: string;
  image: string;
  bio: string;
}

export const leaders: Leader[] = [
  { id: "l1", name: "Ps. Bishal Rai", role: "Senior Pastor", category: "Pastors", image: images.pastor, bio: "Serving the church for over 18 years with a heart for discipleship and mission across Nepal." },
  { id: "l2", name: "Ps. Anita Gurung", role: "Associate Pastor", category: "Pastors", image: images.pastor3, bio: "Leads women's ministry and pastoral care with warmth and wisdom." },
  { id: "l3", name: "Elder Suman Tamang", role: "Elder", category: "Elders", image: images.pastor2, bio: "Oversees teaching and Bible school, grounding the church in God's Word." },
  { id: "l4", name: "Grace Magar", role: "Prayer Coordinator", category: "Deacons", image: images.worship1, bio: "Mobilises the church in prayer and intercession day and night." },
  { id: "l5", name: "David Thapa", role: "Worship Leader", category: "Ministry Leaders", image: images.band, bio: "Leads the worship team and cultivates a culture of praise." },
  { id: "l6", name: "Prakash Rai", role: "Youth Leader", category: "Ministry Leaders", image: images.children2, bio: "Passionate about raising up the next generation of leaders." },
];

export interface Testimony {
  id: string;
  name: string;
  role: string;
  quote: string;
  image: string;
  rating: number;
}

export const testimonies: Testimony[] = [
  { id: "t1", name: "Sunita Shrestha", role: "Member since 2019", quote: "This church became my family. Through the hardest season of my life, they prayed with me and never left my side.", image: images.study, rating: 5 },
  { id: "t2", name: "Ramesh Karki", role: "Youth volunteer", quote: "I met Jesus at the youth camp. Today I serve the very ministry that changed my life forever.", image: images.pastor2, rating: 5 },
  { id: "t3", name: "Kabita Rai", role: "Women's fellowship", quote: "The teaching is deep yet practical. I have grown more in two years here than I ever imagined possible.", image: images.worship3, rating: 5 },
];

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
}

export const gallery: GalleryItem[] = [
  { id: "g1", title: "Christmas Celebration", category: "Christmas", image: images.crowd },
  { id: "g2", title: "Youth Camp 2025", category: "Youth", image: images.children2 },
  { id: "g3", title: "Baptism Service", category: "Baptism", image: images.worship3 },
  { id: "g4", title: "Mission Conference", category: "Conference", image: images.mountains },
  { id: "g5", title: "Sunday Worship", category: "Worship", image: images.worship1 },
  { id: "g6", title: "Village Outreach", category: "Mission", image: images.village },
  { id: "g7", title: "Children's Day", category: "Youth", image: images.children },
  { id: "g8", title: "Prayer Night", category: "Worship", image: images.worship2 },
  { id: "g9", title: "Easter Sunrise", category: "Christmas", image: images.praise },
];

export const galleryCategories = ["All", "Christmas", "Youth", "Conference", "Baptism", "Worship", "Mission"];

export const stats = [
  { id: "st1", value: 850, suffix: "+", label: "Members" },
  { id: "st2", value: 12, suffix: "", label: "Ministries" },
  { id: "st3", value: 18, suffix: "", label: "Years Serving" },
  { id: "st4", value: 24, suffix: "", label: "Villages Reached" },
];

export const campaigns = [
  { id: "c1", title: "Building Fund", raised: 720000, goal: 1200000 },
  { id: "c2", title: "Youth Camp Scholarships", raised: 145000, goal: 200000 },
  { id: "c3", title: "Village Mission Trip", raised: 88000, goal: 150000 },
];

export const verses = [
  { text: "For God so loved the world that he gave his one and only Son.", ref: "John 3:16", ne: "किनभने परमेश्वरले संसारलाई यस्तो प्रेम गर्नुभयो, कि उहाँले आफ्ना एकमात्र पुत्र दिनुभयो।" },
  { text: "The Lord is my shepherd, I lack nothing.", ref: "Psalm 23:1", ne: "परमप्रभु मेरा गोठालो हुनुहुन्छ, मलाई केही कुराको अभाव हुनेछैन।" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13", ne: "मलाई शक्ति दिनुहुने ख्रीष्टद्वारा म सबै कुरा गर्न सक्छु।" },
];

export interface Notice {
  id: string;
  title: string;
  date: string;
  category: string;
  text: string;
  urgent?: boolean;
}

export const notices: Notice[] = [
  { id: "n1", title: "Special Fasting & Prayer Week", date: "July 21–27, 2026", category: "Prayer", text: "Join the whole church for a week of fasting and prayer as we seek God's direction for the year ahead.", urgent: true },
  { id: "n2", title: "New Members Class Begins", date: "August 3, 2026", category: "Membership", text: "A 4-week class for anyone wishing to become a member of Grace Nepal Church. Register at the welcome desk." },
  { id: "n3", title: "Choir Auditions Open", date: "July 18, 2026", category: "Worship", text: "The worship team is welcoming new voices and musicians. Auditions after the Sunday service." },
  { id: "n4", title: "Relief Fund for Flood Victims", date: "Ongoing", category: "Outreach", text: "We are collecting food and supplies for families affected by recent flooding in eastern Nepal." },
];

export interface Member {
  id: string;
  name: string;
  role: string;
  since: string;
  image: string;
}

export const members: Member[] = [
  { id: "m1", name: "Sunita Shrestha", role: "Worship Volunteer", since: "2019", image: images.study },
  { id: "m2", name: "Ramesh Karki", role: "Youth Mentor", since: "2020", image: images.pastor2 },
  { id: "m3", name: "Kabita Rai", role: "Women's Fellowship", since: "2018", image: images.worship3 },
  { id: "m4", name: "David Thapa", role: "Musician", since: "2017", image: images.band },
  { id: "m5", name: "Grace Magar", role: "Intercessor", since: "2015", image: images.worship1 },
  { id: "m6", name: "Prakash Rai", role: "Youth Leader", since: "2016", image: images.children2 },
  { id: "m7", name: "Maya Lama", role: "Children's Teacher", since: "2021", image: images.children },
  { id: "m8", name: "Samuel Rai", role: "Outreach Team", since: "2019", image: images.village },
];

export interface Belief {
  id: string;
  icon: string;
  title: string;
  titleNe: string;
  text: string;
  textNe: string;
}

// Plain-language "What We Believe" — no jargon, visitor-friendly.
export const beliefs: Belief[] = [
  { id: "b1", icon: "BookOpen", title: "The Bible", titleNe: "बाइबल", text: "God's Word is our guide for life and faith — trustworthy, living, and for everyone.", textNe: "परमेश्वरको वचन जीवन र विश्वासको मार्गदर्शक हो — भरपर्दो र जीवित।" },
  { id: "b2", icon: "HandHeart", title: "God's Love", titleNe: "परमेश्वरको प्रेम", text: "We believe in one loving God who created you, knows you, and wants a relationship with you.", textNe: "हामी एक प्रेमी परमेश्वरमा विश्वास गर्छौं जसले तपाईंलाई सृष्टि गर्नुभयो र चिन्नुहुन्छ।" },
  { id: "b3", icon: "Cross", title: "Jesus", titleNe: "येशू", text: "Jesus lived, died, and rose again so that anyone — no matter their past — can be made new.", textNe: "येशू बाँच्नुभयो, मर्नुभयो र फेरि जीवित हुनुभयो ताकि जो कोही नयाँ बन्न सकोस्।" },
  { id: "b4", icon: "Users", title: "Community", titleNe: "समुदाय", text: "Faith grows in family. We do life together — welcoming all, from every village and background.", textNe: "विश्वास परिवारमा बढ्छ। हामी सँगै जीवन बिताउँछौं — सबैलाई स्वागत गर्दै।" },
  { id: "b5", icon: "Globe", title: "Mission", titleNe: "मिसन", text: "We're called to share hope and serve our neighbours across Nepal with practical love.", textNe: "हामी आशा बाँड्न र नेपालभरि छिमेकीहरूलाई व्यावहारिक प्रेमले सेवा गर्न बोलाइएका छौं।" },
  { id: "b6", icon: "Sparkles", title: "New Life", titleNe: "नयाँ जीवन", text: "God's grace is a free gift. There's nothing to earn — just come as you are and be transformed.", textNe: "परमेश्वरको अनुग्रह निःशुल्क उपहार हो। जस्तो हुनुहुन्छ त्यस्तै आउनुहोस्।" },
];

export interface ExpectItem {
  id: string;
  icon: string;
  title: string;
  titleNe: string;
  text: string;
  textNe: string;
}

// "What to Expect" — answers a first-time visitor's real questions.
export const whatToExpect: ExpectItem[] = [
  { id: "x1", icon: "Clock", title: "How long is the service?", titleNe: "सेवा कति लामो हुन्छ?", text: "Around 90 minutes — worship, a practical Bible message, and time to connect over tea afterwards.", textNe: "लगभग ९० मिनेट — आराधना, व्यावहारिक बाइबल सन्देश, र पछि चिया खाँदै भेटघाट।" },
  { id: "x2", icon: "Shirt", title: "What should I wear?", titleNe: "मैले के लगाउने?", text: "Come as you are. You'll see everything from traditional kurta to jeans — there's no dress code here.", textNe: "जस्तो हुनुहुन्छ त्यस्तै आउनुहोस्। कुर्ता देखि जिन्स सम्म — यहाँ कुनै पोशाक नियम छैन।" },
  { id: "x3", icon: "Baby", title: "What about my kids?", titleNe: "मेरा बच्चाहरूको के हुन्छ?", text: "Safe, fun children's ministry runs during the service, with trained volunteers and easy check-in.", textNe: "सेवाको समयमा सुरक्षित, रमाइलो बाल सेवा चल्छ, तालिम प्राप्त स्वयंसेवकहरूसँग।" },
  { id: "x4", icon: "Music", title: "What is worship like?", titleNe: "आराधना कस्तो हुन्छ?", text: "Heartfelt, joyful singing in Nepali and English, led by our worship team — clap, sing, or simply soak it in.", textNe: "नेपाली र अङ्ग्रेजीमा हृदयस्पर्शी, आनन्दमय गायन, हाम्रो आराधना समूहद्वारा नेतृत्व।" },
  { id: "x5", icon: "Car", title: "Where do I park?", titleNe: "गाडी कहाँ राख्ने?", text: "Free parking is available beside the church, and we're a short walk from the Baneshwor bus stop.", textNe: "मण्डली छेउमा निःशुल्क पार्किङ उपलब्ध छ, र बानेश्वर बस स्टपबाट छोटो पैदल दूरीमा।" },
  { id: "x6", icon: "Coffee", title: "Will I be singled out?", titleNe: "मलाई अलग गरिन्छ?", text: "Never. There's no pressure to give or stand up. Come, relax, and experience God's family at your own pace.", textNe: "कहिल्यै होइन। दान वा उठ्ने कुनै दबाब छैन। आउनुहोस्, आराम गर्नुहोस्।" },
];

// Simple step-by-step for first-time visitors.
export const visitSteps = [
  { id: "v1", step: "1", title: "Arrive a little early", titleNe: "केही चाँडो आइपुग्नुहोस्", text: "Come around 9:45 AM. A friendly welcome team will greet you at the door and help you find a seat.", textNe: "बिहान ९:४५ तिर आउनुहोस्। स्वागत टोलीले तपाईंलाई ढोकामा भेट्नेछ।" },
  { id: "v2", step: "2", title: "Check in your kids", titleNe: "बच्चाहरू चेक-इन गर्नुहोस्", text: "Drop your children at the safe, fun children's ministry — they'll love it, and you can worship at ease.", textNe: "बच्चाहरूलाई सुरक्षित बाल सेवामा छोड्नुहोस्।" },
  { id: "v3", step: "3", title: "Enjoy the service", titleNe: "सेवाको आनन्द लिनुहोस्", text: "Worship, hear an encouraging message from the Bible, and simply be — no pressure, no expectations.", textNe: "आराधना गर्नुहोस्, बाइबलबाट उत्साहजनक सन्देश सुन्नुहोस्।" },
  { id: "v4", step: "4", title: "Stay for tea", titleNe: "चियाको लागि बस्नुहोस्", text: "Grab a cup of tea afterwards and meet the family. We'd love to say hello and answer any questions.", textNe: "पछि एक कप चिया लिनुहोस् र परिवारलाई भेट्नुहोस्।" },
];

export const faqs = [
  { q: "What time are your Sunday services?", a: "Our main worship service begins every Sunday at 10:00 AM. Children's ministry runs at the same time." },
  { q: "Do you have services in English and Nepali?", a: "Our services are primarily in Nepali with English translation available. Use the language toggle on this site anytime." },
  { q: "I'm new — what should I expect?", a: "Come as you are! Expect a warm welcome, heartfelt worship, and a practical message from the Bible. Visit the New Here page for more." },
  { q: "How can I get involved?", a: "Join a ministry, attend a fellowship group, or sign up to volunteer. Our team would love to help you find your place." },
  { q: "How can I request prayer?", a: "Use our confidential Prayer Request page any time. Our prayer team commits to praying over every request." },
];
