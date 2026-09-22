import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native'
import { AccessibilityInfo, Alert } from 'react-native'
import { ShowcaseApp } from '../src/ShowcaseApp'

// The showcase rendered at a phone width (the preset's 375pt window): the list first, the chat view after a
// row is opened, `Back` returns to the list. The library's action sheet and its delete confirmation are
// `Alert.alert` calls, so the spy records their buttons and the tests press them like a user would.
type AlertButtons = Array<{ text?: string; onPress?: () => void }>
const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
const alerts = () => alert.mock.calls as unknown as Array<[string, string | undefined, AlertButtons | undefined]>
const lastAlert = () => alerts().at(-1)!
const alertButtons = () => lastAlert()[2]!.map(button => button.text)
const pressAlertButton = (label: string) => act(async () => { lastAlert()[2]!.find(button => button.text === label)!.onPress?.() })
const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined)
/** The quoted block the library renders above a reply, whatever state its parent is in. */
const quoteLabel = /^(Quoted message|Original message unavailable)/
/** The default row that SENT `text`. Since 0.9 a reply repeats its parent's text inside its own quoted
 * block, so a row counts only when the text is there outside that block.
 */
const actionRow = (text: string) => screen.getAllByHintText('Long press for message actions').find(row => {
  const quote = within(row).queryByLabelText(quoteLabel)
  return within(row).queryAllByText(text).length > (quote ? within(quote).queryAllByText(text).length : 0)
})!
const openActions = (text: string) => fireEvent(actionRow(text), 'longPress')

