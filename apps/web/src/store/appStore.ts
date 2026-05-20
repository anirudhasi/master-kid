import { create } from 'zustand'
import axios from 'axios'

// ── Core types ────────────────────────────────────────────────────────────────
export type Mood = 'happy' | 'neutral' | 'tired' | 'excited'
export type Board = 'CBSE' | 'ICSE' | 'IB' | 'State Board'
export type Stage = 'pre-nursery' | 'nursery' | 'lkg' | 'ukg' | 'primary' | 'middle' | 'secondary' | 'senior'
export type Subscription = 'free' | 'advanced' | 'pro'

export interface LogEntry {
  id: string; subject: string; activity: string
  durationMinutes: number; mood: Mood; createdAt: string
}

export interface TutorSession {
  id: string; topics: string[]; homework: string[]
  notes: string; createdAt: string
}

// ── Student Profile ───────────────────────────────────────────────────────────
export interface SubjectGoal {
  subject: string; active: boolean; weeklyMinutes: number
}

export interface StudentProfile {
  avatar: string; grade: string; school: string; age: number
  board: Board; city: string; stage: Stage
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic'
  weeklyXpGoal: number; subjectGoals: SubjectGoal[]
  parentName: string; parentPhone: string; linkedTutors: string[]
  bio: string; sports: string[]; extracurricular: string[]
  cocurricular: string[]; languages: string[]
  lifeGoal: string; targetYear: number
  photoUrl?: string; parentPhotoUrl?: string
}

// ── Syllabus types ────────────────────────────────────────────────────────────
export interface ChapterTopic {
  id: string; name: string; isCompleted: boolean; completedDate?: string
}

export interface SyllabusChapter {
  id: string; name: string; topics: ChapterTopic[]
  targetStartDate: string; targetEndDate: string
  actualStartDate?: string; actualEndDate?: string
  status: 'not-started' | 'in-progress' | 'completed' | 'revised'
  notes: string; testScheduled?: string
}

export interface SyllabusSubject {
  id: string; name: string; icon: string
  color: string; colorLight: string
  textbook: string; teacher: string
  chapters: SyllabusChapter[]
}

// ── Olympiad types ────────────────────────────────────────────────────────────
export interface OlympiadExam {
  id: string; name: string; shortName: string; organizer: string
  subject: string; subjectIcon: string
  examDate: string; registrationDeadline: string
  isRegistered: boolean; isAttending: boolean
  difficultyNote: string; prepTopics: string[]; prepProgress: number
  pastResult?: { year: number; rank: string; score: number }
  currentResult?: { rank: string; score: number; certificate: string }
}

// ── Activity types ────────────────────────────────────────────────────────────
export interface ActivitySession {
  day: string; startTime: string; endTime: string; venue: string
}

export interface ExtraActivity {
  id: string; name: string; category: 'sports' | 'arts' | 'music' | 'dance'
  icon: string; color: string; instructor: string
  yearsActive: number; level: string
  schedule: ActivitySession[]
  nextExamDate?: string; nextExamName?: string
  lastExamResult?: string; achievements: string[]
}

// ── Weekly schedule types ─────────────────────────────────────────────────────
export interface ScheduleBlock {
  id: string; startTime: string; endTime: string
  category: 'school' | 'swimming' | 'dance' | 'drawing' | 'music' | 'study' | 'homework' | 'meal' | 'break' | 'free' | 'sleep'
  label: string; subject?: string; topic?: string
  recommendedTopic?: string; isOverridden: boolean
  isAIRecommended: boolean; location?: string
}

export interface DaySchedule {
  day: string; slots: ScheduleBlock[]
}

// ── Worksheet types ───────────────────────────────────────────────────────────
export interface WorksheetQuestion {
  id: string; text: string; type: 'mcq' | 'short' | 'fill-blank' | 'true-false'
  options?: string[]; answer: string; hint?: string
}

export interface Worksheet {
  id: string; subject: string; chapter: string; title: string
  difficulty: 'easy' | 'medium' | 'hard'; estimatedMinutes: number
  questions: WorksheetQuestion[]; weekLabel: string
  status: 'pending' | 'in-progress' | 'submitted' | 'graded'
  score?: number; assignedDate: string; dueDate: string
}

// ── Learning Plan ─────────────────────────────────────────────────────────────
export type SlotType = 'study' | 'revision' | 'practice' | 'test' | 'sports' | 'activity'

export interface LearningMaterial {
  title: string; type: 'video' | 'book' | 'worksheet' | 'app'; platform?: string
}

export interface LearningSlot {
  id: string; subject: string; topic: string; type: SlotType
  durationMinutes: number; timeOfDay: 'morning' | 'afternoon' | 'evening'
  completed: boolean; materials: LearningMaterial[]; notes: string
}

export interface DayPlan {
  day: string; date: string; slots: LearningSlot[]
  isHoliday: boolean; holidayName?: string
}

export interface UpcomingTest {
  id: string; subject: string; topics: string[]
  date: string; type: 'surprise' | 'scheduled' | 'mock' | 'board-prep'
}

export interface JourneyMilestone {
  grade: string; year: number; focus: string; keyGoal: string; emoji: string
}

export interface WeeklyPlan {
  generatedAt: string; board: Board; grade: string; weekLabel: string
  days: DayPlan[]; upcomingTests: UpcomingTest[]
  journeyMilestones: JourneyMilestone[]
}

// ── Social ────────────────────────────────────────────────────────────────────
export interface SocialPost {
  id: string; authorName: string; authorAvatar: string
  authorRole: 'student' | 'parent' | 'tutor'
  content: string; postType: 'achievement' | 'question' | 'update' | 'announcement'
  reactions: { emoji: string; count: number; reacted: boolean }[]
  commentCount: number; timeAgo: string; badge?: string; school?: string
}

export interface SocialGroup {
  id: string; name: string; description: string; emoji: string
  memberCount: number; category: 'parents' | 'students' | 'tutors' | 'subject' | 'hobby'
  joined: boolean
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string; timestamp: string
}

// ── Store interface ───────────────────────────────────────────────────────────
interface AppState {
  childName: string; profile: StudentProfile; subscription: Subscription
  logs: LogEntry[]; tutorSessions: TutorSession[]
  xpTotal: number; streakDays: number; badges: string[]
  summary: string; tutorSummary: string; isGenerating: boolean
  weeklyPlan: WeeklyPlan | null; isGeneratingPlan: boolean
  socialPosts: SocialPost[]; socialGroups: SocialGroup[]
  chatMessages: ChatMessage[]; isChatting: boolean

  // New rich data
  subjects: SyllabusSubject[]
  olympiads: OlympiadExam[]
  activities: ExtraActivity[]
  weeklySchedule: DaySchedule[]
  worksheets: Worksheet[]

  // Actions
  updateProfile: (patch: Partial<StudentProfile & { childName: string }>) => void
  addLog: (subject: string, activity: string, durationMinutes: number, mood: Mood) => void
  addTutorSession: (topics: string[], homework: string[], notes: string) => Promise<void>
  refreshSummary: () => Promise<void>
  generatePlan: () => Promise<void>
  toggleSlotComplete: (dayLabel: string, slotId: string) => void
  moveSlot: (dayLabel: string, slotId: string, direction: 'up' | 'down') => void
  reactToPost: (postId: string, emoji: string) => void
  addPost: (content: string, type: SocialPost['postType']) => void
  toggleGroup: (groupId: string) => void
  sendChatMessage: (content: string, kidCtx?: MikoKidContext) => Promise<void>

