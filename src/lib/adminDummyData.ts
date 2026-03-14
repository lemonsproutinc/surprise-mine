export interface DummyUser {
  id: string
  name: string
  email: string
  relationship_stage: string
  partner_name: string
  invite_code: string
  hearts: number
  streak: number
  created_at: string
}

export interface DummyCouple {
  id: string
  user1: DummyUser
  user2: DummyUser
  created_at: string
  milestone_count: number
  gifts_exchanged: number
}

export interface DummyQuestion {
  id: string
  text: string
  category: string
  category_emoji: string
  intensity: string
  answers: { user_name: string; answer: string; date: string }[]
  avg_rating: number
  total_ratings: number
}

export interface DummyGift {
  id: string
  sender_name: string
  recipient_name: string
  gift_type: string
  gift_emoji: string
  message: string
  date: string
  opened: boolean
}

export interface DummyMilestone {
  id: string
  couple_names: string
  milestone_type: string
  type_emoji: string
  title: string
  date: string
  note: string
  has_photo: boolean
}

export interface DummyRating {
  id: string
  question_text: string
  user_name: string
  rating: number
  date: string
}

export interface AdminDummyData {
  users: DummyUser[]
  couples: DummyCouple[]
  questions: DummyQuestion[]
  gifts: DummyGift[]
  milestones: DummyMilestone[]
  ratings: DummyRating[]
}

