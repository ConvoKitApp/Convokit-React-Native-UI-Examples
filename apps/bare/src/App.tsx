import { useMemo, type ReactElement } from 'react'
import { pick } from '@react-native-documents/picker'
import Config from 'react-native-config'
import { ConvoKitClient, type MessageMedia } from '@convokitapp/react-native'
import { LiveApp, ShowcaseApp } from '@convokitapp/react-native-examples-shared'

function tokenProvider(appUserId: string): Promise<string> {
  if (!Config.CONVOKIT_TOKEN_ENDPOINT) return Promise.reject(new Error('CONVOKIT_TOKEN_ENDPOINT is required'))
  return fetch(Config.CONVOKIT_TOKEN_ENDPOINT, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ appUserId }),
  }).then(async response => {
    if (!response.ok) throw new Error('Token endpoint rejected the example user')
    const body = await response.json() as { token?: string; data?: { token?: string } }
    const token = body.token ?? body.data?.token
    if (!token) throw new Error('Token endpoint returned no token')
    return token
  })
}

function BareLiveApp(): ReactElement {
  const client = useMemo(() => new ConvoKitClient({
    clientId: Config.CONVOKIT_CLIENT_ID ?? '', tokenProvider,
    ...(Config.CONVOKIT_BACKEND_URL ? { backendUrl: Config.CONVOKIT_BACKEND_URL } : {}),
  }), [])
  const pickAttachment = async (conversationId: string): Promise<MessageMedia | null> => {
    const [file] = await pick({ allowMultiSelection: false })
    const result = await client.uploadMessageMediaFromUri({
      conversationId, uri: file.uri, fileName: file.name ?? 'attachment',
      ...(file.type ? { contentType: file.type } : {}), ...(file.size ? { size: file.size } : {}),
    })
    return result.media
  }
  return <LiveApp client={client} userId={Config.CONVOKIT_APP_USER_ID ?? 'react_native_bare_example'} pickAttachment={pickAttachment} />
}

export default function App(): ReactElement {
  return Config.CONVOKIT_EXAMPLE_MODE === 'live' ? <BareLiveApp /> : <ShowcaseApp />
}
