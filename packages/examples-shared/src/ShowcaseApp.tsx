import { useMemo, useState, type ReactElement, type ReactNode } from 'react'
import {
  LogBox, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput,
  useWindowDimensions, View,
} from 'react-native'
import type { Conversation, Message } from '@convokitapp/react-native'
import {
  ConvoKitConversationListView, ConvoKitConversationView, ConvoKitUiProvider,
  type ConvoKitUiTheme, type ConversationRowContext, type MediaContext,
  type MessageRowContext,
} from '@convokitapp/react-native-ui'
import { fixtureConversations, fixtureMessages } from './fixtures'

LogBox.ignoreLogs(['VirtualizedLists should never be nested inside plain ScrollViews'])

export type ShowcaseVariant = 'standard' | 'branded' | 'compact'
const variants: Array<{ value: ShowcaseVariant; label: string }> = [
  { value: 'standard', label: 'Standard' },
  { value: 'branded', label: 'Branded support' },
  { value: 'compact', label: 'Compact operations' },
]
const specs = {
  standard: {
    title: '1 · Standard components',
    description: 'Default list rows, header, bubbles, receipts, attachments and composer.',
    props: ['onRefresh', 'onAddAttachment', 'readAtByUserId', 'reverseMessages: true'],
  },
  branded: {
    title: '2 · Branded customer support',
    description: 'A purple support workspace with custom rows, header, ticket card, receipt and composer.',
    props: ['itemBuilder', 'headerBuilder', 'mediaBlockBuilder', 'readReceiptBuilder', 'composerBuilder'],
  },
  compact: {
    title: '3 · Compact operations view',
    description: 'Dense list rows and message rendering for dashboards with limited space.',
    props: ['padding', 'separatorBuilder', 'messageBuilder', 'typingIndicatorBuilder', 'reverseMessages: false'],
  },
} as const
const themes: Record<ShowcaseVariant, Partial<ConvoKitUiTheme>> = {
  standard: {},
  branded: { colors: {
    background: '#F8F6FF', surface: '#FFFFFF', primary: '#6750A4',
    text: '#211B2C', mutedText: '#716A7C', border: '#E4DFF0',
    error: '#B3261E', incomingBubble: '#FFFFFF', outgoingBubble: '#6750A4',
    outgoingText: '#FFFFFF', pending: '#716A7C',
  } },
  compact: {
    colors: {
      background: '#F4F6F5', surface: '#FFFFFF', primary: '#315B52',
      text: '#18211F', mutedText: '#6C7773', border: '#DDE3E1',
      error: '#BA1A1A', incomingBubble: '#EEF2F0', outgoingBubble: '#315B52',
      outgoingText: '#FFFFFF', pending: '#6C7773',
    },
    radius: { sm: 4, md: 8, lg: 10, avatar: 17 },
  },
}

