import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native'
import { Alert } from 'react-native'
import type {
  Conversation, ConvoKitClient, EditMessageInput, InboxEntry, MarkConversationReadOptions, Message, RealtimeSubscription,
} from '@convokitapp/react-native'
import { LiveApp } from '../src/LiveApp'

/**
 * A connected 0.8 SDK as the UI package's default adapter sees it: one room with nothing unread, its
 * membership served to the caller, the `/unread` mark answering with the marker and the bumped version, and
 * the author routes answering an edit with the bumped revision and a delete with nothing. Maya's own older
 * message was already edited once (`revision: 1`), Alex's newest one never was.
 */
const subscription = (): RealtimeSubscription => ({ closed: false, unsubscribe: async () => undefined })
const room: Conversation = {
  id: 'room-1', appId: 'demo-app', title: 'Launch room', displayTitle: 'Launch room', description: null, imageUrl: null,
  participants: [], createdAt: new Date('2026-08-26T09:00:00Z'), updatedAt: new Date('2026-08-26T11:00:00Z'),
}
const message: Message = {
  id: 'message-1', conversationId: 'room-1', senderId: 'alex', text: 'Hello Maya', media: [],
  createdAt: new Date('2026-08-26T11:00:00Z'), updatedAt: null, revision: 0,
}
const own: Message = {
  id: 'message-0', conversationId: 'room-1', senderId: 'me', text: 'Morning Alex, launch is a go', media: [],
  createdAt: new Date('2026-08-26T10:58:00Z'), updatedAt: new Date('2026-08-26T10:59:00Z'), revision: 1,
}
const entry: InboxEntry = {
  conversation: room, latestMessage: message, unreadCount: 0, unreadCountCapped: false,
  readPosition: { messageId: message.id, createdAt: message.createdAt }, lastReadAt: message.createdAt,
  isUnread: false, unreadMarkedAt: null, privateStateVersion: 2, activityAt: message.createdAt,
}
const sdk = {
  clientId: 'demo-client',
  connected: true,
  currentUserId: 'me',
  connectUser: jest.fn(async () => undefined),
  listInbox: jest.fn(async () => ({ entries: [entry], nextCursor: null })),
  getConversation: jest.fn(async () => ({
    ...room,
    membership: { role: 'READ_WRITE', lastReadAt: message.createdAt, readPosition: entry.readPosition, unreadMarkedAt: null, privateStateVersion: 2 },
  })),
  getMessages: jest.fn(async () => [message, own]),
  editMessage: jest.fn(async (messageId: string, input: EditMessageInput) => ({
    ...own, id: messageId, text: input.text, updatedAt: new Date('2026-08-26T11:06:00Z'), revision: input.revision + 1,
  })),
  deleteMessage: jest.fn(async (_messageId: string) => undefined),
  markConversationRead: jest.fn(async (_conversationId: string, _options?: MarkConversationReadOptions) => undefined),
  markConversationUnread: jest.fn(async (conversationId: string) => ({
    conversationId, unreadMarkedAt: new Date('2026-08-26T11:05:00Z'), privateStateVersion: 3,
  })),
  clearConversationUnread: jest.fn(),
  sendTyping: jest.fn(async () => undefined),
  realtime: {
    onConnectionEvent: subscription, onInboxChanged: subscription, onInboxActivity: subscription,
    onMessage: subscription, onMessageDeleted: subscription, onReadReceipt: subscription, onTyping: subscription,
  },
}
const client = sdk as unknown as ConvoKitClient

type AlertButtons = Array<{ text?: string; onPress?: () => void }>
const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
const lastAlert = () => alert.mock.calls.at(-1) as unknown as [string, string | undefined, AlertButtons]
const pressAlertButton = (label: string) => act(async () => { lastAlert()[2].find(button => button.text === label)!.onPress?.() })
const ownRow = () => screen.getAllByHintText('Long press for message actions')
  .find(row => within(row).queryByText(/Morning Alex/))!

beforeEach(() => { jest.clearAllMocks() })

