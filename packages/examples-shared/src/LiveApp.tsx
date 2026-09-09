import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { ActivityIndicator, SafeAreaView, Text } from 'react-native'
import type { ConvoKitClient, MessageMedia } from '@convokitapp/react-native'
import {
  ConvoKitConversation, ConvoKitConversationList, ConvoKitUiProvider,
  ConversationController, DefaultConvoKitUiClient,
} from '@convokitapp/react-native-ui'

export interface LiveAppProps {
  client: ConvoKitClient
  userId: string
  pickAttachment?: (conversationId: string) => Promise<MessageMedia | null>
}

export function LiveApp({ client, userId, pickAttachment }: LiveAppProps): ReactElement {
  const [ready, setReady] = useState(client.connected)
  const [error, setError] = useState<unknown>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const uiClient = useMemo(() => new DefaultConvoKitUiClient(client), [client])
  const controller = useMemo(() => selectedId ? new ConversationController({ conversationId: selectedId, client: uiClient }) : null, [selectedId, uiClient])
  useEffect(() => {
    if (!client.connected) void client.connectUser(userId).then(() => setReady(true)).catch(setError)
    return () => { void controller?.dispose() }
  }, [client, controller, userId])
  if (error) return <SafeAreaView><Text>{error instanceof Error ? error.message : 'Could not connect'}</Text></SafeAreaView>
  if (!ready) return <ActivityIndicator accessibilityLabel="Connecting to ConvoKit" />
  return <ConvoKitUiProvider><SafeAreaView style={{ flex: 1 }}>
    {selectedId && controller ? <ConvoKitConversation
      conversationId={selectedId} controller={controller} onBack={() => setSelectedId(null)}
      onAddAttachment={pickAttachment ? () => {
        void pickAttachment(selectedId)
          .then(media => media && controller.sendMessage({ media: [media] }))
          .catch(setError)
      } : undefined}
    /> : <ConvoKitConversationList sdk={client} onConversationSelected={conversation => setSelectedId(conversation.id)} />}
  </SafeAreaView></ConvoKitUiProvider>
}
