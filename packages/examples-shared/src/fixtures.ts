import type { Conversation, InboxSummary, Message, ReadPosition, ReplyPreview } from '@convokitapp/react-native'

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

/** The participant names the showcase renders, so `displayNameForUser`, the composer's reply strip and
 * the compact row's quoted line all read one source.
 */
export function fixtureDisplayName(id: string): string {
  return participants.find(participant => participant.id === id)?.name ?? id
}

// The launch room's older history: rows the showcase's live window does not render, so a quoted parent
// can sit OUTSIDE the window the way a real room's does. `jumpToMessage` is what brings them on screen.
export const fixtureArchive: Message[] = [
  { id: 'archive-1', conversationId: 'launch-room', senderId: 'jordan', text: 'Kickoff notes from the planning session are in the shared folder.', media: [], createdAt: new Date('2026-09-03T09:02:00Z'), updatedAt: null, revision: 0 },
  { id: 'archive-2', conversationId: 'launch-room', senderId: 'me', text: 'Here is the revised launch checklist with the EMEA dates.', media: [], createdAt: new Date('2026-09-03T09:05:00Z'), updatedAt: null, revision: 0 },
  { id: 'archive-3', conversationId: 'launch-room', senderId: 'alex', text: 'Reviewing it now, thanks.', media: [], createdAt: new Date('2026-09-03T09:08:00Z'), updatedAt: null, revision: 0 },
]

/** A quoted parent the room no longer has: the showcase's stand-in for a message its author deleted. No
 * fixture row carries this id, so the batch resolves without it — the only deletion signal the libraries
 * read — and the quoted block shows `Original message unavailable` while keeping the reference.
 */
const deletedParentId = 'planning-brief'

// `revision` is the core's edit counter (0 when sent, +1 on every edit); `revision > 0` is the only
// edited signal. Maya's approval was edited once, so the library rows (and the compact custom row) show
// `Edited` beside its time, and the showcase's edit callbacks bump the literal from there.
// `replyToMessageId` is the 0.9 core's write-once quote. The three rows that carry one cover the three
// states a quoted block renders: a parent outside the window (`archive-2`, resolved by a preview batch
// and reachable with a jump), a parent inside it (`message-2`, derived locally and only highlighted),
// and a parent that is gone (`planning-brief`).
export const fixtureMessages: Message[] = [
  { id: 'message-1', conversationId: 'launch-room', senderId: 'alex', text: 'The final launch checklist is ready for review.', media: [], createdAt: new Date('2026-09-03T09:14:00Z'), updatedAt: null, revision: 0 },
  { id: 'message-2', conversationId: 'launch-room', senderId: 'me', text: 'Great. I approved the copy and shared the release notes.', media: [], createdAt: new Date('2026-09-03T09:19:00Z'), updatedAt: null, revision: 1, replyToMessageId: 'archive-2' },
  { id: 'message-3', conversationId: 'launch-room', senderId: 'jordan', text: 'Attaching the final handoff document.', media: [{ type: 'file', url: 'https://example.invalid/launch-handoff.pdf', name: 'launch-handoff.pdf', size: 245760 }], createdAt: new Date('2026-09-03T09:23:00Z'), updatedAt: null, revision: 0 },
  { id: 'message-4', conversationId: 'launch-room', senderId: 'me', text: 'I linked this conversation to the support case.', media: [{ type: 'file', url: 'https://example.invalid/tickets/CK-4821', name: 'Ticket CK-4821' }], createdAt: new Date('2026-09-03T09:27:00Z'), updatedAt: null, revision: 0, replyToMessageId: deletedParentId },
  { id: 'message-5', conversationId: 'launch-room', senderId: 'alex', text: 'Can you confirm the EMEA launch window before the standup?', media: [], createdAt: new Date('2026-09-03T09:29:00Z'), updatedAt: null, revision: 0, replyToMessageId: 'message-2' },
]

/** The first 500 characters of a row, as the backend derives a `ReplyPreview` when a batch is read: the
 * attachments themselves are never carried, only how many there are.
 */
