import { Text, type TextStyle } from 'react-native';

type Props = {
  name: string;
  size?: number;
  color?: string;
};

const ICON_MAP: Record<string, string> = {
  add: '+',
  close: '×',
  refresh: '↻',
  mail: '✉',
  'checkmark-done': '✓✓',
  'arrow-back': '←',
  'ellipsis-horizontal': '⋯',
  send: '➤',
  'add-circle': '⊕',
  enter: '↪',
  checkmark: '✓',
  'person-add': '⊕',
  'log-out-outline': '⇥',
  eye: '◉',
  'eye-off': '◌',
  search: '⌕',
  home: '⌂',
  people: '◔◔',
  person: '◔',
  call: '☎',
  'paper-plane': '➤',
  'checkmark-circle': '✓',
  'log-in-outline': '⇤',
  'chatbubble-ellipses': '💬',
};

export function Ionicons({ name, size = 16, color = '#ffffff' }: Props) {
  const style: TextStyle = {
    fontSize: size,
    color,
    fontWeight: '700',
    lineHeight: size + 2,
  };
  return <Text style={style}>{ICON_MAP[name] ?? '*'}</Text>;
}
