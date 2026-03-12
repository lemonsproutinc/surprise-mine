export interface Profile {
  id: string
  name: string
  email: string
  avatar_url?: string
  relationship_stage: string
  partner_name?: string
  invite_code?: string
  couple_id?: string
  created_at: string
}

export interface Couple {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
}

export interface Question {
  id: string
  text: string
  category: string
  category_emoji: string
  intensity: 'light' | 'balanced' | 'deep'
}

export interface DailyQuestion {
  id: string
  couple_id: string
  question_id: string
  assigned_date: string
  question?: Question
}

export interface QuestionAnswer {
  id: string
  daily_question_id: string
  user_id: string
  answer: string
  created_at: string
}

export type GiftType = 'gift_box' | 'love_letter' | 'balloon' | 'fortune_cookie'

export interface Gift {
  id: string
  from_user_id: string
  to_user_id: string
  couple_id: string
  gift_type: GiftType
  message: string
  photo_url?: string
  opened: boolean
  scheduled_for?: string
  created_at: string
  from_profile?: Profile
}

export interface Milestone {
  id: string
  couple_id: string
  title: string
  milestone_date: string
  note?: string
  photo_url?: string
  milestone_type?: string
  created_by?: string
  created_at: string
}

export interface HeartsTransaction {
  id: string
  user_id: string
  amount: number
  reason: string
  created_at: string
}

export interface UserPreferences {
  user_id: string
  question_intensity: 'light' | 'balanced' | 'deep'
  question_categories: string[]
  notification_time: string
}

export type RelationshipStage =
  | 'dating'
  | 'long_distance'
  | 'living_together'
  | 'engaged'
  | 'married'
  | 'complicated'

export const RELATIONSHIP_STAGES: { value: RelationshipStage; label: string; emoji: string }[] = [
  { value: 'dating', label: 'Dating', emoji: '💑' },
  { value: 'long_distance', label: 'Long-distance', emoji: '✈️' },
  { value: 'living_together', label: 'Living Together', emoji: '🏠' },
  { value: 'engaged', label: 'Engaged', emoji: '💍' },
  { value: 'married', label: 'Married', emoji: '💒' },
  { value: 'complicated', label: "It's Complicated", emoji: '🫶' },
]

export const MILESTONE_TYPES = [
  { value: 'first_date', label: 'First Date', emoji: '🥰' },
  { value: 'first_kiss', label: 'First Kiss', emoji: '💋' },
  { value: 'i_love_you', label: 'Said "I Love You"', emoji: '❤️' },
  { value: 'moved_in', label: 'Moved In Together', emoji: '🏠' },
  { value: 'engaged', label: 'Got Engaged', emoji: '💍' },
  { value: 'wedding', label: 'Wedding Day', emoji: '💒' },
  { value: 'pet', label: 'Got a Pet Together', emoji: '🐾' },
  { value: 'trip', label: 'First Trip Together', emoji: '✈️' },
  { value: 'anniversary', label: 'Anniversary', emoji: '🎉' },
  { value: 'custom', label: 'Custom Milestone', emoji: '⭐' },
]
