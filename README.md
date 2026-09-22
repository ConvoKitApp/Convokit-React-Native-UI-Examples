# ConvoKit React Native UI examples

Runnable bare React Native and Expo applications sharing the same fixture
gallery and live ConvoKit flows.

## Applications

- `apps/bare`: React Native 0.87 with checked-in iOS and Android projects.
- `apps/expo`: Expo SDK 57 / React Native 0.86.

Both default to a backend-free standard/branded/compact component showcase.
The showcase passes fixture inbox summaries (`InboxSummary` from the 0.9.0
SDK) to the controlled list, so the default and custom rows show message
previews, activity times and unread badges; the live mode list gets the same
data from `GET /api/v1/inbox` through the SDK-backed component. The summaries
are rebuilt from the showcase's live history (`fixtureSummariesFor`, the way
`listInbox` follows the room), so a send, an edit or a delete in the launch
room changes its preview on the way back to the list. The incident room has
104 unread messages, more than a badge shows: the label overflows to `99+`
while the accessible name keeps the real count (`104 unread`).
One fixture room (the design review) is marked unread by the viewer with
nothing left to count, so `isUnread` is true while `unreadCount` is 0: the
default rows render the library's numberless dot (accessible name `Unread`),
the branded row draws its own dot when `unreadBadge(summary)` returns the
`dot` descriptor, and the compact row keeps one dot for every unread case the
helper reports. In live mode the inbox and the open room share
one list controller from `useConvoKitConversationList`; the room's
`Mark unread` button calls `controller.markUnread(id)` and returns to the
list, which shows the dot from the response and refetches on
`inbox_activity`, so a second device shows it too. Opening the room again
clears the marker through the acknowledgement's captured `privateStateVersion`.
When the request fails, the list controller sets its `error`, which the
default list renders inline with `Retry`, and rejects; the demo leaves that
failure to the list and only escalates a rejection the list did not report
(the controller is not active because the session ended or changed hands).
Every fixture `Message` carries the 0.9.0 core's `revision` (0 when sent, +1 on
every edit) and Maya's approval in the launch room was edited once, so the
default rows and the compact custom row show the library's `Edited` label from
`revision > 0` alone. The showcase owns edit mode the way a controlled host
does: it keeps a local `editingMessage`, hands rows to `onEditMessage`, bumps
the fixture's `revision` and text in `onSaveEdit` (an empty caption becomes
`null`) and drops the row in `onDeleteMessage`, so a long press on one of
Maya's confirmed bubbles opens the library's `Message actions` sheet, the
default composer switches to its `Editing message` banner with `Cancel` and
`Save` (its attachment control leaves while editing: author edits change text
only), and deleting goes through the built-in `Delete this message?`
confirmation. The compact variant owns that confirmation instead: it passes
`confirmDelete` to the controlled view, which replaces the default row's dialog
and is the only confirmation a custom row's `remove()` asks for (without it a
custom row's `remove()` calls `onDeleteMessage` directly), so its dense row
reads `isEdited`, `edit()` and `remove()` from `MessageRowContext` for its own
inline actions and needs no dialog of its own. Both custom composers read
`editing` and `cancelEdit` from the exported `ComposerContext` to draw a banner
and relabel the action while `send()` saves. In live mode the bound
`ConvoKitConversation` wires the controller's `startEditing`, `saveEdit`,
`cancelEditing` and `deleteMessage` through the default rows and composer
against the backend; a stale revision reloads the row and keeps the draft.

