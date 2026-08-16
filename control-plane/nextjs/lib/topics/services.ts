import type { Topic } from '../topics';

/**
 * Service-cluster topics: the questions a person asks before they walk into a
 * church for the first time — which day, what time, what happens, what to wear.
 *
 * Every one of these must carry the Saturday fact in its own words. Pages
 * elsewhere on the internet assume Sunday and are wrong for Nepal, which is
 * the whole reason these exist. Do not restate SATURDAY_NOTE verbatim — the
 * renderer may show it alongside this prose.
 *
 * No statistics, no named churches, no attendance figures. Nothing here should
 * be a claim we could not defend to someone who lives in Kathmandu.
 */
export const SERVICE_TOPICS: Topic[] = [
  {
    slug: 'worship',
    cluster: 'service',
    h1: 'Christian Worship in Nepal: Service Days, Times and What to Expect',
    metaTitle: 'Worship in Nepal: Church Service Times & What to Expect',
    metaDescription:
      'Churches in Nepal worship mainly on Saturday, not Sunday. What time services start, how long they run, what to wear and what a Nepali service is like.',
    lede: 'Most Christian congregations in Nepal hold their main worship service on Saturday morning, because Saturday — not Sunday — is the country’s weekly day off.',
    sections: [
      {
        h2: 'Which day do churches in Nepal meet?',
        body: [
          'Saturday. This is the single thing most visitors get wrong, and most websites written outside Nepal get wrong with them. Nepal’s working week has long run Sunday through Friday, with Saturday as the weekly holiday, so a church that gathered on Sunday morning would be asking its members to skip work or school. Nepali congregations therefore settled on Saturday as their day of worship, and that is still where the main service sits.',
          'Nepal moved to a two-day Saturday and Sunday weekend in April 2026. Some congregations have used the extra free day to add a second service on Sunday, and a few English-language and international congregations have shifted their emphasis there. But this is recent, it is not universal, and for the great majority of churches the Saturday morning gathering remains the one that everyone attends. If you can only go once, go on Saturday.',
          'Because the change is so new, published service times age quickly. Whatever you read — here or anywhere else — it is worth a phone call or a message before you travel across a city, especially during festival weeks, when many congregations shift or combine services.',
        ],
      },
      {
        h2: 'What time do services start, and how long do they run?',
        body: [
          'Mid-morning is the norm. A common pattern is a service beginning somewhere between nine and eleven, often with a prayer time for those who arrive early and want it. Larger urban churches sometimes run two sittings on the same Saturday morning to fit everyone in, and a handful hold an additional evening service for people whose work makes the morning impossible.',
          'Services are longer than many visitors expect. Two hours is ordinary and longer is not unusual, particularly when there is communion, a baptism, a dedication or visiting speakers. The length is not filler: singing takes a substantial block, several people may pray aloud, someone may give a testimony, notices are read, and the sermon itself often runs well past the twenty minutes a Western visitor might anticipate.',
          'Nobody will mind if you slip out early, and nobody will be surprised if you arrive late — Kathmandu traffic and Nepal’s bus timetables make punctuality a shared struggle. If you want to be there for the start of the singing, aim to arrive ten or fifteen minutes before the stated time.',
        ],
      },
      {
        h2: 'What a Nepali worship service is actually like',
        body: [
          'The singing is the part most first-time visitors remember. Songs are usually in Nepali, led from the front, with words projected or printed, and the accompaniment often mixes a keyboard or guitar with a harmonium and a madal or other hand drum. Many congregations sing standing, some clap, and in a number of churches people raise their hands or dance a little during the faster songs. None of it is compulsory and nobody watches to see whether a visitor joins in.',
          'Prayer is frequently spoken aloud by everyone at once rather than by one person on behalf of the room, which can be startling the first time you hear it. Testimonies — someone standing to describe an answered prayer, a recovery, a job, a reconciliation — are a normal part of the hour. An offering is usually taken; visitors are under no obligation to give and no one tracks who does.',
          'The sermon is typically preached in Nepali, from an open Bible, and referenced verse by verse. In city churches the preacher may pause for an English translator if foreign guests are present, though this depends entirely on the congregation and is not something to assume.',
          'Afterwards, most congregations serve tea. This is not an optional social add-on — for many members it is a large part of why they came, and it is by far the easiest moment for a newcomer to actually meet people.',
        ],
      },
      {
        h2: 'What to wear, and other practical things',
        body: [
          'Dress modestly and you will be fine. Shoulders and knees covered is the safe rule for everyone; many Nepali women wear a kurta surwal or a sari, many men wear a shirt and trousers, and jeans are unremarkable in most urban congregations. Some churches follow the practice of women covering their heads during worship, and if that is the custom you will see it immediately on arrival — a scarf in your bag covers the possibility.',
          'A great many congregations remove shoes at the door, as Nepali households do. Look for the pile of sandals at the entrance and follow it. Smaller fellowships often seat people on mats or carpet on the floor rather than on chairs or benches, frequently with men on one side and women on the other; if you cannot sit cross-legged for two hours, say so and someone will find you a chair without any fuss.',
          'Silence your phone, and ask before photographing people. Nepali Christians are generally hospitable to cameras among friends, but a congregation is not a tourist attraction and some members have good personal reasons for not appearing in photographs that travel onto the internet.',
        ],
      },
      {
        h2: 'Language, and finding a service you can follow',
        body: [
          'The default language of worship in Nepal is Nepali. Alongside that, there are congregations that worship in mother tongues — Nepal Bhasa, Tamang, Magar, Limbu, Sherpa, Tharu and others — usually where a community of speakers is concentrated, and there are congregations in Kathmandu and Lalitpur that hold services in English for foreign residents, students and international staff.',
          'If you do not speak Nepali, you can still follow a service more easily than you would guess. The songs are repetitive and often projected, the Bible passage will be announced and you can read it in your own translation, and someone sitting near you will very likely offer to summarise the sermon in English over tea afterwards.',
          'Church life in Nepal is comparatively young — it grew mainly from the 1990s onward — and it shows in the buildings. Outside a few larger city churches, congregations meet in rented halls, on the upper floors of commercial buildings, in community rooms and in homes. A church in Kathmandu, Lalitpur, Pokhara, Chitwan, Biratnagar, Dharan or Butwal may have no sign on the street at all, which is exactly why asking someone for directions, or contacting the church first, works better than wandering.',
        ],
      },
      {
        h2: 'Finding a church service near you',
        body: [
          'The Church Nepal directory lists congregations with their locations and, where they have told us, their service days and times. It is new and still growing, so it does not yet contain every church in the country — if the town you are searching has no listing, that means we have not reached it yet, not that there is nothing there.',
          'The most reliable method remains the oldest one: ask a Christian who already lives in the area. Congregations move premises, rents change, and a service time written down a year ago may no longer hold. A short message to a church before you visit will get you the current time and, more often than not, an offer to meet you at the gate.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What time are church services in Nepal?',
        a: 'Most churches in Nepal begin their main service on Saturday morning, commonly between nine and eleven o’clock. Services usually run around two hours, and sometimes longer when there is communion or a baptism. Larger city churches may hold two morning sittings, and a few add an evening service for people who work.',
      },
      {
        q: 'Which day do churches meet in Nepal?',
        a: 'Saturday. Saturday is Nepal’s weekly holiday, so it is the day almost every congregation gathers for its main worship service. Nepal added Sunday to the weekend in April 2026 and some churches have since introduced a Sunday service, but Saturday is still the main gathering for most.',
      },
      {
        q: 'Is there Sunday worship in Nepal?',
        a: 'Some churches now hold a Sunday service, mainly in Kathmandu and Lalitpur and mainly since Nepal moved to a two-day weekend in April 2026. It is still the exception rather than the rule. If you want to be certain of finding a congregation gathered, Saturday morning is the safer choice.',
      },
      {
        q: 'How long is a church service in Nepal?',
        a: 'Around two hours is typical, and longer services are common. The time is taken up by an extended block of singing, open prayer, testimonies, notices and a sermon that is often considerably longer than visitors expect. Leaving early is normal and nobody will comment.',
      },
      {
        q: 'What should I wear to church in Nepal?',
        a: 'Dress modestly, with shoulders and knees covered. Ordinary smart clothes are fine — many men wear a shirt and trousers and many women wear a kurta surwal or sari. Expect to remove your shoes at the door in many congregations, and carry a scarf in case the church you visit is one where women cover their heads.',
      },
      {
        q: 'Can visitors attend a worship service in Nepal?',
        a: 'Yes. Nepali churches are generally welcoming to visitors, including people who are not Christians and people who are simply curious. You will often be greeted at the door, invited to stay for tea afterwards and asked where you are from. There is no expectation that you take part in anything you would rather not.',
      },
      {
        q: 'Do churches in Nepal hold services in English?',
        a: 'A number of congregations in Kathmandu and Lalitpur worship in English, and some Nepali-language churches provide English translation when foreign guests attend. Outside the main cities English services are much harder to find. Contacting a church before you visit is the only dependable way to confirm the language.',
      },
    ],
  },

  {
    slug: 'bible-study',
    cluster: 'service',
    h1: 'Bible Study Groups in Nepal: Where They Meet and How to Join One',
    metaTitle: 'Bible Study in Nepal: Groups, Times and How to Join',
    metaDescription:
      'How Bible study works in Nepal — weeknight home groups, Saturday classes after worship, what happens in a session, and how to find a Bible study near you.',
    lede: 'Bible study in Nepal usually happens in small groups that meet in homes on a weekday evening, or in classes held at the church before or after the Saturday worship service.',
    sections: [
      {
        h2: 'When Bible studies meet',
        body: [
          'There are two common rhythms. The first is the home group, sometimes called a cell group, which gathers on a weekday evening after work — often between six and eight — in a member’s flat or house, rotating between homes or staying put wherever there is space. The second sits alongside the main worship service: because Saturday is Nepal’s weekly holiday and the day congregations gather, many churches run a study or teaching class immediately before or after Saturday worship, while everyone is already there.',
          'The Saturday arrangement is worth understanding if you are new to the country. Nepal’s weekend only became two days in April 2026, and church life was built around a single free day, so Saturday still carries most of the week’s Christian activity — worship, study, youth meetings and shared food, often back to back.',
          'Groups aimed at particular people tend to have their own slot: women’s studies frequently meet on a weekday morning, student and youth groups in the late afternoon or evening, and men’s groups early in the morning before work. A church will usually run several of these at once rather than one study for everybody.',
        ],
      },
      {
        h2: 'What actually happens in a Nepali Bible study',
        body: [
          'A typical session opens with a song or two and a short prayer, works through a passage together, and closes with everyone praying aloud — often for the specific needs raised in the room, which in Nepal commonly means health, work abroad, family members who are unwell, and exams. Somewhere in there, tea appears.',
          'The style is conversational rather than lecture-shaped. The leader is frequently not a pastor but an ordinary member, the passage is read out and then discussed verse by verse, and questions from the group drive most of the hour. Many groups work steadily through one book of the Bible over months rather than jumping between topics.',
          'Groups are small — a living room’s worth of people is the usual size — and that is deliberate. In a country where many congregations meet in rented halls with little room to talk, the home group is where members actually know one another, and it is where a newcomer stops being a stranger fastest.',
        ],
      },
      {
        h2: 'Language and Bibles',
        body: [
          'Most groups study in Nepali. Nepali-language Bibles are readily available through churches and Christian bookshops in Kathmandu, and a great many people simply read from a Bible app on their phone, which is also the easiest way for a visitor to follow along in a second language — you can have the same passage open in English while the discussion runs in Nepali.',
          'In Kathmandu and Lalitpur you will also find groups that study in English, generally connected to congregations serving international residents and students. Elsewhere, English-language study is uncommon, though it is worth asking: in many groups at least one member speaks enough English to translate the gist, and they will usually offer without being asked.',
          'Where a congregation worships in a mother tongue — Nepal Bhasa, Tamang, Magar, Limbu, Sherpa, Tharu and others — its study groups tend to follow the same language, which for many older members is the language they read most comfortably.',
        ],
      },
      {
        h2: 'Joining a group as a newcomer',
        body: [
          'You do not need to be invited, and you do not need to know anything. Turning up to a Saturday service and saying to whoever hands you tea that you would like to join a Bible study is the entire process in most churches; someone will either take you to their own group or put you in touch with the person who organises them.',
          'Expect to be asked where you live. Home groups in Nepal are organised geographically, because evening travel across Kathmandu or Pokhara is slow and people join the group nearest them. If you say which neighbourhood you are in, you will usually be pointed at a specific group rather than a general invitation.',
          'Bring nothing. If you are visiting a home, you will take your shoes off at the door and you may well sit on the floor, and if the group has any warning at all that a guest is coming there will be more food than you expected. Coming empty-handed is entirely normal.',
        ],
      },
      {
        h2: 'Where to look for a Bible study near you',
        body: [
          'Studies are almost never advertised. They run inside churches, in homes, on university campuses and in workplace lunch breaks, and none of that shows up on a map — which is why the practical route to a Bible study is nearly always through a congregation rather than a search.',
          'The Church Nepal directory is the place to start: find a church near you in Kathmandu, Lalitpur, Pokhara, Chitwan, Biratnagar, Dharan, Butwal or wherever you are, then contact it and ask what studies it runs and when. The directory is new and still filling out, so it does not yet cover every town, and no directory will ever list the individual home groups themselves.',
          'If you are outside a city, ask locally. In smaller towns and villages, a study group and the congregation itself are often nearly the same set of people meeting in the same room on a different evening, and one conversation will get you both.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Where can I find Bible study in Nepal?',
        a: 'Bible studies in Nepal run through local churches rather than as standalone groups, so the way to find one is to contact a congregation near you and ask. Most churches run several — home groups by neighbourhood, plus women’s, men’s, youth and student studies. The Church Nepal directory can help you find the church; the church will tell you where its groups meet.',
      },
      {
        q: 'What day and time do Bible study groups meet in Nepal?',
        a: 'Weekday evenings, commonly between six and eight, are the usual slot for home-based Bible study groups. Many churches also hold a study or teaching class immediately before or after the Saturday worship service, since Saturday is Nepal’s main day of gathering. Women’s and men’s groups often meet on weekday mornings instead.',
      },
      {
        q: 'Are Bible studies in Nepal held in English?',
        a: 'Most Bible study in Nepal is in Nepali. English-language groups exist mainly in Kathmandu and Lalitpur, usually attached to congregations that serve international residents and students. Elsewhere you can often still follow along by reading the passage in English on your phone while the discussion runs in Nepali.',
      },
      {
        q: 'Can I join a Bible study if I am not a Christian?',
        a: 'Yes. Groups in Nepal are generally open to anyone who wants to come and read, including people exploring the faith and visitors who are simply curious. You will not be put on the spot to pray, speak or explain your beliefs. Nepali law prohibits attempts to convert people, and groups are conscious of that boundary.',
      },
      {
        q: 'What happens at a Bible study in Nepal?',
        a: 'A session typically opens with singing and prayer, reads through a Bible passage with open discussion, and ends with members praying aloud together for needs raised in the room. Tea is almost always served. Groups are small, usually meet in someone’s home, and often work through one book of the Bible over several months.',
      },
      {
        q: 'Do I need to bring a Bible?',
        a: 'No. There will be spare Bibles, or someone will share theirs, and most groups have members reading from a phone app. If you would like your own, Nepali-language Bibles are available through churches and Christian bookshops in Kathmandu and other cities.',
      },
      {
        q: 'How do I find a Bible study near me if my town has no listed church?',
        a: 'Ask in the nearest town that does have one — congregations in Nepal usually know the fellowships and home groups in the districts around them. Many rural groups meet in homes with no building, sign or online presence at all, so a local introduction is far more effective than searching. The Church Nepal directory is still growing and does not yet reach every district.',
      },
    ],
  },

  {
    slug: 'prayer',
    cluster: 'service',
    h1: 'Prayer Meetings and Prayer Groups in Nepal',
    metaTitle: 'Prayer Meetings in Nepal: When and Where They Meet',
    metaDescription:
      'Prayer meetings in Nepal — early morning prayer, weeknight gatherings, fasting prayer and all-night vigils. When they happen, what to expect and how to join.',
    lede: 'Nepali churches hold prayer meetings far more often than they hold worship services: typically an early morning prayer time on weekdays, a longer prayer meeting one evening a week, and a period of prayer before Saturday worship begins.',
    sections: [
      {
        h2: 'When prayer meetings happen',
        body: [
          'The weekly worship service falls on Saturday, because Saturday is Nepal’s day off, but prayer is spread across the whole week. The most common patterns are a short early morning prayer — often around five or six o’clock, before people leave for work — and a fuller prayer meeting on a weekday evening. Many congregations also open the church an hour before the Saturday service so that anyone who wants to pray before worship can.',
          'On top of the weekly rhythm, churches set aside longer times: a day of fasting and prayer, a chain of prayer running through a week where members take turns by the hour, or an all-night vigil, usually tied to a particular need or to the start of a year or season. These are announced in the service rather than published, so the way to hear about them is to be on a congregation’s message group.',
          'Because these times are frequent and often early, they move around more than service times do. Confirm before you set an alarm for a five o’clock start.',
        ],
      },
      {
        h2: 'What a prayer meeting in Nepal is like',
        body: [
          'The dominant style is audible and simultaneous. Rather than one person praying while everyone listens, a leader will name something to pray for and the whole room prays aloud at once, in Nepali, for several minutes, until the leader draws it to a close and names the next thing. To a visitor used to silence and one voice at a time, the first few minutes are loud and disorienting; it stops feeling strange quickly.',
          'People commonly kneel, and in many congregations they pray sitting on the floor rather than in rows of chairs. Singing is woven through, often quieter and slower than in the Saturday service, and there is usually a stretch where members bring specific requests out loud for the group to carry.',
          'Prayer for the sick occupies a serious place in Nepali church life, and in most congregations you will see people asked to come forward for prayer, with the leaders and sometimes the whole group praying over them. If you attend and would like prayer for something, saying so is entirely ordinary — you do not need to be a member.',
        ],
      },
      {
        h2: 'What people pray about',
        body: [
          'Health comes first in most meetings, then family — and in Nepal, family very often means someone working abroad. Requests for those in the Gulf states, Malaysia, Korea or India, for the paperwork and the debt that sent them, and for the households they left, run through prayer meetings constantly.',
          'After that: exams and school results, work and visas, safety on the roads, land and legal disputes, and the ordinary business of neighbourhoods and congregations. Prayer for the country as a whole — for government, for disaster response, for stability — is a regular fixture rather than an occasional one, and after an earthquake or a flood it becomes the meeting’s centre.',
          'You will hear names spoken aloud, including names of people who are unwell or in difficulty. That candour is part of what makes these gatherings valuable to members, and it is a reason to treat what you hear in a prayer meeting as private.',
        ],
      },
      {
        h2: 'Attending as a visitor',
        body: [
          'Prayer meetings are usually smaller and more informal than the Saturday service, which makes them a gentler place to visit than a full congregation — but also a more personal one. Nobody will require you to pray aloud. Sitting quietly through the whole meeting is completely acceptable and common, including among members.',
          'Practicalities are the same as for any Nepali church gathering: dress modestly, take your shoes off if others are doing so, expect to sit on a mat or carpet in smaller rooms, and expect tea. Early morning meetings in the cold months are held in unheated rooms — bring more layers than you think you need.',
          'Nepal’s constitution protects the right to practise your own religion while its law prohibits acting to convert others. In practice, congregations are hospitable to visitors and careful about evangelism, and a guest who comes to pray, listens, and does not treat the meeting as an audience will be entirely welcome.',
        ],
      },
      {
        h2: 'Finding a prayer meeting near you',
        body: [
          'Prayer meetings are not advertised — they are internal to a congregation, often held in homes, and frequently arranged over the phone. The route to one is therefore through a church: find a congregation near you and ask what its prayer times are.',
          'The Church Nepal directory lists churches across Kathmandu, Lalitpur, Pokhara, Chitwan, Biratnagar, Dharan, Butwal and other places, with contact details where congregations have provided them. It is new and does not yet cover the whole country, and it will never list every home prayer group, because most of them exist only in a phone contact list.',
          'If you are asking for prayer rather than looking to attend, most churches will take a request by phone or message and pray for it at their next meeting, whether or not you come. That is a normal thing to ask for and nobody will find it odd.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Where can I find prayer meetings in Nepal?',
        a: 'Prayer meetings in Nepal are run by individual congregations and are rarely advertised publicly, so the way to find one is to contact a church near you and ask for its prayer times. Most churches hold an early morning prayer on weekdays and a longer prayer meeting one evening a week. The Church Nepal directory can help you find a congregation to contact.',
      },
      {
        q: 'What day and time are prayer meetings in Nepal?',
        a: 'Weekday early mornings, often around five or six o’clock, and one weekday evening are the most common slots. Many churches also open for prayer an hour before the Saturday worship service, since Saturday is Nepal’s weekly holiday and the main day congregations gather. Times vary between congregations, so confirm before you go.',
      },
      {
        q: 'What happens at a prayer meeting in Nepal?',
        a: 'A leader names something to pray for and the whole room prays aloud at the same time, usually in Nepali, then moves to the next request. Singing runs through the meeting, people often kneel or sit on the floor, and there is usually a time when members bring specific needs and prayer is offered for the sick. Meetings typically last one to two hours.',
      },
      {
        q: 'Can I attend a prayer meeting if I am not a member of the church?',
        a: 'Yes. Prayer meetings are generally open, and visitors are welcome to come and sit without taking part. Nobody will ask you to pray aloud, and staying silent throughout is common even among regular members.',
      },
      {
        q: 'What is fasting prayer in Nepal?',
        a: 'Fasting prayer is a longer gathering where members set aside a day — or part of one — to go without food and pray together, usually over a particular need or at the start of a year or season. Churches also organise prayer chains, where members take an hour each in turn, and occasional all-night vigils. These are announced within the congregation rather than published.',
      },
      {
        q: 'Can I ask a church in Nepal to pray for something without attending?',
        a: 'Yes, and it is a normal request. Most congregations will take a prayer request by phone or message and bring it to their next meeting. You do not need to be a member, a Christian, or a resident of the area.',
      },
      {
        q: 'Are prayer meetings in Nepal held in English?',
        a: 'Almost all are in Nepali. Some congregations in Kathmandu and Lalitpur that serve international residents pray in English, and mother-tongue congregations pray in their own language. In a Nepali meeting you can pray in your own language quietly without any difficulty, since everyone prays aloud at once anyway.',
      },
    ],
  },

  {
    slug: 'fellowship',
    cluster: 'service',
    h1: 'Christian Fellowship and Christian Community in Nepal',
    metaTitle: 'Christian Fellowship in Nepal: Finding Community',
    metaDescription:
      'What Christian fellowship looks like in Nepal — sangati after Saturday worship, home groups, student and mother-tongue fellowships, and how newcomers join one.',
    lede: 'Christian fellowship in Nepal — sangati — is the shared life that surrounds the Saturday worship service: tea and food afterwards, small groups in homes during the week, and the practical mutual help that holds a congregation together.',
    sections: [
      {
        h2: 'What “fellowship” means in the Nepali church',
        body: [
          'The Nepali word you will hear is sangati, and it covers more ground than the English word suggests. It means the gathering itself, the people in it, and the relationships between them. Many small congregations describe themselves as a fellowship rather than a church, particularly when they meet in a home and have no building, no sign and no salaried pastor.',
          'That matters practically: a search for a church in a smaller town may turn up nothing while a fellowship of thirty people meets every Saturday on someone’s ground floor. Church life in Nepal grew mainly from the 1990s onward and much of it still takes this shape — rented rooms, upper floors of commercial buildings, and living rooms with the furniture pushed back.',
          'It also shapes what membership feels like. In a congregation of this size, people know who is ill, who has lost work, and whose son’s visa has been delayed, and the response is usually collective and immediate.',
        ],
      },
      {
        h2: 'The hour after the service',
        body: [
          'If you want to meet a congregation rather than watch one, stay for tea. Almost every church serves chiya after Saturday worship, often with something to eat, and this is where the actual conversation happens — the service itself is not a social occasion, and the room is usually full and facing forward.',
          'Expect to be asked where you are from, where you live, and whether you will come again. In many congregations a visitor is asked to stand and introduce themselves during the notices; if that is not something you want, a quiet word with whoever greeted you at the door will spare you it.',
          'Food is a recurring feature of fellowship life more broadly. Shared meals after a baptism, at festivals, or simply because a group has decided to cook are common, and guests are folded into them without much ceremony. Turning up empty-handed is expected and offering to help clear up afterwards is a reliable way to make yourself at home.',
        ],
      },
      {
        h2: 'Fellowship during the week',
        body: [
          'The weekday side of church life runs through small groups in homes — Bible study groups, prayer groups, and groups formed simply around a neighbourhood. They meet on weekday evenings after work, they are organised by locality because travel across a city is slow, and they are where most people find their closest friendships in a congregation.',
          'There are usually separate fellowships within a church for particular groups: women, men, young people, and students. Women’s fellowships in particular often meet on weekday mornings and carry a large share of a congregation’s practical care — visiting the sick, cooking for a bereaved family, checking on someone who has stopped coming.',
          'None of this is advertised. It is arranged in person and over messaging groups, which is why joining a congregation and asking is the only real route in.',
        ],
      },
      {
        h2: 'Fellowship for people far from home',
        body: [
          'A great many Nepali Christians live somewhere other than where they grew up — students in Kathmandu and Dharan, workers who moved to Pokhara, Chitwan, Butwal or Biratnagar for a job, families whose main earner is abroad. For them the fellowship often does the work an extended family would otherwise do, and congregations know it. Newcomers to a city are usually absorbed quickly and deliberately.',
          'Mother-tongue fellowships matter here too. Groups worshipping in Nepal Bhasa, Tamang, Magar, Limbu, Sherpa, Tharu and other languages exist partly for comprehension and partly because worshipping in your own language among people from your own community is, for many, the point.',
          'Foreign residents and long-stay visitors find something similar in the English-language congregations of Kathmandu and Lalitpur, which tend to have a steady turnover of students, aid and development staff and diplomatic families, and are correspondingly practised at receiving new arrivals.',
        ],
      },
      {
        h2: 'How to join a fellowship',
        body: [
          'Attend twice. The first visit you are a guest; the second, you are someone who came back, and in most Nepali congregations that is enough for someone to take responsibility for introducing you around and putting you in a home group.',
          'Say what you need. If you are new to the city, if you are looking for a group near your neighbourhood, if you would rather not be introduced from the front — all of these are ordinary requests, and a congregation would rather hear them than guess.',
          'Use the Church Nepal directory to find a congregation to start with. It lists churches and fellowships with their locations and contact details where they have given them, it is new and still growing, and it does not cover every part of the country yet — particularly the small home fellowships that have no public presence at all. In those places, asking a Christian who lives locally remains the only method that works.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What is Christian fellowship in Nepal?',
        a: 'Fellowship, or sangati in Nepali, is the shared life of a congregation beyond the worship service — tea and food after Saturday worship, small groups meeting in homes during the week, and the practical support members give each other. Many small congregations in Nepal call themselves fellowships rather than churches, especially when they meet in a home rather than a building.',
      },
      {
        q: 'How do I find a Christian community in Nepal as a newcomer?',
        a: 'Start by attending a Saturday worship service at a church near you and staying for tea afterwards, which is where people actually meet. Say that you are new to the area, and you will usually be introduced to a home group in your neighbourhood. The Church Nepal directory lists congregations across Kathmandu, Lalitpur, Pokhara and other cities, though it is still growing and does not yet cover everywhere.',
      },
      {
        q: 'When do Christian fellowships meet in Nepal?',
        a: 'The main gathering is Saturday morning, because Saturday is Nepal’s weekly holiday. Smaller weekday fellowships — home groups, prayer groups, women’s and youth groups — meet on weekday evenings or mornings depending on the group. Some churches have added a Sunday service since Nepal moved to a two-day weekend in April 2026.',
      },
      {
        q: 'Are there Christian fellowships in English in Nepal?',
        a: 'Yes, mainly in Kathmandu and Lalitpur, where congregations serving foreign residents, students and international staff hold services and small groups in English. Outside those cities, English-language fellowship is rare, though many Nepali congregations have members who will happily translate.',
      },
      {
        q: 'Do I have to be a member to join a fellowship in Nepal?',
        a: 'No. Home groups and fellowships in Nepal are generally open, and attending regularly is how people become part of a congregation in the first place. There is no formal step required before you can join a group, and nothing is asked of you financially.',
      },
      {
        q: 'What happens after a church service in Nepal?',
        a: 'Tea is served, and usually something to eat. This is the main social hour of the week for many congregations and the easiest moment for a visitor to meet people. Expect to be asked where you are from and whether you will come back, and in some churches to be invited to introduce yourself during the notices.',
      },
      {
        q: 'Are there Christian student groups in Nepal?',
        a: 'Yes. Churches in university towns commonly run youth and student fellowships, often meeting in the late afternoon or evening on a weekday, and many students in Kathmandu, Dharan and Pokhara find their closest Christian community there rather than in the main service. Ask a local congregation which student groups it runs.',
      },
    ],
  },

  {
    slug: 'english-speaking-churches',
    cluster: 'service',
    h1: 'English-Speaking and International Churches in Nepal',
    metaTitle: 'English Speaking Churches in Nepal: A Visitor’s Guide',
    metaDescription:
      'English-speaking and international churches in Nepal — where they are, which day they meet, what foreigners should expect, and the rules visitors should know.',
    lede: 'English-language and international congregations exist mainly in Kathmandu and Lalitpur, and like every other church in Nepal they gather principally on Saturday, because Saturday is the country’s weekly holiday.',
    sections: [
      {
        h2: 'Which day, and why it is not Sunday',
        body: [
          'Foreign visitors routinely arrive in Nepal on a Sunday morning looking for a service and find the city at work. Nepal’s week ran Sunday to Friday with Saturday off, so Nepali congregations — and the English-language congregations that sit inside the same society — have always met on Saturday. Church is a Saturday morning event here.',
          'Nepal moved to a two-day Saturday and Sunday weekend in April 2026. A few congregations, particularly those serving international residents, have added or shifted a service to Sunday since then. It is genuinely worth checking, because this group is the most likely to have changed — but Saturday morning remains the safe assumption and the time you will find the largest gathering.',
          'If you are in Nepal for only a few days, plan around Saturday. If your dates make that impossible, contact a congregation directly; several will tell you about a mid-week English service, a home group or a prayer meeting you could join instead.',
        ],
      },
      {
        h2: 'Where English-language congregations are',
        body: [
          'Kathmandu and Lalitpur between them hold nearly all of Nepal’s regular English-language Christian worship, because that is where nearly all of the country’s foreign residents live — embassy and UN staff, development and aid workers, international school teachers, businesspeople and students. Congregations there are used to a transient membership and to greeting people who will be in the country for two weeks or two years.',
          'Pokhara, with its large tourist and trekking traffic, is the next most likely place to find English spoken in a service or provided as translation, though the picture is much thinner and less regular. In Chitwan, Biratnagar, Dharan and Butwal you should expect Nepali-language worship, sometimes with an English translator found on the spot when a foreign guest turns up.',
          'On a trek, do not count on finding a service at all. Congregations exist in hill and mountain districts, but they are Nepali or mother-tongue speaking, they meet where there is no signage, and they are not organised around passing visitors. If it matters to you, arrange it before you leave the valley.',
        ],
      },
      {
        h2: 'What a foreigner should expect on arrival',
        body: [
          'You will be noticed and you will be welcomed — often before you have found a seat. Expect to be asked your name and your country, to be offered a Bible, and to be invited to stay for tea. In some congregations you may be asked to stand and introduce yourself; a word to whoever greets you at the door is enough to opt out.',
          'Dress modestly: shoulders and knees covered, and nothing you would not wear into a temple. Many congregations take shoes off at the door, and smaller ones seat people on mats on the floor. Services run long by Western standards — two hours is normal — with an extended block of singing, several people praying aloud at once, testimonies, notices and a sermon.',
          'An offering will be taken. Visitors are not expected to give, and no one will look. If you want to, a small note in the bag is entirely sufficient and it is better not to give in a way that draws attention.',
          'Even in an English-language congregation, expect Nepali to be present — in songs, in prayer, in conversation over tea. Most of these churches are mixed rather than exclusively expatriate.',
        ],
      },
      {
        h2: 'The rules a visitor should know',
        body: [
          'Nepal’s constitution protects the freedom to profess and practise your own religion. It also prohibits converting another person from one religion to another, and acts intended to do so are a criminal offence under Nepali law. This is not an obscure technicality — it shapes how churches behave in public and what they are cautious about.',
          'For a visitor the practical translation is simple. You are free to attend a service, sing, pray, take part and talk about your own faith when asked. You should not use a visit, a conversation afterwards, or any material you have brought with you as a means of persuading Nepalis to change religion, and you should not put a congregation in the position of appearing to host that. Churches carry the consequences of a visitor’s enthusiasm long after the visitor has flown home.',
          'Two related courtesies. Ask before photographing people, and do not post photographs of a congregation without asking — some members have family situations that make that a real problem. And if you are visiting with a group or an organisation, tell the church in advance rather than arriving with fifteen people unannounced.',
        ],
      },
      {
        h2: 'Finding an English service or an international church',
        body: [
          'Contact before you go. Congregations in Nepal move premises more often than churches in most countries, because most rent their space, and few have a permanent street sign. A message a day or two ahead will get you the current address, the current start time, confirmation of the language, and frequently an offer to meet you somewhere findable and walk you in.',
          'The Church Nepal directory lists congregations with their locations and contact details where they have provided them, and is the place to start looking for a church in Kathmandu, Lalitpur, Pokhara or elsewhere. It is new and still growing: an area with no listing is an area we have not covered yet, not an area without churches.',
          'Guesthouse and hotel staff, long-term foreign residents and international schools are all reasonable secondary sources in Kathmandu, and are often quicker than a search engine at telling you which congregation currently meets where.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are there English speaking churches in Kathmandu?',
        a: 'Yes. Kathmandu and neighbouring Lalitpur have several congregations that worship in English, serving foreign residents, international staff and students, and some Nepali-language churches provide English translation for guests. They meet mainly on Saturday morning, like all churches in Nepal. Contacting a congregation before you visit is the reliable way to confirm the language and current address.',
      },
      {
        q: 'Can foreigners attend church in Nepal?',
        a: 'Yes. Nepali congregations are generally welcoming to foreign visitors, and no permission, membership or booking is needed to attend a service. Nepal’s constitution protects the right to practise your own religion. Attempting to convert other people is a criminal offence under Nepali law, so attend as a guest rather than as an evangelist.',
      },
      {
        q: 'Which day do English-speaking churches in Nepal meet?',
        a: 'Saturday, in almost all cases, because Saturday is Nepal’s weekly holiday and the day the whole country’s church life is built around. Since Nepal adopted a two-day Saturday–Sunday weekend in April 2026, some international congregations have added a Sunday service, so it is worth checking with the specific church. Sunday morning has never been the default here.',
      },
      {
        q: 'Are there international churches outside Kathmandu?',
        a: 'Regular English-language worship is concentrated in Kathmandu and Lalitpur, where most of Nepal’s foreign residents live. Pokhara sometimes offers English or on-the-spot translation because of its tourist traffic. In Chitwan, Biratnagar, Dharan, Butwal and smaller towns, expect Nepali-language services, often with someone willing to translate for a guest.',
      },
      {
        q: 'Can I find a church while trekking in Nepal?',
        a: 'Rarely, and not reliably. Congregations do exist in hill and mountain districts, but they worship in Nepali or a local language, meet in unmarked homes and halls, and are not set up for passing visitors. If attending matters to you, arrange something before you leave Kathmandu or Pokhara.',
      },
      {
        q: 'What should a foreign visitor wear to a church in Nepal?',
        a: 'Modest clothing with shoulders and knees covered — the same standard you would use for a temple. Be ready to remove your shoes at the door, as many congregations do, and to sit on a mat on the floor in smaller fellowships. Ordinary smart casual clothing is entirely acceptable.',
      },
      {
        q: 'Is it legal to attend a Christian service in Nepal?',
        a: 'Yes. Practising your own religion, including attending Christian worship, is protected under Nepal’s constitution. What the law prohibits is converting another person, or acting with the intent to convert them, which is a criminal offence. Visitors should be careful not to place a local congregation in that position.',
      },
      {
        q: 'Should I contact a church before visiting in Nepal?',
        a: 'It is strongly recommended. Most congregations rent their premises and move more often than churches elsewhere, few have street signage, and service times have been shifting since Nepal moved to a two-day weekend. A short message ahead of time will confirm the address, the start time and the language, and often produces an offer to meet you nearby.',
      },
    ],
  },
];
