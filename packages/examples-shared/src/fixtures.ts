import type { Conversation, InboxSummary, Message, ReadPosition } from '@convokitapp/react-native'

const now = new Date('2026-09-03T09:30:00Z')
// Alex and Jordan have acknowledged through the newest fixture message; the viewer (Maya) is one behind,
// so the first room carries one unread message in the inbox summaries below.
const readThroughNewest: ReadPosition = { messageId: 'message-5', createdAt: new Date('2026-09-03T09:29:00Z') }
const viewerReadPosition: ReadPosition = { messageId: 'message-4', createdAt: new Date('2026-09-03T09:27:00Z') }
const participants = [
  { id: 'me', appUserId: 'me', name: 'Maya Chen', imageUrl: null, role: 'READ_WRITE', lastReadAt: viewerReadPosition.createdAt, readPosition: viewerReadPosition },
  { id: 'alex', appUserId: 'alex', name: 'Alex Rivera', imageUrl: null, role: 'READ_WRITE', lastReadAt: new Date('2026-09-03T09:32:00Z'), readPosition: readThroughNewest },
  { id: 'jordan', appUserId: 'jordan', name: 'Jordan Lee', imageUrl: null, role: 'READ_WRITE', lastReadAt: now, readPosition: readThroughNewest },
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
  { id: 'message-5', conversationId: 'launch-room', senderId: 'alex', text: 'Can you confirm the EMEA launch window before the standup?', media: [], createdAt: new Date('2026-09-03T09:29:00Z'), updatedAt: null },
]

// The viewer's inbox as GET /api/v1/inbox would report it: the newest message per room, the unread count
// after the viewer's read position and the activity time the rows are ordered by.
const latestByRoom: Record<string, Message> = {
  'launch-room': fixtureMessages.at(-1)!,
  'customer-ops': { id: 'ops-latest', conversationId: 'customer-ops', senderId: 'me', text: 'Refund approved, closing the ticket.', media: [], createdAt: new Date('2026-09-03T09:12:00Z'), updatedAt: null },
  'design-review': { id: 'design-latest', conversationId: 'design-review', senderId: 'jordan', text: null, media: [{ type: 'image', url: 'https://example.invalid/onboarding-v3.png', name: 'onboarding-v3.png' }], createdAt: new Date('2026-09-03T07:30:00Z'), updatedAt: null },
  'incident-room': { id: 'incident-latest', conversationId: 'incident-room', senderId: 'alex', text: 'Postmortem draft is in the shared folder.', media: [], createdAt: new Date('2026-09-03T03:30:00Z'), updatedAt: null },
}

export const fixtureSummaries: ReadonlyMap<string, InboxSummary> = new Map(fixtureConversations.map(conversation => {
  const latestMessage = latestByRoom[conversation.id]!
  const unread = conversation.id === 'launch-room'
  const readPosition = unread ? viewerReadPosition : { messageId: latestMessage.id, createdAt: latestMessage.createdAt }
  return [conversation.id, {
    latestMessage, unreadCount: unread ? 1 : 0, unreadCountCapped: false,
    readPosition, lastReadAt: readPosition.createdAt, activityAt: latestMessage.createdAt,
  }]
}))