export function ShowcaseApp(): ReactElement {
  const [variant, setVariant] = useState<ShowcaseVariant>('standard')
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState(fixtureMessages)
  const [notice, setNotice] = useState<string | null>(null)
  const { width } = useWindowDimensions()
  const wide = width >= 900
  const spec = specs[variant]
  const visibleMessages = useMemo(
    () => selected
      ? messages.map(message => ({ ...message, conversationId: selected.id }))
      : messages,
    [messages, selected],
  )
  const chooseVariant = (value: ShowcaseVariant) => {
    setVariant(value)
    setSelected(null)
    setMessages(fixtureMessages)
  }
  const notify = (value: string) => {
    setNotice(value)
    setTimeout(() => setNotice(null), 1800)
  }
  return <ConvoKitUiProvider theme={themes[variant]}>
    <View style={[styles.safe, Platform.OS === 'android' && { paddingTop: Math.max(StatusBar.currentHeight ?? 0, 36) }]}>
      <StatusBar barStyle="dark-content" />
      <TopBar variant={variant} onChange={chooseVariant} wide={wide} />
      {!wide && selected ? <View style={styles.mobileChat}>
        <ShowcaseConversation
          variant={variant}
          selected={selected}
          messages={visibleMessages}
          setMessages={setMessages}
          notify={notify}
          onBack={() => setSelected(null)}
          wide={false}
        />
      </View> : <ScrollView style={styles.scroller} contentContainerStyle={styles.page}>
        <View style={styles.maxWidth}>
          <View style={[styles.summary, !wide && styles.summaryNarrow]}>
            <View style={styles.summaryCopy}>
              <Text testID={`variant-title-${variant}`} style={styles.title}>{spec.title}</Text>
              <Text style={styles.description}>{spec.description}</Text>
            </View>
            <View style={styles.chips}>{spec.props.map(prop =>
              <View key={prop} style={styles.chip}><Text style={styles.chipText}>{prop}</Text></View>)}
            </View>
          </View>
          <View style={[styles.gallery, wide && styles.galleryWide]}>
            {(wide || !selected) && <Frame label="Conversation list" style={wide
              ? { width: variant === 'compact' ? 300 : 340 } : { height: 440 }}>
                <ConvoKitConversationListView
                  testID={`conversation-list-${variant}`}
                  conversations={fixtureConversations}
                  onConversationSelected={setSelected}
                  onRefresh={async () => undefined}
                  renderItem={variant === 'branded' ? supportRow
                    : variant === 'compact' ? compactRow : undefined}
                  renderSeparator={variant === 'compact' ? () => <View style={{ height: 3 }} /> : undefined}
                />
              </Frame>}
            {!!selected && <Frame label="Chat view" style={styles.chatWide}>
                <ShowcaseConversation
                  variant={variant}
                  selected={selected}
                  messages={visibleMessages}
                  setMessages={setMessages}
                  notify={notify}
                  onBack={() => setSelected(null)}
                  wide={wide}
                />
              </Frame>}
          </View>
        </View>
      </ScrollView>}
      {!!notice && <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View>}
    </View>
  </ConvoKitUiProvider>
}

function ShowcaseConversation({
  variant, selected, messages, setMessages, notify, onBack, wide,
}: {
  variant: ShowcaseVariant
  selected: Conversation
  messages: Message[]
  setMessages: (update: (current: Message[]) => Message[]) => void
  notify: (message: string) => void
  onBack(): void
  wide: boolean
}) {
  return <ConvoKitConversationView
    testID={`chat-view-${variant}`}
    conversation={selected}
    messages={messages}
    currentUserId="me"
    typingUserIds={variant === 'branded' ? new Set(['alex'])
      : variant === 'compact' ? new Set(['jordan']) : new Set()}
    readAtByUserId={new Map([['alex', new Date('2026-09-03T09:32:00Z')]])}
    reverse={variant === 'standard'}
    onBack={!wide ? onBack : variant === 'compact' ? () => notify('Back callback') : undefined}
    onRefresh={variant === 'standard' ? async () => undefined : undefined}
    onAddAttachment={() => notify('Attachment callback')}
    onAttachmentPress={(_, media) => notify(`Opened ${media.name ?? 'attachment'}`)}
    onSendMessage={({ text }) => {
      setMessages(current => [...current, {
        id: `local-${current.length}`, conversationId: selected.id,
        senderId: 'me', text, media: [], createdAt: new Date(), updatedAt: null,
      }])
      return true
    }}
    displayNameForUser={id => id === 'alex' ? 'Alex Rivera' : id === 'jordan' ? 'Jordan Lee' : id}
    renderHeader={variant === 'branded' ? supportHeader : variant === 'compact' ? compactHeader : undefined}
    renderMessage={variant === 'compact' ? compactMessage : undefined}
    renderMedia={variant === 'branded' ? supportMedia : undefined}
    renderReadReceipt={variant === 'branded' ? supportReceipt : undefined}
    renderComposer={variant === 'branded' ? supportComposer : variant === 'compact' ? compactComposer : undefined}
    renderTypingIndicator={variant === 'compact' ? compactTyping : undefined}
  />
}

