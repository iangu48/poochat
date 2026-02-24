declare module '@react-native-community/datetimepicker' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  export type DateTimePickerEvent = {
    type: 'set' | 'dismissed';
    nativeEvent: {
      timestamp: number;
      utcOffset?: number;
    };
  };

  export type DateTimePickerProps = ViewProps & {
    value: Date;
    mode?: 'date' | 'time' | 'datetime' | 'countdown';
    display?: 'default' | 'spinner' | 'calendar' | 'clock' | 'inline' | 'compact';
    onChange: (event: DateTimePickerEvent, date?: Date) => void;
  };

  const DateTimePicker: ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
}
