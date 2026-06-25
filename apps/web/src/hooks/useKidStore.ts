import { useAuthStore } from '@/store/authStore'
import { useKidsDataStore, EMPTY_KID_DATA } from '@/store/kidsDataStore'
import type { SyllabusChapter, Mood, OlympiadExam } from '@/store/appStore'

export function useKidStore() {
  const { activeKidId } = useAuthStore()
  const {
    kidsData,
    toggleTopicComplete, updateChapterStatus,
    updateSubjectTextbook, toggleChapterInSchool,
    ensureOlympiads,
    toggleOlympiadRegistration, overrideScheduleTopic,
    submitWorksheet, addLog,
  } = useKidsDataStore()

  const kidId = activeKidId ?? ''
  const data  = kidsData[kidId] ?? EMPTY_KID_DATA

  return {
    kidId,
    subjects:       data.subjects,
    olympiads:      data.olympiads,
    weeklySchedule: data.weeklySchedule,
    worksheets:     data.worksheets,
    logs:           data.logs,
    badges:         data.badges,
    xpTotal:        data.xpTotal,
    streakDays:     data.streakDays,
    hasData:        Boolean(kidsData[kidId]),

    toggleTopicComplete: (subjectId: string, chapterId: string, topicId: string) =>
      toggleTopicComplete(kidId, subjectId, chapterId, topicId),

    updateChapterStatus: (subjectId: string, chapterId: string, status: SyllabusChapter['status']) =>
      updateChapterStatus(kidId, subjectId, chapterId, status),

    updateSubjectTextbook: (subjectId: string, textbook: string) =>
      updateSubjectTextbook(kidId, subjectId, textbook),

    toggleChapterInSchool: (subjectId: string, chapterId: string) =>
      toggleChapterInSchool(kidId, subjectId, chapterId),

    ensureOlympiads: (defaults: OlympiadExam[]) =>
      ensureOlympiads(kidId, defaults),

    toggleOlympiadRegistration: (olympiadId: string) =>
      toggleOlympiadRegistration(kidId, olympiadId),

    overrideScheduleTopic: (day: string, blockId: string, topic: string) =>
      overrideScheduleTopic(kidId, day, blockId, topic),

    submitWorksheet: (worksheetId: string, score: number) =>
      submitWorksheet(kidId, worksheetId, score),

    addLog: (subject: string, activity: string, durationMinutes: number, mood: Mood) =>
      addLog(kidId, subject, activity, durationMinutes, mood),
  }
}
