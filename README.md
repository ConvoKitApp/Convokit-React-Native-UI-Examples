# ConvoKit React Native UI examples

Runnable bare React Native and Expo applications sharing the same fixture
gallery and live ConvoKit flows.

## Applications

- `apps/bare`: React Native 0.87 with checked-in iOS and Android projects.
- `apps/expo`: Expo SDK 57 / React Native 0.86.

Both default to a backend-free standard/branded/compact component showcase.
The showcase passes fixture inbox summaries (`InboxSummary` from the 0.7.0
SDK) to the controlled list, so the default and custom rows show message
previews, activity times and unread badges; the live mode list gets the same
data from `GET /api/v1/inbox` through the SDK-backed component.
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
Copy the relevant `.env.example` and select live mode to connect through a
customer-owned token endpoint. Never place a ConvoKit client secret here.

Use Node 22 (`nvm use`), then install dependencies and run `npm run typecheck`
and `npm test`. Start either app with `npm run start:bare` or
`npm run start:expo`. The bare app has real native projects with Hermes and the
New Architecture enabled; the Expo app uses only Expo Go-compatible modules.

For released packages, publish in this order: JavaScript SDK, React Native SDK,
React Native UI, then install those package versions here. CI can also check out
the SDK and UI sibling repositories for pre-release validation.
