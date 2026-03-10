declare module 'react-native-pager-view' {
  import * as React from 'react';

  type NativeEvent = {
    position: number;
    offset: number;
  };

  export type PageSelectedEvent = {
    nativeEvent: NativeEvent;
  };

  export type PagerViewProps = {
    style?: any;
    initialPage?: number;
    scrollEnabled?: boolean;
    children?: React.ReactNode;
    onPageSelected?: (event: PageSelectedEvent) => void;
  };

  export default class PagerView extends React.Component<PagerViewProps> {
    setPage(pageNumber: number): void;
    setPageWithoutAnimation(pageNumber: number): void;
  }
}
