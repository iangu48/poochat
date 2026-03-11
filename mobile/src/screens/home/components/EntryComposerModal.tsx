import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import PagerView from 'react-native-pager-view';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles';
import { BristolVisual, RatingVisual } from './EntryVisuals';
import { formatDateTimeButtonLabel } from '../utils';
import { getThemePalette, type ThemeMode } from '../../../theme';

type Props = {
  themeMode: ThemeMode;
  visible: boolean;
  addEntryLoading: boolean;
  isEditingEntry: boolean;
  bristolType: string;
  rating: string;
  note: string;
  showDateEditor: boolean;
  pickerStep: 'none' | 'date' | 'time';
  draftDateTime: Date | null;
  getEntryDateTimeValue: () => Date;
  onToggleDateEditor: () => void;
  onPickerChange: (mode: 'date' | 'time') => (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onGoToTimeStep: () => void;
  onSaveDateTime: () => void;
  onBristolTypeChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onNoteFocus: () => void;
  onDateStepActionsLayout: (event: any) => void;
  onEntryActionsRowLayout: (event: any) => void;
  onAddEntry: () => void;
  onClose: () => void;
  scrollRef: RefObject<any>;
  closeOnOutsideTap?: boolean;
  bottomOffset?: number;
};

const TOTAL_STEPS = 4;

export function EntryComposerModal(props: Props) {
  const {
    themeMode,
    visible,
    addEntryLoading,
    isEditingEntry,
    bristolType,
    rating,
    note,
    draftDateTime,
    getEntryDateTimeValue,
    onPickerChange,
    onSaveDateTime,
    onBristolTypeChange,
    onRatingChange,
    onNoteChange,
    onAddEntry,
    onClose,
    closeOnOutsideTap = false,
    bottomOffset = 0,
  } = props;
  const colors = getThemePalette(themeMode);

  const effectiveDateTime = draftDateTime ?? getEntryDateTimeValue();
  const [mounted, setMounted] = useState(visible);
  const [stepIndex, setStepIndex] = useState(0);
  const [dateMode, setDateMode] = useState<'date' | 'time'>('date');
  const translateY = useRef(new Animated.Value(420)).current;
  const pagerRef = useRef<PagerView | null>(null);
  const stepRef = useRef(stepIndex);

  useEffect(() => {
    stepRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setStepIndex(0);
      stepRef.current = 0;
      setDateMode('date');
      requestAnimationFrame(() => pagerRef.current?.setPageWithoutAnimation?.(0));
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }).start();
      return;
    }
    Animated.timing(translateY, {
      toValue: 420,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setMounted(false);
    });
  }, [visible, translateY]);

  useEffect(() => {
    if (!mounted) return;
    pagerRef.current?.setPage?.(stepIndex);
  }, [mounted, stepIndex]);

  function goToStep(next: number): void {
    setStepIndex(Math.max(0, Math.min(TOTAL_STEPS - 1, next)));
  }

  function handleBack(): void {
    if (stepIndex === 0) {
      onClose();
      return;
    }
    goToStep(stepIndex - 1);
  }

  function handleNextOrSave(): void {
    if (stepIndex === 2) {
      onSaveDateTime();
      goToStep(3);
      return;
    }
    if (stepIndex === 3) {
      onAddEntry();
      return;
    }
    goToStep(stepIndex + 1);
  }

  if (!mounted) return null;

  return (
    <View style={styles.entryInlineOverlay} pointerEvents="box-none">
      {closeOnOutsideTap ? <Pressable style={[styles.entryComposerBackdrop, { backgroundColor: colors.overlay }]} onPress={onClose} /> : null}
      <KeyboardAvoidingView
        style={[styles.entryKeyboardAvoiding, { paddingBottom: bottomOffset }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.commentsDrawerSheet,
            styles.entryDrawerSheet,
            { transform: [{ translateY }], backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={[styles.entryComposer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{isEditingEntry ? 'Edit Entry' : 'Add New Entry'}</Text>
            <View style={styles.entryProgressRow}>
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <View
                  key={`step-dot-${index}`}
                  style={[styles.entryProgressDot, index === stepIndex ? styles.entryProgressDotActive : null]}
                />
              ))}
            </View>

            <PagerView
              ref={pagerRef}
              style={styles.entryPager}
              initialPage={0}
              onPageSelected={(event: any) => {
                const nextStep = event.nativeEvent.position;
                if (stepRef.current === 2 && nextStep !== 2) {
                  onSaveDateTime();
                }
                setStepIndex(nextStep);
              }}
            >
              <View key="step-0" style={styles.entryStepPane}>
                <Text style={[styles.label, { color: colors.text }]}>Bristol Type</Text>
                <BristolVisual typeValue={Number(bristolType)} themeMode={themeMode} />
                <Slider
                  minimumValue={1}
                  maximumValue={7}
                  step={1}
                  tapToSeek
                  value={Number(bristolType)}
                  onValueChange={(value) => onBristolTypeChange(String(Math.round(value)))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor="#58a6ff"
                />
              </View>

              <View key="step-1" style={styles.entryStepPane}>
                <Text style={[styles.label, { color: colors.text }]}>Comfort Rating</Text>
                <RatingVisual ratingValue={Number(rating)} onSelect={(value) => onRatingChange(String(value))} themeMode={themeMode} />
              </View>

              <View key="step-2" style={styles.entryStepPane}>
                <Text style={[styles.label, { color: colors.text }]}>Date & Time</Text>
                <Text style={[styles.muted, { color: colors.mutedText }]}>{formatDateTimeButtonLabel(effectiveDateTime)}</Text>
                <View style={styles.entryDateToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.entryDateToggleButton,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      dateMode === 'date' ? styles.entryDateToggleButtonActive : null,
                    ]}
                    onPress={() => setDateMode('date')}
                  >
                    <Text
                      style={[
                        styles.entryDateToggleText,
                        { color: dateMode === 'date' ? '#ffffff' : colors.text },
                      ]}
                    >
                      Date
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.entryDateToggleButton,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      dateMode === 'time' ? styles.entryDateToggleButtonActive : null,
                    ]}
                    onPress={() => setDateMode('time')}
                  >
                    <Text
                      style={[
                        styles.entryDateToggleText,
                        { color: dateMode === 'time' ? '#ffffff' : colors.text },
                      ]}
                    >
                      Time
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.dateTimePickerWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  {dateMode === 'date' ? (
                    <DateTimePicker
                      value={effectiveDateTime}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
                      textColor={colors.text}
                      onChange={onPickerChange('date')}
                    />
                  ) : (
                    <DateTimePicker
                      value={effectiveDateTime}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      textColor={colors.text}
                      onChange={onPickerChange('time')}
                    />
                  )}
                </View>
              </View>

              <View key="step-3" style={styles.entryStepPane}>
                <Text style={[styles.label, { color: colors.text }]}>Note (optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                  value={note}
                  onChangeText={onNoteChange}
                  placeholder="Any context?"
                  placeholderTextColor={colors.mutedText}
                  multiline
                />
              </View>
            </PagerView>

            <View style={styles.entryNavRow}>
              <TouchableOpacity
                style={[
                  styles.entryNavButton,
                  styles.entryNavButtonSecondary,
                  styles.entryNavButtonIconOnly,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  addEntryLoading ? styles.buttonDisabled : null,
                ]}
                onPress={handleBack}
                disabled={addEntryLoading}
                accessibilityLabel={stepIndex === 0 ? 'Cancel' : 'Back'}
              >
                <Ionicons name={stepIndex === 0 ? 'close' : 'arrow-back'} size={18} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.entryNavButton,
                  styles.entryNavButtonPrimary,
                  styles.entryNavButtonIconOnly,
                  { backgroundColor: colors.primary, borderColor: colors.primaryBorder },
                  addEntryLoading ? styles.buttonDisabled : null,
                ]}
                onPress={handleNextOrSave}
                disabled={addEntryLoading}
                accessibilityLabel={
                  addEntryLoading
                    ? 'Saving'
                    : stepIndex === 3
                      ? (isEditingEntry ? 'Save changes' : 'Save entry')
                      : 'Next'
                }
              >
                {addEntryLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name={stepIndex === 3 ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