beforeEach(() => { alert.mockClear(); announce.mockClear() })

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
    // Since 0.9 every confirmed row carries the action sheet, because any member may quote any row; only
    // Maya's two own rows also offer Edit and Delete. Her approval is the one edited row (`revision: 1`).
    expect(screen.getAllByHintText('Long press for message actions')).toHaveLength(5)
    expect(within(actionRow('Great. I approved the copy and shared the release notes.')).getByLabelText('Edited')).toHaveTextContent('Edited')
    expect(screen.getAllByLabelText('Edited')).toHaveLength(1)
    expect(screen.getByLabelText('Add attachment')).toBeOnTheScreen()

    // Message actions → Edit message: the default composer shows its banner with the original text, is
    // prefilled with it, hides the attachment control (edits change text only) and relabels the action.
    await openActions('I linked this conversation to the support case.')
    expect(lastAlert()[0]).toBe('Message actions')
    expect(alertButtons()).toEqual(['Reply', 'Edit message', 'Delete message', 'Cancel'])
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
    expect(alertButtons()).toEqual(['Cancel', 'Delete'])
    await pressAlertButton('Cancel')
    expect(screen.getByText('EMEA goes first, confirmed.')).toBeOnTheScreen()
    await openActions('EMEA goes first, confirmed.')
    await pressAlertButton('Delete message')
    await pressAlertButton('Delete')
    await waitFor(() => expect(screen.queryByText('EMEA goes first, confirmed.')).toBeNull())
    expect(screen.getAllByHintText('Long press for message actions')).toHaveLength(5)
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Alex Rivera: Can you confirm the EMEA launch window before the standup?')).toBeOnTheScreen()
    expect(screen.queryByText('You: EMEA goes first, confirmed.')).toBeNull()
  })

  it('quotes any confirmed row, carries the quote on the send and keeps reply and edit exclusive', async () => {
    await render(<ShowcaseApp />)
    await fireEvent.press(screen.getByRole('button', { name: 'Open Product launch, 1 unread' }))
    // One batch for the whole window, and three quoted blocks out of it: the parent inside the window is
    // derived from it, the parent outside it comes from the batch, and the id the batch resolved without
    // is gone for good. A parent that is not resolved yet keeps the bare name ‘Quoted message’.
    expect(await screen.findAllByLabelText('Quoted message from Maya Chen')).toHaveLength(2)
    expect(screen.getByLabelText('Original message unavailable')).toBeOnTheScreen()
    expect(screen.queryByLabelText('Quoted message')).toBeNull()
    expect(screen.getByText('Here is the revised launch checklist with the EMEA dates.')).toBeOnTheScreen()
    expect(screen.queryByText('Reviewing it now, thanks.')).toBeNull()

    // Alex's row is not Maya's, so the sheet offers Reply alone — an edit-eligibility rule must not
    // suppress quoting another member's message.
    await openActions('Can you confirm the EMEA launch window before the standup?')
    expect(alertButtons()).toEqual(['Reply', 'Cancel'])
    await pressAlertButton('Reply')
    expect(screen.getByText('Replying to Alex Rivera')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Cancel reply' })).toBeOnTheScreen()

    // Entering edit mode leaves reply mode: the composer never shows both banners.
    await openActions('I linked this conversation to the support case.')
    await pressAlertButton('Edit message')
    expect(screen.getByText('Editing message')).toBeOnTheScreen()
    expect(screen.queryByText('Replying to Alex Rivera')).toBeNull()
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel editing' }))

    // Cancelling the strip drops the quote without touching the draft.
    await openActions('Can you confirm the EMEA launch window before the standup?')
    await pressAlertButton('Reply')
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel reply' }))
    expect(screen.queryByText('Replying to Alex Rivera')).toBeNull()

    // A send carries the reference, so the new row renders its own quoted block and the strip clears.
    await openActions('Can you confirm the EMEA launch window before the standup?')
    await pressAlertButton('Reply')
    await fireEvent.changeText(screen.getByLabelText('Message'), 'EMEA opens at 09:00 UTC.')
    await fireEvent.press(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText('EMEA opens at 09:00 UTC.')).toBeOnTheScreen()
    expect(screen.queryByText('Replying to Alex Rivera')).toBeNull()
    await waitFor(() => expect(within(within(actionRow('EMEA opens at 09:00 UTC.'))
      .getByLabelText('Quoted message from Alex Rivera'))
      .getByText('Can you confirm the EMEA launch window before the standup?')).toBeOnTheScreen())
  })

  it('jumps to a quoted message outside the window and back to the latest', async () => {
    await render(<ShowcaseApp />)
    await fireEvent.press(screen.getByRole('button', { name: 'Open Product launch, 1 unread' }))
    const quoted = await screen.findAllByLabelText('Quoted message from Maya Chen')
    expect(quoted).toHaveLength(2)

    // The quoted parent of Maya's approval is older than the loaded window: activating the block loads a
    // window around it, moves it into view and announces the move.
    await fireEvent.press(within(actionRow('Great. I approved the copy and shared the release notes.'))
      .getByLabelText('Quoted message from Maya Chen'))
    expect(await screen.findByText('Kickoff notes from the planning session are in the shared folder.')).toBeOnTheScreen()
    expect(screen.getByText('Reviewing it now, thanks.')).toBeOnTheScreen()
    expect(announce).toHaveBeenCalledWith('Showing the quoted message')
    // The row a jump lands on is tinted until the host clears it: the theme's `highlight` token, or the
    // accent at low opacity when the theme names none.
    const quotedParent = 'Here is the revised launch checklist with the EMEA dates.'
    expect(actionRow(quotedParent)).toHaveStyle({ backgroundColor: '#148F7829' })
    // A user-initiated drag clears it; the programmatic scroll the jump itself performed never does.
    await fireEvent(screen.getByTestId('chat-view-standard'), 'scrollBeginDrag', {
      nativeEvent: { contentOffset: { x: 0, y: 0 }, contentSize: { height: 0, width: 0 }, layoutMeasurement: { height: 0, width: 0 } },
    })
    expect(actionRow(quotedParent)).not.toHaveStyle({ backgroundColor: '#148F7829' })
    // The live tail is no longer rendered, and the way back is offered throughout.
    expect(screen.queryByText('Can you confirm the EMEA launch window before the standup?')).toBeNull()
    const backToLatest = screen.getByRole('button', { name: 'Jump to latest messages' })

    await fireEvent.press(backToLatest)
    expect(await screen.findByText('Can you confirm the EMEA launch window before the standup?')).toBeOnTheScreen()
    expect(screen.queryByText('Reviewing it now, thanks.')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Jump to latest messages' })).toBeNull()

    // The newer edge pages the window forward while it is jumped, and reaching the tail is never an
    // in-place flip: the host reloads the newest page instead.
    await fireEvent.press(within(actionRow('Great. I approved the copy and shared the release notes.'))
      .getByLabelText('Quoted message from Maya Chen'))
    expect(await screen.findByText('Reviewing it now, thanks.')).toBeOnTheScreen()
    await fireEvent(screen.getByTestId('chat-view-standard'), 'startReached')
    expect(await screen.findByText('I linked this conversation to the support case.')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Jump to latest messages' })).toBeOnTheScreen()
    await fireEvent(screen.getByTestId('chat-view-standard'), 'startReached')
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Jump to latest messages' })).toBeNull())
    expect(screen.queryByText('Reviewing it now, thanks.')).toBeNull()
    expect(screen.getByText('Can you confirm the EMEA launch window before the standup?')).toBeOnTheScreen()

    // A parent that is gone has no window to load: the host reports the deletion and leaves the rendered
    // window exactly as it was. The notice is what only that branch produces — the quoted block was
    // already showing the terminal copy before the press, so asserting the copy alone pins nothing.
    await fireEvent.press(screen.getByLabelText('Original message unavailable'))
    expect(await screen.findByText('That message was deleted')).toBeOnTheScreen()
    expect(screen.getByText('Original message unavailable')).toBeOnTheScreen()
    expect(screen.getByText('Can you confirm the EMEA launch window before the standup?')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Jump to latest messages' })).toBeNull()

    // A parent already inside the loaded window is only highlighted: the window is never replaced, so
    // the live tail stays rendered, nothing older is pulled in and no way back is offered. Alex's newest
    // row quotes Maya's approval, which the live window carries.
    await fireEvent.press(within(actionRow('Can you confirm the EMEA launch window before the standup?'))
      .getByLabelText('Quoted message from Maya Chen'))
    const inWindowParent = 'Great. I approved the copy and shared the release notes.'
    await waitFor(() => expect(actionRow(inWindowParent)).toHaveStyle({ backgroundColor: '#148F7829' }))
    expect(screen.getByText('The final launch checklist is ready for review.')).toBeOnTheScreen()
    expect(screen.getByText('I linked this conversation to the support case.')).toBeOnTheScreen()
    expect(screen.queryByText('Reviewing it now, thanks.')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Jump to latest messages' })).toBeNull()
  })

  it('drives the branded composer through the same edit and reply sessions', async () => {
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
    // Twice on screen: Maya's row itself and the quoted block of the reply that re-read it.
    expect(await screen.findAllByText('Great. I approved the copy and shared the final release notes.')).toHaveLength(2)
    expect(within(actionRow('Great. I approved the copy and shared the final release notes.')).getByLabelText('Edited')).toBeOnTheScreen()
    // Alex's reply re-reads its parent instead of carrying a copy, so the edited text shows in its quote too.
    await waitFor(() => expect(within(within(actionRow('Can you confirm the EMEA launch window before the standup?'))
      .getByLabelText('Quoted message from Maya Chen'))
      .getByText('Great. I approved the copy and shared the final release notes.')).toBeOnTheScreen())
    expect(screen.queryByTestId('support-edit-banner')).toBeNull()
    expect(screen.getByLabelText('Attach to ticket')).toBeOnTheScreen()
    expect(screen.getByLabelText('Send message')).toBeOnTheScreen()
    expect(screen.getByPlaceholderText('Reply to customer…')).toHaveDisplayValue('')

    // Since 0.9 the same flat context carries `replying` and `cancelReply`, so the custom composer draws
    // its own reply strip from them: Alex's row offers Reply alone, the strip names the quoted author and
    // text, and its Cancel drops the target.
    await openActions('Can you confirm the EMEA launch window before the standup?')
    expect(alertButtons()).toEqual(['Reply', 'Cancel'])
    await pressAlertButton('Reply')
    expect(within(screen.getByTestId('support-reply-banner'))
      .getByText('Replying to Alex Rivera: Can you confirm the EMEA launch window before the standup?')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel reply' }))
    expect(screen.queryByTestId('support-reply-banner')).toBeNull()

    // Replying and editing stay mutually exclusive in a custom composer too: at most one strip shows.
    await openActions('Can you confirm the EMEA launch window before the standup?')
    await pressAlertButton('Reply')
    expect(screen.getByTestId('support-reply-banner')).toBeOnTheScreen()
    await openActions('Great. I approved the copy and shared the final release notes.')
    await pressAlertButton('Edit message')
    expect(screen.getByTestId('support-edit-banner')).toBeOnTheScreen()
    expect(screen.queryByTestId('support-reply-banner')).toBeNull()
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel editing' }))
    expect(screen.queryByTestId('support-edit-banner')).toBeNull()
  })

  it('lets the compact rows reply, edit and delete inline, with the host-owned confirmDelete', async () => {
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
    // `reply` is on every confirmed row, not only Maya's: quoting is not an author-only action.
    expect(screen.getAllByRole('button', { name: 'Reply to message' })).toHaveLength(5)
    // The dense row draws its own quoted line from `replyPreview`, with the same three states as the
    // default bubble: the resolved parent, and the terminal unavailable copy for the one that is gone.
    expect(compactRow('message-5').getByTestId('compact-quote-message-5'))
      .toHaveAccessibleName('Maya Chen: Great. I approved the copy and shared the release notes.')
    expect(compactRow('message-2').getByTestId('compact-quote-message-2'))
      .toHaveAccessibleName('Maya Chen: Here is the revised launch checklist with the EMEA dates.')
    expect(compactRow('message-4').getByTestId('compact-quote-message-4'))
      .toHaveAccessibleName('Original message unavailable')
    expect(compactRow('message-1').queryByTestId('compact-quote-message-1')).toBeNull()

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
    // The reply that quoted it keeps its reference: the next batch resolves without the parent, which is
    // the only deletion signal, so the quoted line becomes the terminal unavailable copy.
    await waitFor(() => expect(screen.getByTestId('compact-quote-message-5'))
      .toHaveAccessibleName('Original message unavailable'))

    // `reply()` off the row context is what the inline action calls, and the compact composer reads the
    // same flat `replying`/`cancelReply` the branded one does: the chip appears, its press drops the
    // target, and a send from that composer stamps the reference so the new row draws its own quoted line.
    await fireEvent.press(compactRow('message-1').getByRole('button', { name: 'Reply to message' }))
    expect(screen.getByText('REPLYING ✕')).toBeOnTheScreen()
    expect(screen.queryByText('EDITING ✕')).toBeNull()
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel reply' }))
    expect(screen.queryByText('REPLYING ✕')).toBeNull()
    await fireEvent.press(compactRow('message-1').getByRole('button', { name: 'Reply to message' }))
    expect(screen.getByText('REPLYING ✕')).toBeOnTheScreen()
    await fireEvent.changeText(screen.getByPlaceholderText('Message'), 'Checking the EMEA window now.')
    await fireEvent.press(screen.getByLabelText('Send compact message'))
    expect(await screen.findByTestId('compact-message-local-1')).toBeOnTheScreen()
    expect(screen.queryByText('REPLYING ✕')).toBeNull()
    await waitFor(() => expect(compactRow('local-1').getByTestId('compact-quote-local-1'))
      .toHaveAccessibleName('Alex Rivera: The final launch checklist is ready for review.'))
  })
})