function randomDate(daysBack: number): string {
  const now = new Date()
  const past = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000)
  return past.toISOString()
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateDummyData(): AdminDummyData {
  // --- Users ---
  const userSeeds: { name: string; email: string; stage: string; partnerIdx: number }[] = [
    { name: 'Sarah Chen', email: 'sarah.chen@email.com', stage: 'dating', partnerIdx: 1 },
    { name: 'Marcus Johnson', email: 'marcus.j@email.com', stage: 'dating', partnerIdx: 0 },
    { name: 'Priya Patel', email: 'priya.patel@email.com', stage: 'engaged', partnerIdx: 3 },
    { name: 'James O\'Brien', email: 'james.obrien@email.com', stage: 'engaged', partnerIdx: 2 },
    { name: 'Aisha Mohammed', email: 'aisha.m@email.com', stage: 'married', partnerIdx: 5 },
    { name: 'David Kim', email: 'david.kim@email.com', stage: 'married', partnerIdx: 4 },
    { name: 'Luna Rodriguez', email: 'luna.r@email.com', stage: 'dating', partnerIdx: 7 },
    { name: 'Ethan Nakamura', email: 'ethan.n@email.com', stage: 'dating', partnerIdx: 6 },
    { name: 'Olivia Taylor', email: 'olivia.t@email.com', stage: 'long_distance', partnerIdx: 9 },
    { name: 'Noah Williams', email: 'noah.w@email.com', stage: 'long_distance', partnerIdx: 8 },
  ]

  const users: DummyUser[] = userSeeds.map((seed, idx) => ({
    id: crypto.randomUUID(),
    name: seed.name,
    email: seed.email,
    relationship_stage: seed.stage,
    partner_name: userSeeds[seed.partnerIdx].name,
    invite_code: `SM-${seed.name.split(' ')[0].toUpperCase().slice(0, 3)}${randomInt(100, 999)}`,
    hearts: randomInt(0, 650),
    streak: randomInt(0, 30),
    created_at: randomDate(180),
  }))

  // --- Couples ---
  const coupleIndices = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]
  const couples: DummyCouple[] = coupleIndices.map(([i1, i2]) => ({
    id: crypto.randomUUID(),
    user1: users[i1],
    user2: users[i2],
    created_at: randomDate(180),
    milestone_count: randomInt(1, 8),
    gifts_exchanged: randomInt(2, 20),
  }))

  // --- Questions ---
  const questionSeeds: { text: string; category: string; emoji: string; intensity: string }[] = [
    { text: 'What is your favorite memory of us together?', category: 'Memories', emoji: '📸', intensity: 'light' },
    { text: 'What is one thing I do that always makes you smile?', category: 'Appreciation', emoji: '😊', intensity: 'light' },
    { text: 'Where do you see us in five years?', category: 'Future', emoji: '🔮', intensity: 'deep' },
    { text: 'What is something new you would like us to try together?', category: 'Adventures', emoji: '🌟', intensity: 'medium' },
    { text: 'How do you most like to receive love?', category: 'Love Languages', emoji: '💕', intensity: 'medium' },
    { text: 'What was the moment you knew you loved me?', category: 'Memories', emoji: '📸', intensity: 'deep' },
    { text: 'What is your ideal Sunday morning with me?', category: 'Daily Life', emoji: '☀️', intensity: 'light' },
    { text: 'If we could travel anywhere tomorrow, where would we go?', category: 'Adventures', emoji: '🌟', intensity: 'light' },
    { text: 'What is something I could do more of to make you feel loved?', category: 'Love Languages', emoji: '💕', intensity: 'deep' },
    { text: 'What song reminds you of our relationship?', category: 'Fun', emoji: '🎵', intensity: 'light' },
    { text: 'What is the hardest challenge we have overcome together?', category: 'Growth', emoji: '🌱', intensity: 'deep' },
    { text: 'What do you admire most about me?', category: 'Appreciation', emoji: '😊', intensity: 'medium' },
    { text: 'What is one thing you wish we did more often?', category: 'Daily Life', emoji: '☀️', intensity: 'medium' },
    { text: 'What is a goal you want us to accomplish together this year?', category: 'Future', emoji: '🔮', intensity: 'medium' },
    { text: 'What is your favorite meal we have shared?', category: 'Memories', emoji: '📸', intensity: 'light' },
    { text: 'How can I better support you when you are stressed?', category: 'Growth', emoji: '🌱', intensity: 'deep' },
    { text: 'What is a small everyday thing I do that you love?', category: 'Appreciation', emoji: '😊', intensity: 'light' },
    { text: 'What is something you have never told me but want to?', category: 'Vulnerability', emoji: '🤍', intensity: 'deep' },
    { text: 'What is your favorite way to spend a rainy day together?', category: 'Daily Life', emoji: '☀️', intensity: 'light' },
    { text: 'If we had a couple superpower, what would it be?', category: 'Fun', emoji: '🎵', intensity: 'light' },
    { text: 'What is the most thoughtful thing I have ever done for you?', category: 'Appreciation', emoji: '😊', intensity: 'medium' },
    { text: 'What does home mean to you?', category: 'Vulnerability', emoji: '🤍', intensity: 'deep' },
    { text: 'What is a tradition you want us to start?', category: 'Future', emoji: '🔮', intensity: 'medium' },
    { text: 'What is your biggest dream for our family?', category: 'Future', emoji: '🔮', intensity: 'deep' },
    { text: 'What activity makes you feel most connected to me?', category: 'Love Languages', emoji: '💕', intensity: 'medium' },
    { text: 'What is something funny that happened to us that still makes you laugh?', category: 'Fun', emoji: '🎵', intensity: 'light' },
    { text: 'What have you learned about yourself through our relationship?', category: 'Growth', emoji: '🌱', intensity: 'deep' },
    { text: 'What is one thing about me that surprised you when we first met?', category: 'Memories', emoji: '📸', intensity: 'medium' },
    { text: 'How do you feel when we are apart for a long time?', category: 'Vulnerability', emoji: '🤍', intensity: 'deep' },
    { text: 'What is your favorite date night idea?', category: 'Adventures', emoji: '🌟', intensity: 'light' },
    { text: 'What would you want our love story to be titled?', category: 'Fun', emoji: '🎵', intensity: 'light' },
    { text: 'What role does trust play in our relationship for you?', category: 'Growth', emoji: '🌱', intensity: 'deep' },
  ]

  const answerPool: Record<string, string[]> = {
    Memories: [
      'Our first trip to the coast, watching the sunset on the beach.',
      'The night we stayed up until 3am talking on the phone.',
      'When you surprised me with breakfast in bed on a random Tuesday.',
      'Our picnic in the park during that unexpected warm day in October.',
    ],
    Appreciation: [
      'The way you always remember the little things.',
      'How you make me coffee every morning without being asked.',
      'Your laugh is infectious and always brightens my day.',
      'You always know exactly what to say when I am having a bad day.',
    ],
    Future: [
      'I see us traveling the world together and building a life we love.',
      'Living in a cozy house with a garden and maybe a dog or two.',
      'Growing together, supporting each other through everything life throws at us.',
      'I want us to build something meaningful, together.',
    ],
    Adventures: [
      'I would love for us to go on a road trip with no set destination.',
      'Learning to cook a new cuisine together every month.',
      'Hiking a new trail every weekend this summer.',
      'Taking a pottery class together sounds like so much fun.',
    ],
    'Love Languages': [
      'Quality time means the most to me, just being present together.',
      'Words of affirmation really fill my cup.',
      'Physical touch, like holding hands or a random hug.',
      'When you do little acts of service, it makes me feel so cared for.',
    ],
    'Daily Life': [
      'Slow mornings with coffee and a good book side by side.',
      'Cooking dinner together while music plays in the background.',
      'Evening walks around the neighborhood.',
      'Just being on the couch together, doing our own things but together.',
    ],
    Fun: [
      'That song that was playing when we had our first dance!',
      'Definitely "You Are My Sunshine" — cheesy but true!',
      'Something epic, like "The Greatest Adventure".',
      'Our love story would be called "Unexpected Magic".',
    ],
    Growth: [
      'Moving to a new city together and rebuilding our social lives.',
      'Learning to communicate better after our first big disagreement.',
      'I have learned to be more patient and open-hearted.',
      'Trust is the foundation of everything we have built together.',
    ],
    Vulnerability: [
      'I sometimes worry I am not doing enough to show how much I care.',
      'Home is wherever you are, honestly.',
      'I miss you even when you are just in the next room sometimes.',
      'I have never felt this safe with anyone before.',
    ],
  }

  const questions: DummyQuestion[] = questionSeeds.map((seed) => {
    const answerCount = randomInt(2, 8)
    const answers: { user_name: string; answer: string; date: string }[] = []
    for (let i = 0; i < answerCount; i++) {
      const user = pick(users)
      const categoryAnswers = answerPool[seed.category] || answerPool['Fun']
      answers.push({
        user_name: user.name,
        answer: pick(categoryAnswers),
        date: randomDate(90),
      })
    }
    const ratings = answers.map(() => randomInt(3, 5))
    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

    return {
      id: crypto.randomUUID(),
      text: seed.text,
      category: seed.category,
      category_emoji: seed.emoji,
      intensity: seed.intensity,
      answers,
      avg_rating: Math.round(avg * 10) / 10,
      total_ratings: randomInt(answerCount, answerCount + 15),
    }
  })

  // --- Gifts ---
  const giftTypes: { type: string; emoji: string; messages: string[] }[] = [
    { type: 'Love Letter', emoji: '💌', messages: ['You mean the world to me.', 'Every day with you is a gift.', 'Just wanted to remind you how much I love you.'] },
    { type: 'Virtual Flower', emoji: '🌹', messages: ['A rose for the most beautiful person I know.', 'Sending you flowers because you deserve them.', 'Brightening your day, one petal at a time.'] },
    { type: 'Song Dedication', emoji: '🎶', messages: ['This song reminds me of you.', 'Listen to this and think of me.', 'Our song, always.'] },
    { type: 'Compliment Bomb', emoji: '💣', messages: ['You are incredibly kind and talented.', 'Your smile lights up every room.', 'I am so proud of who you are.'] },
    { type: 'Memory Photo', emoji: '📷', messages: ['Remember this day? One of my favorites.', 'Look at us! So happy.', 'Throwback to the best day ever.'] },
    { type: 'Surprise Poem', emoji: '📝', messages: ['Roses are red, violets are blue, no one compares to you.', 'A few words from the heart.', 'I wrote this thinking of you.'] },
    { type: 'Virtual Hug', emoji: '🤗', messages: ['Sending you the biggest hug!', 'Wish I could hold you right now.', 'A warm hug for you, from me.'] },
    { type: 'Star Map', emoji: '⭐', messages: ['The stars on the night we met.', 'Our constellations, always aligned.', 'Looking up and thinking of you.'] },
  ]

  const gifts: DummyGift[] = []
  for (let i = 0; i < 18; i++) {
    const couple = pick(couples)
    const isSenderFirst = Math.random() > 0.5
    const sender = isSenderFirst ? couple.user1 : couple.user2
    const recipient = isSenderFirst ? couple.user2 : couple.user1
    const giftType = pick(giftTypes)
    gifts.push({
      id: crypto.randomUUID(),
      sender_name: sender.name,
      recipient_name: recipient.name,
      gift_type: giftType.type,
      gift_emoji: giftType.emoji,
      message: pick(giftType.messages),
      date: randomDate(120),
      opened: Math.random() > 0.25,
    })
  }

  // --- Milestones ---
  const milestoneTypes: { type: string; emoji: string; titles: string[] }[] = [
    { type: 'Anniversary', emoji: '🎉', titles: ['1 Month Together!', '6 Month Anniversary', '1 Year of Love', '100 Days Together'] },
    { type: 'First', emoji: '✨', titles: ['First Date', 'First Kiss', 'First Trip Together', 'First Home-Cooked Meal Together'] },
    { type: 'Achievement', emoji: '🏆', titles: ['30-Day Streak!', '100 Hearts Earned', 'Answered 50 Questions', 'All Categories Explored'] },
    { type: 'Travel', emoji: '✈️', titles: ['Trip to Paris', 'Beach Weekend Getaway', 'Road Trip Adventure', 'Camping Under the Stars'] },
    { type: 'Personal', emoji: '💛', titles: ['Met the Parents', 'Moved In Together', 'Adopted a Pet', 'Said I Love You'] },
  ]

  const milestoneNotes = [
    'Such an unforgettable moment for both of us.',
    'We will never forget this day!',
    'A beautiful chapter in our story.',
    'So grateful we got to experience this together.',
    'One of those memories you hold onto forever.',
    'This changed everything for us, in the best way.',
  ]

  const milestones: DummyMilestone[] = []
  for (let i = 0; i < 14; i++) {
    const couple = pick(couples)
    const mt = pick(milestoneTypes)
    milestones.push({
      id: crypto.randomUUID(),
      couple_names: `${couple.user1.name} & ${couple.user2.name}`,
      milestone_type: mt.type,
      type_emoji: mt.emoji,
      title: pick(mt.titles),
      date: randomDate(180),
      note: pick(milestoneNotes),
      has_photo: Math.random() > 0.4,
    })
  }

  // --- Ratings ---
  const ratings: DummyRating[] = []
  for (let i = 0; i < 25; i++) {
    const question = pick(questions)
    const user = pick(users)
    ratings.push({
      id: crypto.randomUUID(),
      question_text: question.text,
      user_name: user.name,
      rating: randomInt(1, 5),
      date: randomDate(90),
    })
  }

  return { users, couples, questions, gifts, milestones, ratings }
}