  // New actions
  toggleTopicComplete: (subjectId: string, chapterId: string, topicId: string) => void
  updateChapterStatus: (subjectId: string, chapterId: string, status: SyllabusChapter['status']) => void
  toggleOlympiadRegistration: (olympiadId: string) => void
  overrideScheduleTopic: (day: string, blockId: string, topic: string) => void
  submitWorksheet: (worksheetId: string, score: number) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getLevel(xp: number) {
  if (xp >= 1500) return { name: 'Champion', emoji: '🏆' }
  if (xp >= 500)  return { name: 'Scholar',  emoji: '⭐' }
  if (xp >= 100)  return { name: 'Learner',  emoji: '📚' }
  return                 { name: 'Explorer', emoji: '🌱' }
}

function awardBadges(xp: number, streak: number, badges: string[]): string[] {
  const b = [...badges]
  if (xp >= 100  && !b.includes('100 XP Club'))    b.push('100 XP Club')
  if (xp >= 500  && !b.includes('500 XP Scholar'))  b.push('500 XP Scholar')
  if (streak >= 3 && !b.includes('3-Day Streak 🔥')) b.push('3-Day Streak 🔥')
  if (streak >= 7 && !b.includes('7-Day Streak ⚡')) b.push('7-Day Streak ⚡')
  return b
}

const fallbackSummary = (n: string, logs: LogEntry[]) => {
  const s = [...new Set(logs.map(l => l.subject))].join(', ')
  const t = logs.reduce((a, l) => a + l.durationMinutes, 0)
  return `${n} studied ${s} for ${t} minutes today. Keep up the great work!`
}

const todayISO = new Date().toISOString()
const dayName  = (offset: number) => {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('en-IN', { weekday: 'long' })
}
const dateStr  = (offset: number) => {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function makeSlot(
  subject: string, topic: string, type: SlotType,
  mins: number, time: 'morning'|'afternoon'|'evening',
  mats: LearningMaterial[] = [], notes = ''
): LearningSlot {
  return {
    id: `${subject}-${Math.random().toString(36).slice(2,7)}`,
    subject, topic, type, durationMinutes: mins,
    timeOfDay: time, completed: false, materials: mats, notes,
  }
}

// ── PRISHA SEED DATA ──────────────────────────────────────────────────────────
const seedProfile: StudentProfile = {
  avatar: '👧', grade: 'Grade 4', school: 'National Public School, Koramangala',
  age: 9, board: 'CBSE', city: 'Bangalore', stage: 'primary',
  learningStyle: 'visual', weeklyXpGoal: 200,
  subjectGoals: [
    { subject: 'Mathematics', active: true,  weeklyMinutes: 150 },
    { subject: 'English',     active: true,  weeklyMinutes: 90  },
    { subject: 'Hindi',       active: true,  weeklyMinutes: 90  },
    { subject: 'EVS',         active: true,  weeklyMinutes: 90  },
    { subject: 'Computer',    active: true,  weeklyMinutes: 60  },
    { subject: 'Drawing',     active: false, weeklyMinutes: 60  },
  ],
  parentName: 'Anirudh', parentPhone: '+91 98765 43210',
  linkedTutors: [],
  bio: 'Prisha is a multi-talented Grade 4 student — a competitive swimmer of 4 years, learning Bharatanatyam and Western Vocal, and an aspiring artist. She loves exploring the outdoors and reading.',
  sports: ['Swimming'],
  extracurricular: ['Bharatanatyam', 'Drawing', 'Western Vocal'],
  cocurricular: ['SOF Math Olympiad (IMO)', 'SOF Science Olympiad (NSO)', 'SOF English Olympiad (IEO)'],
  languages: ['English', 'Hindi', 'Kannada'],
  lifeGoal: 'Marine Biologist / Olympic Swimmer',
  targetYear: 2034,
}

// ── CBSE GRADE 4 SYLLABUS ─────────────────────────────────────────────────────
const mkTopic = (id: string, name: string, done = false): ChapterTopic =>
  ({ id, name, isCompleted: done, completedDate: done ? '2026-04-15' : undefined })

const mkChapter = (
  id: string, name: string, topics: ChapterTopic[],
  start: string, end: string,
  status: SyllabusChapter['status'] = 'not-started',
  notes = '', test?: string
): SyllabusChapter => ({ id, name, topics, targetStartDate: start, targetEndDate: end, status, notes, testScheduled: test })

export const seedSubjects: SyllabusSubject[] = [
  {
    id: 'math', name: 'Mathematics', icon: '📐', color: '#4F46E5', colorLight: '#EEF2FF',
    textbook: 'NCERT Math-Magic Class 4', teacher: 'Mrs. Kavitha R.',
    chapters: [
      mkChapter('m1','Building with Bricks',[
        mkTopic('m1t1','Patterns with bricks',true),mkTopic('m1t2','Floor patterns',true),
        mkTopic('m1t3','Vertical, horizontal, slanting arrangements',true),
      ],'2026-06-09','2026-06-20','completed','First chapter — shapes and patterns with bricks'),
      mkChapter('m2','Long and Short',[
        mkTopic('m2t1','Measuring length with ruler',true),mkTopic('m2t2','Estimation of length',true),
        mkTopic('m2t3','Comparing lengths — cm and m',true),mkTopic('m2t4','Adding and subtracting lengths'),
      ],'2026-06-23','2026-07-04','in-progress'),
      mkChapter('m3','A Trip to Bhopal',[
        mkTopic('m3t1','Large numbers — reading and writing'),mkTopic('m3t2','Distance and fare calculation'),
        mkTopic('m3t3','Money — bills and transactions'),mkTopic('m3t4','Number names up to 10,000'),
      ],'2026-07-07','2026-07-18','not-started'),
      mkChapter('m4','Tick-Tick-Tick',[
        mkTopic('m4t1','Reading clock — hour and minute hands'),mkTopic('m4t2','AM and PM'),
        mkTopic('m4t3','Calendar — days, weeks, months'),mkTopic('m4t4','Calculating time duration'),
      ],'2026-07-21','2026-08-01','not-started'),
      mkChapter('m5','The Way the World Looks',[
        mkTopic('m5t1','Aerial view and maps'),mkTopic('m5t2','Cardinal directions (N,S,E,W)'),
        mkTopic('m5t3','Reading simple maps'),mkTopic('m5t4','Scale on maps'),
      ],'2026-08-04','2026-08-15','not-started'),
      mkChapter('m6','The Junk Seller',[
        mkTopic('m6t1','Weight — kg and grams'),mkTopic('m6t2','Weighing balance'),
        mkTopic('m6t3','Addition and subtraction of weights'),
      ],'2026-08-18','2026-08-29','not-started','Before mid-term'),
      mkChapter('m7','Jugs and Mugs',[
        mkTopic('m7t1','Volume and capacity'),mkTopic('m7t2','Litres and millilitres'),
        mkTopic('m7t3','Measuring capacity'),mkTopic('m7t4','Comparison of capacity'),
      ],'2026-09-08','2026-09-19','not-started','','2026-09-12'),
      mkChapter('m8','Carts and Wheels',[
        mkTopic('m8t1','Circles — centre, radius, diameter'),mkTopic('m8t2','Drawing circles'),
        mkTopic('m8t3','Circumference (introduction)'),
      ],'2026-09-22','2026-10-03','not-started'),
      mkChapter('m9','Halves and Quarters',[
        mkTopic('m9t1','Fractions as part of a whole'),mkTopic('m9t2','1/2, 1/4, 3/4'),
        mkTopic('m9t3','Fractions on number line'),mkTopic('m9t4','Comparing simple fractions'),
      ],'2026-10-06','2026-10-17','not-started'),
      mkChapter('m10','Play with Patterns',[
        mkTopic('m10t1','Number patterns'),mkTopic('m10t2','Shape patterns'),
        mkTopic('m10t3','Finding the rule'),mkTopic('m10t4','Extending patterns'),
      ],'2026-10-20','2026-10-31','not-started'),
      mkChapter('m11','Tables and Shares',[
        mkTopic('m11t1','Multiplication tables up to 10'),mkTopic('m11t2','Division — equal sharing'),
        mkTopic('m11t3','Relationship between ×  and ÷'),mkTopic('m11t4','Word problems'),
      ],'2026-11-03','2026-11-21','not-started','','2026-11-14'),
      mkChapter('m12','How Heavy? How Light?',[
        mkTopic('m12t1','Comparing weights using pan balance'),mkTopic('m12t2','Estimating weight'),
        mkTopic('m12t3','Sorting by weight'),
      ],'2026-11-24','2026-12-05','not-started'),
      mkChapter('m13','Fields and Fences',[
        mkTopic('m13t1','Perimeter — concept and calculation'),mkTopic('m13t2','Area — sq metre'),
        mkTopic('m13t3','Area of irregular shapes (counting squares)'),mkTopic('m13t4','Perimeter of complex shapes'),
      ],'2026-12-08','2026-12-19','not-started'),
      mkChapter('m14','Smart Charts',[
        mkTopic('m14t1','Pictographs'),mkTopic('m14t2','Bar graphs'),
        mkTopic('m14t3','Reading and interpreting data'),mkTopic('m14t4','Collecting and organizing data'),
      ],'2027-01-05','2027-01-23','not-started'),
    ],
  },
  {
    id: 'english', name: 'English', icon: '📖', color: '#059669', colorLight: '#ECFDF5',
    textbook: 'NCERT Marigold Class 4', teacher: 'Mrs. Deepa S.',
    chapters: [
      mkChapter('e1','Unit 1: Wake Up / Noses',[
        mkTopic('e1t1','Poem: Wake Up — comprehension',true),mkTopic('e1t2','Story: Noses — reading',true),
        mkTopic('e1t3','Vocabulary — body parts, actions',true),mkTopic('e1t4','Writing: My Morning Routine',true),
      ],'2026-06-09','2026-06-20','completed'),
      mkChapter('e2','Unit 2: Neha\'s Alarm Clock / The Little Fir Tree',[
        mkTopic('e2t1','Story: Neha\'s Alarm Clock — reading',true),mkTopic('e2t2','Grammar: Nouns — common and proper',true),
        mkTopic('e2t3','Story: The Little Fir Tree — comprehension'),mkTopic('e2t4','Writing: Describing a tree'),
      ],'2026-06-23','2026-07-04','in-progress'),
      mkChapter('e3','Unit 3: Run! / Nasruddin\'s Aim',[
        mkTopic('e3t1','Poem: Run! — rhyme scheme'),mkTopic('e3t2','Story: Nasruddin\'s Aim — sequencing'),
        mkTopic('e3t3','Grammar: Pronouns'),mkTopic('e3t4','Writing: Funny story'),
      ],'2026-07-07','2026-07-18','not-started'),
      mkChapter('e4','Unit 4: Why? / Alice in Wonderland',[
        mkTopic('e4t1','Poem: Why? — question words'),mkTopic('e4t2','Story: Alice in Wonderland — summary'),
        mkTopic('e4t3','Grammar: Adjectives'),mkTopic('e4t4','Writing: Imaginary world'),
      ],'2026-07-21','2026-08-01','not-started'),
      mkChapter('e5','Unit 5: Don\'t be Afraid / Helen Keller',[
        mkTopic('e5t1','Poem: Don\'t be Afraid of the Dark'),mkTopic('e5t2','Story: Helen Keller — biography reading'),
        mkTopic('e5t3','Grammar: Verbs — action words'),mkTopic('e5t4','Writing: Someone I admire'),
      ],'2026-08-04','2026-08-22','not-started'),
      mkChapter('e6','Unit 6: Hiawatha / The Scholar\'s Mother Tongue',[
        mkTopic('e6t1','Poem: Hiawatha'),mkTopic('e6t2','Story: The Scholar\'s Mother Tongue'),
        mkTopic('e6t3','Grammar: Tenses — past, present, future'),mkTopic('e6t4','Comprehension passage'),
      ],'2026-09-01','2026-09-19','not-started','','2026-09-10'),
      mkChapter('e7','Unit 7: A Watering Rhyme / The Giving Tree',[
        mkTopic('e7t1','Poem: A Watering Rhyme'),mkTopic('e7t2','Story: The Giving Tree — values'),
        mkTopic('e7t3','Grammar: Adverbs'),mkTopic('e7t4','Writing: Environment essay'),
      ],'2026-09-22','2026-10-10','not-started'),
      mkChapter('e8','Unit 8: Books / Going to Buy a Book',[
        mkTopic('e8t1','Poem: Books — appreciation'),mkTopic('e8t2','Story: Going to Buy a Book'),
        mkTopic('e8t3','Grammar: Prepositions'),mkTopic('e8t4','Writing: My favourite book'),
      ],'2026-10-13','2026-10-31','not-started'),
      mkChapter('e9','Unit 9: Pinocchio / The Donkey',[
        mkTopic('e9t1','Story: Pinocchio — honesty theme'),mkTopic('e9t2','Grammar: Conjunctions'),
        mkTopic('e9t3','Story: The Donkey — comprehension'),mkTopic('e9t4','Writing: Moral story'),
      ],'2026-11-10','2026-11-28','not-started'),
      mkChapter('e10','Unit 10: The Naughty Boy / Golu Grows a Nose',[
        mkTopic('e10t1','Poem: The Naughty Boy'),mkTopic('e10t2','Story: Golu Grows a Nose'),
        mkTopic('e10t3','Grammar: Review — all grammar topics'),mkTopic('e10t4','Final writing assignment'),
      ],'2026-12-01','2026-12-19','not-started'),
    ],
  },
  {
    id: 'hindi', name: 'Hindi', icon: '🔤', color: '#DC2626', colorLight: '#FFF5F5',
    textbook: 'NCERT Rimjhim Class 4', teacher: 'Mrs. Sunita M.',
    chapters: [
      mkChapter('h1','पाठ 1: मन के भोले-भाले बादल',[
        mkTopic('h1t1','कविता पाठ और अर्थ',true),mkTopic('h1t2','नए शब्द और अर्थ',true),
        mkTopic('h1t3','प्रश्नोत्तर',true),
      ],'2026-06-09','2026-06-20','completed'),
      mkChapter('h2','पाठ 2: जैसा सवाल वैसा जवाब',[
        mkTopic('h2t1','कहानी पाठ',true),mkTopic('h2t2','पात्र और चरित्र'),
        mkTopic('h2t3','व्याकरण: संज्ञा'),
      ],'2026-06-23','2026-07-04','in-progress'),
      mkChapter('h3','पाठ 3: किरमिच की गेंद',[
        mkTopic('h3t1','कहानी पाठ'),mkTopic('h3t2','नए शब्द'),
        mkTopic('h3t3','व्याकरण: सर्वनाम'),mkTopic('h3t4','लेखन: अनुच्छेद'),
      ],'2026-07-07','2026-07-18','not-started'),
      mkChapter('h4','पाठ 4: पापा जब बच्चे थे',[
        mkTopic('h4t1','कहानी — पारिवारिक संबंध'),mkTopic('h4t2','व्याकरण: विशेषण'),
        mkTopic('h4t3','लेखन: मेरे परिवार पर अनुच्छेद'),
      ],'2026-07-21','2026-08-01','not-started'),
      mkChapter('h5','पाठ 5: दोस्त की पोशाक',[
        mkTopic('h5t1','कहानी पाठ'),mkTopic('h5t2','मुहावरे और लोकोक्तियाँ'),
        mkTopic('h5t3','व्याकरण: क्रिया'),
      ],'2026-08-04','2026-08-22','not-started'),
      mkChapter('h6','पाठ 6: नौकर',[
        mkTopic('h6t1','कहानी: स्वतंत्रता सेनानी'),mkTopic('h6t2','व्याकरण: काल (वर्तमान, भूत, भविष्य)'),
        mkTopic('h6t3','पत्र लेखन'),
      ],'2026-09-01','2026-09-19','not-started','','2026-09-10'),
      mkChapter('h7','पाठ 7: दाँत का दर्द',[
        mkTopic('h7t1','कविता पाठ'),mkTopic('h7t2','व्याकरण: वचन (एकवचन, बहुवचन)'),
        mkTopic('h7t3','संवाद लेखन'),
      ],'2026-09-22','2026-10-10','not-started'),
      mkChapter('h8','पाठ 8: कागज़ी घोड़ा',[
        mkTopic('h8t1','कहानी पाठ'),mkTopic('h8t2','व्याकरण: लिंग'),
        mkTopic('h8t3','चित्र वर्णन'),
      ],'2026-10-13','2026-10-31','not-started'),
      mkChapter('h9','पाठ 9-14: शेष पाठ',[
        mkTopic('h9t1','पाठ 9: बाँस की टेट'),mkTopic('h9t2','पाठ 10: हुदहुद'),
        mkTopic('h9t3','पाठ 11-14: विविध कहानियाँ'),mkTopic('h9t4','वार्षिक पुनरावृत्ति'),
      ],'2026-11-03','2027-01-23','not-started'),
    ],
  },
  {
    id: 'evs', name: 'EVS', icon: '🌍', color: '#0891B2', colorLight: '#ECFEFF',
    textbook: 'NCERT Looking Around Class 4', teacher: 'Mrs. Rekha P.',
    chapters: [
      mkChapter('v1','Ch 1-3: Going to School / Ear to Ear / A Day with Nandu',[
        mkTopic('v1t1','Different ways children go to school',true),mkTopic('v1t2','Sense of hearing — ear and sound',true),
        mkTopic('v1t3','Elephants — habitat and behaviour',true),mkTopic('v1t4','Animals and their characteristics',true),
      ],'2026-06-09','2026-06-27','completed'),
      mkChapter('v2','Ch 4-6: Story of Amrita / Anita & Honeybees / Omana\'s Journey',[
        mkTopic('v2t1','Trees and environment — conservation',true),mkTopic('v2t2','Honeybees — colony and honey'),
        mkTopic('v2t3','Train journey — map reading'),mkTopic('v2t4','India — states and places'),
      ],'2026-06-30','2026-07-18','in-progress'),
      mkChapter('v3','Ch 7-9: From the Window / Grandmother\'s House / Changing Families',[
        mkTopic('v3t1','Food and crops across India'),mkTopic('v3t2','Family types — joint and nuclear'),
        mkTopic('v3t3','Grandparents and relationships'),
      ],'2026-07-21','2026-08-08','not-started'),
      mkChapter('v4','Ch 10-13: Hu Tu Tu / Valley of Flowers / Changing Times / River\'s Tale',[
        mkTopic('v4t1','Traditional games and sports'),mkTopic('v4t2','Flowers and states'),
        mkTopic('v4t3','Changes in technology and lifestyle'),mkTopic('v4t4','Rivers — importance and pollution'),
      ],'2026-08-11','2026-09-05','not-started','Before mid-term'),
      mkChapter('v5','Ch 14-18: Basva\'s Farm / Market / Busy Month / Nandita / Too Much Water',[
        mkTopic('v5t1','Farming — crops and seasons'),mkTopic('v5t2','Market — farm to table'),
        mkTopic('v5t3','Water cycle and rain'),mkTopic('v5t4','Drought and flood management'),
      ],'2026-09-22','2026-10-24','not-started'),
      mkChapter('v6','Ch 19-23: Abdul in Garden / Eating Together / Food Fun / World in Home / Pochampalli',[
        mkTopic('v6t1','Plants — growth and needs'),mkTopic('v6t2','Food from different regions'),
        mkTopic('v6t3','Textiles — weaving and craft'),mkTopic('v6t4','Cultural diversity of India'),
      ],'2026-10-27','2026-11-28','not-started'),
      mkChapter('v7','Ch 24-27: Home & Abroad / Spicy Riddles / Defence Officer / Chuskit',[
        mkTopic('v7t1','Indian diaspora — living abroad'),mkTopic('v7t2','Spices and their uses'),
        mkTopic('v7t3','Armed forces — pride of India'),mkTopic('v7t4','Disabilities and inclusion'),
      ],'2026-12-01','2027-01-23','not-started'),
    ],
  },
  {
    id: 'computer', name: 'Computer Science', icon: '💻', color: '#7C3AED', colorLight: '#F5F3FF',
    textbook: 'Kips iSucceed / Computer Masti Level 4', teacher: 'Mr. Rajesh K.',
    chapters: [
      mkChapter('c1','Introduction to Computers',[
        mkTopic('c1t1','What is a computer? Uses in daily life',true),mkTopic('c1t2','Types of computers',true),
        mkTopic('c1t3','History of computers',true),
      ],'2026-06-09','2026-06-20','completed'),
      mkChapter('c2','Parts of a Computer',[
        mkTopic('c2t1','CPU — the brain of computer',true),mkTopic('c2t2','Monitor, keyboard, mouse',true),
        mkTopic('c2t3','Printer, scanner — peripherals'),mkTopic('c2t4','Care of computer parts'),
      ],'2026-06-23','2026-07-11','in-progress'),
      mkChapter('c3','Input and Output Devices',[
        mkTopic('c3t1','Input devices — keyboard, mouse, joystick'),mkTopic('c3t2','Output devices — monitor, printer, speakers'),
        mkTopic('c3t3','Difference between input and output'),
      ],'2026-07-14','2026-07-25','not-started'),
      mkChapter('c4','MS Windows Basics',[
        mkTopic('c4t1','Desktop — icons, taskbar, start menu'),mkTopic('c4t2','Files and folders'),
        mkTopic('c4t3','Copy, cut, paste operations'),mkTopic('c4t4','Recycle bin'),
      ],'2026-07-28','2026-08-15','not-started'),
      mkChapter('c5','MS Paint',[
        mkTopic('c5t1','Opening Paint and tools'),mkTopic('c5t2','Drawing shapes and lines'),
        mkTopic('c5t3','Colours — fill, eraser, colour picker'),mkTopic('c5t4','Saving and opening files'),
      ],'2026-08-18','2026-09-05','not-started'),
      mkChapter('c6','MS Word Introduction',[
        mkTopic('c6t1','Opening Word — title bar, menu'),mkTopic('c6t2','Typing and editing text'),
        mkTopic('c6t3','Font — size, bold, italic, underline'),mkTopic('c6t4','Saving a document'),
      ],'2026-09-22','2026-10-17','not-started'),
      mkChapter('c7','Internet Basics',[
        mkTopic('c7t1','What is Internet?'),mkTopic('c7t2','Web browser and websites'),
        mkTopic('c7t3','Safe internet use for kids'),mkTopic('c7t4','Email — concept'),
      ],'2026-10-20','2026-11-14','not-started'),
    ],
  },
]

// ── EXTRA ACTIVITIES ──────────────────────────────────────────────────────────
export const seedActivities: ExtraActivity[] = [
  {
    id: 'swim', name: 'Swimming', category: 'sports', icon: '🏊', color: '#0EA5E9',
    instructor: 'Coach Suresh (BBMP Aquatic Centre, Koramangala)',
    yearsActive: 4, level: 'Competitive / District Level',
    schedule: [
      { day: 'Monday',    startTime: '05:30', endTime: '07:00', venue: 'BBMP Aquatic Centre, Koramangala' },
      { day: 'Wednesday', startTime: '05:30', endTime: '07:00', venue: 'BBMP Aquatic Centre, Koramangala' },
      { day: 'Friday',    startTime: '05:30', endTime: '07:00', venue: 'BBMP Aquatic Centre, Koramangala' },
      { day: 'Saturday',  startTime: '06:00', endTime: '08:00', venue: 'BBMP Aquatic Centre, Koramangala' },
    ],
    achievements: ['District Level Bronze 2024', 'School Champion 2023', 'Sub-junior State Entry 2025'],
  },
  {
    id: 'dance', name: 'Bharatanatyam', category: 'dance', icon: '💃', color: '#EC4899',
    instructor: 'Guru Priya Chandrasekhar',
    yearsActive: 2, level: 'Intermediate — Preparing for Arangetram',
    schedule: [
      { day: 'Thursday', startTime: '16:00', endTime: '18:00', venue: 'Nritya Kala Academy, Koramangala' },
      { day: 'Saturday', startTime: '14:00', endTime: '16:00', venue: 'Nritya Kala Academy, Koramangala' },
    ],
    lastExamResult: 'Grade A — First Exam Completed (March 2026)',
    nextExamDate: '2026-12-15', nextExamName: 'Second Grade Exam (Bharatanatyam)',
    achievements: ['First Grade Exam — Grade A (March 2026)'],
  },
  {
    id: 'drawing', name: 'Drawing & Art', category: 'arts', icon: '🎨', color: '#F59E0B',
    instructor: 'Ms. Meena (Art Kreations Studio)',
    yearsActive: 2, level: 'Intermediate — Govt. Drawing Grade Exams',
    schedule: [
      { day: 'Tuesday', startTime: '16:00', endTime: '17:30', venue: 'Art Kreations Studio, HSR Layout' },
    ],
    lastExamResult: 'Grade A — Junior Grade Exam Passed (2025)',
    nextExamDate: '2026-08-15', nextExamName: 'Government Drawing Exam — Senior Grade',
    achievements: ['Junior Grade Exam Passed — Grade A (2025)'],
  },
  {
    id: 'vocal', name: 'Western Vocal', category: 'music', icon: '🎵', color: '#8B5CF6',
    instructor: 'Mr. David (Furtados School of Music)',
    yearsActive: 1, level: 'Beginner — Trinity Rockschool Grade 1',
    schedule: [
      { day: 'Sunday', startTime: '10:00', endTime: '11:30', venue: 'Furtados School of Music, Koramangala' },
    ],
    achievements: ['Completed Term 1 — Trinity Rockschool prep'],
  },
]

// ── OLYMPIADS ─────────────────────────────────────────────────────────────────
export const seedOlympiads: OlympiadExam[] = [
  {
    id: 'imo', name: 'International Mathematics Olympiad', shortName: 'IMO',
    organizer: 'Science Olympiad Foundation (SOF)', subject: 'Mathematics', subjectIcon: '📐',
    examDate: '2026-10-21', registrationDeadline: '2026-08-31',
    isRegistered: true, isAttending: true,
    difficultyNote: 'Covers 30% extra content beyond CBSE syllabus. Focus on logical reasoning and speed.',
    prepTopics: ['Number patterns', 'Fractions — beyond textbook', 'Geometry basics', 'Logical reasoning', 'Data interpretation'],
    prepProgress: 25,
    pastResult: { year: 2025, rank: 'School Rank 3', score: 28 },
  },
  {
    id: 'nso', name: 'National Science Olympiad', shortName: 'NSO',
    organizer: 'Science Olympiad Foundation (SOF)', subject: 'Science (EVS)', subjectIcon: '🌍',
    examDate: '2026-11-11', registrationDeadline: '2026-09-15',
    isRegistered: false, isAttending: true,
    difficultyNote: 'Heavy focus on living and non-living things, environment, and basic physics concepts.',
    prepTopics: ['Plants and their types', 'Animals — habitats', 'Water cycle', 'Simple machines', 'Human body basics'],
    prepProgress: 10,
  },
  {
    id: 'ieo', name: 'International English Olympiad', shortName: 'IEO',
    organizer: 'Science Olympiad Foundation (SOF)', subject: 'English', subjectIcon: '📖',
    examDate: '2026-12-09', registrationDeadline: '2026-10-15',
    isRegistered: false, isAttending: false,
    difficultyNote: 'Tests grammar, reading comprehension, vocabulary, and creative expression.',
    prepTopics: ['Grammar — all parts of speech', 'Reading comprehension strategy', 'Vocabulary building', 'Sentence transformation'],
    prepProgress: 0,
  },
  {
    id: 'asset', name: 'ASSET Talent & Olympiad Exam', shortName: 'ASSET',
    organizer: 'Educational Initiatives', subject: 'Math + Science + English', subjectIcon: '🏆',
    examDate: '2026-11-25', registrationDeadline: '2026-09-30',
    isRegistered: false, isAttending: false,
    difficultyNote: 'Application-based questions. Tests understanding and application, not just recall.',
    prepTopics: ['Conceptual Math', 'Real-world Science problems', 'English usage in context'],
    prepProgress: 0,
  },
]

// ── WEEKLY SCHEDULE ───────────────────────────────────────────────────────────
const mkBlock = (
  id: string, start: string, end: string,
  cat: ScheduleBlock['category'], label: string,
  opts: Partial<Pick<ScheduleBlock,'subject'|'topic'|'recommendedTopic'|'isAIRecommended'|'location'>> = {}
): ScheduleBlock => ({
  id, startTime: start, endTime: end, category: cat, label,
  subject: opts.subject, topic: opts.topic,
  recommendedTopic: opts.recommendedTopic,
  isOverridden: false,
  isAIRecommended: opts.isAIRecommended ?? false,
  location: opts.location,
})

export const seedWeeklySchedule: DaySchedule[] = [
  {
    day: 'Monday', slots: [
      mkBlock('m1','05:30','07:00','swimming','🏊 Swimming Training',{location:'BBMP Aquatic Centre'}),
      mkBlock('m2','07:00','08:00','meal','🥣 Breakfast + Get Ready'),
      mkBlock('m3','08:00','14:30','school','🏫 NPS Koramangala',{location:'National Public School'}),
      mkBlock('m4','14:30','15:30','meal','🍛 Lunch + Rest'),
      mkBlock('m5','15:30','17:00','homework','📝 School Homework',{subject:'Math'}),
      mkBlock('m6','17:00','18:30','study','📚 Self Study',{subject:'EVS',recommendedTopic:'Ch 4-6 Reading — Honeybees',isAIRecommended:true}),
      mkBlock('m7','18:30','21:00','free','🎮 Free Time + Dinner'),
      mkBlock('m8','21:00','05:00','sleep','😴 Sleep'),
    ],
  },
  {
    day: 'Tuesday', slots: [
      mkBlock('t1','06:00','08:00','meal','🥣 Morning Routine + Breakfast'),
      mkBlock('t2','08:00','14:30','school','🏫 NPS Koramangala',{location:'National Public School'}),
      mkBlock('t3','14:30','15:30','meal','🍛 Lunch + Rest'),
      mkBlock('t4','15:30','17:00','homework','📝 School Homework'),
      mkBlock('t5','16:00','17:30','drawing','🎨 Drawing Class',{location:'Art Kreations Studio, HSR Layout'}),
      mkBlock('t6','17:30','19:00','study','📚 Self Study',{subject:'Mathematics',recommendedTopic:'Long and Short — adding lengths practice',isAIRecommended:true}),
      mkBlock('t7','19:00','21:00','free','🎮 Free Time + Dinner'),
      mkBlock('t8','21:00','05:00','sleep','😴 Sleep'),
    ],
  },
  {
    day: 'Wednesday', slots: [
      mkBlock('w1','05:30','07:00','swimming','🏊 Swimming Training',{location:'BBMP Aquatic Centre'}),
      mkBlock('w2','07:00','08:00','meal','🥣 Breakfast + Get Ready'),
      mkBlock('w3','08:00','14:30','school','🏫 NPS Koramangala'),
      mkBlock('w4','14:30','15:30','meal','🍛 Lunch + Rest'),
      mkBlock('w5','15:30','17:00','homework','📝 School Homework'),
      mkBlock('w6','17:00','18:30','study','📚 Self Study',{subject:'English',recommendedTopic:'Unit 2 — Comprehension questions',isAIRecommended:true}),
      mkBlock('w7','18:30','21:00','free','🎮 Free Time + Dinner'),
      mkBlock('w8','21:00','05:00','sleep','😴 Sleep'),
    ],
  },
  {
    day: 'Thursday', slots: [
      mkBlock('th1','06:00','08:00','meal','🥣 Morning Routine + Breakfast'),
      mkBlock('th2','08:00','14:30','school','🏫 NPS Koramangala'),
      mkBlock('th3','14:30','15:30','meal','🍛 Lunch + Rest'),
      mkBlock('th4','15:30','16:00','homework','📝 Quick HW review'),
      mkBlock('th5','16:00','18:00','dance','💃 Bharatanatyam Class',{location:'Nritya Kala Academy'}),
      mkBlock('th6','18:00','19:00','homework','📝 Remaining Homework'),
      mkBlock('th7','19:00','21:00','free','🎮 Free Time + Dinner'),
      mkBlock('th8','21:00','05:00','sleep','😴 Sleep'),
    ],
  },
  {
    day: 'Friday', slots: [
      mkBlock('f1','05:30','07:00','swimming','🏊 Swimming Training',{location:'BBMP Aquatic Centre'}),
      mkBlock('f2','07:00','08:00','meal','🥣 Breakfast + Get Ready'),
      mkBlock('f3','08:00','14:30','school','🏫 NPS Koramangala'),
      mkBlock('f4','14:30','15:30','meal','🍛 Lunch + Rest'),
      mkBlock('f5','15:30','17:00','homework','📝 School Homework'),
      mkBlock('f6','17:00','18:30','study','📚 Self Study',{subject:'Hindi',recommendedTopic:'Pāth 2 — new words and prashnottar',isAIRecommended:true}),
      mkBlock('f7','18:30','21:00','free','🎮 Free Time + Dinner'),
      mkBlock('f8','21:00','05:00','sleep','😴 Sleep'),
    ],
  },
  {
    day: 'Saturday', slots: [
      mkBlock('s1','06:00','08:00','swimming','🏊 Swimming Training (Long session)',{location:'BBMP Aquatic Centre'}),
      mkBlock('s2','08:00','08:45','meal','🥣 Breakfast'),
      mkBlock('s3','09:00','13:00','school','🏫 NPS Koramangala (Half day)'),
      mkBlock('s4','13:00','14:00','meal','🍛 Lunch'),
      mkBlock('s5','14:00','16:00','dance','💃 Bharatanatyam (Weekend session)',{location:'Nritya Kala Academy'}),
      mkBlock('s6','16:00','17:30','study','📚 Weekly Revision',{subject:'All Subjects',recommendedTopic:'Revise all completed topics this week',isAIRecommended:true}),
      mkBlock('s7','17:30','21:00','free','🎮 Family time + Dinner'),
      mkBlock('s8','21:00','05:00','sleep','😴 Sleep'),
    ],
  },
  {
    day: 'Sunday', slots: [
      mkBlock('su1','07:30','09:00','meal','🥣 Relaxed Morning + Breakfast'),
      mkBlock('su2','09:00','10:00','study','📚 Light Reading / Revision',{isAIRecommended:true,recommendedTopic:'Read ahead — next chapter preview'}),
      mkBlock('su3','10:00','11:30','music','🎵 Western Vocal Class',{location:'Furtados School of Music'}),
      mkBlock('su4','11:30','13:00','study','📚 Self Study / Olympiad Prep',{subject:'Mathematics',recommendedTopic:'IMO Practice — Logical Reasoning',isAIRecommended:true}),
      mkBlock('su5','13:00','14:00','meal','🍛 Lunch'),
      mkBlock('su6','14:00','16:00','free','😊 Rest & Play'),
      mkBlock('su7','16:00','17:30','study','📚 Weekly Planning + Weak Areas',{isAIRecommended:true,recommendedTopic:'Review worksheet mistakes from this week'}),
      mkBlock('su8','17:30','21:00','free','🎮 Family time + Dinner'),
      mkBlock('su9','21:00','05:00','sleep','😴 Sleep'),
    ],
  },
]

// ── WORKSHEETS ────────────────────────────────────────────────────────────────
export const seedWorksheets: Worksheet[] = [
  {
    id: 'ws1', subject: 'Mathematics', chapter: 'Long and Short', weekLabel: 'Week of May 20',
    title: 'Measuring and Comparing Lengths', difficulty: 'easy', estimatedMinutes: 20,
    status: 'pending', assignedDate: '2026-05-20', dueDate: '2026-05-24',
    questions: [
      { id: 'q1', text: 'A pencil is 15 cm long and a pen is 12 cm long. How much longer is the pencil?', type: 'short', answer: '3 cm', hint: 'Subtract the shorter from the longer' },
      { id: 'q2', text: 'Prisha swims 50 metres in one lap. How many metres does she swim in 4 laps?', type: 'short', answer: '200 metres', hint: 'Multiply 50 × 4' },
      { id: 'q3', text: 'Which is longer — 1 metre or 90 centimetres?', type: 'mcq', options: ['1 metre', '90 centimetres', 'Both are equal'], answer: '1 metre', hint: '1 m = 100 cm' },
      { id: 'q4', text: '1 metre = _____ centimetres', type: 'fill-blank', answer: '100' },
      { id: 'q5', text: 'Estimate the length of your textbook in cm (measure and check):', type: 'short', answer: 'approximately 27-30 cm', hint: 'Use a ruler' },
    ],
  },
  {
    id: 'ws2', subject: 'English', chapter: 'Unit 2: Neha\'s Alarm Clock', weekLabel: 'Week of May 20',
    title: 'Comprehension & Grammar — Nouns', difficulty: 'easy', estimatedMinutes: 25,
    status: 'pending', assignedDate: '2026-05-20', dueDate: '2026-05-24',
    questions: [
      { id: 'q1', text: 'What woke Neha up in the story?', type: 'mcq', options: ['A bell', 'An alarm clock', 'Her mother', 'A bird'], answer: 'An alarm clock' },
      { id: 'q2', text: 'Write 3 proper nouns from the story "Neha\'s Alarm Clock"', type: 'short', answer: 'Neha, Delhi, India (example answers)' },
      { id: 'q3', text: 'Underline the common nouns: "The girl put her book on the table."', type: 'short', answer: 'girl, book, table' },
      { id: 'q4', text: 'Write the plural of: child → _____, tooth → _____, mouse → _____', type: 'fill-blank', answer: 'children, teeth, mice' },
      { id: 'q5', text: 'True or False: "Bangalore" is a common noun.', type: 'true-false', options: ['True', 'False'], answer: 'False', hint: 'It is a name of a city — proper noun' },
    ],
  },
  {
    id: 'ws3', subject: 'EVS', chapter: 'Ch 4-6: Amrita / Honeybees / Omana', weekLabel: 'Week of May 20',
    title: 'Trees, Bees and Travel', difficulty: 'medium', estimatedMinutes: 25,
    status: 'pending', assignedDate: '2026-05-20', dueDate: '2026-05-26',
    questions: [
      { id: 'q1', text: 'Amrita Devi sacrificed her life to save which type of trees?', type: 'mcq', options: ['Banyan trees', 'Khejri trees', 'Neem trees', 'Mango trees'], answer: 'Khejri trees' },
      { id: 'q2', text: 'What is the role of a queen bee in a honeybee colony?', type: 'short', answer: 'The queen bee lays eggs and is the mother of all bees in the hive.' },
      { id: 'q3', text: 'Name 2 crops that grow in Karnataka that you might see on a train journey.', type: 'short', answer: 'Sugarcane, coconut / paddy (accept any Karnataka crops)' },
      { id: 'q4', text: 'Trees give us _____, _____ and _____ (fill 3 important things).', type: 'fill-blank', answer: 'oxygen, fruits, wood (also: shade, medicine)' },
      { id: 'q5', text: 'True or False: Honey is made by worker bees.', type: 'true-false', options: ['True', 'False'], answer: 'True' },
    ],
  },
  {
    id: 'ws4', subject: 'Mathematics', chapter: 'A Trip to Bhopal', weekLabel: 'Week of May 20',
    title: 'Large Numbers & Money', difficulty: 'medium', estimatedMinutes: 30,
    status: 'graded', score: 80, assignedDate: '2026-05-13', dueDate: '2026-05-17',
    questions: [
      { id: 'q1', text: 'Write in words: 5,408', type: 'short', answer: 'Five thousand four hundred and eight' },
      { id: 'q2', text: 'The train ticket from Bangalore to Bhopal costs ₹ 1,250. Prisha bought 2 tickets. How much did she pay in total?', type: 'short', answer: '₹ 2,500' },
      { id: 'q3', text: 'Which is greater? 7,305 or 7,350?', type: 'mcq', options: ['7,305', '7,350', 'Both are equal'], answer: '7,350' },
      { id: 'q4', text: '3,000 + 400 + 50 + 6 = _____', type: 'fill-blank', answer: '3,456' },
      { id: 'q5', text: 'Round 6,847 to the nearest thousand.', type: 'short', answer: '7,000', hint: 'Look at the hundreds digit' },
    ],
  },
]

// ── Social seed ───────────────────────────────────────────────────────────────
const seedLogs: LogEntry[] = [
  { id:'l1', subject:'Mathematics', activity:'Completed Worksheet 4 — Large Numbers', durationMinutes:30, mood:'happy',   createdAt: todayISO },
  { id:'l2', subject:'English',     activity:'Read Unit 2 story — Neha\'s Alarm Clock', durationMinutes:20, mood:'excited', createdAt: todayISO },
  { id:'l3', subject:'EVS',         activity:'Chapter 4 reading — Amrita Devi story',  durationMinutes:15, mood:'neutral', createdAt: todayISO },
]

const seedPosts: SocialPost[] = [
  {
    id:'p1', authorName:'Prisha', authorAvatar:'👧', authorRole:'student', postType:'achievement',
    content:'Just scored 80% on my Maths worksheet on Large Numbers! 🎉 The practice is paying off. Ready for the IMO prep now!',
    reactions:[{emoji:'🔥',count:12,reacted:false},{emoji:'⭐',count:8,reacted:false},{emoji:'👏',count:5,reacted:false}],
    commentCount:4, timeAgo:'2h ago', badge:'100 XP Club', school:'National Public School, Koramangala',
  },
  {
    id:'p2', authorName:'Anirudh (Prisha\'s Dad)', authorAvatar:'👨', authorRole:'parent', postType:'update',
    content:'Prisha just finished her Drawing Junior Grade exam! 🎨 Results expected in 2 weeks. Next up — Senior Grade exam in August. Fingers crossed! 🤞',
    reactions:[{emoji:'❤️',count:17,reacted:false},{emoji:'🏆',count:9,reacted:false}],
    commentCount:6, timeAgo:'1d ago', school:'National Public School, Koramangala',
  },
  {
    id:'p3', authorName:'NPS Parent Group', authorAvatar:'🏫', authorRole:'parent', postType:'announcement',
    content:'📢 NPS Koramangala — Annual Day registrations open! Students can register for singing, dancing, drawing, and sports events. Last date: June 5. Contact school office.',
    reactions:[{emoji:'👏',count:34,reacted:false},{emoji:'🎉',count:22,reacted:false}],
    commentCount:15, timeAgo:'3h ago', school:'National Public School, Koramangala',
  },
  {
    id:'p4', authorName:'Suresh Coach', authorAvatar:'🏊', authorRole:'tutor', postType:'announcement',
    content:'🏊 District-level swimming trials on June 28. All my competitive swimmers — please ensure your forms are submitted by June 10. Prisha, you\'re looking strong this season!',
    reactions:[{emoji:'💪',count:19,reacted:false},{emoji:'🔥',count:11,reacted:false}],
    commentCount:8, timeAgo:'5h ago',
  },
  {
    id:'p5', authorName:'Meera Rao', authorAvatar:'👩', authorRole:'parent', postType:'question',
    content:'My daughter is in Grade 4 at NPS Koramangala — struggling a bit with Hindi. Any suggestions for good Hindi practice apps or worksheets? She loves stories.',
    reactions:[{emoji:'💡',count:7,reacted:false},{emoji:'❤️',count:3,reacted:false}],
    commentCount:12, timeAgo:'1d ago', school:'National Public School, Koramangala',
  },
]

const seedGroups: SocialGroup[] = [
  { id:'g1', name:'NPS Koramangala Parents', emoji:'🏫', description:'Parent community of National Public School, Koramangala, Bangalore', memberCount:312, category:'parents', joined:true  },
  { id:'g2', name:'CBSE Grade 4 — Bangalore', emoji:'📚', description:'Study tips, resources and support for Grade 4 CBSE parents in Bangalore', memberCount:189, category:'parents', joined:true  },
  { id:'g3', name:'SOF Olympiad Prep', emoji:'🏆', description:'Preparation group for IMO, NSO, IEO and ASSET exams', memberCount:97,  category:'subject', joined:true  },
  { id:'g4', name:'Young Swimmers — Bangalore', emoji:'🏊', description:'Competitive swimming community for kids in Bangalore', memberCount:56,  category:'hobby',   joined:true  },
  { id:'g5', name:'Bharatanatyam Students', emoji:'💃', description:'Bharatanatyam learners — tips, exam prep, performances', memberCount:43,  category:'hobby',   joined:false },
  { id:'g6', name:'Grade 4 Math Study Group', emoji:'📐', description:'Chapter-by-chapter math practice and doubt clearing for Grade 4', memberCount:78,  category:'subject', joined:false },
]

const seedPlan: WeeklyPlan = {
  generatedAt: todayISO, board: 'CBSE', grade: 'Grade 4', weekLabel: 'This Week',
  days: [
    { day: dayName(0), date: dateStr(0), isHoliday: false, slots: [
      makeSlot('Mathematics','Long and Short — adding lengths','study',30,'morning',[{title:'NCERT Math-Magic Pg 16-20',type:'book'}]),
      makeSlot('English','Unit 2 — The Little Fir Tree','study',20,'afternoon',[]),
      makeSlot('EVS','Chapter 5 — Anita and Honeybees','study',20,'evening',[]),
    ]},
    { day: dayName(1), date: dateStr(1), isHoliday: false, slots: [
      makeSlot('Hindi','Pāth 2 — new words and meaning','study',25,'morning',[]),
      makeSlot('Mathematics','Long and Short — worksheet practice','practice',30,'afternoon',[]),
      makeSlot('Drawing','Art Kreations class — prepare portfolio','activity',90,'afternoon',[]),
    ]},
    { day: dayName(2), date: dateStr(2), isHoliday: false, slots: [
      makeSlot('EVS','Ch 4-6 — comprehension questions','practice',25,'morning',[]),
      makeSlot('English','Grammar — Nouns (Unit 2)','study',20,'afternoon',[]),
      makeSlot('Mathematics','Quick revision — Ch 1 & 2','revision',20,'evening',[]),
    ]},
    { day: dayName(3), date: dateStr(3), isHoliday: false, slots: [
      makeSlot('Computer','Parts of a Computer — practice quiz','practice',20,'morning',[]),
      makeSlot('Bharatanatyam','Dance class — second exam prep','activity',120,'afternoon',[]),
    ]},
    { day: dayName(4), date: dateStr(4), isHoliday: false, slots: [
      makeSlot('Mathematics','⚡ Ch 2 Topic Test — Long and Short','test',30,'morning',[]),
      makeSlot('Hindi','Pāth 2 — story writing','practice',25,'afternoon',[]),
      makeSlot('English','Unit 2 — writing task','practice',25,'evening',[]),
    ]},
    { day: dayName(5), date: dateStr(5), isHoliday: false, slots: [
      makeSlot('All Subjects','Weekly revision — all chapters covered','revision',60,'morning',[]),
      makeSlot('Mathematics','IMO Prep — logical reasoning practice','practice',30,'afternoon',[]),
      makeSlot('Bharatanatyam','Dance class — weekend session','activity',120,'afternoon',[]),
    ]},
    { day: dayName(6), date: dateStr(6), isHoliday: false, slots: [
      makeSlot('Western Vocal','Music class','activity',90,'morning',[]),
      makeSlot('Mathematics','IMO Practice Paper','practice',45,'morning',[]),
      makeSlot('All Subjects','Sunday review — plan next week','revision',30,'evening',[]),
    ]},
  ],
  upcomingTests: [
    { id:'t1', subject:'Mathematics',      topics:['Ch 2 — Long and Short'],            date: dateStr(4),  type:'scheduled' },
    { id:'t2', subject:'EVS',              topics:['Ch 1-6 — Unit Test'],                date: dateStr(14), type:'mock'      },
    { id:'t3', subject:'Drawing (Art)',    topics:['Government Senior Grade Exam'],       date: '2026-08-15', type:'board-prep'},
    { id:'t4', subject:'Bharatanatyam',   topics:['Second Grade Exam — Dance recital'], date: '2026-12-15', type:'board-prep'},
  ],
  journeyMilestones: [
    { grade:'Grade 4 (Now)',  year:2026, focus:'Study habits + Olympiad exposure + competitive swimming', keyGoal:'IMO School Rank 1', emoji:'🌱' },
    { grade:'Grade 5',        year:2027, focus:'Strengthen all subjects, first State-level swim trial',   keyGoal:'State swim qualifier',  emoji:'🏊' },
    { grade:'Grade 6-7',      year:2028, focus:'Deepen Science, Art Grade exams, dance recital',          keyGoal:'Arangetram performance', emoji:'💃' },
    { grade:'Grade 8-9',      year:2030, focus:'Board prep, advanced art, science stream clarity',        keyGoal:'Class 9 score > 90%', emoji:'🎯' },
    { grade:'Grade 10-12',    year:2032, focus:'Board exams, competitive swimming peak, college prep',    keyGoal:'National swim champion', emoji:'🚀' },
    { grade:'Goal Achieved',  year:2034, focus:'Marine Biology or Sports Science at top college',         keyGoal:'University admission', emoji:'🏆' },
  ],
}

// ── Miko / Ollama types & helpers ─────────────────────────────────────────────
export interface MikoKidContext {
  name:       string
  grade:      string
  board:      string
  school:     string
  goal:       string
  subjects:   string[]
  activities: string[]
  xp:         number
  streak:     number
  recentLogs?: { subject: string; activity: string }[]
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_BASE    = 'https://api.openai.com/v1'

function buildSystemPrompt(ctx: MikoKidContext): string {
  const subjectList = ctx.subjects.length ? ctx.subjects.join(', ') : 'core subjects'
  const activityList = ctx.activities.length ? ctx.activities.join(', ') : 'extracurriculars'
  const recentStr = ctx.recentLogs?.length
    ? ctx.recentLogs.map(l => `${l.subject}: ${l.activity}`).join('; ')
    : 'no recent logs yet'

  return `You are Miko, a friendly and encouraging AI study buddy for ${ctx.name}.

Student profile:
- Name: ${ctx.name}
- Grade: ${ctx.grade} | Board: ${ctx.board}
- School: ${ctx.school || 'school'}
- Subjects: ${subjectList}
- Activities: ${activityList}
- Dream goal: ${ctx.goal || 'not shared yet'}
- XP earned: ${ctx.xp} | Study streak: ${ctx.streak} days
- Recent study: ${recentStr}

Your personality and rules:
- You are warm, patient, and encouraging — like a knowledgeable older sibling
- Use age-appropriate language for a ${ctx.grade} student
- Use relatable Indian examples (cricket, festivals, Bollywood, street food) when explaining concepts
- Celebrate effort and progress, not just results
- For ${ctx.board} curriculum questions, align answers to NCERT/prescribed textbooks
- Keep responses concise — 2-4 short paragraphs maximum
- Use emojis sparingly to keep it fun 🎯
- If you don't know something specific to the curriculum, say so honestly and suggest looking at the NCERT textbook
- Never make the student feel bad for not knowing something
- When giving a quiz or practice question, wait for the student's answer before revealing the correct one`
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useAppStore = create<AppState>((set, get) => ({
  childName: 'Prisha',
  profile: seedProfile,
  subscription: 'advanced',
  logs: seedLogs,
  tutorSessions: [],
  xpTotal: 185,
  streakDays: 7,
  badges: ['First Log 🌟', '3-Day Streak 🔥', '7-Day Streak ⚡', '100 XP Club'],
  summary: '',
  tutorSummary: '',
  isGenerating: false,
  weeklyPlan: seedPlan,
  isGeneratingPlan: false,
  socialPosts: seedPosts,
  socialGroups: seedGroups,
  chatMessages: [],
  isChatting: false,

  subjects: seedSubjects,
  olympiads: seedOlympiads,
  activities: seedActivities,
  weeklySchedule: seedWeeklySchedule,
  worksheets: seedWorksheets,

  updateProfile: (patch) => {
    const { childName: n, ...rest } = patch as Partial<StudentProfile & { childName: string }>
    set(s => ({
      ...(n ? { childName: n } : {}),
      profile: { ...s.profile, ...rest },
    }))
  },

  addLog: (subject, activity, durationMinutes, mood) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      subject, activity, durationMinutes, mood,
      createdAt: new Date().toISOString(),
    }
    const xp = get().xpTotal + 10
    const streak = get().streakDays + 1
    const newBadges = awardBadges(xp, streak, get().badges)
    const earned = newBadges.filter(b => !get().badges.includes(b))
    const newPosts = earned.length > 0 ? [{
      id: `auto-${Date.now()}`,
      authorName: get().childName, authorAvatar: get().profile.avatar,
      authorRole: 'student' as const, postType: 'achievement' as const,
      content: `Just earned the "${earned[0]}" badge! 🎉 Consistency paying off!`,
      reactions: [{emoji:'🎉',count:1,reacted:false},{emoji:'⭐',count:0,reacted:false}],
      commentCount: 0, timeAgo: 'Just now', badge: earned[0],
    }, ...get().socialPosts] : get().socialPosts
    set({ logs:[newLog,...get().logs], xpTotal:xp, streakDays:streak, badges:newBadges, socialPosts:newPosts })
  },

  addTutorSession: async (topics, homework, notes) => {
    const session: TutorSession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      topics, homework, notes, createdAt: new Date().toISOString(),
    }
    const xp = get().xpTotal + 20
    set({ tutorSessions:[session,...get().tutorSessions], isGenerating:true,
          xpTotal:xp, badges:awardBadges(xp,get().streakDays,get().badges) })
    try {
      const res = await axios.post('/api/summary/tutor', { topics, homework, notes })
      set({ tutorSummary:res.data.summary, isGenerating:false })
    } catch {
      set({ tutorSummary:`Session on ${topics.join(', ')} completed. HW: ${homework.join(', ')}.`, isGenerating:false })
    }
  },

  refreshSummary: async () => {
    set({ isGenerating:true })
    const { childName, logs, profile } = get()
    try {
      const res = await axios.post('/api/summary/parent', {
        child_name:childName, grade:profile.grade, school:profile.school,
        logs: logs.map(l => ({ subject:l.subject, activity:l.activity, duration_minutes:l.durationMinutes, mood:l.mood })),
      })
      set({ summary:res.data.summary, isGenerating:false })
    } catch {
      set({ summary:fallbackSummary(childName,logs), isGenerating:false })
    }
  },

  generatePlan: async () => {
    set({ isGeneratingPlan:true })
    const { childName, profile } = get()
    try {
      const res = await axios.post('/api/plan/generate', {
        child_name:childName, grade:profile.grade, board:profile.board,
        school:profile.school, city:profile.city, life_goal:profile.lifeGoal,
        subjects:profile.subjectGoals.filter(g=>g.active).map(g=>g.subject),
      })
      set({ weeklyPlan:res.data.plan, isGeneratingPlan:false })
    } catch {
      set({ isGeneratingPlan:false })
    }
  },

  toggleSlotComplete: (dayLabel, slotId) => {
    const plan = get().weeklyPlan
    if (!plan) return
    set({
      weeklyPlan: {
        ...plan,
        days: plan.days.map(d =>
          d.day === dayLabel
            ? { ...d, slots: d.slots.map(s => s.id===slotId ? {...s, completed:!s.completed} : s) }
            : d
        ),
      },
    })
  },

  moveSlot: (dayLabel, slotId, direction) => {
    const plan = get().weeklyPlan
    if (!plan) return
    set({
      weeklyPlan: {
        ...plan,
        days: plan.days.map(d => {
          if (d.day !== dayLabel) return d
          const idx = d.slots.findIndex(s => s.id===slotId)
          if (idx < 0) return d
          const slots = [...d.slots]
          const target = direction==='up' ? idx-1 : idx+1
          if (target<0 || target>=slots.length) return d
          ;[slots[idx], slots[target]] = [slots[target], slots[idx]]
          return { ...d, slots }
        }),
      },
    })
  },

  reactToPost: (postId, emoji) => {
    set({
      socialPosts: get().socialPosts.map(p => {
        if (p.id !== postId) return p
        const existing = p.reactions.find(r => r.emoji===emoji)
        return {
          ...p,
          reactions: existing
            ? p.reactions.map(r => r.emoji===emoji ? {...r, count:r.reacted?r.count-1:r.count+1, reacted:!r.reacted} : r)
            : [...p.reactions, {emoji, count:1, reacted:true}],
        }
      }),
    })
  },

  addPost: (content, type) => {
    const { childName, profile } = get()
    const post: SocialPost = {
      id: `post-${Date.now()}`,
      authorName:childName, authorAvatar:profile.avatar,
      authorRole:'student', postType:type, content,
      reactions:[{emoji:'❤️',count:0,reacted:false},{emoji:'👏',count:0,reacted:false}],
      commentCount:0, timeAgo:'Just now', school:profile.school,
    }
    set({ socialPosts:[post,...get().socialPosts] })
  },

  toggleGroup: (groupId) => {
    set({
      socialGroups: get().socialGroups.map(g =>
        g.id===groupId ? {...g, joined:!g.joined, memberCount:g.joined?g.memberCount-1:g.memberCount+1} : g
      ),
    })
  },

  sendChatMessage: async (content, kidCtx) => {
    const ts = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: 'user', content, timestamp: ts() }
    set({ chatMessages: [...get().chatMessages, userMsg], isChatting: true })

    const history = get().chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))
    const systemPrompt = buildSystemPrompt(kidCtx ?? {
      name: get().childName, grade: get().profile.grade, board: get().profile.board,
      school: get().profile.school, goal: get().profile.lifeGoal,
      subjects: get().profile.subjectGoals.filter(g => g.active).map(g => g.subject),
      activities: get().profile.sports ?? [],
      xp: get().xpTotal, streak: get().streakDays,
      recentLogs: get().logs.slice(0, 5).map(l => ({ subject: l.subject, activity: l.activity })),
    })
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content },
    ]

    // Production: call the secure Azure Function proxy (/api/chat)
    // Dev: call OpenAI directly using local .env.local key
    const useProxy = import.meta.env.PROD

    try {
      let reply: string

      if (useProxy) {
        const res = await axios.post('/api/chat', { messages }, { timeout: 30000 })
        reply = (res.data as { reply: string }).reply.trim()
      } else {
        if (!OPENAI_API_KEY) throw new Error('no-key')
        const res = await axios.post(
          `${OPENAI_BASE}/chat/completions`,
          { model: 'gpt-4o-mini', messages, temperature: 0.7 },
          { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 30000 }
        )
        reply = (res.data as { choices: { message: { content: string } }[] }).choices[0].message.content.trim()
      }

      set({
        chatMessages: [...get().chatMessages, { id: `m-${Date.now()}-ai`, role: 'assistant', content: reply, timestamp: ts() }],
        isChatting: false,
      })
    } catch (err: unknown) {
      let fallback = `Sorry, I ran into a hiccup! Please try again in a moment. 🙏`
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        if (!err.response || err.code === 'ERR_NETWORK') {
          fallback = `⚠️ Network error — check your internet connection and try again.`
        } else if (status === 401) {
          fallback = `⚠️ API key error. Please contact the app administrator.`
        } else if (status === 429) {
          fallback = `⚠️ Too many requests — please wait a moment and try again. 🙏`
        }
      } else if ((err as Error).message === 'no-key') {
        fallback = `⚠️ Miko isn't configured yet — VITE_OPENAI_API_KEY missing from .env.local.`
      }
      set({
        chatMessages: [...get().chatMessages, { id: `m-${Date.now()}-ai`, role: 'assistant', content: fallback, timestamp: ts() }],
        isChatting: false,
      })
    }
  },

  // ── New actions ────────────────────────────────────────────────────────────
  toggleTopicComplete: (subjectId, chapterId, topicId) => {
    set(s => ({
      subjects: s.subjects.map(sub => sub.id !== subjectId ? sub : {
        ...sub,
        chapters: sub.chapters.map(ch => ch.id !== chapterId ? ch : {
          ...ch,
          topics: ch.topics.map(t => t.id !== topicId ? t : {
            ...t, isCompleted: !t.isCompleted,
            completedDate: !t.isCompleted ? new Date().toISOString().split('T')[0] : undefined,
          }),
        }),
      }),
    }))
  },

  updateChapterStatus: (subjectId, chapterId, status) => {
    set(s => ({
      subjects: s.subjects.map(sub => sub.id !== subjectId ? sub : {
        ...sub,
        chapters: sub.chapters.map(ch => ch.id !== chapterId ? ch : { ...ch, status }),
      }),
    }))
  },

  toggleOlympiadRegistration: (olympiadId) => {
    set(s => ({
      olympiads: s.olympiads.map(o => o.id !== olympiadId ? o : { ...o, isRegistered: !o.isRegistered }),
    }))
  },

  overrideScheduleTopic: (day, blockId, topic) => {
    set(s => ({
      weeklySchedule: s.weeklySchedule.map(d => d.day !== day ? d : {
        ...d,
        slots: d.slots.map(b => b.id !== blockId ? b : { ...b, topic, isOverridden: true }),
      }),
    }))
  },

  submitWorksheet: (worksheetId, score) => {
    set(s => ({
      worksheets: s.worksheets.map(w => w.id !== worksheetId ? w : {
        ...w, status: 'graded', score,
      }),
      xpTotal: s.xpTotal + 15,
    }))
  },
}))
