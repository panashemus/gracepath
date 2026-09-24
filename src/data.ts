import type { CategoryOption, ToneOption } from './types';

export const CATEGORIES: CategoryOption[] = [
  { id: 'financial', label: 'Financial Breakthrough', icon: 'HandCoins' },
  { id: 'peace', label: 'Inner Peace & Anxiety', icon: 'Waves' },
  { id: 'healing', label: 'Healing & Health', icon: 'HeartPulse' },
  { id: 'family', label: 'Family & Relationships', icon: 'Users' },
  { id: 'purpose', label: 'Finding Purpose', icon: 'Compass' },
  { id: 'career', label: 'Career & Work', icon: 'Briefcase' },
  { id: 'grief', label: 'Grief & Loss', icon: 'Dove' },
  { id: 'faith', label: 'Faith & Doubt', icon: 'Flame' },
];

export const TONES: ToneOption[] = [
  {
    id: 'uplifting',
    label: 'Uplifting & Celebratory',
    description: 'Joyful, hopeful, full of praise and expectation',
  },
  {
    id: 'intercession',
    label: 'Deep Intercession',
    description: 'Earnest, fervent, standing in the gap with boldness',
  },
  {
    id: 'calming',
    label: 'Calming & Comforting',
    description: 'Gentle, soothing, like a quiet whisper of peace',
  },
];

export const TRANSLATIONS = ['NIV', 'KJV', 'ESV', 'NLT'] as const;

export interface ScriptureEntry {
  reference: string;
  text: Record<string, string>;
}