function TopBar({ variant, onChange, wide }: {
  variant: ShowcaseVariant; onChange(value: ShowcaseVariant): void; wide: boolean
}) {
  const primary = variant === 'branded' ? '#6750A4' : variant === 'compact' ? '#315B52' : '#148F78'
  return <View style={[styles.topBar, wide && styles.topBarWide]}>
    <View style={[styles.brand, wide && styles.brandWide]}>
      <View style={[styles.logo, { backgroundColor: primary }]}><Text style={styles.logoText}>▰</Text></View>
      <View style={styles.brandCopy}>
        <Text style={styles.brandTitle}>ConvoKit UI components</Text>
        <Text style={styles.brandSubtitle}>Same SDK widgets, different props and builders</Text>
      </View>
    </View>
    <View testID="variant-selector" style={[styles.selector, wide && styles.selectorWide]}>
      {variants.map(item => <Pressable
        key={item.value}
        onPress={() => onChange(item.value)}
        style={[styles.segment, item.value === variant && {
          backgroundColor: variant === 'branded' ? '#E8DFF5' : '#DCEDE8',
        }]}
      ><Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={styles.segmentText}
      >{item.value === variant ? '✓  ' : ''}{item.label}</Text></Pressable>)}
    </View>
  </View>
}

function Frame({ label, children, style }: { label: string; children: ReactNode; style?: object }) {
  return <View style={[styles.frame, style]}>
    <View style={styles.frameLabel}><Text style={styles.frameLabelText}>{label.toUpperCase()}</Text></View>
    <View style={styles.frameBody}>{children}</View>
  </View>
}

function supportRow({ conversation, index, onPress }: ConversationRowContext) {
  return <Pressable testID={`support-row-${conversation.id}`} onPress={onPress}
    style={[styles.supportRow, index === 0 && styles.supportRowActive]}>
    <Avatar title={conversation.displayTitle} color="#6750A4" />
    <View style={styles.flex}>
      <Text numberOfLines={1} style={styles.rowTitle}>{conversation.displayTitle}</Text>
      <Text style={styles.supportMeta}>{index === 0 ? 'Waiting for your reply' : 'Last reply today'}</Text>
    </View>
    {index === 0 && <View testID="support-unread-badge" style={styles.badge}><Text style={styles.badgeText}>2</Text></View>}
  </Pressable>
}

function compactRow({ conversation, index, onPress }: ConversationRowContext) {
  return <Pressable testID={`compact-row-${conversation.id}`} onPress={onPress} style={styles.compactRow}>
    <Avatar title={conversation.displayTitle} color="#DCE9E5" compact />
    <Text numberOfLines={1} style={styles.compactRowTitle}>{conversation.displayTitle}</Text>
    {index === 0 && <View style={styles.liveDot} />}
  </Pressable>
}

function Avatar({ title, color, compact }: { title: string; color: string; compact?: boolean }) {
  return <View style={[compact ? styles.compactAvatar : styles.avatar, { backgroundColor: color }]}>
    <Text style={compact ? styles.compactAvatarText : styles.avatarText}>{title.slice(0, 1)}</Text>
  </View>
}

function supportHeader(conversation: Conversation, actions: { onBack?: () => void }) {
  return <View testID="support-header" style={styles.supportHeader}>
    {actions.onBack && <Pressable accessibilityLabel="Back to conversations" onPress={actions.onBack}>
      <Text style={styles.supportBack}>←</Text>
    </Pressable>}
    <View style={styles.agentIcon}><Text style={styles.agentText}>◉</Text></View>
    <View style={styles.flex}>
      <Text style={styles.supportHeaderTitle}>{conversation.displayTitle}</Text>
      <Text testID="support-sla" style={styles.supportHeaderMeta}>Priority support · SLA 18 min</Text>
    </View>
    <Text style={styles.personIcon}>♙</Text>
  </View>
}

function compactHeader(conversation: Conversation, actions: { onBack?: () => void }) {
  return <View testID="compact-header" style={styles.compactHeader}>
    {actions.onBack && <Pressable accessibilityLabel="Back to queue" onPress={actions.onBack}>
      <Text style={styles.back}>←</Text>
    </Pressable>}
    <Text numberOfLines={1} style={styles.compactHeaderTitle}>{conversation.displayTitle}</Text>
    <View style={styles.liveChip}><Text style={styles.liveChipText}>LIVE</Text></View>
  </View>
}

function supportMedia({ media }: MediaContext) {
  if (media.name === 'Ticket CK-4821') {
    return <View testID="support-ticket" style={styles.ticket}>
      <Text style={styles.ticketIcon}>▧</Text>
      <View style={styles.flex}>
        <Text style={styles.ticketTitle}>Ticket CK-4821</Text>
        <Text style={styles.ticketMeta}>Payment verification</Text>
      </View>
      <View style={styles.openChip}><Text style={styles.openText}>OPEN</Text></View>
    </View>
  }
  return <View style={styles.fileCard}>
    <Text style={styles.fileIcon}>▱</Text>
    <View style={styles.flex}>
      <Text style={styles.rowTitle}>{media.name}</Text>
      <Text style={styles.supportMeta}>{'size' in media && media.size ? `${Math.round(media.size / 1024)} KB` : ''}</Text>
    </View>
    <Text>⇩</Text>
  </View>
}

