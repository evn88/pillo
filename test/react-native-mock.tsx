import { forwardRef, type ComponentProps, type ReactNode } from 'react';

type NativeProps = ComponentProps<'div'> & {
  children?: ReactNode;
  onChangeText?: (value: string) => void;
  onPress?: () => void;
  value?: string;
};

const createHost = (name: string) => forwardRef<unknown, NativeProps>(({ children, ...props }, ref) => (
  <div {...props} data-native-component={name} ref={ref as never}>{children}</div>
));

export const View = createHost('View');
export const Text = createHost('Text');
export const ScrollView = createHost('ScrollView');
export const KeyboardAvoidingView = createHost('KeyboardAvoidingView');
export const Pressable = createHost('Pressable');
export const TextInput = createHost('TextInput');
export const Modal = createHost('Modal');
export const Switch = createHost('Switch');
export const ActivityIndicator = createHost('ActivityIndicator');
export const Image = createHost('Image');

export const Platform = { OS: 'ios' as const, select: <T,>(options: { ios?: T; android?: T; default?: T }) => options.ios ?? options.default };
export const StyleSheet = { create: <T,>(styles: T) => styles, hairlineWidth: 1 };
export const Alert = { alert: () => undefined };
export const useColorScheme = () => 'light' as const;
export const useWindowDimensions = () => ({ fontScale: 1, height: 844, scale: 1, width: 390 });
export const AppState = { addEventListener: () => ({ remove: () => undefined }), currentState: 'active' as const };
export const Animated = { Value: class { constructor(_value: number) {} }, spring: () => ({ start: () => undefined }) };
export const PanResponder = { create: () => ({ panHandlers: {} }) };
