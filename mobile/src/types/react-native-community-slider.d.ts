declare module '@react-native-community/slider' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  export type StepMarkerProps = {
    stepMarked?: boolean;
    currentValue?: number;
    index?: number;
    min?: number;
    max?: number;
  };

  export type SliderProps = ViewProps & {
    value?: number;
    minimumValue?: number;
    maximumValue?: number;
    step?: number;
    tapToSeek?: boolean;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    onValueChange?: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
    StepMarker?: ComponentType<StepMarkerProps>;
    renderStepNumber?: boolean;
  };

  const Slider: ComponentType<SliderProps>;
  export default Slider;
}
