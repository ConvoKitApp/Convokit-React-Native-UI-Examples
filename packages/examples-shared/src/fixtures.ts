import type { Conversation, Message } from '@convokitapp/react-native'

const participants = [
  { id: 'participant-alex', appUserId: 'alex', name: 'Alex Rivera', imageUrl: null, role: 'READ_WRITE', lastReadAt: new Date('2026-09-09T18:05:00Z') },
  { id: 'participant-jordan', appUserId: 'jordan', name: 'Jordan Lee', imageUrl: null, role: 'READ_WRITE', lastReadAt: new Date('2026-09-09T18:02:00Z') },
]

export const fixtureConversations: Conversation[] = [
  {
    id: 'launch-room', appId: 'fixture-app', title: 'Customer operations',
    displayTitle: 'Customer operations', description: 'Launch handoff and open support items',
    imageUrl: null, participants, createdAt: new Date('2026-09-01T12:00:00Z'), updatedAt: new Date('2026-09-09T18:05:00Z'),
  },
  {
    id: 'design-room', appId: 'fixture-app', title: 'Design review',
    displayTitle: 'Design review', description: 'Branded chat surfaces', imageUrl: null,
    participants, createdAt: new Date('2026-09-02T12:00:00Z'), updatedAt: new Date('2026-09-09T17:00:00Z'),
  },
  {
    id: 'incident-room', appId: 'fixture-app', title: 'Incident response',
    displayTitle: 'Incident response', description: 'Compact operations timeline', imageUrl: null,
    participants, createdAt: new Date('2026-09-03T12:00:00Z'), updatedAt: new Date('2026-09-09T16:00:00Z'),
  },
]

export const fixtureMessages: Message[] = [
  {
    id: 'message-1', conversationId: 'launch-room', senderId: 'alex', text: 'The release candidate is ready for review.',
    media: [], createdAt: new Date('2026-09-09T17:58:00Z'), updatedAt: null,
  },
  {
    id: 'message-2', conversationId: 'launch-room', senderId: 'jordan', text: 'I added the handoff document.',
    media: [{ type: 'file', url: 'https://example.invalid/launch-handoff.pdf', name: 'launch-handoff.pdf', size: 248320 }],
    createdAt: new Date('2026-09-09T18:01:00Z'), updatedAt: null,
  },
  {
    id: 'message-3', conversationId: 'launch-room', senderId: 'alex', text: null,
    media: [{ type: 'image', url: 'https://picsum.photos/640/480', name: 'release-preview.png' }],
    createdAt: new Date('2026-09-09T18:04:00Z'), updatedAt: null,
  },
]