Three launch-room rows carry the 0.9.0 core's `replyToMessageId`, the write-once
quote a send may attach, and between them they cover every state a quoted block
has. The showcase resolves them the way a room does: one batch for the whole
window (`resolveFixtureReplyPreviews`, shaped like `getReplyPreviews`), never
one request per row, with a parent that is itself on screen derived locally and
costing nothing. It hands the result to the controlled view as
`replyPreviewByMessageId`, keyed by the PARENT's id: a resolved entry renders
the author and the quoted text, `'unavailable'` renders
`Original message unavailable` while keeping the reference, and a key that is
simply missing is "not yet resolved" and renders the reference with no quoted
text — never the unavailable copy. Absence from a batch that RESOLVED is the
only deletion signal, so deleting a quoted message in the compact variant turns
its reply's quoted line into the unavailable copy on the next batch, and editing
one changes the quoted text, because a reply re-reads its parent instead of
carrying a copy. `Reply` is offered on every confirmed row, not only your own:
`MessageRowContext` carries `canReply`, `reply()`, `replyPreview` and
`jumpToReplyTarget()` beside the 0.8 members, the default row puts `Reply` at
the top of its `Message actions` sheet, and the compact custom row draws its own
inline reply action and quoted line from the same context. While the showcase
has a reply target it passes `replyTarget` and `onCancelReply`, so the default
composer shows its cancellable `Replying to …` strip and both custom composers
read the flat `replying` and `cancelReply` from `ComposerContext`; replying and
editing are mutually exclusive, and entering one leaves the other. The send
stamps `replyToMessageId` on the new row and clears the strip.

Activating a quoted block calls `onJumpToMessage`. A parent already on screen is
only highlighted; an older one replaces the window with a slice centred on it
(`onReturnToLatest` then makes the library show its `Jump to latest` control,
and `onLoadNewer` pages the newer edge), and the target is tinted through
`highlightedMessageId` until the host clears it — on a timer or through
`onHighlightDismissed`, which the view fires on a user-initiated drag and never
on the programmatic scroll a jump performs. A send while a historical window is
open returns to the latest first, so a new row is never stranded off-screen, and
a quoted message that is gone has no window to load: the window is left exactly
as it was and the preview becomes the terminal unavailable state. In live mode
the bound `ConvoKitConversation` wires all of this from the room controller, so
the demo passes nothing for it. Against a backend older than 0.9 the two new
routes answer with an uncoded 404: the room reports `canJumpToMessages` and
`canResolveReplyPreviews` false, the affordances disappear instead of failing
repeatedly, and quoted blocks keep the bare reference. Such a backend also drops
the unknown `replyToMessageId` from a send, so the quote shown on the optimistic
row is not on the confirmed one.

Copy the relevant `.env.example` and select live mode to connect through a
customer-owned token endpoint. Never place a ConvoKit client secret here.

Use Node 22 (`nvm use`), then install dependencies and run `npm run typecheck`
and `npm test`. `npm test` runs every workspace's tests: the shared package
renders the showcase and live screens with `@testing-library/react-native` on
Jest's React Native preset (`packages/examples-shared/test`), pinning the
previews and `99+` badges, the numberless `Unread` dot, the `Edited` label, the
edit and delete flows through the library's action sheet and dialogs, the
compact `confirmDelete` override, the three quoted-block states, the reply strip
and the jump to a parent outside the window, and the live `Mark unread`, reply
and jump wiring through a fake SDK client; the apps check their native
configuration. CI runs the tests after the typecheck, with a generous
`testTimeout` because the first render of each suite transforms React Native,
the linked UI and the SDK through Babel on a cold cache. The renderer behind
those tests (`test-renderer`) is pinned to the release built for the workspace's
React minor (1.2.0 for React 19.2), so a React bump moves that pin too. Start
either app with
`npm run start:bare` or `npm run start:expo`. The bare app has real native
projects with Hermes and the New Architecture enabled; the Expo app uses only
Expo Go-compatible modules.

For released packages, publish in this order: JavaScript SDK, React Native SDK,
React Native UI, then install those package versions here. CI can also check out
the SDK and UI sibling repositories for pre-release validation, and local builds
validate the same way: `npm install --no-save --legacy-peer-deps
../ConvoKit-JavaScript-SDK ../Convokit-React-Native-SDK ../Convokit-React-Native-UI`
links them into the workspace without changing the pins, and the Jest config
resolves React and the ConvoKit packages from the workspace so a linked
checkout's own `node_modules` never renders through a second React. The apps pin
their ConvoKit packages exactly, so npm keeps a registry copy under each app
until those pins name the version being validated; remove
`apps/*/node_modules/@convokitapp` after linking, or the two copies typecheck
against different core types.
