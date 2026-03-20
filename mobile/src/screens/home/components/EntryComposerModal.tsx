import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import PagerView from 'react-native-pager-view';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles';
import { BristolTypeChip, BristolVisual, RatingVisual } from './EntryVisuals';
import { formatDateTimeButtonLabel } from '../utils';
import { getThemePalette, type ThemeMode } from '../../../theme';
import { POOP_VOLUME_OPTIONS } from '../../../types/domain';

type Props = {
  themeMode: ThemeMode;
  visible: boolean;
  addEntryLoading: boolean;
  isEditingEntry: boolean;
  bristolType: string;
  rating: string;
  volume: string;
  note: string;
  showDateEditor: boolean;
  pickerStep: 'none' | 'date' | 'time';
  pickerMaxDate?: Date;
  draftDateTime: Date | null;
  onSetDraftDateTime: (value: Date) => void;
  getEntryDateTimeValue: () => Date;
  onToggleDateEditor: () => void;
  onPickerChange: (mode: 'date' | 'time') => (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onGoToTimeStep: () => void;
  onSaveDateTime: () => void;
  onBristolTypeChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onVolumeChange: (value: string) => void;
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

const TOTAL_STEPS = 5;

export function EntryComposerModal(props: Props) {
  const {
    themeMode,
    visible,
    addEntryLoading,
    isEditingEntry,
    bristolType,
    rating,
    volume,
    note,
    pickerMaxDate,
    draftDateTime,
    onSetDraftDateTime,
    getEntryDateTimeValue,
    onPickerChange,
    onSaveDateTime,
    onBristolTypeChange,
    onRatingChange,
    onVolumeChange,
    onNoteChange,
    onAddEntry,
    onClose,
    closeOnOutsideTap = false,
    bottomOffset = 0,
  } = props;
  const colors = getThemePalette(themeMode);

  const effectiveDateTime = draftDateTime ?? getEntryDateTimeValue();
  const datePickerValue = new Date(effectiveDateTime.getTime());
  datePickerValue.setHours(12, 0, 0, 0);
  const timePickerValue = new Date(effectiveDateTime.getTime());
  const effectiveMinDate = new Date(2000, 0, 1);
  const effectiveMaxDate = pickerMaxDate ?? new Date();
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

  function setTimeValue(hours24: number, minutes: number): void {
    const next = new Date(effectiveDateTime.getTime());
    next.setHours(((hours24 % 24) + 24) % 24, ((minutes % 60) + 60) % 60, 0, 0);
    const now = new Date();
    const isToday =
      next.getFullYear() === now.getFullYear() &&
      next.getMonth() === now.getMonth() &&
      next.getDate() === now.getDate();
    if (isToday && next.getTime() > now.getTime()) {
      return;
    }
    onSetDraftDateTime(next);
  }

  function shiftHour(delta: number): void {
    setTimeValue(effectiveDateTime.getHours() + delta, effectiveDateTime.getMinutes());
  }

  function shiftMinute(delta: number): void {
    const total = effectiveDateTime.getHours() * 60 + effectiveDateTime.getMinutes() + delta;
    const normalized = ((total % 1440) + 1440) % 1440;
    setTimeValue(Math.floor(normalized / 60), normalized % 60);
  }

  function setPeriod(period: 'AM' | 'PM'): void {
    const currentHour = effectiveDateTime.getHours();
    const isPm = currentHour >= 12;
    if ((period === 'PM' && isPm) || (period === 'AM' && !isPm)) return;
    setTimeValue((currentHour + 12) % 24, effectiveDateTime.getMinutes());
  }

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
    if (stepIndex === 3) {
      onSaveDateTime();
      goToStep(4);
      return;
    }
    if (stepIndex === 4) {
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
                if (stepRef.current === 3 && nextStep !== 3) {
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
                <View style={styles.bristolQuickSelectWrap}>
                  <View style={styles.bristolQuickSelectRowTop}>
                    {[1, 3, 5, 7].map((value) => {
                      const isSelected = Number(bristolType) === value;
                      return (
                        <TouchableOpacity
                          key={`bristol-quick-${value}`}
                          style={[
                            styles.bristolQuickSelectButtonVisual,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surfaceAlt,
                              borderColor: isSelected ? colors.primaryBorder : colors.border,
                            },
                          ]}
                          onPress={() => onBristolTypeChange(String(value))}
                          accessibilityLabel={`Set Bristol type ${value}`}
                        >
                          <BristolTypeChip typeValue={value} themeMode={themeMode} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={styles.bristolQuickSelectRowBottom}>
                    {[2, 4, 6].map((value) => {
                      const isSelected = Number(bristolType) === value;
                      return (
                        <TouchableOpacity
                          key={`bristol-quick-${value}`}
                          style={[
                            styles.bristolQuickSelectButtonVisual,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surfaceAlt,
                              borderColor: isSelected ? colors.primaryBorder : colors.border,
                            },
                          ]}
                          onPress={() => onBristolTypeChange(String(value))}
                          accessibilityLabel={`Set Bristol type ${value}`}
                        >
                          <BristolTypeChip typeValue={value} themeMode={themeMode} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View key="step-1" style={styles.entryStepPane}>
                <Text style={[styles.label, { color: colors.text }]}>Comfort Rating</Text>
                <RatingVisual ratingValue={Number(rating)} onSelect={(value) => onRatingChange(String(value))} themeMode={themeMode} />
              </View>

              <View key="step-2" style={styles.entryStepPane}>
                <Text style={[styles.label, { color: colors.text }]}>Volume</Text>
                <View style={[styles.volumeVisualCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Text style={[styles.volumeVisualEmoji, { color: colors.text }]}>
                    {POOP_VOLUME_OPTIONS.find((option) => option.value === Number(volume))?.emoji ?? '◻️'}
                  </Text>
                  <Text style={[styles.volumeVisualLabel, { color: colors.text }]}>
                    {POOP_VOLUME_OPTIONS.find((option) => option.value === Number(volume))?.label ?? 'Medium'}
                  </Text>
                </View>
                <Slider
                  minimumValue={0}
                  maximumValue={4}
                  step={1}
                  tapToSeek
                  value={Number(volume)}
                  onValueChange={(value) => onVolumeChange(String(Math.round(value)))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor="#58a6ff"
                />
                <View style={styles.volumeOptionGrid}>
                  {POOP_VOLUME_OPTIONS.map((option) => {
                    const isSelected = Number(volume) === option.value;
                    return (
                      <TouchableOpacity
                        key={`volume-${option.value}`}
                        style={[
                          styles.volumeOptionButton,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceAlt,
                            borderColor: isSelected ? colors.primaryBorder : colors.border,
                          },
                        ]}
                        onPress={() => onVolumeChange(String(option.value))}
                        accessibilityLabel={`Set volume to ${option.label}`}
                      >
                        <Text style={styles.volumeOptionEmoji}>{option.emoji}</Text>
                        <Text style={[styles.volumeOptionText, { color: isSelected ? '#ffffff' : colors.text }]} numberOfLines={2}>
                          {option.shortLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View key="step-3" style={styles.entryStepPane}>
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
                      key="entry-picker-date"
                      value={datePickerValue}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
                      minimumDate={effectiveMinDate}
                      maximumDate={effectiveMaxDate}
                      textColor={colors.text}
                      onChange={onPickerChange('date')}
                    />
                  ) : (
                    Platform.OS === 'ios' ? (
                      <View style={[styles.timeEditorWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                        <View style={styles.timeEditorRow}>
                          <TouchableOpacity style={[styles.timeEditorButton, { borderColor: colors.border }]} onPress={() => shiftHour(1)}>
                            <Ionicons name="chevron-up" size={16} color={colors.text} />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.timeEditorButton, { borderColor: colors.border }]} onPress={() => shiftMinute(1)}>
                            <Ionicons name="chevron-up" size={16} color={colors.text} />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.timeEditorValuesRow}>
                          <Text style={[styles.timeEditorValue, { color: colors.text }]}>
                            {String((((effectiveDateTime.getHours() + 11) % 12) + 1)).padStart(2, '0')}
                          </Text>
                          <Text style={[styles.timeEditorColon, { color: colors.mutedText }]}>:</Text>
                          <Text style={[styles.timeEditorValue, { color: colors.text }]}>
                            {String(effectiveDateTime.getMinutes()).padStart(2, '0')}
                          </Text>
                          <View style={styles.timeEditorPeriodWrap}>
                            <TouchableOpacity
                              style={[
                                styles.timeEditorPeriodButton,
                                { borderColor: colors.border },
                                effectiveDateTime.getHours() < 12 ? { backgroundColor: colors.primary, borderColor: colors.primaryBorder } : null,
                              ]}
                              onPress={() => setPeriod('AM')}
                            >
                              <Text style={[styles.timeEditorPeriodText, { color: effectiveDateTime.getHours() < 12 ? '#fff' : colors.text }]}>AM</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.timeEditorPeriodButton,
                                { borderColor: colors.border },
                                effectiveDateTime.getHours() >= 12 ? { backgroundColor: colors.primary, borderColor: colors.primaryBorder } : null,
                              ]}
                              onPress={() => setPeriod('PM')}
                            >
                              <Text style={[styles.timeEditorPeriodText, { color: effectiveDateTime.getHours() >= 12 ? '#fff' : colors.text }]}>PM</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.timeEditorRow}>
                          <TouchableOpacity style={[styles.timeEditorButton, { borderColor: colors.border }]} onPress={() => shiftHour(-1)}>
                            <Ionicons name="chevron-down" size={16} color={colors.text} />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.timeEditorButton, { borderColor: colors.border }]} onPress={() => shiftMinute(-1)}>
                            <Ionicons name="chevron-down" size={16} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <DateTimePicker
                        key="entry-picker-time"
                        value={timePickerValue}
                        mode="time"
                        display="default"
                        textColor={colors.text}
                        onChange={onPickerChange('time')}
                      />
                    )
                  )}
                </View>
              </View>

              <View key="step-4" style={styles.entryStepPane}>
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
                    : stepIndex === 4
                      ? (isEditingEntry ? 'Save changes' : 'Save entry')
                      : 'Next'
                }
              >
                {addEntryLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name={stepIndex === 4 ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