function supportReceipt(_: Message, readers: ReadonlySet<string>) {
  return readers.size ? <View testID="support-read-receipt" style={styles.receipt}>
    <Text style={styles.receiptText}>✓✓  Read by Alex Rivera</Text>
  </View> : null
}

function compactMessage({ message, isCurrentUser, sender }: MessageRowContext) {
  const senderName = isCurrentUser
    ? 'YOU' : (sender?.name ?? message.senderId).split(' ')[0]!.toUpperCase()
  return <View testID={`compact-message-${message.id}`} style={styles.compactMessage}>
    <Text style={[styles.compactSender, isCurrentUser && styles.compactYou]}>{senderName}</Text>
    <Text style={styles.compactText}>{message.text ?? '[structured message]'}</Text>
    <Text style={styles.compactTime}>{message.createdAt.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', hour12: false,
    })}</Text>
  </View>
}

type ComposerInput = {
  value: string
  setValue(value: string): void
  send(): void
  isSending: boolean
  addAttachment?: () => void
}

function supportComposer(input: ComposerInput) {
  return <View testID="support-composer" style={styles.supportComposer}>
    {input.addAttachment && <Pressable accessibilityLabel="Attach to ticket" onPress={input.addAttachment}>
      <Text style={styles.attach}>⌕</Text>
    </Pressable>}
    <TextInput
      value={input.value}
      onChangeText={input.setValue}
      onSubmitEditing={input.send}
      placeholder="Reply to customer…"
      style={styles.supportInput}
    />
    <Pressable disabled={input.isSending} onPress={input.send} style={styles.sendPill}>
      <Text style={styles.sendPillText}>Send</Text>
    </Pressable>
  </View>
}

function compactComposer(input: ComposerInput) {
  return <View testID="compact-composer" style={styles.compactComposer}>
    <TextInput
      value={input.value}
      onChangeText={input.setValue}
      onSubmitEditing={input.send}
      placeholder="Message"
      style={styles.compactInput}
    />
    <Pressable
      accessibilityLabel="Send compact message"
      disabled={input.isSending}
      onPress={input.send}
      style={styles.sendCircle}
    ><Text style={styles.sendArrow}>↑</Text></Pressable>
  </View>
}

