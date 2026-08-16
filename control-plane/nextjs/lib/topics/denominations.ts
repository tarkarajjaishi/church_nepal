import type { Topic } from '../topics';

/**
 * Denomination explainers.
 *
 * The honest premise every page here repeats in its own words: most Nepali
 * churches are independent or loosely networked rather than formally
 * denominational, so a denominational label predicts far less in Nepal than it
 * does in the US or UK. Without that, eleven pages describing eleven
 * traditions would be eleven doorway pages.
 *
 * No church names, no counts, no dates, no leaders — nothing a reader could
 * check and find wrong, and nothing that ranks one tradition above another.
 */
export const DENOMINATION_TOPICS: Topic[] = [
  {
    slug: 'baptist',
    cluster: 'denomination',
    h1: 'Baptist Churches in Nepal',
    metaTitle: 'Baptist Churches in Nepal — Beliefs and What to Expect',
    metaDescription:
      'What Baptist churches believe, how believer’s baptism by immersion works, and what to expect in Nepal, where most churches are independent, not denominational.',
    lede:
      'Baptist churches baptise adult believers by full immersion and govern themselves locally without a bishop or synod — a pattern common across Nepal, though relatively few Nepali churches actually carry the Baptist name.',
    sections: [
      {
        h2: 'What Baptist churches believe',
        body: [
          'The conviction that gives the tradition its name is believer’s baptism. Baptism follows a personal, conscious decision to follow Christ rather than marking birth into a Christian family, so infants are not baptised. The person is lowered fully under the water and raised again, a deliberate picture of dying and rising with Christ, and it is normally a public occasion the whole congregation attends.',
          'The second conviction is local church autonomy. Each congregation calls its own pastor, holds its own property and settles its own affairs, usually through a meeting of members who vote. Baptist unions, conventions and associations do exist, but they are voluntary fellowships for training, mission and mutual help rather than authorities that can appoint a pastor or overrule a church.',
          'Alongside these sit an emphasis on the Bible as final authority, preaching as the centre of the gathering, and personal conversion as the beginning of Christian life. Baptists have also argued for a long time that faith cannot be coerced and that the state has no business enforcing religion — a strand of the tradition that reads very differently in a country where conversion is a sensitive subject. Communion is generally understood as a remembrance and taken at a table rather than an altar, often monthly.',
        ],
      },
      {
        h2: 'Baptist churches in Nepal',
        body: [
          'Nepali Christianity did not grow up along denominational lines. The great majority of congregations here are independent or belong to a loose fellowship of churches, and many describe themselves simply as a Nepali Christian church or by the name of their neighbourhood. So the number of churches that would put the word Baptist on the gate is small compared with the number that quietly hold recognisably Baptist convictions.',
          'Baptism by immersion, for adults who have made their own decision, is close to standard practice across Nepali churches whatever they call themselves — often in a river, sometimes in a tank built for the purpose. Watching an immersion baptism in Nepal tells you almost nothing about a church’s affiliation, which is exactly the confusion this page exists to clear up.',
          'Where a genuine Baptist connection does exist in Nepal, it usually runs through theological training and mission partnerships with Baptist bodies abroad rather than through a Nepali Baptist hierarchy. Congregational independence means such churches feel Nepali rather than imported. It is also worth knowing that many Nepali churches combine sermon-centred evangelical teaching with charismatic practice — praying aloud together, praying for the sick — regardless of the label on the noticeboard.',
        ],
      },
      {
        h2: 'What a visitor notices',
        body: [
          'The service is built around the sermon, which may run half an hour or more and works through a passage of the Bible. People bring their own Bibles and follow along. Singing is congregational and in Nepali, led on keyboard and guitar and sometimes with a madal or other local percussion. In many congregations you will take your shoes off at the door and sit on the floor or on plastic chairs, with men and women often on different sides — Nepali custom, not Baptist doctrine.',
          'Timing catches most newcomers out: the main gathering is usually Saturday morning, since Saturday is Nepal’s weekly holiday, and although the two-day weekend introduced in April 2026 has led some churches to add a Sunday service, Saturday is still when the church is full. Visitors are not expected to give when the offering is taken, and nobody will ask you to speak.',
        ],
      },
      {
        h2: 'Finding a Baptist church in Nepal',
        body: [
          'Start with the Church Nepal directory and its city pages — Kathmandu, Lalitpur, Pokhara, Biratnagar, Butwal and others. The directory is new and still growing, and it does not yet record each church’s denomination, so we cannot hand you a filtered list of Baptist churches. Pretending otherwise would waste your time.',
          'The practical route is to look at the church’s own website or social page, or simply phone or message and ask two questions: how do you baptise, and who governs the church. A church that immerses adult believers and is run by its own members’ meeting is Baptist in substance whether or not it uses the word — and in Nepal, that is more often how you will find one.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are there Baptist churches in Nepal?',
        a: 'Yes, though fewer churches use the Baptist name than you might expect. Baptist convictions — adult baptism by immersion and a self-governing congregation — are common across Nepali churches, while formal Baptist affiliation is not, because most congregations in Nepal are independent or loosely networked rather than denominational.',
      },
      {
        q: 'Where can I find a Baptist church in Kathmandu?',
        a: 'Begin with the Kathmandu city page in the Church Nepal directory, then check each church’s own website or contact them directly. The directory does not yet record denominations, so the listing itself will not tell you whether a church is Baptist.',
      },
      {
        q: 'What makes a Baptist church different from other churches in Nepal?',
        a: 'Two things: it baptises only people old enough to profess faith for themselves, by full immersion, and it is governed by its own members rather than by any outside body. In Nepal the first is widely shared and the second is close to universal, which is why the label draws a fainter line here than elsewhere.',
      },
      {
        q: 'Do I need to be a member to attend a Baptist church?',
        a: 'No. Anyone can attend a service without being a member or a Christian. Membership in a Baptist church matters for voting in congregational decisions and for holding office, not for coming through the door, and no one will ask about it when you visit.',
      },
      {
        q: 'Do Baptist churches in Nepal meet on Sunday?',
        a: 'Most meet on Saturday, because Saturday is Nepal’s weekly holiday rather than Sunday. Since Nepal moved to a two-day Saturday–Sunday weekend in April 2026 some churches have added a Sunday service, but Saturday morning remains the main gathering.',
      },
    ],
  },

  {
    slug: 'catholic',
    cluster: 'denomination',
    h1: 'Catholic Churches in Nepal',
    metaTitle: 'Catholic Churches in Nepal: Mass, Parishes and Schools',
    metaDescription:
      'The Catholic Church in Nepal is an apostolic vicariate and known for its schools. What Catholics believe, what Mass is like and how to find a parish near you.',
    lede:
      'The Catholic Church has a long-established presence in Nepal, organised as an apostolic vicariate, with parishes celebrating Mass in Nepali and a network of schools that many Nepalis know far better than they know the church itself.',
    sections: [
      {
        h2: 'What the Catholic Church teaches',
        body: [
          'Catholics understand themselves as part of a worldwide church in communion with the bishop of Rome, continuous with the church of the apostles. Worship centres on the Mass: scripture readings that follow a fixed cycle so that congregations everywhere hear the same passages, a homily explaining them, and then the Eucharist, in which Catholics believe the bread and wine truly become the body and blood of Christ. That belief is why the altar, not the pulpit, is the visual centre of a Catholic church.',
          'Around the Eucharist sit the other sacraments — baptism, confirmation, confession, marriage, ordination and anointing of the sick — understood as moments where God acts through ordinary material things. Priests are ordained and appointed by a bishop rather than chosen by the congregation, and the year is shaped by a liturgical calendar of Advent, Christmas, Lent and Easter.',
          'One point often misread by newcomers: Catholics honour Mary and the saints and ask for their prayers, but do not worship them; worship belongs to God alone. Catholic teaching also weights heavily the dignity of every person and care for the poor as an obligation rather than an optional extra, which is why a Catholic presence in almost any country appears first as schools and clinics.',
        ],
      },
      {
        h2: 'The Catholic Church in Nepal',
        body: [
          'The Catholic presence in Nepal is long-established and predates much of the Protestant work here. It is organised as an apostolic vicariate — the form of jurisdiction the Catholic Church uses where the community is not yet constituted as a full diocese, led by a bishop known as an apostolic vicar. The Catholic community is small relative to Nepal’s population, but institutionally settled in a way that few churches here are.',
          'It is best known for education. Catholic-run schools have a wide reputation in Nepal, and many families with no connection to Christianity have children in them; for a great many Nepalis, a school is the only Catholic institution they have set foot in. Religious orders carry much of that educational and social work alongside parish life.',
          'That institutional footing makes Catholic parishes more visible as buildings and campuses than most Nepali congregations, which commonly meet in rented halls, homes or rooftop rooms. There is also a structural difference: most churches in Nepal are independent or loosely networked, whereas a Catholic parish belongs to a worldwide structure and receives a priest who is appointed rather than called by the people.',
        ],
      },
      {
        h2: 'Going to Mass in Nepal',
        body: [
          'The shape of the Mass is the same everywhere in the world, which means a Catholic visitor can follow it in Nepal without knowing the language: the congregation stands, sits and kneels at set points, gives set responses, hears two or three readings and a homily, exchanges a sign of peace, and then receives communion. Mass is commonly celebrated in Nepali, and some parishes also offer an English Mass.',
          'Anyone may attend, Catholic or not — there is no membership, no ticket and no requirement to be Christian. Receiving communion is another matter and is limited to Catholics prepared to receive it; visitors normally stay seated, or come forward with arms crossed over the chest for a blessing instead. Dress modestly and arrive a few minutes early.',
          'Because Saturday is Nepal’s weekly holiday, parishes schedule their principal Mass on Saturday, which surprises Catholics arriving from countries where the weekend and Sunday coincide. Nepal’s move to a Saturday–Sunday weekend in April 2026 has made Sunday Masses easier to hold, and weekday Masses are common.',
        ],
      },
      {
        h2: 'Finding a Catholic church in Nepal',
        body: [
          'The Church Nepal directory and its city pages for Kathmandu, Lalitpur, Pokhara and Biratnagar are the place to begin. It is still growing and does not yet record which tradition each listed church belongs to, so it cannot give you a filtered list of Catholic parishes — check the church’s own website or contact it directly.',
          'Mass times are worth confirming by phone before you travel, since they shift with the season and with feast days, and a parish listing one time online may in practice run several. Parish offices are used to enquiries from visitors and will tell you plainly when to come.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are there Catholic churches in Nepal?',
        a: 'Yes. The Catholic Church has been present in Nepal for a long time and is organised as an apostolic vicariate, with parishes celebrating Mass, along with schools and social work that are widely known in the country.',
      },
      {
        q: 'Where can I find a Catholic church in Kathmandu?',
        a: 'Start with the Kathmandu city page in the Church Nepal directory and then contact the parish to confirm Mass times. The directory is new and does not yet record denominations, so you should verify with the church itself rather than assume from the listing.',
      },
      {
        q: 'Can non-Catholics attend Mass in Nepal?',
        a: 'Yes, anyone may attend Mass regardless of religion. Receiving communion is reserved for Catholics who are prepared to receive it, so visitors usually remain seated or come forward with arms crossed for a blessing instead.',
      },
      {
        q: 'Is Mass in Nepal celebrated in Nepali or English?',
        a: 'Nepali is the common language for Mass, and some parishes also offer an English celebration. The structure is identical in either language, so a visitor who knows the Mass can follow it even without the words.',
      },
      {
        q: 'What day is Mass held in Nepal?',
        a: 'Saturday is the main day, because Saturday rather than Sunday is Nepal’s weekly holiday. Nepal adopted a two-day Saturday–Sunday weekend in April 2026, which has made Sunday Masses more practical, and many parishes also celebrate weekday Masses.',
      },
      {
        q: 'Are Catholic schools in Nepal only for Catholic students?',
        a: 'No — Catholic schools in Nepal are attended by students of many faiths, and most of their pupils are not Christian. Admission policies are set by each school, so contact the school directly for its own requirements.',
      },
    ],
  },

  {
    slug: 'pentecostal',
    cluster: 'denomination',
    h1: 'Pentecostal Churches in Nepal',
    metaTitle: 'Pentecostal Churches in Nepal — What to Expect',
    metaDescription:
      'Pentecostal worship is widespread in Nepal, including in churches that avoid the name. What Pentecostals believe, what a service is like and how to find one.',
    lede:
      'Pentecostal churches emphasise the present work of the Holy Spirit — healing prayer, prophecy, speaking in tongues and long, expressive sung worship — and that style is so widespread in Nepal that you will meet it in many churches that would never call themselves Pentecostal.',
    sections: [
      {
        h2: 'What Pentecostal churches emphasise',
        body: [
          'The central Pentecostal claim is that the gifts described in the New Testament — healing, prophecy, speaking in tongues and their interpretation — are given to the church now and not only to the first generation of Christians. That belief shapes what actually happens in a meeting far more than it shapes any statement of doctrine: prayer is offered expecting an answer, and people gather round the sick and lay hands on them to pray.',
          'Most Pentecostal churches also teach a baptism in the Holy Spirit, an experience distinct from conversion that empowers a believer for witness and service, and in many of them speaking in tongues is understood as its sign. Worship is treated as an encounter rather than only as instruction, which is why the singing runs long and why people are free to raise their hands, kneel, weep or pray aloud while it continues.',
          'On the core Christian message Pentecostals are ordinarily indistinguishable from other evangelical churches: conversion, the authority of scripture, and an urgency about telling others. The difference lies in emphasis and practice. Church government varies enormously — some belong to structured international fellowships, while a great many are entirely independent and answer to nobody outside their own eldership.',
        ],
      },
      {
        h2: 'Pentecostal worship in Nepal',
        body: [
          'The most useful thing to understand about Nepal is that Pentecostal and charismatic styles of worship run right across Nepali Christianity, including in churches that would not describe themselves as Pentecostal. Prayer for healing, everyone praying out loud at once, long sung worship and testimonies of answered prayer are ordinary features of congregations that on paper are Baptist, evangelical, or simply independent.',
          'This means the word predicts much less here than it would in the United States or Britain. Most Nepali congregations are independent or loosely networked rather than formally denominational, and many identify themselves only as a Nepali Christian church. If you want to know how a church worships, ask what happens in the meeting rather than reading the sign outside.',
          'Music is led on keyboard and guitar, often with the madal or other local percussion, and songs are sung in Nepali and sometimes in other languages of Nepal. Prayer for the sick carries particular weight in a country where good healthcare can be distant and expensive, and it is common to see people bring family members specifically to be prayed for.',
        ],
      },
      {
        h2: 'What a visitor notices',
        body: [
          'Services run long — two hours is unremarkable and longer is common. Sung worship may occupy the first thirty to forty-five minutes, followed by testimonies, notices, a sermon, and then an open time of prayer in which many people pray aloud simultaneously. That last part startles most first-time visitors; it is entirely normal, not a sign that something has gone wrong, and nobody expects you to join in.',
          'Because Saturday is the weekly holiday in Nepal, that is when the main service is held; Nepal moved to a two-day Saturday–Sunday weekend in April 2026, so a few congregations now run a second gathering on Sunday, and midweek prayer meetings and fasting prayer are common besides. Expect to be greeted, asked your name and offered tea afterwards. In many churches you will leave your shoes at the door.',
        ],
      },
      {
        h2: 'Finding a Pentecostal church in Nepal',
        body: [
          'The Church Nepal directory lists churches by city — Kathmandu, Pokhara, Chitwan, Dharan, Butwal and more. It is a new directory, still filling out, and it does not record whether a church is Pentecostal, so it cannot produce a filtered list. Check the church’s own website or social page, or contact it and ask.',
          'A more reliable question than the label is a practical one: do you pray for healing, and how long does the service run. Given how widespread charismatic practice is in Nepal, you may well find what you are looking for in a church whose name mentions no denomination at all.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are there Pentecostal churches in Nepal?',
        a: 'Yes, and Pentecostal worship extends well beyond churches that use the name. Pentecostal and charismatic practice — healing prayer, praying aloud together, extended sung worship — is widespread across Nepali Christianity, including in congregations that would describe themselves simply as Christian.',
      },
      {
        q: 'What is the difference between Pentecostal and charismatic?',
        a: 'Pentecostal usually refers to churches whose identity is built on the gifts of the Spirit, while charismatic describes the same practices appearing within churches of other traditions. In Nepal the distinction matters little, because charismatic practice is common in churches of almost every description.',
      },
      {
        q: 'Where can I find a Pentecostal church in Kathmandu?',
        a: 'Use the Kathmandu city page in the Church Nepal directory as a starting point, then check each church’s own website or contact it directly. The directory does not yet record denomination, so the listing alone will not tell you how a church worships.',
      },
      {
        q: 'Do I have to speak in tongues to attend a Pentecostal church?',
        a: 'No. Nothing is required of a visitor beyond sitting and observing, and no one will single you out during prayer. You are free to stay seated while others stand, sing or pray aloud.',
      },
      {
        q: 'How long is a Pentecostal service in Nepal?',
        a: 'Two hours or more is typical, and some run considerably longer. Extended sung worship at the start and an open time of prayer at the end account for most of the length, so arriving on time and leaving before the close is perfectly acceptable if you have another commitment.',
      },
      {
        q: 'When do Pentecostal churches in Nepal meet?',
        a: 'Saturday, because that is Nepal’s weekly holiday. Since the two-day weekend arrived in April 2026 some churches have added a Sunday gathering, and midweek prayer meetings are common in this tradition.',
      },
    ],
  },

  {
    slug: 'evangelical',
    cluster: 'denomination',
    h1: 'Evangelical Churches in Nepal',
    metaTitle: 'Evangelical Churches in Nepal: What the Word Means',
    metaDescription:
      'Evangelical describes an emphasis, not a denomination. What evangelical churches believe, why the term fits so many Nepali churches, and how to find one.',
    lede:
      'Evangelical describes a set of emphases rather than a denomination — personal conversion, the authority of the Bible, the cross, and a duty to tell others — and it fits a very large share of Nepali churches, including many that also worship in a Pentecostal style.',
    sections: [
      {
        h2: 'What evangelical actually means',
        body: [
          'There is no evangelical denomination, no headquarters and no membership roll. The word names a family of emphases held across many different churches: the Bible as the final authority for belief and behaviour; personal conversion, so that being born into a Christian family is not itself enough; the death of Christ on the cross as the heart of the message; and an obligation to share that message and serve others.',
          'Because it is an emphasis and not a structure, you will find evangelicals inside Anglican, Presbyterian, Methodist, Lutheran and Baptist churches as well as in a vast number of independent ones. Two churches that both call themselves evangelical may disagree about how baptism is done, who governs the church, and whether the gifts of the Spirit operate as they did in the New Testament.',
          'What the word does reliably predict is the shape of a service. Preaching takes a substantial share of the time and works through a passage rather than a theme; singing is congregational; there is usually some invitation to respond to what has been preached; and midweek Bible study or small groups are treated as normal Christian life rather than as an extra for the keen.',
        ],
      },
      {
        h2: 'Evangelical churches in Nepal',
        body: [
          'Most Nepali churches would recognise themselves in that description, which is precisely why the word is a weak filter here. What it does not tell you is anything about structure: the great majority of congregations in Nepal are independent or belong to loose fellowships rather than to denominations, and many are known only by the name of their locality or as a Nepali Christian church.',
          'The combination that most surprises visitors is that a church here is often evangelical in doctrine and charismatic in practice at the same time. In Britain or the United States those instincts frequently belong to separate camps; in Nepal they routinely sit in the same room, and a congregation may work carefully through a Bible passage and then pray over the sick with laying on of hands in the same meeting.',
          'Umbrella fellowships and pastors’ networks do exist, and they matter — for training, for recognising ordination, for shared relief work and for representing churches collectively. But they operate as voluntary associations rather than governing bodies, a church joins because it chooses to, and leadership training is a live priority across nearly all of them.',
        ],
      },
      {
        h2: 'What a visitor notices',
        body: [
          'Bring nothing and expect nothing to be asked of you. The sermon is the anchor of the meeting and the congregation follows it in their own Bibles; someone will often give a testimony of something God has done; and the service closes with prayer, frequently prayer offered aloud by many people at once. Songs are in Nepali, and in many congregations you will sit on the floor with your shoes left at the door.',
          'The gathering is normally on Saturday morning, since Saturday and not Sunday is the weekly holiday in Nepal — Nepal’s shift to a two-day weekend in April 2026 has led some churches to add a Sunday service without displacing the Saturday one. Tea and conversation afterwards are part of the event, and a first-time visitor is likely to be asked their name and where they are from.',
        ],
      },
      {
        h2: 'Finding an evangelical church in Nepal',
        body: [
          'The Church Nepal directory organises churches by city, from Kathmandu and Lalitpur to Pokhara, Biratnagar, Butwal and Nepalgunj. It is a young directory, still growing, and it does not record whether a church calls itself evangelical, so it cannot filter for you — look at the church’s own website or contact it and ask.',
          'Two questions get you further than the label does: what do you preach through on a normal week, and do you have midweek groups. The answers reveal whether a church operates the way evangelical churches usually do, which is far more informative than a word that fits most churches in the country.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What does evangelical mean?',
        a: 'Evangelical describes churches that emphasise personal conversion, the authority of the Bible, the centrality of the cross, and an obligation to share the Christian message. It is not a denomination and has no central organisation, so evangelical churches differ from one another on baptism, church government and worship style.',
      },
      {
        q: 'Are most churches in Nepal evangelical?',
        a: 'A large share of Nepali churches fit the evangelical description, though many would not use the word about themselves. Most congregations in Nepal are independent or loosely networked rather than formally denominational, and often identify simply as Nepali Christian churches.',
      },
      {
        q: 'Is evangelical the same as Pentecostal?',
        a: 'They are not the same, but in Nepal they frequently overlap. Evangelical refers to doctrinal emphases while Pentecostal refers to the present-day work of the Holy Spirit in worship, and a great many Nepali churches are both — evangelical in teaching and charismatic in practice.',
      },
      {
        q: 'Where can I find an evangelical church in Kathmandu?',
        a: 'Begin with the Kathmandu city page in the Church Nepal directory and then check individual churches’ own websites or contact them. The directory is still growing and does not yet record how each church describes itself.',
      },
      {
        q: 'Do I need to be a Christian to attend an evangelical church?',
        a: 'No. Services are open to anyone and visitors are welcome to observe without participating. You will not be asked to give money, sign anything, or explain your beliefs.',
      },
    ],
  },

  {
    slug: 'protestant',
    cluster: 'denomination',
    h1: 'Protestant Churches in Nepal',
    metaTitle: 'Protestant Churches in Nepal: A Plain Guide',
    metaDescription:
      'Protestant covers Baptist, Methodist, Presbyterian, Lutheran and Pentecostal churches. What the term means, and why most Nepali churches are simply independent.',
    lede:
      'Protestant is an umbrella term for the churches descended from the Reformation — Baptist, Methodist, Presbyterian, Lutheran, Anglican, Pentecostal and a great many independent congregations — and in Nepal almost all of them are independent churches that would simply call themselves Christian.',
    sections: [
      {
        h2: 'What Protestant means',
        body: [
          'The term goes back to the sixteenth-century movements in Europe that separated from the Roman Catholic Church. The convictions that held those movements together were that scripture stands as the highest authority for faith, that salvation is God’s gift received by faith rather than earned, that worship and the Bible belong in the ordinary language of the people, and that no priesthood stands between a believer and God.',
          'But Protestant is a family, not a church. It stretches from the highly liturgical — Anglican and Lutheran services with set prayers and a formal calendar — to the completely informal, where a service is songs, a sermon and open prayer with nothing written down. Knowing that a church is Protestant tells you more about what it is not, namely Catholic or Orthodox, than about what it is.',
          'The differences that actually distinguish Protestant churches from each other are practical: whether infants or only professing believers are baptised and by what method, whether the church is governed by bishops, by elders or by the congregation, how the Lord’s Supper is understood, and how formal the worship is. Those four questions will place almost any Protestant church you walk into.',
        ],
      },
      {
        h2: 'Protestant churches in Nepal',
        body: [
          'In Nepal the word is used more by outsiders, researchers and journalists than by churches about themselves. A congregation here is far more likely to describe itself as a Nepali Christian church, as an Isai mandali, or by the name of the neighbourhood it meets in, and a member asked their religion will usually just say Christian.',
          'Structurally, the picture is unlike Britain or the United States. Most Nepali congregations are independent or loosely networked rather than belonging to a denomination with a national office, and formal denominational machinery is the exception. Two churches on the same street may practise almost identically and yet belong to nothing in common, while two churches sharing a network may differ noticeably in style.',
          'There is nevertheless a good deal of common ground you will find in practice across most of them: baptism by immersion for adults who profess faith, a sermon at the centre of the service, sung worship in Nepali led from the front, and Pentecostal or charismatic elements present in a great many congregations whatever tradition they trace back to.',
        ],
      },
      {
        h2: 'What a visit is like',
        body: [
          'Because the category is so broad, the honest answer is that it varies — but a typical Nepali Protestant service opens with sung worship, moves through notices and a testimony or two, gives the largest share of its time to the sermon, and ends with prayer. Shoes come off at the door in many churches, seating may be on the floor or on plastic chairs, and tea afterwards is common.',
          'Note the day before you plan a visit. Saturday is Nepal’s weekly holiday and therefore the day the church gathers, which regularly catches out visitors who arrive on a Sunday to find the building shut. The two-day weekend introduced in April 2026 has allowed some churches to add a Sunday service, but Saturday is still the one to aim for. Visitors are never expected to contribute to the offering.',
        ],
      },
      {
        h2: 'Finding a Protestant church in Nepal',
        body: [
          'Use the Church Nepal directory and its city pages, which cover Kathmandu, Lalitpur, Bhaktapur, Pokhara, Chitwan, Biratnagar, Dharan and others. The directory is new and still growing, and it does not yet record which tradition a church belongs to, so treat it as a way to find churches near you rather than a way to filter by denomination.',
          'To learn where a particular church stands, read its own website or contact it directly. If you are moving to Nepal from a denominational background, the four practical questions above — baptism, governance, communion, formality — will tell you far more in one phone call than any label on a listing.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What is a Protestant church?',
        a: 'A Protestant church is one descended from the sixteenth-century Reformation, holding scripture as the highest authority and salvation as a gift received by faith rather than earned. The term covers many very different traditions, including Baptist, Methodist, Presbyterian, Lutheran, Anglican and Pentecostal churches.',
      },
      {
        q: 'Are there Protestant churches in Nepal?',
        a: 'Yes, and they make up the majority of churches in the country. Most, however, are independent congregations that do not describe themselves as Protestant, preferring to be known simply as Nepali Christian churches.',
      },
      {
        q: 'What denominations are in Nepal?',
        a: 'Nepal has a long-established Catholic presence organised as an apostolic vicariate, along with churches connected to Baptist, Methodist, Presbyterian, Lutheran, Anglican and Pentecostal traditions. The most important thing to know is that most Nepali churches belong to no denomination at all and are independent or loosely networked instead.',
      },
      {
        q: 'What is the difference between Protestant and Catholic churches in Nepal?',
        a: 'A Catholic parish belongs to a worldwide structure, is served by an appointed priest, and centres its worship on the Mass and the sacraments. A Protestant church in Nepal is usually independent, chooses its own leaders, and centres its service on preaching and sung worship.',
      },
      {
        q: 'Where can I find a Protestant church in Kathmandu?',
        a: 'The Kathmandu city page in the Church Nepal directory is the place to start, followed by a look at each church’s own website or a direct enquiry. Denomination is not recorded in the directory yet, so contacting the church is the only reliable way to confirm its tradition.',
      },
    ],
  },

  {
    slug: 'methodist',
    cluster: 'denomination',
    h1: 'Methodist Churches in Nepal',
    metaTitle: 'Methodist Churches in Nepal: Beliefs and Worship',
    metaDescription:
      'Methodism combines warm personal faith, small groups and social service. What Methodists believe, and how the tradition appears in Nepal through partnership.',
    lede:
      'Methodist churches come out of the Wesleyan revival and hold together warm personal faith, disciplined small-group practice and practical service — a tradition present in Nepal more as an influence and a partnership than as a formal Methodist structure.',
    sections: [
      {
        h2: 'What Methodists emphasise',
        body: [
          'Methodism began in the eighteenth century as a renewal movement within the Church of England, led by John and Charles Wesley, and it began as a method: small groups meeting weekly to pray, give account of their lives and encourage one another in practical discipline. That small-group habit is Methodism’s most widely borrowed idea, and churches all over the world use a version of it without knowing where it came from.',
          'Theologically, Methodists stress that God’s grace is offered to everyone rather than to a predetermined few, that a believer can have a settled assurance of being accepted by God, and that Christian life is a lifelong growth in holiness rather than a single moment. Wesley’s insistence that personal holiness and social holiness cannot be separated is the reason Methodist bodies characteristically run schools, clinics and social programmes alongside worship.',
          'Singing carries an unusual weight in this tradition. The Wesleys wrote hymns by the thousand and Methodists have always learned their theology by singing it, so hymnody is closer to teaching than to decoration. Governance is connexional: congregations are linked in circuits under a superintendent, ministers can be moved between churches, and lay preachers carry a large share of the preaching. Both infants and adults are ordinarily baptised.',
        ],
      },
      {
        h2: 'Methodist churches in Nepal',
        body: [
          'Nepal has no large Methodist denominational apparatus of the kind found in Britain, the United States or India. Where a Methodist identity does appear, it generally comes through partnership — a congregation connected to a Methodist body abroad, a pastor who trained at a Methodist seminary, or a church planted with Methodist mission support — rather than through a Nepali connexion with circuits and a conference.',
          'Day to day, those churches run much like other Nepali congregations: independent in feel, Nepali-led, with a pastor known personally to everyone in the room. The parts of the Methodist inheritance that survive most visibly in Nepal are the small-group discipline and the commitment to practical social work, rather than the connexional machinery that would be the most obvious feature elsewhere.',
          'The wider context applies here as everywhere in Nepal: most churches are independent or loosely networked rather than formally denominational, and many combine evangelical teaching with charismatic practice. A Methodist-linked church in Nepal may well include extended prayer and prayer for healing that would look unfamiliar in a Methodist service in Britain.',
        ],
      },
      {
        h2: 'What a visitor notices',
        body: [
          'Where a Methodist connection is real, you tend to see an order of service that is actually followed, older hymns sung alongside contemporary Nepali songs, and lay members leading readings and prayers rather than everything running through the pastor. Communion is usually monthly rather than weekly and, in keeping with the tradition, the invitation to the table is generously worded.',
          'The main service falls on Saturday, Nepal’s weekly holiday, so plan a visit for Saturday morning rather than Sunday; Nepal moved to a two-day weekend in April 2026 and a few churches have added a Sunday gathering since. Midweek small groups are likely to be a genuine part of the church’s life here rather than an optional extra, and visitors are usually invited to one.',
        ],
      },
      {
        h2: 'Finding a Methodist church in Nepal',
        body: [
          'Look through the Church Nepal directory by city — Kathmandu, Lalitpur, Pokhara, Biratnagar, Hetauda and others. Because the directory is new and does not yet record denominations, it cannot show you a Methodist-only list, and any site that claims to has made the data up.',
          'Ask the church directly whether it is affiliated with a Methodist body and, if so, which one. In Nepal the answer is often that a church has a partnership or a training link rather than a formal membership, which is a perfectly honest position and worth understanding before you decide whether it is the church you are looking for.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are there Methodist churches in Nepal?',
        a: 'Yes, though Methodist identity in Nepal usually comes through partnership and training rather than through a large national Methodist structure. Most churches in Nepal are independent or loosely networked, so a Methodist-linked congregation here often functions much like an independent one.',
      },
      {
        q: 'What do Methodists believe?',
        a: 'Methodists teach that God’s grace is offered to everyone, that a believer can have assurance of being accepted by God, and that Christian life is a lifelong growth in holiness expressed in both personal discipline and social service. They came out of the eighteenth-century Wesleyan revival and retain its emphasis on small groups and hymn singing.',
      },
      {
        q: 'Do Methodist churches baptise babies?',
        a: 'Yes, Methodists ordinarily baptise the infant children of believers as well as adults who come to faith. In Nepal this makes a Methodist-linked church unusual, since baptism by immersion for professing adults is the common practice across Nepali churches.',
      },
      {
        q: 'Where can I find a Methodist church in Kathmandu?',
        a: 'Start with the Kathmandu city page in the Church Nepal directory and then contact churches individually to ask about affiliation. The directory does not record denominations yet, so there is no filtered Methodist listing to consult.',
      },
      {
        q: 'Do I need to be a member to attend a Methodist church?',
        a: 'No, services are open to anyone and no one will ask whether you belong. Membership matters for taking on responsibilities within the church, not for attending, and visitors are welcome to come as often or as rarely as they like.',
      },
    ],
  },

  {
    slug: 'presbyterian',
    cluster: 'denomination',
    h1: 'Presbyterian Churches in Nepal',
    metaTitle: 'Presbyterian Churches in Nepal: What to Know',
    metaDescription:
      'Presbyterian churches are Reformed in theology and led by elders, not bishops. What that means in practice, and how the tradition appears in Nepal today.',
    lede:
      'Presbyterian churches are Reformed in theology and governed by elected elders rather than by bishops or by a congregational vote — a structure that in Nepal is inherited through training and partnership far more often than through a working Nepali presbytery.',
    sections: [
      {
        h2: 'How Presbyterian churches are organised, and what they teach',
        body: [
          'The name comes from the Greek word for elder. Each congregation is led by a group of ordained elders sitting together as a session, one of whom is usually the minister who teaches and preaches. Sessions send representatives to a presbytery covering a region, and presbyteries to a wider assembly. The point of the arrangement is that no one person rules a church alone and no church stands entirely alone: authority is shared, and decisions can be appealed upward.',
          'Theologically the tradition is Reformed. It emphasises God’s sovereignty in salvation, reads the Bible through the frame of covenant, and uses written confessions and catechisms to teach the faith in a settled, summarised form that a congregation can learn and hold to across generations. Preaching is central and commonly works steadily through whole books of the Bible rather than jumping between topics.',
          'Worship tends to be ordered and unhurried: scripture read at length, prayers of confession and intercession, a substantial sermon, and psalms and hymns sung by everyone. The aesthetic is deliberate simplicity rather than spectacle. Many Presbyterian churches baptise the infant children of believers on covenant grounds while also baptising adults who come to faith, and the Lord’s Supper is celebrated regularly with careful preparation beforehand.',
        ],
      },
      {
        h2: 'Presbyterian churches in Nepal',
        body: [
          'In Nepal, Presbyterian identity is usually a matter of a pastor’s theological training and a congregation’s partnerships abroad rather than of a functioning presbytery with courts and appeals inside the country. A church may hold Reformed theology sincerely and still have no regional body above it to report to.',
          'That is because most Nepali congregations are independent: they hold their own property, choose their own leaders and answer to no external authority. A church describing itself as Presbyterian in Nepal may therefore be independent in practice, using the word to signal what it believes rather than how it is governed — a distinction worth clarifying before you assume one from the other.',
          'The practice most likely to set such a church apart from its neighbours is baptism. Immersion of professing adults is close to standard across Nepali churches, so a congregation baptising infants stands out immediately. Style is the other visible difference: with charismatic practice widespread in Nepali Christianity, a Reformed-leaning congregation is often noticeably quieter and more structured than the churches around it, which visitors do notice.',
        ],
      },
      {
        h2: 'What a visitor notices',
        body: [
          'Expect a service that keeps to a recognisable order, a sermon that assumes you will follow the argument in an open Bible, and lay elders visibly sharing the leading rather than one person carrying the whole meeting. Teaching often extends beyond the sermon into catechism classes or systematic study, and there may be less spontaneity than in many Nepali churches.',
          'The gathering is on Saturday, since that is the weekly holiday in Nepal rather than Sunday, and April 2026 brought a two-day weekend that has allowed a few churches to add a Sunday service as well. Communion may be held monthly or quarterly rather than weekly, and if you intend to receive it, it is courteous to speak to an elder beforehand.',
        ],
      },
      {
        h2: 'Finding a Presbyterian church in Nepal',
        body: [
          'Search the Church Nepal directory by city — Kathmandu, Lalitpur, Pokhara, Biratnagar, Itahari and others. The directory is new, still growing, and does not yet record denominational affiliation, so it cannot list Presbyterian churches specifically; use it to find churches near you and then verify.',
          'When you contact a church, two questions settle it quickly: who governs this church, and do you baptise infants. A church led by a session of elders that baptises the children of believers is Presbyterian in substance; a church using the name while functioning independently is common in Nepal and worth knowing about in advance rather than discovering later.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are there Presbyterian churches in Nepal?',
        a: 'Yes, though Presbyterian identity in Nepal usually reflects a congregation’s theology and overseas partnerships rather than membership of a Nepali presbytery. Most churches in the country are independent or loosely networked rather than formally denominational.',
      },
      {
        q: 'What is the difference between Presbyterian and Baptist churches?',
        a: 'The main differences are governance and baptism: a Presbyterian church is led by elders who also belong to a regional presbytery, while a Baptist church governs itself through its own members. Presbyterians commonly baptise the infant children of believers as well as adults, whereas Baptists baptise only those old enough to profess faith, by immersion.',
      },
      {
        q: 'Do Presbyterian churches baptise infants?',
        a: 'Most do, on the grounds that the children of believers belong within God’s covenant community. They also baptise adults who come to faith, so both practices exist side by side in the same congregation.',
      },
      {
        q: 'What does Reformed mean?',
        a: 'Reformed describes a theological tradition that emphasises God’s sovereignty in salvation, reads scripture through the framework of covenant, and teaches the faith using written confessions and catechisms. Presbyterian churches are the most common Reformed form, but not the only one.',
      },
      {
        q: 'Where can I find a Presbyterian church in Kathmandu?',
        a: 'Start from the Kathmandu city page in the Church Nepal directory and then contact churches directly to ask how they are governed. The directory does not yet record denomination, so no filtered Presbyterian list exists.',
      },
    ],
  },

  {
    slug: 'anglican',
    cluster: 'denomination',
    h1: 'Anglican Churches in Nepal',
    metaTitle: 'Anglican Churches in Nepal: Liturgy and Visiting',
    metaDescription:
      'Anglican worship uses a shared prayer book and bishops. What Anglicans believe, why the tradition is small in Nepal, and what a visitor can expect there.',
    lede:
      'Anglican churches worship through a shared written liturgy, are led by bishops, and deliberately hold a wide range of styles together — a tradition present in Nepal only in a small way, usually connected to the wider Anglican Communion through structures based outside the country.',
    sections: [
      {
        h2: 'What Anglicans believe and how they worship',
        body: [
          'Anglicanism came out of the English Reformation and kept things from both sides of it. It retained bishops, priests and deacons and a liturgical shape inherited from the ancient church, while adopting Reformation convictions about the authority of scripture and salvation by grace. It is often described as holding scripture, tradition and reason together, with scripture the first among them.',
          'Its real distinctive is common prayer: a shared, written liturgy that the whole congregation says aloud together, rooted in the Book of Common Prayer and its later revisions. The words change little from week to week, which is either the tradition’s great strength or its limitation depending on who you ask — you can pray a liturgy you know by heart while exhausted or grieving, and it will carry you when spontaneous words will not come.',
          'Anglican churches vary far more than the single name suggests. A high church parish may use incense, vestments and a weekly Eucharist; a low or evangelical parish may be sermon-led and visually plain; a charismatic Anglican congregation may pray for healing much as a Pentecostal church would. All three belong to the same communion, so churchmanship tells you more about a particular church than the word Anglican does. Infants are normally baptised and later confirmed by a bishop, and adults coming to faith are baptised.',
        ],
      },
      {
        h2: 'The Anglican tradition in Nepal',
        body: [
          'Anglican presence in Nepal is small. Unlike India, Bangladesh and Pakistan, where churches descended from Anglican mission are large and long established, Nepal has no comparable historic Anglican body, and congregations that identify as Anglican here are few and usually connected to the Communion through structures based outside Nepal.',
          'Some English-language congregations serving international residents worship in a pattern an Anglican visitor would recognise, with set prayers, readings and a communion service, even where the congregation itself is gathered from several traditions. That is often the nearest thing available, and it is worth enquiring about if liturgy is what you are looking for.',
          'Nepali congregations, by contrast, are overwhelmingly independent and non-liturgical. Most Nepali churches are independent or loosely networked rather than formally denominational, and a visitor from an Anglican background will find far more churches resembling a free evangelical or Pentecostal service than an Anglican one. Where a Nepali church does keep a written order of service, it tends to hold it lightly rather than as a fixed text.',
        ],
      },
      {
        h2: 'What a visitor notices',
        body: [
          'In a service following Anglican liturgy you will be handed an order of service or follow one projected on a screen, and you will be expected to say parts aloud with everyone else — the congregation is a participant rather than an audience. Readings follow a set cycle, prayers are said for the church and the world, and communion is normally the high point of the service, with the priest possibly vested.',
          'As everywhere in Nepal, the main gathering falls on Saturday, because Saturday and not Sunday is the country’s weekly holiday; the two-day weekend introduced in April 2026 has made an additional Sunday service possible in some places. Anyone may attend regardless of background, and practice on receiving communion varies between congregations, so ask beforehand if you are unsure whether the invitation extends to you.',
        ],
      },
      {
        h2: 'Finding an Anglican or liturgical service in Nepal',
        body: [
          'The Church Nepal directory lists churches by city, including Kathmandu, Lalitpur, Pokhara and Biratnagar. It is new and still growing and does not record denomination or worship style, so it cannot point you to a liturgical service directly — contact churches to ask, and be specific that you are asking about the form of the service rather than the label.',
          'If you cannot find an Anglican congregation, it is worth knowing that a Catholic parish will feel structurally familiar to anyone raised on Anglican liturgy, though communion practice differs, while an independent Nepali church will feel very different in form even where the beliefs are close. Neither is a substitute for the other; knowing which you are walking into simply saves the surprise.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are there Anglican churches in Nepal?',
        a: 'Anglican presence in Nepal is small, and congregations that identify as Anglican are usually connected to the wider Anglican Communion through structures based outside the country. Nepal has no large historic Anglican body of the kind found elsewhere in South Asia.',
      },
      {
        q: 'Is Anglican the same as Church of England or Episcopal?',
        a: 'They belong to the same worldwide family. The Church of England is the Anglican church in England, Episcopal is the name used in the United States and some other places, and all are part of the Anglican Communion, which shares a broadly common liturgy and leadership by bishops.',
      },
      {
        q: 'Where can I find an Anglican service in Kathmandu?',
        a: 'Start with the Kathmandu city page in the Church Nepal directory and contact churches to ask about their form of worship. The directory does not record denomination or liturgy yet, and because Anglican congregations in Nepal are few, asking directly is the only reliable approach.',
      },
      {
        q: 'Can anyone attend an Anglican service?',
        a: 'Yes, services are open to all and no one will ask about your background at the door. Whether visitors are invited to receive communion varies between congregations, so it is worth asking someone before the service begins.',
      },
      {
        q: 'Are services in Nepal held in English?',
        a: 'Most churches in Nepal worship in Nepali, though some congregations serving international residents hold services in English. Ask when you contact a church, since a service listed in English may still include Nepali songs and announcements.',
      },
    ],
  },

  {
    slug: 'lutheran',
    cluster: 'denomination',
    h1: 'Lutheran Churches in Nepal',
    metaTitle: 'Lutheran Churches in Nepal: Beliefs and Worship',
    metaDescription:
      'Lutherans teach that a person is made right with God by grace through faith. What that means for worship, and how the tradition appears in Nepal today.',
    lede:
      'Lutheran churches teach that a person is made right with God by grace received through faith rather than earned, and centre worship on preaching and the sacraments — a tradition whose presence in Nepal shows mainly through partnerships, training and service work rather than a wide network of parishes.',
    sections: [
      {
        h2: 'What Lutherans believe',
        body: [
          'The tradition takes its name from Martin Luther, whose central conviction was justification: a person is accepted by God as a gift, received by faith, and not achieved through merit or religious performance. Everything else follows from that. A Lutheran sermon is expected to distinguish clearly between God’s demand and God’s gift — law and gospel in the tradition’s own vocabulary — and to leave the hearer holding the gift rather than the demand.',
          'Lutherans baptise infants as well as adults, understanding baptism as God acting rather than the believer testifying, and they hold a high view of the Lord’s Supper: Christ is genuinely present with the bread and wine rather than merely remembered. Confession of sin and a spoken word of absolution often keep a formal place in the service, which strikes visitors from more informal traditions as unusually direct.',
          'Where other Reformation movements stripped worship back sharply, Lutherans kept much of the traditional liturgy and translated it into the language of the people. The tradition’s two great teaching instruments are the catechism, a summary of the faith learned at home as well as at church, and hymnody. Governance differs by country — some Lutheran bodies have bishops, others are organised as synods.',
        ],
      },
      {
        h2: 'The Lutheran tradition in Nepal',
        body: [
          'Nepal has no large Lutheran denominational network. Where a Lutheran presence is visible, it tends to be through partnership rather than parishes: relief and development work, theological education, and support relationships with Lutheran bodies abroad. In practice the tradition is often more recognisable in an institution or a training programme than in a congregation.',
          'A Nepali congregation with a Lutheran connection normally functions much like other churches in the country — independent in practice, Nepali-led, meeting in rented premises with a pastor who knows every family. Since most Nepali churches are independent or loosely networked rather than formally denominational, the Lutheran name here generally signals theology and partnership rather than membership of a chain of parishes.',
          'Two Lutheran practices would make a congregation stand out in Nepal: baptising infants, where baptism by immersion for professing adults is the norm, and following a set liturgy, where informal worship is usual. In reality, congregations with a Lutheran connection frequently follow local practice on both, so it is worth asking rather than assuming.',
        ],
      },
      {
        h2: 'What a visitor notices',
        body: [
          'Where the liturgy is kept, the service has a clear and repeated structure, hymns are sung by the whole congregation, confession and absolution come early, and the sermon carries the weight of the meeting. Communion is treated with particular seriousness — this is the tradition where what is happening at the table is most carefully defined — and the practice on who may receive it varies between Lutheran bodies.',
          'Plan a visit for Saturday. Nepal’s weekly holiday is Saturday rather than Sunday, so that is when congregations gather; the two-day weekend adopted in April 2026 has made Sunday services possible in some churches without replacing the Saturday one. Visitors are welcome to attend without participating and are not expected to give.',
        ],
      },
      {
        h2: 'Finding a Lutheran church in Nepal',
        body: [
          'Browse the Church Nepal directory by city — Kathmandu, Lalitpur, Pokhara, Biratnagar, Dharan and others. The directory is new and still growing, and it does not yet record denominations, so it cannot show a Lutheran-only list; use it to find churches nearby and then check each one’s own website or contact it.',
          'Ask directly whether the church has a Lutheran affiliation or partnership, how it baptises, and whether it uses a set liturgy. In Nepal it is common for the answer to be a mixture — Lutheran links in training and support, local practice in the service — and knowing that in advance prevents an unfair disappointment on either side.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are there Lutheran churches in Nepal?',
        a: 'The Lutheran tradition is present in Nepal mainly through partnerships, theological training and development work rather than through a large network of parishes. Congregations with a Lutheran connection generally function like other Nepali churches, which are mostly independent or loosely networked rather than denominational.',
      },
      {
        q: 'What do Lutherans believe?',
        a: 'Lutherans teach that a person is made right with God by grace, received through faith, and not earned by merit or religious effort. Worship centres on preaching that distinguishes God’s demand from God’s gift, and on the sacraments of baptism and the Lord’s Supper.',
      },
      {
        q: 'Do Lutherans baptise babies?',
        a: 'Yes, Lutherans baptise infants as well as adults, understanding baptism as something God does rather than something the believer performs. In Nepal this is unusual, since most churches practise baptism by immersion for adults who profess faith.',
      },
      {
        q: 'Can I take communion as a visitor at a Lutheran church?',
        a: 'Practice varies between Lutheran bodies, and some ask visitors to speak with the pastor beforehand. The safest approach is to ask before the service rather than deciding at the moment communion is served.',
      },
      {
        q: 'Where can I find a Lutheran church in Kathmandu?',
        a: 'Start with the Kathmandu city page in the Church Nepal directory and then contact churches to ask about affiliation. The directory does not yet record denomination, so there is no filtered Lutheran listing available.',
      },
    ],
  },

  {
    slug: 'assemblies-of-god',
    cluster: 'denomination',
    h1: 'Assemblies of God Churches in Nepal',
    metaTitle: 'Assemblies of God Churches in Nepal',
    metaDescription:
      'The Assemblies of God is a worldwide Pentecostal fellowship of self-governing national bodies. What affiliation means in Nepal and what a service is like.',
    lede:
      'The Assemblies of God is an organised worldwide Pentecostal fellowship made up of self-governing national bodies, so a church using the name in Nepal is Nepali-led and Pentecostal in practice while sharing credentialing, training and mission links with the wider fellowship.',
    sections: [
      {
        h2: 'What the Assemblies of God is',
        body: [
          'Pentecostal describes a style of faith shared by thousands of unrelated churches; the Assemblies of God is something narrower — a specific fellowship with a defined structure. Its distinguishing feature is organisation: ministers are credentialed rather than self-appointed, Bible colleges train them, a missions arm sends and supports workers, and member churches share a written statement of faith. That is the practical difference between an Assemblies of God church and an independent Pentecostal one.',
          'Doctrinally it is classical Pentecostal: salvation through Christ, baptism in the Holy Spirit as an experience that empowers a believer for service, the spiritual gifts including tongues, prophecy and healing as part of ordinary church life, and the return of Christ. Baptism is by immersion for those who profess faith, and the Lord’s Supper is understood as a remembrance.',
          'Structurally, national bodies within the fellowship govern themselves and relate to one another as partners rather than as branches of a head office overseas. Local churches keep a great deal of independence and call their own pastors, but the pastor’s credentials, training and accountability run through the fellowship. That accountability, more than anything in the service itself, is what affiliation buys.',
        ],
      },
      {
        h2: 'Assemblies of God churches in Nepal',
        body: [
          'Where the name appears in Nepal, it generally means a congregation that has chosen to affiliate, often because its pastor trained through the fellowship or wants the accountability and continuing education that credentialing brings. Affiliation is voluntary, and it makes a church no less Nepali — the congregation, the language, the music and the leadership are local.',
          'Set that against the wider picture: most Nepali churches are independent or loosely networked rather than formally denominational, so an affiliated church is an exception in structure rather than in worship. In the meeting itself it will feel much like a great many Nepali churches, because Pentecostal and charismatic practice is widespread across Nepali Christianity regardless of what a church calls itself.',
          'One consequence of affiliation is worth noting for anyone weighing up churches. Fellowships of this kind take ministerial training and the formal recognition of pastors seriously, which is a genuine point of difference in a setting where a great many pastors are trained informally or through short courses. It is not a judgement on independent churches, simply a description of how the two differ.',
        ],
      },
      {
        h2: 'What a visitor notices',
        body: [
          'Extended sung worship opens the service, often for half an hour or more, followed by testimonies, notices, a sermon and a time of prayer in which many people pray aloud at once and those wanting prayer for healing come forward. Services commonly run two hours or longer. Songs are in Nepali, led on keyboard and guitar, frequently with local percussion.',
          'The main gathering is on Saturday, since Saturday is the weekly holiday in Nepal, and Nepal’s move to a two-day weekend in April 2026 has led some churches to add a Sunday service alongside it. Midweek prayer meetings and periods of fasting prayer are a normal part of church life in this tradition, and visitors are welcome at those as well.',
        ],
      },
      {
        h2: 'Finding an Assemblies of God church in Nepal',
        body: [
          'The Church Nepal directory lists churches by city, including Kathmandu, Lalitpur, Pokhara, Chitwan, Biratnagar and Butwal. It is a new directory, still growing, and it does not record denominational affiliation, so it cannot filter for Assemblies of God churches — check the church’s own website or ask directly.',
          'Bear in mind that a church may be affiliated without carrying the name on its sign, and that many independent Pentecostal churches in Nepal worship almost identically to an affiliated one. If affiliation matters to you, ask specifically whether the pastor holds credentials with the fellowship; if the worship style is what matters, the label is not the thing to search for.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is there an Assemblies of God church in Nepal?',
        a: 'Yes, the Assemblies of God is a worldwide Pentecostal fellowship whose national bodies are self-governing, and churches in Nepal affiliate with it voluntarily. Such churches are Nepali-led and function locally much like other Nepali Pentecostal congregations.',
      },
      {
        q: 'What is the difference between the Assemblies of God and other Pentecostal churches?',
        a: 'The Assemblies of God is an organised fellowship with credentialed ministers, Bible colleges and a shared statement of faith, whereas most Pentecostal churches in Nepal are entirely independent. The doctrine and the style of worship are largely the same; the difference is structure and accountability.',
      },
      {
        q: 'Where can I find an Assemblies of God church in Kathmandu?',
        a: 'Use the Kathmandu city page in the Church Nepal directory to find churches nearby, then contact them to ask about affiliation. The directory does not record denomination yet, and affiliated churches do not always carry the name publicly.',
      },
      {
        q: 'What happens in an Assemblies of God service?',
        a: 'A service typically opens with extended sung worship, moves through testimonies and a sermon, and closes with a time of prayer in which people may come forward for prayer for healing. Two hours or more is normal, and visitors are free to sit and observe throughout.',
      },
      {
        q: 'Do I need to be a member to attend?',
        a: 'No, anyone may attend without membership or prior contact. Membership relates to belonging formally to that congregation and taking part in its decisions, not to attending its services.',
      },
    ],
  },

  {
    slug: 'non-denominational',
    cluster: 'denomination',
    h1: 'Non-Denominational Churches in Nepal',
    metaTitle: 'Non-Denominational Churches in Nepal',
    metaDescription:
      'Independent churches are the ordinary shape of a church in Nepal, not a niche. What non-denominational means, how they work, and how to find one near you.',
    lede:
      'A non-denominational church answers to no outside denomination — it writes its own constitution, chooses its own leaders and runs its own affairs — and in Nepal this is not a niche category but the ordinary shape of a church.',
    sections: [
      {
        h2: 'What non-denominational means',
        body: [
          'Independence is a statement about authority, not about belief. No bishop, synod or head office can appoint the pastor, hold the property or settle a dispute; those decisions rest with a local board of elders or with a meeting of members. It does not mean the church has no doctrine — most publish a statement of faith and can tell you exactly what they hold — and it does not mean the church is isolated.',
          'Nearly all independent churches belong to something informal: a pastors’ fellowship, a training network, a mission partnership, an association for shared relief work. These supply teaching, conferences, recognition of ordination and mutual support, and a church can leave one without any legal process. That freedom to walk away is the difference between a network and a denomination.',
          'Because there is no denominational template, practice varies genuinely from church to church. Two independent congregations in the same town can differ on baptism, on women in leadership, on the gifts of the Spirit and on how a service is run, with no external authority to resolve the difference. The gain is adaptability and local ownership; the trade-off is that accountability depends entirely on relationships the church chooses to keep up.',
        ],
      },
      {
        h2: 'Independent churches in Nepal',
        body: [
          'Most Nepali churches are independent or loosely networked rather than formally denominational. This is the default here rather than the alternative, and it regularly surprises visitors from countries where a church states its denomination before anything else. Asking a Nepali pastor which denomination the church belongs to often produces a slightly puzzled answer, because the question assumes a structure that mostly does not exist.',
          'The names reflect it. Churches are commonly named for the neighbourhood they meet in or with a phrase in Nepali, and members describe their congregation simply as a Nepali Christian church. Many combine evangelical teaching with Pentecostal or charismatic practice — a carefully worked-through sermon and prayer for the sick in the same meeting — without treating that as a combination of two things at all.',
          'The practical reality behind the structure is worth knowing: a great many congregations meet in rented rooms, homes or on rooftops, are led by a pastor who also works another job, and were planted by Nepali believers rather than by foreign missions. Independence is not primarily a theological choice here; it is the shape a church takes when it grows out of a household and a neighbourhood.',
        ],
      },
      {
        h2: 'What a visitor notices',
        body: [
          'The name will tell you nothing, so ask. Beyond that, expect a service built around sung worship in Nepali and a sermon, with testimonies, open prayer and a warm and fairly direct welcome — a first-time visitor is likely to be asked their name, where they are from and whether they will come back. Shoes come off at the door in many churches, seating may be on the floor, and tea afterwards is part of the occasion.',
          'The meeting falls on Saturday, Nepal’s weekly holiday, which is the single most useful practical fact for anyone new to the country; since the two-day weekend began in April 2026 a number of churches have added a Sunday service, but Saturday remains the main one. Nothing is expected of a visitor financially, and no one will press you to make any commitment.',
        ],
      },
      {
        h2: 'Finding an independent church in Nepal',
        body: [
          'The Church Nepal directory lists churches by city — Kathmandu, Lalitpur, Bhaktapur, Pokhara, Chitwan, Biratnagar, Dharan, Butwal and more. The directory is new and still growing and does not record denomination, which matters less on this page than on any other: most of the churches you find there will be independent anyway.',
          'To learn what a particular church actually believes and practises, read its own website or social page, or contact it and ask three questions — what do you believe, who leads the church, and are you part of any wider network. Independent churches are generally direct in answering, and the answers will tell you far more than any label could.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What is a non-denominational church?',
        a: 'A non-denominational church is one that belongs to no denomination and governs itself, choosing its own leaders, holding its own property and setting its own practice. It usually still has a clear statement of belief and often belongs to informal networks for training and support.',
      },
      {
        q: 'Are most churches in Nepal non-denominational?',
        a: 'Yes, most Nepali churches are independent or loosely networked rather than formally denominational. Many describe themselves simply as Nepali Christian churches and combine evangelical teaching with Pentecostal or charismatic practice, whatever label an outsider might apply.',
      },
      {
        q: 'How do I know what an independent church believes?',
        a: 'Ask the church directly, or read the statement of faith on its own website. Because there is no denomination standing behind it, the only reliable source on an independent church’s beliefs and practice is the church itself.',
      },
      {
        q: 'Is an independent church less accountable than a denominational one?',
        a: 'It has no external body that can intervene, so accountability depends on the relationships and networks the church chooses to maintain. Many independent churches in Nepal belong to pastors’ fellowships and training networks precisely for that reason, and it is a fair question to ask when you visit.',
      },
      {
        q: 'Where can I find a non-denominational church in Kathmandu?',
        a: 'The Kathmandu city page in the Church Nepal directory is the place to start, and most churches listed there are likely to be independent. Contact a church directly to confirm what it believes and how it is led, since the directory does not yet record that information.',
      },
      {
        q: 'What day do independent churches in Nepal meet?',
        a: 'Almost all of them gather on Saturday, which is Nepal’s weekly holiday. A number have added a Sunday service since Nepal adopted a two-day Saturday–Sunday weekend in April 2026, but Saturday morning is still when you will find the church full.',
      },
    ],
  },
];
