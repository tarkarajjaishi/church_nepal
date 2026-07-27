/**
 * Mock data for PUBLIC API endpoints — used when the real Rust backend
 * is unreachable (dev / demo mode). Mirrors the shape the public pages expect.
 */

export const PUBLIC_MOCK_SERMONS = [
  { id: "s1", title: "The Anchor of Hope", speaker: "Ps. Bishal Rai", date: "2026-07-20", duration: "42 min", series: "Living Hope", topic: "Hope", enabled: true, image: "https://images.unsplash.com/photo-1653133672754-82025e7e9074?w=600&auto=format&fit=crop", description: "In a shifting world, our hope is anchored in the risen Christ. Discover what it means to hold fast to an eternal promise.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: "" },
  { id: "s2", title: "Walking in Grace", speaker: "Ps. Bishal Rai", date: "2026-07-13", duration: "38 min", series: "Grace Upon Grace", topic: "Grace", enabled: true, image: "https://images.unsplash.com/photo-1522158637959-30385a09e0da?w=600&auto=format&fit=crop", description: "Grace is not just how we are saved, it is how we live each day. A deeper look at Ephesians 2.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: "" },
  { id: "s3", title: "A Heart for Prayer", speaker: "Elder Suman Tamang", date: "2026-07-06", duration: "35 min", series: "Spiritual Disciplines", topic: "Prayer", enabled: true, image: "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=600&auto=format&fit=crop", description: "Prayer is the lifeline of the believer. Learn how to cultivate a vibrant, consistent prayer life.", videoUrl: "", audioUrl: "https://example.com/audio/s3.mp3" },
  { id: "s4", title: "Faith Over Fear", speaker: "Ps. Bishal Rai", date: "2026-06-29", duration: "44 min", series: "Living Hope", topic: "Faith", enabled: true, image: "https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?w=600&auto=format&fit=crop", description: "When fear grips our hearts, faith in the sovereignty of God gives us the courage to press forward.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: "" },
  { id: "s5", title: "The Power of Community", speaker: "Ps. Pratima Gurung", date: "2026-06-22", duration: "40 min", series: "Together in Christ", topic: "Community", enabled: true, image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop", description: "God did not design us to walk alone. Explore the beauty and necessity of Christian community.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: "" },
  { id: "s6", title: "Forgiveness Transforms", speaker: "Elder Suman Tamang", date: "2026-06-15", duration: "36 min", series: "Grace Upon Grace", topic: "Forgiveness", enabled: true, image: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=600&auto=format&fit=crop", description: "Unforgiveness chains us to the past. Discover how divine forgiveness can set us — and others — free.", videoUrl: "", audioUrl: "https://example.com/audio/s6.mp3" },
  { id: "s7", title: "Rooted in the Word", speaker: "Ps. Bishal Rai", date: "2026-06-08", duration: "45 min", series: "Spiritual Disciplines", topic: "Bible Study", enabled: true, image: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=600&auto=format&fit=crop", description: "A tree with deep roots weathers any storm. How daily engagement with Scripture anchors the soul.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: "" },
  { id: "s8", title: "The Great Commission", speaker: "Ps. Bishal Rai", date: "2026-06-01", duration: "48 min", series: "Mission Nepal", topic: "Evangelism", enabled: true, image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop", description: "The final command of Christ is still our first priority. Exploring what it means to reach every village.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: "" },
  { id: "s9", title: "Worship in Spirit and Truth", speaker: "Ps. Pratima Gurung", date: "2026-05-25", duration: "33 min", series: "Together in Christ", topic: "Worship", enabled: true, image: "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&auto=format&fit=crop", description: "True worship is not limited to Sunday mornings. It is a lifestyle offered to God in every moment.", videoUrl: "", audioUrl: "https://example.com/audio/s9.mp3" },
  { id: "s10", title: "Generosity as Worship", speaker: "Elder Suman Tamang", date: "2026-05-18", duration: "37 min", series: "Grace Upon Grace", topic: "Giving", enabled: true, image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&auto=format&fit=crop", description: "Biblical generosity is an act of worship reflecting the heart of a God who gave His only Son.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: "" },
  { id: "s11", title: "Healing in His Wings", speaker: "Ps. Bishal Rai", date: "2026-05-11", duration: "41 min", series: "Living Hope", topic: "Healing", enabled: true, image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&auto=format&fit=crop", description: "From Malachi to the Gospels, the heart of God is always toward healing — body, soul, and spirit.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", audioUrl: "" },
  { id: "s12", title: "The Fruit of the Spirit", speaker: "Ps. Pratima Gurung", date: "2026-05-04", duration: "39 min", series: "Spiritual Disciplines", topic: "Holy Spirit", enabled: true, image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop", description: "Love, joy, peace — not just virtues we pursue, but fruit produced by the Holy Spirit living in us.", videoUrl: "", audioUrl: "https://example.com/audio/s12.mp3" },
]

export const PUBLIC_MOCK_EVENTS = [
  { id: "e1", title: "Sunday Worship Service", date: "2026-08-03", displayDate: "Every Sunday", time: "10:00 AM", location: "Main Hall", category: "Worship", image: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=600&auto=format&fit=crop", description: "Join us every Sunday for worship, prayer, and the Word. All are welcome!", enabled: true, rsvpEnabled: false },
  { id: "e2", title: "Youth Camp 2026", date: "2026-08-15", displayDate: "Aug 15-17", time: "7:00 AM", location: "Nagarkot Retreat Centre", category: "Youth", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop", description: "Three days of worship, adventure, and spiritual growth for teens and young adults (ages 14-25).", enabled: true, rsvpEnabled: true },
  { id: "e3", title: "Women's Retreat", date: "2026-08-22", displayDate: "Aug 22-23", time: "8:00 AM", location: "Pokhara Fellowship Hall", category: "Women", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop", description: "A weekend of rest, reflection, and renewal for the women of Grace Nepal.", enabled: true, rsvpEnabled: true },
  { id: "e4", title: "Community Baptism Service", date: "2026-09-05", displayDate: "Sep 5", time: "4:00 PM", location: "Lakeside Park, Pokhara", category: "Sacrament", image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&auto=format&fit=crop", description: "Celebrate with those making a public declaration of faith through water baptism.", enabled: true, rsvpEnabled: false },
  { id: "e5", title: "Annual Mission Conference", date: "2026-09-05", displayDate: "Sep 5-6", time: "9:30 AM", location: "Grace Nepal Church", category: "Mission", image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop", description: "Hear from missionaries across Nepal about the work God is doing in every district.", enabled: true, rsvpEnabled: true },
]

export const PUBLIC_MOCK_TESTIMONIES = [
  { id: "t1", name: "Sunita Shrestha", title: "God restored my family", text: "After years of conflict, God used this church community to bring healing and reconciliation to my home. I am forever grateful.", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop", category: "Family", enabled: true },
  { id: "t2", name: "Ramesh Gurung", title: "Healed from addiction", text: "I came to this church broken and enslaved to alcohol. Through prayer and the love of the congregation, I found freedom in Christ.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop", category: "Healing", enabled: true },
  { id: "t3", name: "Kabita Tamang", title: "A business transformed", text: "When my business was failing, I dedicated it to God. He turned it around — and taught me that true success is serving others.", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop", category: "Provision", enabled: true },
]

export const PUBLIC_MOCK_GALLERY = [
  { id: "g1", title: "Sunday Worship", category: "Worship", image: "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=600&auto=format&fit=crop", enabled: true },
  { id: "g2", title: "Mountain Nepal", category: "Mission", image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop", enabled: true },
  { id: "g3", title: "Youth Fellowship", category: "Youth", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop", enabled: true },
  { id: "g4", title: "Christmas Service", category: "Christmas", image: "https://images.unsplash.com/photo-1482440308425-276ad0f28b19?w=600&auto=format&fit=crop", enabled: true },
  { id: "g5", title: "Baptism Day", category: "Baptism", image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&auto=format&fit=crop", enabled: true },
  { id: "g6", title: "Women's Conference", category: "Conference", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop", enabled: true },
]

/** Returns mock data for a given public API path, or null if no mock exists. */
export function getMockPublicResponse(url: string): unknown {
  const path = url.split("?")[0]

  if (path.includes("/sermons/public") || path.match(/\/sermons\/[a-z0-9]+$/)) {
    if (path.match(/\/sermons\/[^/]+$/) && !path.endsWith("/public")) {
      const id = path.split("/").pop()
      return PUBLIC_MOCK_SERMONS.find((s) => s.id === id) ?? PUBLIC_MOCK_SERMONS[0]
    }
    return {
      data: PUBLIC_MOCK_SERMONS,
      total: PUBLIC_MOCK_SERMONS.length,
      page: 1,
      per_page: PUBLIC_MOCK_SERMONS.length,
      total_pages: 1,
    }
  }

  if (path.includes("/events/public")) {
    return {
      data: PUBLIC_MOCK_EVENTS,
      total: PUBLIC_MOCK_EVENTS.length,
      page: 1,
      per_page: PUBLIC_MOCK_EVENTS.length,
      total_pages: 1,
    }
  }

  if (path.includes("/testimonies")) {
    return { data: PUBLIC_MOCK_TESTIMONIES, total: PUBLIC_MOCK_TESTIMONIES.length }
  }

  if (path.includes("/gallery")) {
    return { data: PUBLIC_MOCK_GALLERY, total: PUBLIC_MOCK_GALLERY.length }
  }

  return null
}
