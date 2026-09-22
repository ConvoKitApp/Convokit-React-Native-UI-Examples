import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import type { ConvoKitClient, MessageMedia } from '@convokitapp/react-native'
import {
  ConvoKitConversation, ConvoKitConversationList, ConvoKitUiProvider,
  ConversationController, DefaultConvoKitUiClient, useConvoKitConversationList, useConvoKitTheme,
} from '@convokitapp/react-native-ui'

export interface LiveAppProps {
  client: ConvoKitClient
  userId: string
  pickAttachment?: (conversationId: string) => Promise<MessageMedia | null>
}

export function LiveApp({ client, userId, pickAttachment }: LiveAppProps): ReactElement {
  const [ready, setReady] = useState(client.connected)
  const [error, setError] = useState<unknown>(null)
  useEffect(() => {
    if (!client.connected) void client.connectUser(userId).then(() => setReady(true)).catch(setError)
  }, [client, userId])
  if (error) return <SafeAreaView><Text>{error instanceof Error ? error.message : 'Could not connect'}</Text></SafeAreaView>
  if (!ready) return <ActivityIndicator accessibilityLabel="Connecting to ConvoKit" />
  return <ConvoKitUiProvider><SafeAreaView style={{ flex: 1 }}>
    <LiveInbox client={client} pickAttachment={pickAttachment} onError={setError} />
  </SafeAreaView></ConvoKitUiProvider>
}

/** The inbox and the open room share one list controller (`useConvoKitConversationList`), so the room's
 * "Mark unread" action goes through the library's `markUnread` and the list, with its default rows,
 * shows the numberless dot when the user comes back. The controller is created once the session is
 * connected, exactly when the SDK-backed list used to create its own.
 */
function LiveInbox({ client, pickAttachment, onError }: {
  client: ConvoKitClient
  pickAttachment?: (conversationId: string) => Promise<MessageMedia | null>
  onError(error: unknown): void
}): ReactElement {
  const theme = useConvoKitTheme()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const uiClient = useMemo(() => new DefaultConvoKitUiClient(client), [client])
  const list = useConvoKitConversationList({ client: uiClient })
  const controller = useMemo(() => selectedId ? new ConversationController({ conversationId: selectedId, client: uiClient }) : null, [selectedId, uiClient])
  useEffect(() => () => { void controller?.dispose() }, [controller])
  if (!selectedId || !controller) {
    return <ConvoKitConversationList controller={list.controller} onConversationSelected={conversation => setSelectedId(conversation.id)} />
  }
  const markUnread = () => {
    // Leave the room, then mark it: the marker is the user's latest intention and the list controller
    // applies the response to the room's summary. The acknowledgements this open sent carry the version
    // captured at open, so a late one cannot clear the newer marker. A request failure sets the list
    // controller's `error`, which the default list renders inline with `Retry`, and rejects (RN UI 0.8.1),
    // so it is not escalated here; only a rejection the list did not report replaces the screen: the
    // controller is not active (the session ended or changed hands) or the adapter lacks the 0.7 member.
    setSelectedId(null)
    void list.controller.markUnread(selectedId).catch((error: unknown) => {
      if (list.controller.getSnapshot().error !== error) onError(error)
    })
  }
  return <>
    <View style={[styles.toolbar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Pressable
        testID="live-mark-unread"
        accessibilityRole="button"
        accessibilityLabel="Mark unread"
        onPress={markUnread}
        style={[styles.toolbarButton, { borderColor: theme.colors.primary }]}
      ><Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Mark unread</Text></Pressable>
    </View>
    <ConvoKitConversation
      conversationId={selectedId} controller={controller} onBack={() => setSelectedId(null)}
      onAddAttachment={pickAttachment ? () => {
        void pickAttachment(selectedId)
          .then(media => media && controller.sendMessage({ media: [media] }))
          .catch(onError)
      } : undefined}
    />
  </>
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  toolbarButton: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
})
