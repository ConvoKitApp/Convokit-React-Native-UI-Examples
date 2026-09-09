# ConvoKit React Native UI examples

Runnable bare React Native and Expo applications sharing the same fixture
gallery and live ConvoKit flows.

## Applications

- `apps/bare`: React Native 0.87 with checked-in iOS and Android projects.
- `apps/expo`: Expo SDK 57 / React Native 0.86.

Both default to a backend-free standard/branded/compact component showcase.
Copy the relevant `.env.example` and select live mode to connect through a
customer-owned token endpoint. Never place a ConvoKit client secret here.

Use Node 22 (`nvm use`), then install dependencies and run `npm run typecheck`
and `npm test`. Start either app with `npm run start:bare` or
`npm run start:expo`. The bare app has real native projects with Hermes and the
New Architecture enabled; the Expo app uses only Expo Go-compatible modules.

For released packages, publish in this order: JavaScript SDK, React Native SDK,
React Native UI, then install those package versions here. CI can also check out
the SDK and UI sibling repositories for pre-release validation.