function compactTyping(ids: ReadonlySet<string>, displayName: (id: string) => string) {
  if (!ids.size) return null
  return <View testID="compact-typing" style={styles.compactTyping}>
    <Text style={styles.compactTypingText}>{displayName([...ids][0]!)} is responding…</Text>
  </View>
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  mobileChat: { flex: 1, paddingBottom: Platform.OS === 'android' ? 18 : 10 },
  scroller: { backgroundColor: '#F3F5F4' },
  flex: { flex: 1 },
  topBar: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14, gap: 16 },
  topBarWide: { flexDirection: 'row', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandWide: { flex: 1 },
  logo: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 22 },
  brandCopy: { flex: 1, marginLeft: 12 },
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#17211F' },
  brandSubtitle: { fontSize: 12, color: '#6B7471', marginTop: 2 },
  selector: { flexDirection: 'row', borderWidth: 1, borderColor: '#919997', borderRadius: 24, overflow: 'hidden' },
  selectorWide: { width: 455 },
  segment: { flex: 1, flexBasis: 0, minWidth: 0, minHeight: 42, paddingHorizontal: 7, justifyContent: 'center', alignItems: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderColor: '#919997' },
  segmentText: { color: '#27302E', fontSize: 11, textAlign: 'center' },
  page: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
  maxWidth: { width: '100%', maxWidth: 1320, alignSelf: 'center' },
  summary: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  summaryNarrow: { flexDirection: 'column', gap: 12 },
  summaryCopy: { flex: 1 },
  title: { fontSize: 26, lineHeight: 30, fontWeight: '800', color: '#17211F', letterSpacing: -0.5 },
  description: { color: '#66706D', marginTop: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'flex-end' },
  chip: { borderWidth: 1, borderColor: '#D0D7D5', backgroundColor: '#F5F8F7', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 9 },
  chipText: { color: '#52605C', fontSize: 11 },
  gallery: { marginTop: 16, gap: 18 },
  galleryWide: { height: 650, flexDirection: 'row' },
  chatWide: { flex: 1 },
  frame: { borderWidth: 1, borderColor: '#D8DEDC', borderRadius: 18, overflow: 'hidden', backgroundColor: '#F6F8F7', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  frameLabel: { height: 38, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#D8DEDC' },
  frameLabelText: { color: '#78817E', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  frameBody: { flex: 1 },
  rowTitle: { color: '#211B2C', fontWeight: '800' },
  supportRow: { minHeight: 66, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 14, backgroundColor: '#fff' },
  supportRowActive: { backgroundColor: '#F0EAFF' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  supportMeta: { color: '#716A7C', fontSize: 12, marginTop: 3 },
  badge: { width: 23, height: 23, borderRadius: 12, backgroundColor: '#6750A4', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  compactRow: { minHeight: 41, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 11 },
  compactAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  compactAvatarText: { color: '#315B52', fontSize: 11 },
  compactRowTitle: { flex: 1, fontSize: 12, fontWeight: '700' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2F8A72' },
  supportHeader: { minHeight: 72, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#2E2440', borderBottomWidth: 1, borderColor: '#4A3D61', flexDirection: 'row', alignItems: 'center', gap: 11 },
  supportBack: { color: '#FFFFFF', fontSize: 24 },
  agentIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EADDFF', alignItems: 'center', justifyContent: 'center' },
  agentText: { color: '#6750A4' },
  supportHeaderTitle: { color: '#fff', fontWeight: '800' },
  supportHeaderMeta: { color: '#D8CFF0', fontSize: 12 },
  personIcon: { color: '#fff', fontSize: 22 },
  compactHeader: { height: 52, paddingHorizontal: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#DDE3E1', flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { fontSize: 24 },
  compactHeaderTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  liveChip: { borderWidth: 1, borderColor: '#DDE3E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  liveChipText: { fontSize: 9 },
  fileCard: { width: 270, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileIcon: { color: '#6750A4', fontSize: 24 },
  ticket: { width: 270, padding: 12, backgroundColor: '#F8F6FF', borderWidth: 1, borderColor: '#D9D0EC', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketIcon: { color: '#6750A4', fontSize: 22 },
  ticketTitle: { color: '#211B2C', fontWeight: '800' },
  ticketMeta: { color: '#514A5C', fontSize: 12 },
  openChip: { borderWidth: 1, borderColor: '#D9D0EC', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  openText: { color: '#514A5C', fontSize: 9 },
  receipt: { alignSelf: 'flex-end', paddingTop: 4, paddingRight: 4 },
  receiptText: { color: '#6750A4', fontSize: 10 },
  compactMessage: { minHeight: 32, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'flex-start' },
  compactSender: { width: 44, color: '#6C7773', fontSize: 9, fontWeight: '800' },
  compactYou: { color: '#315B52' },
  compactText: { flex: 1, fontSize: 12, lineHeight: 16 },
  compactTime: { color: '#7B8582', fontSize: 9, marginLeft: 8 },
  supportComposer: { padding: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 8 },
  attach: { fontSize: 24 },
  supportInput: { flex: 1, minHeight: 42, borderRadius: 22, paddingHorizontal: 14, backgroundColor: '#F4F0FA' },
  sendPill: { borderRadius: 22, paddingHorizontal: 17, paddingVertical: 11, backgroundColor: '#6750A4' },
  sendPillText: { color: '#fff' },
  compactComposer: { height: 54, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#DDE3E1', flexDirection: 'row', alignItems: 'center' },
  compactInput: { flex: 1 },
  sendCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#315B52', alignItems: 'center', justifyContent: 'center' },
  sendArrow: { color: '#fff', fontSize: 18 },
  compactTyping: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#E8EFEC' },
  compactTypingText: { color: '#315B52', fontSize: 10 },
  notice: { position: 'absolute', left: 24, right: 24, bottom: 18, padding: 12, borderRadius: 8, backgroundColor: '#27302E' },
  noticeText: { color: '#fff' },
})
