import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { ShowcaseApp } from '../src/ShowcaseApp'

// The showcase rendered at a phone width (the preset's 375pt window): the list first, the chat view after a
// row is opened, `Back` returns to the list. The library's action sheet and its delete confirmation are
// `Alert.alert` calls, so the spy records their buttons and the tests press them like a user would.
type AlertButtons = Array<{ text?: string; onPress?: () => void }>
const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
const alerts = () => alert.mock.calls as unknown as Array<[string, string | undefined, AlertButtons | undefined]>
const lastAlert = () => alerts().at(-1)!
const pressAlertButton = (label: string) => act(async () => { lastAlert()[2]!.find(button => button.text === label)!.onPress?.() })
/** The default row wrapping `text`: the long-pressable the library renders around an editable message. */
const actionRow = (text: string) => screen.getAllByHintText('Long press for message actions')
  .find(row => within(row).queryByText(text))!
const openActions = (text: string) => fireEvent(actionRow(text), 'longPress')

beforeEach(() => alert.mockClear())

describe('ShowcaseApp', () => {
  it('renders previews, unread badges and the numberless dot from the fixture summaries in every variant', async () => {
    await render(<ShowcaseApp />)
    expect(screen.getByText('1 · Standard components')).toBeOnTheScreen()
    // The library's default rows render the preview line and the badge from the summaries: the exact count,
    // `99+` for the overflow room with the real count as its accessible name, never `0 unread`.
    expect(screen.getByText('Alex Rivera: Can you confirm the EMEA launch window before the standup?')).toBeOnTheScreen()
    expect(screen.getByText('You: Refund approved, closing the ticket.')).toBeOnTheScreen()
    expect(screen.getByText('Jordan Lee: Photo')).toBeOnTheScreen()
    expect(screen.getByText('Alex Rivera: Postmortem draft is in the shared folder.')).toBeOnTheScreen()
    expect(screen.getByLabelText('1 unread')).toHaveTextContent('1')
    expect(screen.getByLabelText('104 unread')).toHaveTextContent('99+')
    expect(screen.queryByLabelText('99+ unread')).toBeNull()
    expect(screen.queryByLabelText('0 unread')).toBeNull()
    expect(screen.getByRole('button', { name: 'Open Incident room, 104 unread' })).toBeOnTheScreen()
    // Design review has nothing left to count but Maya marked it: the numberless dot, named `Unread`.
    expect(screen.getByLabelText('Unread')).toBeEmptyElement()
    expect(screen.getByRole('button', { name: 'Open Design review, Unread' })).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Open Customer operations' })).toBeOnTheScreen()

    // The branded rows read the same summary and draw their own badge and dot from `unreadBadge`.
    await fireEvent.press(screen.getByText('Branded support'))
    expect(screen.getByText('2 · Branded customer support')).toBeOnTheScreen()
    expect(within(screen.getByTestId('support-row-launch-room')).getByText('Alex Rivera: Can you confirm the EMEA launch window before the standup?')).toBeOnTheScreen()
    expect(within(screen.getByTestId('support-row-launch-room')).getByTestId('support-unread-badge')).toHaveTextContent('1')
    expect(within(screen.getByTestId('support-row-incident-room')).getByTestId('support-unread-badge')).toHaveTextContent('99+')
    expect(screen.getByLabelText('104 unread')).toBe(within(screen.getByTestId('support-row-incident-room')).getByTestId('support-unread-badge'))
    expect(within(screen.getByTestId('support-row-design-review')).getByTestId('support-unread-dot')).toHaveAccessibleName('Unread')
    expect(screen.queryByTestId('support-row-customer-ops-badge')).toBeNull()
    expect(within(screen.getByTestId('support-row-customer-ops')).queryByTestId('support-unread-badge')).toBeNull()
    expect(screen.queryByLabelText('0 unread')).toBeNull()

    // The compact rows collapse every unread case (a count, the overflow, the marker) into one dot.
    await fireEvent.press(screen.getByText('Compact operations'))
    expect(screen.getByText('3 · Compact operations view')).toBeOnTheScreen()
    expect(within(screen.getByTestId('compact-row-launch-room')).getByLabelText('1 unread')).toBeEmptyElement()
    expect(within(screen.getByTestId('compact-row-incident-room')).getByLabelText('104 unread')).toBeEmptyElement()
    expect(within(screen.getByTestId('compact-row-design-review')).getByLabelText('Unread')).toBeEmptyElement()
    expect(within(screen.getByTestId('compact-row-customer-ops')).queryByLabelText(/unread/i)).toBeNull()
  })

  it('edits and deletes own messages through the default rows and composer, and the list preview follows', async () => {
    await render(<ShowcaseApp />)
    await fireEvent.press(screen.getByRole('button', { name: 'Open Product launch, 1 unread' }))
    // Only Maya's confirmed rows carry the action sheet; her approval is the one edited row (`revision: 1`).
    expect(screen.getAllByHintText('Long press for message actions')).toHaveLength(2)
    expect(within(actionRow('Great. I approved the copy and shared the release notes.')).getByLabelText('Edited')).toHaveTextContent('Edited')
    expect(screen.getAllByLabelText('Edited')).toHaveLength(1)
    expect(screen.getByLabelText('Add attachment')).toBeOnTheScreen()

    // Message actions → Edit message: the default composer shows its banner with the original text, is
    // prefilled with it, hides the attachment control (edits change text only) and relabels the action.
    await openActions('I linked this conversation to the support case.')
    expect(lastAlert()[0]).toBe('Message actions')
    expect(lastAlert()[2]!.map(button => button.text)).toEqual(['Edit message', 'Delete message', 'Cancel'])
    await pressAlertButton('Edit message')
    expect(screen.getByText('Editing message')).toBeOnTheScreen()
    expect(screen.getByLabelText('Message')).toHaveDisplayValue('I linked this conversation to the support case.')
    expect(screen.queryByLabelText('Add attachment')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Send message' })).toBeNull()
    await fireEvent.changeText(screen.getByLabelText('Message'), 'I linked this conversation to support case CK-4821.')
    await fireEvent.press(screen.getByRole('button', { name: 'Save message' }))
    // `onSaveEdit` bumps the fixture's revision, so the library labels the row `Edited`; edit mode is left.
    expect(await screen.findByText('I linked this conversation to support case CK-4821.')).toBeOnTheScreen()
    expect(within(actionRow('I linked this conversation to support case CK-4821.')).getByLabelText('Edited')).toBeOnTheScreen()
    expect(screen.getAllByLabelText('Edited')).toHaveLength(2)
    expect(screen.queryByText('Editing message')).toBeNull()
    expect(screen.getByLabelText('Add attachment')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Send message' })).toBeOnTheScreen()
    expect(screen.getByLabelText('Message')).toHaveDisplayValue('')

    // Cancel restores the (empty) draft through `onCancelEdit`.
    await openActions('Great. I approved the copy and shared the release notes.')
    await pressAlertButton('Edit message')
    expect(screen.getByLabelText('Message')).toHaveDisplayValue('Great. I approved the copy and shared the release notes.')
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel editing' }))
    expect(screen.queryByText('Editing message')).toBeNull()
    expect(screen.getByLabelText('Message')).toHaveDisplayValue('')

    // A send becomes the launch room's newest row, and the list preview is derived from the live history.
    await fireEvent.changeText(screen.getByLabelText('Message'), 'EMEA goes first, confirmed.')
    await fireEvent.press(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText('EMEA goes first, confirmed.')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('You: EMEA goes first, confirmed.')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Open Product launch, 1 unread' })).toBeOnTheScreen()

    // Delete message asks the library's built-in confirmation; Cancel keeps the row, Delete removes it
    // through `onDeleteMessage`, and the preview falls back to the previous surviving message.
    await fireEvent.press(screen.getByRole('button', { name: 'Open Product launch, 1 unread' }))
    await openActions('EMEA goes first, confirmed.')
    await pressAlertButton('Delete message')
    expect(lastAlert()[0]).toBe('Delete this message?')
    expect(lastAlert()[2]!.map(button => button.text)).toEqual(['Cancel', 'Delete'])
    await pressAlertButton('Cancel')
    expect(screen.getByText('EMEA goes first, confirmed.')).toBeOnTheScreen()
    await openActions('EMEA goes first, confirmed.')
    await pressAlertButton('Delete message')
    await pressAlertButton('Delete')
    await waitFor(() => expect(screen.queryByText('EMEA goes first, confirmed.')).toBeNull())
    expect(screen.getAllByHintText('Long press for message actions')).toHaveLength(2)
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Alex Rivera: Can you confirm the EMEA launch window before the standup?')).toBeOnTheScreen()
    expect(screen.queryByText('You: EMEA goes first, confirmed.')).toBeNull()
  })

  it('drives the branded composer through the same edit session', async () => {
    await render(<ShowcaseApp />)
    await fireEvent.press(screen.getByText('Branded support'))
    await fireEvent.press(screen.getByTestId('support-row-launch-room'))
    expect(screen.getByTestId('support-header')).toBeOnTheScreen()
    expect(screen.getByLabelText('Attach to ticket')).toBeOnTheScreen()
    // The custom composer reads `editing` and `cancelEdit` from the context: its own banner, the prefilled
    // field, no attachment control, and `send()` saving through `onSaveEdit`.
    await openActions('Great. I approved the copy and shared the release notes.')
    await pressAlertButton('Edit message')
    expect(within(screen.getByTestId('support-edit-banner')).getByText('Editing: Great. I approved the copy and shared the release notes.')).toBeOnTheScreen()
    expect(screen.getByPlaceholderText('Edit your reply…')).toHaveDisplayValue('Great. I approved the copy and shared the release notes.')
    expect(screen.queryByLabelText('Attach to ticket')).toBeNull()
    await fireEvent.changeText(screen.getByPlaceholderText('Edit your reply…'), 'Great. I approved the copy and shared the final release notes.')
    await fireEvent.press(screen.getByLabelText('Save message'))
    expect(await screen.findByText('Great. I approved the copy and shared the final release notes.')).toBeOnTheScreen()
    expect(within(actionRow('Great. I approved the copy and shared the final release notes.')).getByLabelText('Edited')).toBeOnTheScreen()
    expect(screen.queryByTestId('support-edit-banner')).toBeNull()
    expect(screen.getByLabelText('Attach to ticket')).toBeOnTheScreen()
    expect(screen.getByLabelText('Send message')).toBeOnTheScreen()
    expect(screen.getByPlaceholderText('Reply to customer…')).toHaveDisplayValue('')
  })

  it('lets the compact rows edit and delete inline, with the host-owned confirmDelete', async () => {
    await render(<ShowcaseApp />)
    await fireEvent.press(screen.getByText('Compact operations'))
    await fireEvent.press(screen.getByTestId('compact-row-launch-room'))
    expect(screen.getByTestId('compact-header')).toBeOnTheScreen()
    expect(screen.getByText('Jordan Lee is responding…')).toBeOnTheScreen()
    // The custom row renders `isEdited` itself and the `edit` / `remove` context only where the view lets
    // Maya edit: her two rows, not Alex's or Jordan's.
    const compactRow = (id: string) => within(screen.getByTestId(`compact-message-${id}`))
    expect(compactRow('message-2').getByLabelText('Edited')).toHaveTextContent('edited')
    expect(compactRow('message-1').queryByLabelText('Edited')).toBeNull()
    expect(screen.getAllByRole('button', { name: 'Edit message' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Delete message' })).toHaveLength(2)
    expect(compactRow('message-5').queryByRole('button', { name: 'Edit message' })).toBeNull()
    expect(screen.queryByHintText('Long press for message actions')).toBeNull()

    await fireEvent.press(compactRow('message-2').getByRole('button', { name: 'Edit message' }))
    expect(screen.getByText('EDITING ✕')).toBeOnTheScreen()
    expect(screen.getByPlaceholderText('Message')).toHaveDisplayValue('Great. I approved the copy and shared the release notes.')
    expect(screen.getByLabelText('Save compact message')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel editing' }))
    expect(screen.queryByText('EDITING ✕')).toBeNull()
    expect(screen.getByPlaceholderText('Message')).toHaveDisplayValue('')
    expect(screen.getByLabelText('Send compact message')).toBeOnTheScreen()

    // `remove()` asks the view's `confirmDelete`, the compact host's own dialog, instead of the library's
    // `Delete this message?`: Keep resolves false and keeps the row, Delete reaches `onDeleteMessage`.
    await fireEvent.press(compactRow('message-2').getByRole('button', { name: 'Delete message' }))
    expect(alerts()).toHaveLength(1)
    expect(lastAlert()[0]).toBe('Delete "Great. I approved the copy and shared the release notes."?')
    expect(lastAlert()[2]!.map(button => button.text)).toEqual(['Keep', 'Delete'])
    await pressAlertButton('Keep')
    expect(screen.getByTestId('compact-message-message-2')).toBeOnTheScreen()
    await fireEvent.press(compactRow('message-2').getByRole('button', { name: 'Delete message' }))
    await pressAlertButton('Delete')
    await waitFor(() => expect(screen.queryByTestId('compact-message-message-2')).toBeNull())
    expect(alerts().map(call => call[0])).not.toContain('Delete this message?')
    expect(screen.getAllByRole('button', { name: 'Delete message' })).toHaveLength(1)
    expect(screen.getByTestId('compact-message-message-1')).toBeOnTheScreen()
  })
})
