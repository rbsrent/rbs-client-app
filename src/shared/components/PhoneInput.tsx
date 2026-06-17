import { forwardRef } from 'react';
import { InputAccessoryView, Platform, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { COLORS } from '@/shared/colors';
import { formatPhoneDigits, parsePhoneDigits } from '@/shared/utils/phone';

const INPUT_ACCESSORY_ID = 'phone-input-accessory';

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> {
  /** 10 local digits (without country code) */
  digits: string;
  onChangeDigits: (digits: string) => void;
}

export const PhoneInput = forwardRef<TextInput, Props>(
  ({ digits, onChangeDigits, style, ...rest }, ref) => (
    <>
      <TextInput
        ref={ref}
        keyboardType="phone-pad"
        value={formatPhoneDigits(digits)}
        onChangeText={(v) => onChangeDigits(parsePhoneDigits(v))}
        placeholder="+7 (___) ___-__-__"
        placeholderTextColor={COLORS.text3}
        maxLength={18}
        inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
        style={[s.input, style]}
        {...rest}
      />
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View />
        </InputAccessoryView>
      )}
    </>
  ),
);

PhoneInput.displayName = 'PhoneInput';

const s = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text1,
  },
});
