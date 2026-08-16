/**
 * Event cluster. One page, large keyword block.
 *
 * There is no events table, so this page explains what Christian events in
 * Nepal are and how to find out about them — it never implies a listing.
 */
import type { Topic } from '../topics';

export const EVENT_TOPICS: Topic[] = [
  {
    slug: 'events',
    cluster: 'event',
    h1: 'Christian Events in Nepal',
    metaTitle: 'Christian Events in Nepal: A Guide to Church Events',
    metaDescription:
      'Christmas and Easter services, church anniversaries, conferences, worship nights and youth camps in Nepal — what each one is, and how to find out what is on.',
    lede: 'Christian events in Nepal run from the weekly Saturday worship service to Christmas and Easter gatherings, church anniversaries, conferences, worship nights and school-holiday youth camps — almost all organised by individual congregations, which is why the church itself is the best place to ask what is coming up.',
    sections: [
      {
        h2: 'Weekly worship comes first — and it is on Saturday',
        body: [
          'Most churches in Nepal hold their main worship service on Saturday, not Sunday, because Saturday is Nepal’s weekly holiday. Nepal moved to a two-day Saturday–Sunday weekend in April 2026, so some churches added a Sunday service, but Saturday morning remains the main gathering.',
          'That shapes the calendar. Special church events in Nepal — anniversaries, conferences, camps, worship nights — are usually held on a Saturday or across a run of public holidays, because that is when people can travel and attend.',
          'A weekly service happens whether or not anything is planned. An event is announced in advance, often brings guest speakers or visiting worship teams, runs longer, usually ends with a shared meal, and may draw several congregations together rather than one.',
        ],
      },
      {
        h2: 'Christmas and Easter',
        body: [
          'Christmas is the largest event in the Nepali Christian calendar. Christmas Day is a public holiday in Nepal, so congregations can gather during the day on 25 December, and it is the Christian festival in Nepal most visible outside the church.',
          'Formats vary: carol singing, items from the choir or worship team, a play by the children, a longer message and food afterwards. Larger congregations in Kathmandu and Lalitpur sometimes run more than one Christmas gathering.',
          'Easter is the other major date, often marked from Good Friday onward and sometimes with an early-morning gathering. Since Sunday became a rest day in April 2026, an Easter Sunday service is easier to arrange than it once was, though many churches still centre the weekend on their Saturday service.',
          'If you are new to Nepal and want a Christmas or Easter service to attend, any city with a Christian community will have one — Kathmandu, Lalitpur, Pokhara, Chitwan, Butwal, Biratnagar, Dharan. Ask the church for its time; there is no standard hour.',
        ],
      },
      {
        h2: 'Church anniversaries, baptisms and congregation milestones',
        body: [
          'A church anniversary is a genuinely significant occasion for a Nepali congregation, and one a visitor is often invited to. The church marks the date it was founded with a full programme rather than a service hour: invited speakers, worship items from several groups, testimonies from long-standing members, and a meal for everyone present.',
          'If you have been invited, plan for several hours rather than one, and expect food to be part of it. Practice varies — some congregations meet in buildings where shoes are left at the door. Whoever invited you is the right person to ask.',
          'Baptisms are another milestone the congregation gathers for, often several people at once, at a river or in a baptismal tank. Weddings, dedications of children and farewells follow the same shape: congregation occasions rather than public ones, which you attend because someone invited you.',
        ],
      },
      {
        h2: 'Conferences, seminars and Bible teaching events',
        body: [
          'A Christian conference in Nepal is typically a multi-session teaching event run by one church or by several together, compressed into a Saturday or spread across public holidays — a Bible conference on one book or theme, leadership and pastoral training, or a women’s or men’s gathering.',
          'A Christian seminar in Nepal is the shorter form: a day or an afternoon on one practical subject such as teaching children, counselling or church music. Sessions are normally in Nepali, though events in Kathmandu are sometimes held in English or with translation.',
          'Churches around Pokhara, Chitwan, Butwal, Biratnagar and Dharan often host events for their own region rather than sending everyone to Kathmandu. Registration, where there is any, goes through your own church; there is generally no central booking system.',
        ],
      },
      {
        h2: 'Worship nights and Christian music',
        body: [
          'A worship night in Nepal is an evening given over to extended sung worship, with less preaching than a normal service and more music — often several teams taking turns, sometimes teams from different churches sharing one evening. They are held in a church building or, for larger gatherings, a hired hall.',
          'Christian music in Nepal is largely Nepali-language: locally written worship songs, choir arrangements and youth bands alongside translated hymns, and some congregations publish theirs online. Around Christmas, carol services and music evenings are the most common form.',
          'Some urban congregations hold a worship night regularly; for many smaller churches it is occasional. There is no fixed circuit, so asking a church directly beats waiting for something to be advertised.',
        ],
      },
      {
        h2: 'Youth camps and children’s programmes',
        body: [
          'Youth camps commonly run during school holidays, when students are free and travel is practical. A camp is usually residential, lasts a few days, and mixes Bible teaching with games, sport and music at a campsite or a church in another town — churches in the Kathmandu valley sometimes take their youth to Chitwan or Pokhara.',
          'Children’s programmes follow the same holiday rhythm in shorter form: daytime sessions over several days in the church building, with songs, stories, crafts and activities, run by one congregation for its own children and their friends.',
          'Both are arranged through the church rather than booked independently, so registration goes through the congregation and a modest fee may cover food and transport. If your own church is not running a camp, ask anyway — churches often send their youth to one another congregation is hosting.',
        ],
      },
      {
        h2: 'How to find out what is happening',
        body: [
          'The individual church is the best and often the only reliable source; there is no national calendar of Christian events in Nepal. Nepal’s constitution protects the freedom to practise religion while prohibiting proselytising and conversion, so events are generally organised as gatherings for the existing Christian community and their invited guests rather than as public campaigns.',
          'In practice there are four routes: the noticeboard inside the church, the announcements at the end of the Saturday service, the church’s own website or social page, and word of mouth within the congregation. If you are new to a city, contact one church and ask — congregations know what neighbouring churches are planning.',
          'Church Nepal is a directory of churches, new and still growing. It lists congregations with their locations and contact details across Kathmandu, Lalitpur, Pokhara, Chitwan, Biratnagar, Dharan, Butwal and elsewhere, so you can find one near you and ask directly. It does not yet carry an events calendar, and we would rather say so than show a listing that is not real.',
          'Nepal’s official calendar is Bikram Sambat and the Nepali new year falls in April, so a notice is sometimes dated in BS, though church dates follow the Christian calendar and the public holidays.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Where can I find Christian events in Nepal?',
        a: 'The most reliable way to find Christian events in Nepal is to ask a local church directly, because there is no national events calendar and most events are announced within congregations. Church noticeboards, Saturday service announcements, a church’s own website and word of mouth are the usual channels. Church Nepal lists churches with contact details but does not yet run an events listing.',
      },
      {
        q: 'Is there a Christmas service in Kathmandu?',
        a: 'Yes — churches in Kathmandu hold Christmas services, and Christmas Day is a public holiday in Nepal, so gatherings can be held during the day on 25 December. Times are set by each congregation, so contact a specific church rather than assuming a standard hour.',
      },
      {
        q: 'Are church events in Nepal open to visitors?',
        a: 'Weekly worship services and most Christmas and Easter gatherings are open to visitors, while anniversaries, baptisms and weddings are congregation occasions you would normally attend on an invitation. Nobody is turned away for being new, and conferences and camps usually need registration through a church.',
      },
      {
        q: 'When do churches in Nepal meet?',
        a: 'Most churches in Nepal hold their main worship service on Saturday, not Sunday, because Saturday is Nepal’s weekly holiday. Nepal moved to a two-day Saturday–Sunday weekend in April 2026 and some churches added a Sunday service, but Saturday morning remains the main gathering. Special events follow the same pattern.',
      },
      {
        q: 'Can foreigners attend Christian events in Nepal?',
        a: 'Yes, foreigners can attend Christian worship services and events in Nepal, and visitors are common in city congregations. Services are usually in Nepali, though some churches in Kathmandu hold English services or provide translation. Nepal’s constitution protects religious practice but prohibits proselytising and conversion, so events are gatherings for the Christian community and their guests rather than public campaigns.',
      },
      {
        q: 'What happens at a church anniversary in Nepal?',
        a: 'A church anniversary in Nepal is a full-day programme marking the founding of the congregation, with invited speakers, worship items from several groups, testimonies from long-standing members and a shared meal. It runs longer than a normal service and often draws guests from other churches, so plan for several hours.',
      },
      {
        q: 'Are there Christian conferences and seminars in Nepal?',
        a: 'Yes — churches in Nepal run Bible conferences, leadership and pastoral training, and shorter seminars on subjects such as teaching children, counselling and church music. They are usually held on a Saturday or across public holidays and are mostly in Nepali. Registration normally goes through your own church.',
      },
      {
        q: 'Do churches in Nepal hold worship nights or Christian music events?',
        a: 'Yes, worship nights are held by churches in Nepal — an evening of extended sung worship with several worship teams and less preaching than a normal service. Christian music in Nepal is largely Nepali-language, with locally written songs, choirs and youth bands, and music evenings are most common around Christmas.',
      },
    ],
  },
];
