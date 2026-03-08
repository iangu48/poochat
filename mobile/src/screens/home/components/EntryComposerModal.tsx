import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import PagerView from 'react-native-pager-view';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles';
import { BristolVisual, RatingVisual } from './EntryVisuals';
import { formatDateTimeButtonLabel } from '../utils';

type Props = {
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
};

const TOTAL_STEPS = 4;

export function EntryComposerModal(props: Props) {
  const {
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
  } = props;

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
      <KeyboardAvoidingView
        style={styles.entryKeyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.commentsDrawerSheet, styles.entryDrawerSheet, { transform: [{ translateY }] }]}> 
          <View style={styles.entryComposer}>
            <Text style={styles.cardTitle}>{isEditingEntry ? 'Edit Entry' : 'Add New Entry'}</Text>
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
                <Text style={styles.label}>Bristol Type</Text>
                <BristolVisual typeValue={Number(bristolType)} />
                <Slider
                  minimumValue={1}
                  maximumValue={7}
                  step={1}
                  tapToSeek
                  value={Number(bristolType)}
                  onValueChange={(value) => onBristolTypeChange(String(Math.round(value)))}
                  minimumTrackTintColor="#1f6feb"
                  maximumTrackTintColor="#30363d"
                  thumbTintColor="#58a6ff"
                />
              </View>

              <View key="step-1" style={styles.entryStepPane}>
                <Text style={styles.label}>Comfort Rating</Text>
                <RatingVisual ratingValue={Number(rating)} onSelect={(value) => onRatingChange(String(value))} />
              </View>

              <View key="step-2" style={styles.entryStepPane}>
                <Text style={styles.label}>Date & Time</Text>
                <Text style={styles.muted}>{formatDateTimeButtonLabel(effectiveDateTime)}</Text>
                <View style={styles.entryDateToggleRow}>
                  <TouchableOpacity
                    style={[styles.entryDateToggleButton, dateMode === 'date' ? styles.entryDateToggleButtonActive : null]}
                    onPress={() => setDateMode('date')}
                  >
                    <Text style={styles.entryDateToggleText}>Date</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.entryDateToggleButton, dateMode === 'time' ? styles.entryDateToggleButtonActive : null]}
                    onPress={() => setDateMode('time')}
                  >
                    <Text style={styles.entryDateToggleText}>Time</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateTimePickerWrap}>
                  {dateMode === 'date' ? (
                    <DateTimePicker
                      value={effectiveDateTime}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
                      onChange={onPickerChange('date')}
                    />
                  ) : (
                    <DateTimePicker
                      value={effectiveDateTime}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onPickerChange('time')}
                    />
                  )}
                </View>
              </View>

              <View key="step-3" style={styles.entryStepPane}>
                <Text style={styles.label}>Note (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={note}
                  onChangeText={onNoteChange}
                  placeholder="Any context?"
                  placeholderTextColor="#8b949e"
                  multiline
                />
              </View>
            </PagerView>

            <View style={styles.entryNavRow}>
              <TouchableOpacity
                style={[styles.entryNavButton, styles.entryNavButtonSecondary, addEntryLoading ? styles.buttonDisabled : null]}
                onPress={handleBack}
                disabled={addEntryLoading}
              >
                <Ionicons name={stepIndex === 0 ? 'close' : 'arrow-back'} size={16} color="#f0f6fc" />
                <Text style={styles.entryNavButtonText}>{stepIndex === 0 ? 'Cancel' : 'Back'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.entryNavButton, styles.entryNavButtonPrimary, addEntryLoading ? styles.buttonDisabled : null]}
                onPress={handleNextOrSave}
                disabled={addEntryLoading}
              >
                {addEntryLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name={stepIndex === 3 ? 'checkmark' : 'arrow-forward'} size={16} color="#fff" />
                )}
                <Text style={styles.entryNavButtonTextPrimary}>
                  {addEntryLoading
                    ? 'Saving...'
                    : stepIndex === 3
                      ? (isEditingEntry ? 'Save Changes' : 'Save Entry')
                      : stepIndex === 2
                        ? 'Apply'
                        : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
