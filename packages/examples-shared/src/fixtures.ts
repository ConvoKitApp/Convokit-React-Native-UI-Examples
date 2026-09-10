import type { Conversation, Message } from '@convokitapp/react-native'

const now = new Date('2026-09-03T09:30:00Z')
const participants = [
  { id: 'me', appUserId: 'me', name: 'Maya Chen', imageUrl: null, role: 'READ_WRITE', lastReadAt: now },
  { id: 'alex', appUserId: 'alex', name: 'Alex Rivera', imageUrl: null, role: 'READ_WRITE', lastReadAt: new Date('2026-09-03T09:32:00Z') },
  { id: 'jordan', appUserId: 'jordan', name: 'Jordan Lee', imageUrl: null, role: 'READ_WRITE', lastReadAt: now },
]

export const fixtureConversations: Conversation[] = [
  { id: 'launch-room', appId: 'showcase', title: 'Product launch', displayTitle: 'Product launch', description: 'Launch planning and assets', imageUrl: null, participants, createdAt: new Date('2026-08-30T09:30:00Z'), updatedAt: now },
  { id: 'customer-ops', appId: 'showcase', title: 'Customer operations', displayTitle: 'Customer operations', description: null, imageUrl: null, participants, createdAt: new Date('2026-08-31T09:30:00Z'), updatedAt: new Date('2026-09-03T09:12:00Z') },
  { id: 'design-review', appId: 'showcase', title: 'Design review', displayTitle: 'Design review', description: null, imageUrl: null, participants, createdAt: new Date('2026-09-01T09:30:00Z'), updatedAt: new Date('2026-09-03T07:30:00Z') },
  { id: 'incident-room', appId: 'showcase', title: 'Incident room', displayTitle: 'Incident room', description: null, imageUrl: null, participants, createdAt: new Date('2026-09-02T09:30:00Z'), updatedAt: new Date('2026-09-03T03:30:00Z') },
]

export const fixtureMessages: Message[] = [
  { id: 'message-1', conversationId: 'launch-room', senderId: 'alex', text: 'The final launch checklist is ready for review.', media: [], createdAt: new Date('2026-09-03T09:14:00Z'), updatedAt: null },
  { id: 'message-2', conversationId: 'launch-room', senderId: 'me', text: 'Great. I approved the copy and shared the release notes.', media: [], createdAt: new Date('2026-09-03T09:19:00Z'), updatedAt: null },
  { id: 'message-3', conversationId: 'launch-room', senderId: 'jordan', text: 'Attaching the final handoff document.', media: [{ type: 'file', url: 'https://example.invalid/launch-handoff.pdf', name: 'launch-handoff.pdf', size: 245760 }], createdAt: new Date('2026-09-03T09:23:00Z'), updatedAt: null },
  { id: 'message-4', conversationId: 'launch-room', senderId: 'me', text: 'I linked this conversation to the support case.', media: [{ type: 'file', url: 'https://example.invalid/tickets/CK-4821', name: 'Ticket CK-4821' }], createdAt: new Date('2026-09-03T09:27:00Z'), updatedAt: null },
]
