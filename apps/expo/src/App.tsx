import { useMemo, type ReactElement } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import { ConvoKitClient, type MessageMedia } from '@convokitapp/react-native/expo'
import { LiveApp, ShowcaseApp } from '@convokitapp/react-native-examples-shared'

const env = process.env
async function tokenProvider(appUserId: string): Promise<string> {
  const endpoint = env.EXPO_PUBLIC_CONVOKIT_TOKEN_ENDPOINT
  if (!endpoint) throw new Error('EXPO_PUBLIC_CONVOKIT_TOKEN_ENDPOINT is required')
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ appUserId }),
  })
  if (!response.ok) throw new Error('Token endpoint rejected the example user')
  const body = await response.json() as { token?: string; data?: { token?: string } }
  const token = body.token ?? body.data?.token
  if (!token) throw new Error('Token endpoint returned no token')
  return token
}

function ExpoLiveApp(): ReactElement {
  const client = useMemo(() => new ConvoKitClient({
    clientId: env.EXPO_PUBLIC_CONVOKIT_CLIENT_ID ?? '', tokenProvider,
    ...(env.EXPO_PUBLIC_CONVOKIT_BACKEND_URL ? { backendUrl: env.EXPO_PUBLIC_CONVOKIT_BACKEND_URL } : {}),
  }), [])
  const pickAttachment = async (conversationId: string): Promise<MessageMedia | null> => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
    if (result.canceled) return null
    const file = result.assets[0]!
    return (await client.uploadMessageMediaFromUri({
      conversationId, uri: file.uri, fileName: file.name,
      ...(file.mimeType ? { contentType: file.mimeType } : {}),
      ...(file.size ? { size: file.size } : {}),
    })).media
  }
  return <LiveApp client={client} userId={env.EXPO_PUBLIC_CONVOKIT_APP_USER_ID ?? 'react_native_expo_example'} pickAttachment={pickAttachment} />
}

export default function App(): ReactElement {
  return env.EXPO_PUBLIC_CONVOKIT_EXAMPLE_MODE === 'live' ? <ExpoLiveApp /> : <ShowcaseApp />
}
