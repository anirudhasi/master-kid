// Engagement content: motivational quotes (for parents) and Weekend Bonanza
// suggestions (competitions, movies, trips) — lightly tuned by the child's age.

export interface Quote { text: string; author: string }

export const PARENT_QUOTES: Quote[] = [
  { text: 'Children are not things to be moulded, but people to be unfolded.', author: 'Jess Lair' },
  { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin' },
  { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
  { text: 'Don’t compare your child to others. Every flower blooms in its own time.', author: 'Unknown' },
  { text: 'A little progress each day adds up to big results.', author: 'Unknown' },
  { text: 'Praise the effort, not just the result.', author: 'Carol Dweck' },
  { text: 'Reading is to the mind what exercise is to the body.', author: 'Joseph Addison' },
]

export interface Suggestion { title: string; note: string; emoji: string }

export const COMPETITIONS: Suggestion[] = [
  { title: 'SOF Olympiad mock test', note: 'Free weekend practice round', emoji: '🏆' },
  { title: 'Inter-school art contest', note: 'Submit one artwork this week', emoji: '🎨' },
  { title: 'District swimming trials', note: 'Open registrations', emoji: '🏊' },
  { title: 'Spell Bee — junior round', note: 'Practice 20 words', emoji: '🐝' },
]

// Age-tiered movie suggestions (educational / wholesome)
export const MOVIES: { maxAge: number; items: Suggestion[] }[] = [
  { maxAge: 8, items: [
    { title: 'The Lion King', note: 'Courage & responsibility', emoji: '🦁' },
    { title: 'Finding Nemo', note: 'Ocean life & family', emoji: '🐠' },
  ] },
  { maxAge: 14, items: [
    { title: 'Hidden Figures', note: 'Maths, science & perseverance', emoji: '🚀' },
    { title: 'The Boy Who Harnessed the Wind', note: 'STEM & determination', emoji: '🌬️' },
    { title: 'Wonder', note: 'Kindness & empathy', emoji: '💛' },
  ] },
]

export const TRIPS: { maxAge: number; items: Suggestion[] }[] = [
  { maxAge: 8, items: [
    { title: 'Local zoo or aquarium', note: 'Spot 5 animals & note one fact each', emoji: '🦒' },
    { title: 'Neighbourhood park nature walk', note: 'Collect & name 3 leaves', emoji: '🌳' },
  ] },
  { maxAge: 14, items: [
    { title: 'Science museum / planetarium', note: 'Find one exhibit about space', emoji: '🔭' },
    { title: 'Historical fort or monument', note: 'Learn one story from its past', emoji: '🏰' },
    { title: 'Botanical garden', note: 'Photograph 3 plants & look them up', emoji: '🌺' },
  ] },
]

export const tierFor = <T,>(tiers: { maxAge: number; items: T[] }[], age: number): T[] =>
  (tiers.find(t => age <= t.maxAge) ?? tiers[tiers.length - 1]).items
