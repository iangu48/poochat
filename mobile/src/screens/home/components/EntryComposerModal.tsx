import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import type { RefObject } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, LayoutChangeEvent, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles';
import { BristolVisual, RatingVisual } from './EntryVisuals';
import { formatDateTimeButtonLabel, isCurrentMinute } from '../utils';

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
  onDateStepActionsLayout: (event: LayoutChangeEvent) => void;
  onEntryActionsRowLayout: (event: LayoutChangeEvent) => void;
  onAddEntry: () => void;
  onClose: () => void;
  scrollRef: RefObject<ScrollView | null>;
};

export function EntryComposerModal(props: Props) {
  const {
    visible,
    addEntryLoading,
    isEditingEntry,
    bristolType,
    rating,
    note,
    showDateEditor,
    pickerStep,
    draftDateTime,
    getEntryDateTimeValue,
    onToggleDateEditor,
    onPickerChange,
    onGoToTimeStep,
    onSaveDateTime,
    onBristolTypeChange,
    onRatingChange,
    onNoteChange,
    onNoteFocus,
    onDateStepActionsLayout,
    onEntryActionsRowLayout,
    onAddEntry,
    onClose,
    scrollRef,
  } = props;

  const effectiveDateTime = draftDateTime ?? getEntryDateTimeValue();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.entryModalBackdrop} onPress={onClose}>
        <KeyboardAvoidingView
          style={styles.entryKeyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 28 : 0}
        >
          <Pressable style={[styles.modalCard, styles.entryModalCard]} onPress={() => {}}>
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.entryComposerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.entryComposer}>
                <Text style={styles.cardTitle}>{isEditingEntry ? 'Edit Entry' : 'Add New Entry'}</Text>
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
                <Text style={styles.label}>Comfort Rating</Text>
                <RatingVisual ratingValue={Number(rating)} onSelect={(value) => onRatingChange(String(value))} />
                <TouchableOpacity style={styles.buttonSecondary} onPress={onToggleDateEditor}>
                  <View style={styles.buttonContentRow}>
                    <Text style={styles.buttonText}>{formatDateTimeButtonLabel(effectiveDateTime)}</Text>
                    {isCurrentMinute(effectiveDateTime) ? <Ionicons name="create-outline" size={16} color="#fff" /> : null}
                  </View>
                </TouchableOpacity>
                {showDateEditor ? (
                  <View style={styles.dateTimePickerWrap}>
                    {pickerStep === 'date' ? (
                      <DateTimePicker
                        value={effectiveDateTime}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                        onChange={onPickerChange('date')}
                      />
                    ) : null}
                    {pickerStep === 'time' ? (
                      <DateTimePicker
                        value={effectiveDateTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onPickerChange('time')}
                      />
                    ) : null}
                    <View style={styles.row} onLayout={onDateStepActionsLayout}>
                      {pickerStep === 'date' ? (
                        <TouchableOpacity style={styles.button} onPress={onGoToTimeStep}>
                          <View style={styles.buttonContentRow}>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                            <Text style={styles.buttonText}>Next</Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}
                      {pickerStep === 'time' ? (
                        <TouchableOpacity style={styles.button} onPress={onSaveDateTime}>
                          <View style={styles.buttonContentRow}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                            <Text style={styles.buttonText}>Save</Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ) : null}
                <Text style={styles.label}>Note (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={note}
                  onChangeText={onNoteChange}
                  placeholder="Any context?"
                  placeholderTextColor="#8b949e"
                  onFocus={onNoteFocus}
                />
                <View style={styles.row} onLayout={onEntryActionsRowLayout}>
                  <TouchableOpacity style={[styles.button, addEntryLoading && styles.buttonDisabled]} onPress={onAddEntry} disabled={addEntryLoading}>
                    <View style={styles.buttonContentRow}>
                      {addEntryLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color="#fff" />}
                      <Text style={styles.buttonText}>
                        {addEntryLoading ? 'Saving...' : isEditingEntry ? 'Save Changes' : 'Save Entry'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.buttonSecondary, addEntryLoading && styles.buttonDisabled]} onPress={onClose} disabled={addEntryLoading}>
                    <View style={styles.buttonContentRow}>
                      <Ionicons name="close" size={16} color="#fff" />
                      <Text style={styles.buttonText}>Cancel</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