describe('LiveApp', () => {
  it('marks the open room unread through the shared list controller and shows the dot on the way back', async () => {
    await render(<LiveApp client={client} userId="me" />)
    // The inbox comes from the SDK's `listInbox`; nothing is unread, so the row carries no badge.
    expect(await screen.findByRole('button', { name: 'Open Launch room' })).toBeOnTheScreen()
    expect(sdk.listInbox).toHaveBeenCalledWith({ limit: 30, cursor: null, archived: false })
    expect(screen.getByText('Hello Maya')).toBeOnTheScreen()
    expect(screen.queryByLabelText(/unread/i)).toBeNull()
    expect(sdk.connectUser).not.toHaveBeenCalled()

    // Opening the room renders its history and acknowledges the newest row with the version captured at open.
    await fireEvent.press(screen.getByRole('button', { name: 'Open Launch room' }))
    expect(await screen.findByText('Hello Maya')).toBeOnTheScreen()
    await waitFor(() => expect(sdk.markConversationRead).toHaveBeenCalledWith('room-1', { throughMessageId: 'message-1', privateStateVersion: 2 }))
    expect(screen.getByRole('button', { name: 'Mark unread' })).toBeOnTheScreen()

    // The toolbar action goes through `controller.markUnread` on the shared list controller: the SDK's
    // `/unread` route is called, the demo closes the room, and the list's default row shows the numberless
    // dot from the response (count 0, never `0 unread`).
    await fireEvent.press(screen.getByRole('button', { name: 'Mark unread' }))
    await waitFor(() => expect(sdk.markConversationUnread).toHaveBeenCalledWith('room-1'))
    expect(await screen.findByRole('button', { name: 'Open Launch room, Unread' })).toBeOnTheScreen()
    expect(screen.getByLabelText('Unread')).toBeEmptyElement()
    expect(screen.queryByLabelText('0 unread')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Mark unread' })).toBeNull()
  })

  it('keeps the inbox on screen when the mark fails: the list reports it inline and Retry refetches', async () => {
    sdk.markConversationUnread.mockRejectedValueOnce(new Error('The unread marker could not be saved'))
    await render(<LiveApp client={client} userId="me" />)
    await fireEvent.press(await screen.findByRole('button', { name: 'Open Launch room' }))
    await fireEvent.press(await screen.findByRole('button', { name: 'Mark unread' }))
    await waitFor(() => expect(sdk.markConversationUnread).toHaveBeenCalledWith('room-1'))
    // Under RN UI 0.8.1 the request failure sets the list controller's `error` and rejects. The demo does not
    // route that rejection into its fatal screen: the inbox stays, without the dot, and the library's inline
    // alert carries the message with a `Retry` that refetches the inbox and clears it.
    expect(await screen.findByText('The unread marker could not be saved')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Open Launch room' })).toBeOnTheScreen()
    expect(screen.queryByLabelText('Unread')).toBeNull()
    expect(sdk.listInbox).toHaveBeenCalledTimes(1)
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(sdk.listInbox).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByText('The unread marker could not be saved')).toBeNull())
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Open Launch room' })).toBeOnTheScreen()
  })

  it('edits and deletes the own message through the bound conversation and the SDK author routes', async () => {
    await render(<LiveApp client={client} userId="me" />)
    await fireEvent.press(await screen.findByRole('button', { name: 'Open Launch room' }))
    expect(await screen.findByText('Morning Alex, launch is a go')).toBeOnTheScreen()
    // The demo passes nothing about editing: the bound `ConvoKitConversation` wires the controller, so
    // Maya's own confirmed row is the only long-pressable one and carries the `Edited` label (revision 1).
    expect(screen.getAllByHintText('Long press for message actions')).toHaveLength(1)
    expect(within(ownRow()).getByLabelText('Edited')).toBeOnTheScreen()
    expect(screen.getAllByLabelText('Edited')).toHaveLength(1)

    await fireEvent(ownRow(), 'longPress')
    expect(lastAlert()[0]).toBe('Message actions')
    await pressAlertButton('Edit message')
    // Edit mode is controller-owned: the composer shows the banner, is prefilled with the snapshot text and
    // saves through the SDK's author route with the SNAPSHOT's revision.
    expect(await screen.findByText('Editing message')).toBeOnTheScreen()
    expect(screen.getByLabelText('Message')).toHaveDisplayValue('Morning Alex, launch is a go')
    await fireEvent.changeText(screen.getByLabelText('Message'), 'Morning Alex, launch is a go at 10:00')
    await fireEvent.press(screen.getByRole('button', { name: 'Save message' }))
    await waitFor(() => expect(sdk.editMessage).toHaveBeenCalledWith('message-0', { text: 'Morning Alex, launch is a go at 10:00', revision: 1 }))
    expect(await screen.findByText('Morning Alex, launch is a go at 10:00')).toBeOnTheScreen()
    expect(screen.queryByText('Editing message')).toBeNull()
    expect(screen.getByRole('button', { name: 'Send message' })).toBeOnTheScreen()
    expect(within(ownRow()).getByLabelText('Edited')).toBeOnTheScreen()

    // Delete is never optimistic: the built-in confirmation sends nothing until `Delete`, then the row goes
    // once the SDK's delete resolves.
    await fireEvent(ownRow(), 'longPress')
    await pressAlertButton('Delete message')
    expect(lastAlert()[0]).toBe('Delete this message?')
    await pressAlertButton('Cancel')
    expect(sdk.deleteMessage).not.toHaveBeenCalled()
    await fireEvent(ownRow(), 'longPress')
    await pressAlertButton('Delete message')
    await pressAlertButton('Delete')
    await waitFor(() => expect(sdk.deleteMessage).toHaveBeenCalledWith('message-0'))
    await waitFor(() => expect(screen.queryByText('Morning Alex, launch is a go at 10:00')).toBeNull())
    expect(screen.getByText('Hello Maya')).toBeOnTheScreen()
  })
})
