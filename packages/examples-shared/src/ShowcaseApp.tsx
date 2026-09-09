import { useMemo, useState, type ReactElement } from 'react'
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import type { Conversation } from '@convokitapp/react-native'
import {
  ConvoKitConversationListView, ConvoKitConversationView, ConvoKitUiProvider,
  type ConvoKitUiTheme,
} from '@convokitapp/react-native-ui'
import { fixtureConversations, fixtureMessages } from './fixtures'

export type ShowcaseVariant = 'standard' | 'branded' | 'compact'
const variants: ShowcaseVariant[] = ['standard', 'branded', 'compact']

const themes: Record<ShowcaseVariant, Partial<ConvoKitUiTheme>> = {
  standard: {},
  branded: { colors: { background: '#F8F6FF', surface: '#FFFFFF', primary: '#6750A4', text: '#211B2C', mutedText: '#716A7C', border: '#E4DFF0', error: '#B3261E', incomingBubble: '#FFFFFF', outgoingBubble: '#6750A4', outgoingText: '#FFFFFF', pending: '#716A7C' } },
  compact: { colors: { background: '#F4F6F5', surface: '#FFFFFF', primary: '#315B52', text: '#18211F', mutedText: '#6C7773', border: '#DDE3E1', error: '#BA1A1A', incomingBubble: '#EEF2F0', outgoingBubble: '#315B52', outgoingText: '#FFFFFF', pending: '#6C7773' } },
}

export function ShowcaseApp(): ReactElement {
  const [variant, setVariant] = useState<ShowcaseVariant>('standard')
  const [selected, setSelected] = useState<Conversation>(fixtureConversations[0]!)
  const [messages, setMessages] = useState(fixtureMessages)
  const { width } = useWindowDimensions()
  const conversationMessages = useMemo(() => messages.map(row => ({ ...row, conversationId: selected.id })), [messages, selected.id])
  const compact = variant === 'compact'
  return <ConvoKitUiProvider theme={themes[variant]}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.title}>ConvoKit UI components</Text>
        <View testID="variant-selector" style={styles.selector}>{variants.map(value =>
          <Pressable key={value} accessibilityRole="button" onPress={() => setVariant(value)} style={[styles.variant, value === variant && styles.active]}>
            <Text style={value === variant ? styles.activeText : undefined}>{value}</Text>
          </Pressable>)}</View>
      </View>
      <ScrollView contentContainerStyle={[styles.gallery, width >= 900 && styles.wide]}>
        <View style={[styles.panel, width >= 900 && { width: compact ? 300 : 340 }]}>
          <Text style={styles.label}>CONVERSATION LIST</Text>
          <View style={styles.frame}><ConvoKitConversationListView
            testID={`conversation-list-${variant}`} conversations={fixtureConversations}
            onConversationSelected={setSelected}
            renderItem={variant === 'standard' ? undefined : ({ conversation, onPress }) =>
              <Pressable accessibilityRole="button" onPress={onPress} style={[styles.customRow, compact && styles.compactRow]}>
                <Text style={styles.rowTitle}>{conversation.displayTitle}</Text>
                <Text numberOfLines={1}>{variant === 'branded' ? 'Waiting for your reply' : conversation.description}</Text>
              </Pressable>}
          /></View>
        </View>
        <View style={[styles.panel, width >= 900 && styles.chatPanel]}>
          <Text style={styles.label}>CHAT VIEW</Text>
          <View style={styles.frame}><ConvoKitConversationView
            testID={`chat-view-${variant}`} conversation={selected} messages={conversationMessages}
            currentUserId="jordan" typingUserIds={variant === 'standard' ? new Set() : new Set(['alex'])}
            readAtByUserId={new Map([['alex', new Date('2026-09-09T18:05:00Z')]])}
            reverse={variant === 'standard'}
            onSendMessage={({ text }) => {
              setMessages(current => [...current, {
                id: `fixture-${current.length}`, conversationId: selected.id, senderId: 'jordan',
                text, media: [], createdAt: new Date(), updatedAt: null,
              }]); return true
            }}
            onAddAttachment={() => undefined}
            renderHeader={variant === 'branded' ? conversation =>
              <View style={styles.supportHeader}><Text style={styles.supportText}>{conversation.displayTitle}</Text><Text style={styles.supportCaption}>Priority support · SLA 18 min</Text></View> : undefined}
            renderMessage={compact ? context =>
              <View testID={`compact-message-${context.message.id}`} style={styles.compactMessage}><Text>{context.sender?.name}: {context.message.text}</Text></View> : undefined}
          /></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  </ConvoKitUiProvider>
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EEF2F0' }, hero: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '800' }, selector: { flexDirection: 'row', gap: 8 },
  variant: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: '#fff' },
  active: { backgroundColor: '#17211F' }, activeText: { color: '#fff' },
  gallery: { padding: 12, gap: 16 }, wide: { flexDirection: 'row' }, panel: { height: 620, minWidth: 280 }, chatPanel: { flex: 1 },
  label: { fontSize: 10, fontWeight: '800', color: '#78817E', marginBottom: 6 },
  frame: { flex: 1, overflow: 'hidden', backgroundColor: '#fff', borderRadius: 18 },
  customRow: { padding: 14, borderRadius: 14, backgroundColor: '#F0EAFF', gap: 4 }, compactRow: { padding: 8, borderRadius: 6 },
  rowTitle: { fontWeight: '800' }, supportHeader: { padding: 16, backgroundColor: '#2E2440' },
  supportText: { color: '#fff', fontWeight: '800' }, supportCaption: { color: '#D8CFF0' },
  compactMessage: { marginVertical: 3, padding: 8, backgroundColor: '#EEF2F0', borderRadius: 6 },
})