export function fixtureReplyPreview(message: Message): ReplyPreview {
  const text = message.text ?? null
  return {
    id: message.id, conversationId: message.conversationId, senderId: message.senderId,
    text: text === null ? null : text.slice(0, 500), textTruncated: (text?.length ?? 0) > 500,
    createdAt: message.createdAt, revision: message.revision, mediaCount: message.media.length,
  }
}

/** The showcase's stand-in for `getReplyPreviews`: ONE batch for every distinct quoted parent the window
 * renders, never one request per row. An id the room no longer has is simply absent from the result —
 * absence from a resolved batch is the only deletion signal, and is never an error.
 */
export async function resolveFixtureReplyPreviews(
  messageIds: readonly string[], history: readonly Message[],
): Promise<ReplyPreview[]> {
  const known = new Map(history.map(message => [message.id, message]))
  return messageIds.flatMap(id => {
    const message = known.get(id)
    return message ? [fixtureReplyPreview(message)] : []
  })
}

// The viewer's inbox as GET /api/v1/inbox would report it: the newest message per room, the unread count
// after the viewer's read position, the viewer's private unread marker and the activity time the rows are
// ordered by. Maya marked the design review to come back to: it is fully read (count 0) but `isUnread`,
// so the rows show the numberless dot instead of a badge. The incident room has more unread than a badge
// can show: the label overflows to `99+` while the accessible name keeps the real count.
const markedRoomId = 'design-review'
const unreadMarkedAt = new Date('2026-09-03T09:05:00Z')
const overflowRoomId = 'incident-room'
const overflowUnread = 104
const latestByRoom: Record<string, Message> = {
  'customer-ops': { id: 'ops-latest', conversationId: 'customer-ops', senderId: 'me', text: 'Refund approved, closing the ticket.', media: [], createdAt: new Date('2026-09-03T09:12:00Z'), updatedAt: null, revision: 0 },
  'design-review': { id: 'design-latest', conversationId: 'design-review', senderId: 'jordan', text: null, media: [{ type: 'image', url: 'https://example.invalid/onboarding-v3.png', name: 'onboarding-v3.png' }], createdAt: new Date('2026-09-03T07:30:00Z'), updatedAt: null, revision: 0 },
  'incident-room': { id: 'incident-latest', conversationId: 'incident-room', senderId: 'alex', text: 'Postmortem draft is in the shared folder.', media: [], createdAt: new Date('2026-09-03T03:30:00Z'), updatedAt: null, revision: 0 },
}

/** The inbox summaries for a launch-room history: the launch room reports the newest surviving row of
 * `history` and counts the other members' messages after the viewer's read position, the way `listInbox`
 * follows an edit, a delete or a send; the other rooms are fixed. The showcase rebuilds the map from its
 * live history so the list previews follow the chat view.
 */
export function fixtureSummariesFor(history: readonly Message[]): ReadonlyMap<string, InboxSummary> {
  return new Map(fixtureConversations.map(conversation => {
    const launch = conversation.id === 'launch-room'
    const latestMessage = launch ? history.at(-1) ?? null : latestByRoom[conversation.id]!
    const unreadCount = launch
      ? history.filter(row => row.senderId !== 'me' && row.createdAt > viewerReadPosition.createdAt).length
      : conversation.id === overflowRoomId ? overflowUnread : 0
    const marked = conversation.id === markedRoomId
    const readPosition = launch ? viewerReadPosition
      : unreadCount ? null : { messageId: latestMessage!.id, createdAt: latestMessage!.createdAt }
    return [conversation.id, {
      latestMessage, unreadCount, unreadCountCapped: false,
      readPosition, lastReadAt: readPosition?.createdAt ?? null,
      isUnread: unreadCount > 0 || marked, unreadMarkedAt: marked ? unreadMarkedAt : null, privateStateVersion: marked ? 1 : 0,
      activityAt: latestMessage?.createdAt ?? conversation.createdAt,
    }]
  }))
}

export const fixtureSummaries: ReadonlyMap<string, InboxSummary> = fixtureSummariesFor(fixtureMessages)