export const SCRIPTURE_LIBRARY: Record<string, ScriptureEntry[]> = {
  financial: [
    {
      reference: 'Philippians 4:19',
      text: {
        NIV: 'And my God will meet all your needs according to the riches of his glory in Christ Jesus.',
        KJV: 'But my God shall supply all your need according to his riches in glory by Christ Jesus.',
        ESV: 'And my God will supply every need of yours according to his riches in glory in Christ Jesus.',
        NLT: 'And this same God who takes care of me will supply all your needs from his glorious riches, which have been given to us in Christ Jesus.',
      },
    },
    {
      reference: 'Matthew 6:31-33',
      text: {
        NIV: 'So do not worry, saying, "What shall we eat?" or "What shall we drink?" or "What shall we wear?" ... But seek first his kingdom and his righteousness, and all these things will be given to you as well.',
        KJV: 'Therefore take no thought, saying, What shall we eat? or, What shall we drink? ... But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
        ESV: 'Therefore do not be anxious, saying, "What shall we eat?" ... But seek first the kingdom of God and his righteousness, and all these things will be added to you.',
        NLT: 'So don\u2019t worry about these things, saying, "What will we eat? ... Seek the Kingdom of God above all else, and live righteously, and he will give you everything you need.',
      },
    },
    {
      reference: '2 Corinthians 9:8',
      text: {
        NIV: 'And God is able to bless you abundantly, so that in all things at all times, having all that you need, you will abound in every good work.',
        KJV: 'And God is able to make all grace abound toward you; that ye, always having all sufficiency in all things, may abound to every good work.',
        ESV: 'And God is able to make all grace abound to you, so that having all sufficiency in all things at all times, you may abound in every good work.',
        NLT: 'And God will generously provide all you need. Then you will always have everything you need and plenty left over to share with others.',
      },
    },
  ],
  peace: [
    {
      reference: 'Philippians 4:6-7',
      text: {
        NIV: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
        KJV: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
        ESV: 'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.',
        NLT: 'Don\u2019t worry about anything; instead, pray about everything. Tell God what you need, and thank him for all he has done. Then you will experience God\u2019s peace, which exceeds anything we can understand. His peace will guard your hearts and minds as you live in Christ Jesus.',
      },
    },
    {
      reference: 'Isaiah 26:3',
      text: {
        NIV: 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.',
        KJV: 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.',
        ESV: 'You keep him in perfect peace whose mind is stayed on you, because he trusts in you.',
        NLT: 'You will keep in perfect peace all who trust in you, all whose thoughts are fixed on you!',
      },
    },
    {
      reference: 'John 14:27',
      text: {
        NIV: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.',
        KJV: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
        ESV: 'Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.',
        NLT: 'I am leaving you with a gift\u2014peace of mind and heart. And the peace I give is a gift the world cannot give. So don\u2019t be troubled or afraid.',
      },
    },
  ],
  healing: [
    {
      reference: 'Jeremiah 30:17',
      text: {
        NIV: 'But I will restore you to health and heal your wounds, declares the LORD.',
        KJV: 'For I will restore health unto thee, and I will heal thee of thy wounds, saith the LORD.',
        ESV: 'For I will restore health to you, and your wounds I will heal, declares the LORD.',
        NLT: 'I will give you back your health and heal your wounds, says the LORD.',
      },
    },
    {
      reference: 'Psalm 103:2-3',
      text: {
        NIV: 'Praise the LORD, my soul, and forget not all his benefits\u2014who forgives all your sins and heals all your diseases.',
        KJV: 'Bless the LORD, O my soul, and forget not all his benefits: Who forgiveth all thine iniquities; who healeth all thy diseases;',
        ESV: 'Bless the LORD, O my soul, and forget not all his benefits, who forgives all your iniquity, who heals all your diseases.',
        NLT: 'Let all that I am praise the LORD; may I never forget the good things he does for me. He forgives all my sins and heals all my diseases.',
      },
    },
    {
      reference: 'Isaiah 53:5',
      text: {
        NIV: 'But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed.',
        KJV: 'But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.',
        ESV: 'But he was pierced for our transgressions; he was crushed for our iniquities; upon him was the chastisement that brought us peace, and with his wounds we are healed.',
        NLT: 'But he was pierced for our rebellion, crushed for our sins. He was beaten so we could be whole. He was whipped so we could be healed.',
      },
    },
  ],
  family: [
    {
      reference: 'Joshua 24:15',
      text: {
        NIV: 'As for me and my household, we will serve the LORD.',
        KJV: 'But as for me and my house, we will serve the LORD.',
        ESV: 'But as for me and my house, we will serve the LORD.',
        NLT: 'But as for me and my family, we will serve the LORD.',
      },
    },
    {
      reference: 'Colossians 3:13-14',
      text: {
        NIV: 'Bear with each other and forgive one another ... Forgive as the Lord forgave you. And over all these virtues put on love, which binds them all together in perfect unity.',
        KJV: 'Forbearing one another, and forgiving one another ... even as Christ forgave you, so also do ye. And above all these things put on charity, which is the bond of perfectness.',
        ESV: 'Bearing with one another and, if one has a complaint against another, forgiving each other ... as the Lord has forgiven you, so you also must forgive. And above all these put on love, which binds everything together in perfect harmony.',
        NLT: 'Make allowance for each other\u2019s faults, and forgive anyone who offends you. Remember, the Lord forgave you, so you must forgive others. Above all, clothe yourselves with the bond of perfect harmony.',
      },
    },
    {
      reference: 'Proverbs 22:6',
      text: {
        NIV: 'Start children off on the way they should go, and even when they are old they will not turn from it.',
        KJV: 'Train up a child in the way he should go: and when he is old, he will not depart from it.',
        ESV: 'Train up a child in the way he should go; even when he is old he will not depart from it.',
        NLT: 'Direct your children onto the right path, and when they are older, they will not leave it.',
      },
    },
  ],
  purpose: [
    {
      reference: 'Jeremiah 29:11',
      text: {
        NIV: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.',
        KJV: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
        ESV: 'For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope.',
        NLT: 'For I know the plans I have for you, says the LORD. They are plans for good and not for disaster, to give you a future and a hope.',
      },
    },
    {
      reference: 'Ephesians 2:10',
      text: {
        NIV: 'For we are God\u2019s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.',
        KJV: 'For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.',
        ESV: 'For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them.',
        NLT: 'For we are God\u2019s masterpiece. He has created us anew in Christ Jesus, so we can do the good things he planned for us long ago.',
      },
    },
    {
      reference: 'Proverbs 3:5-6',
      text: {
        NIV: 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
        KJV: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
        ESV: 'Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.',
        NLT: 'Trust in the LORD with all your heart; do not depend on your own understanding. Seek his will in all you do, and he will show you which path to take.',
      },
    },
  ],
  career: [
    {
      reference: 'Colossians 3:23-24',
      text: {
        NIV: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward.',
        KJV: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men; Knowing that of the Lord ye shall receive the reward of the inheritance.',
        ESV: 'Whatever you do, work heartily, as for the Lord and not for men, knowing that from the Lord you will receive the inheritance as your reward.',
        NLT: 'Work willingly at whatever you do, as though you were working for the Lord rather than for people. Remember that the Lord will give you an inheritance as your reward.',
      },
    },
    {
      reference: 'Proverbs 16:3',
      text: {
        NIV: 'Commit to the LORD whatever you do, and he will establish your plans.',
        KJV: 'Commit thy works unto the LORD, and thy thoughts shall be established.',
        ESV: 'Commit your work to the LORD, and your plans will be established.',
        NLT: 'Commit your actions to the LORD, and your plans will succeed.',
      },
    },
    {
      reference: 'Psalm 90:17',
      text: {
        NIV: 'May the favor of the Lord our God rest on us; establish the work of our hands for us\u2014yes, establish the work of our hands.',
        KJV: 'And let the beauty of the LORD our God be upon us: and establish thou the work of our hands upon us; yea, the work of our hands establish thou it.',
        ESV: 'Let the favor of the Lord our God be upon us, and establish the work of our hands upon us; yes, establish the work of our hands!',
        NLT: 'And may the Lord our God show us his approval and make our efforts successful. Yes, make our efforts successful!',
      },
    },
  ],
  grief: [
    {
      reference: 'Psalm 34:18',
      text: {
        NIV: 'The LORD is close to the brokenhearted and saves those who are crushed in spirit.',
        KJV: 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
        ESV: 'The LORD is near to the brokenhearted and saves the crushed in spirit.',
        NLT: 'The LORD is close to the brokenhearted; he rescues those whose spirits are crushed.',
      },
    },
    {
      reference: 'Revelation 21:4',
      text: {
        NIV: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.',
        KJV: 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.',
        ESV: 'He will wipe away every tear from their eyes, and death shall be no more, neither shall there be mourning, nor crying, nor pain anymore, for the former things have passed away.',
        NLT: 'He will wipe every tear from their eyes, and there will be no more death or sorrow or crying or pain. All these things are gone forever.',
      },
    },
    {
      reference: 'Matthew 5:4',
      text: {
        NIV: 'Blessed are those who mourn, for they will be comforted.',
        KJV: 'Blessed are they that mourn: for they shall be comforted.',
        ESV: 'Blessed are those who mourn, for they shall be comforted.',
        NLT: 'God blesses those who mourn, for they will be comforted.',
      },
    },
  ],
  faith: [
    {
      reference: 'Hebrews 11:1',
      text: {
        NIV: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
        KJV: 'Now faith is the substance of things hoped for, the evidence of things not seen.',
        ESV: 'Now faith is the assurance of things hoped for, the conviction of things not seen.',
        NLT: 'Faith shows the reality of what we hope for; it is the evidence of things we cannot see.',
      },
    },
    {
      reference: 'Mark 9:24',
      text: {
        NIV: 'I do believe; help me overcome my unbelief!',
        KJV: 'Lord, I believe; help thou mine unbelief.',
        ESV: 'I believe; help my unbelief!',
        NLT: 'I do believe, but help me overcome my unbelief!',
      },
    },
    {
      reference: 'Romans 8:28',
      text: {
        NIV: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
        KJV: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
        ESV: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.',
        NLT: 'And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for them.',
      },
    },
  ],
};

export const LOADING_QUOTES = [
  'Be still, and know that I am God. — Psalm 46:10',
  'The Lord is my shepherd; I shall not want. — Psalm 23:1',
  'They who wait for the Lord shall renew their strength. — Isaiah 40:31',
  'Cast your burden on the Lord, and he will sustain you. — Psalm 55:22',
  'The Lord is near to all who call on him. — Psalm 145:18',
  'Trust in the Lord with all your heart. — Proverbs 3:5',
  'Come to me, all who labor and are heavy laden, and I will give you rest. — Matthew 11:28',
];
