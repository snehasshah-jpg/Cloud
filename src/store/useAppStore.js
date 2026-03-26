import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialProfile = {
  // Quiz results
  quizCompleted: false,
  recommendedFields: [], // [{ name, confidence, description, careers, salary }]
  selectedField: null,

  // Academic
  gpa: null,           // 0.0 - 4.0
  sat: null,           // 400 - 1600
  act: null,           // 1 - 36
  classRank: null,     // 'top5' | 'top10' | 'top25' | 'top50' | 'lower'
  courseRigor: null,   // 'standard' | 'honors' | 'ap_ib' | 'dual_enrollment'

  // Preferences
  locationPref: [],    // ['northeast', 'southeast', 'midwest', 'southwest', 'west', 'any']
  settingPref: null,   // 'urban' | 'suburban' | 'rural' | 'any'
  sizePref: null,      // 'small' | 'medium' | 'large' | 'very_large' | 'any'
  researchImportance: 5,
  coopImportance: 5,

  // Financial
  familyContribution: null, // 0 | 20000 | 40000 | 60000 | 80000+
  scholarshipPriority: null, // 'critical' | 'important' | 'nice_to_have'
  loanAverse: false,

  // Special circumstances
  firstGen: false,
  urm: false,
  race: null,          // 'hispanic' | 'black' | 'native_american' | 'asian_pi' | 'white' | 'other' | 'prefer_not'
  gender: 'any',       // 'male' | 'female' | 'non_binary' | 'prefer_not'
  citizenship: 'us_citizen', // 'us_citizen' | 'permanent_resident' | 'daca' | 'international'
  isAthlete: false,
  isArtist: false,
  hasDisability: false,
  uniqueTalents: [],   // free text array
  householdIncome: null, // number

  // State
  state: null,         // 2-letter state code

  // Setup
  onboardingComplete: false,
  name: '',
  grade: null,         // 'junior' | 'senior'
};

const initialTracker = {
  colleges: {},      // { [collegeId]: { status, notes, visited, essayDone, deadlineAlert } }
  scholarships: {},  // { [scholarshipId]: { status, notes, essayDone, docsComplete } }
  savedColleges: [],
  savedScholarships: [],
};

const useAppStore = create(
  persist(
    (set, get) => ({
      // State
      profile: initialProfile,
      tracker: initialTracker,
      quizAnswers: {},   // { [questionId]: answerValue }
      matchedColleges: [],
      matchedScholarships: [],

      // Profile actions
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      resetProfile: () =>
        set({ profile: initialProfile, quizAnswers: {}, matchedColleges: [], matchedScholarships: [] }),

      // Quiz actions
      setQuizAnswer: (questionId, value) =>
        set((state) => ({
          quizAnswers: { ...state.quizAnswers, [questionId]: value },
        })),

      setRecommendedFields: (fields) =>
        set((state) => ({
          profile: { ...state.profile, recommendedFields: fields, quizCompleted: true },
        })),

      // Match results
      setMatchedColleges: (colleges) => set({ matchedColleges: colleges }),
      setMatchedScholarships: (scholarships) => set({ matchedScholarships: scholarships }),

      // College tracker
      saveCollege: (collegeId) =>
        set((state) => {
          const saved = state.tracker.savedColleges.includes(collegeId)
            ? state.tracker.savedColleges
            : [...state.tracker.savedColleges, collegeId];
          return { tracker: { ...state.tracker, savedColleges: saved } };
        }),

      removeCollege: (collegeId) =>
        set((state) => ({
          tracker: {
            ...state.tracker,
            savedColleges: state.tracker.savedColleges.filter((id) => id !== collegeId),
          },
        })),

      updateCollegeStatus: (collegeId, updates) =>
        set((state) => ({
          tracker: {
            ...state.tracker,
            colleges: {
              ...state.tracker.colleges,
              [collegeId]: { ...(state.tracker.colleges[collegeId] || {}), ...updates },
            },
          },
        })),

      // Scholarship tracker
      saveScholarship: (scholarshipId) =>
        set((state) => {
          const saved = state.tracker.savedScholarships.includes(scholarshipId)
            ? state.tracker.savedScholarships
            : [...state.tracker.savedScholarships, scholarshipId];
          return { tracker: { ...state.tracker, savedScholarships: saved } };
        }),

      removeScholarship: (scholarshipId) =>
        set((state) => ({
          tracker: {
            ...state.tracker,
            savedScholarships: state.tracker.savedScholarships.filter((id) => id !== scholarshipId),
          },
        })),

      updateScholarshipStatus: (scholarshipId, updates) =>
        set((state) => ({
          tracker: {
            ...state.tracker,
            scholarships: {
              ...state.tracker.scholarships,
              [scholarshipId]: { ...(state.tracker.scholarships[scholarshipId] || {}), ...updates },
            },
          },
        })),

      completeOnboarding: () =>
        set((state) => ({
          profile: { ...state.profile, onboardingComplete: true },
        })),
    }),
    {
      name: 'scholar-coach-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        tracker: state.tracker,
        quizAnswers: state.quizAnswers,
        matchedColleges: state.matchedColleges,
        matchedScholarships: state.matchedScholarships,
      }),
    }
  )
);

export default useAppStore;
