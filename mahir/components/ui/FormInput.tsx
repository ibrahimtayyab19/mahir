import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet, type KeyboardTypeOptions } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { Colors, Typography } from "@/constants/design-tokens";

interface FormInputProps {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

/**
 * Flat-card input field matching the Luminance Light design.
 * Rounded-xl border with icon left, optional password toggle right.
 * Focus state: border darkens to on-surface (#1A1C18).
 */
const FormInput: React.FC<FormInputProps> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showToggle = secureTextEntry;
  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View
      style={[
        styles.container,
        { borderColor: isFocused ? Colors.onSurface : Colors.outline + "66" },
      ]}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isSecure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {showToggle && (
        <Pressable
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.toggleButton}
          accessibilityRole="button"
          accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
        >
          {isPasswordVisible ? (
            <EyeOff size={20} color={Colors.onSurfaceVariant} />
          ) : (
            <Eye size={20} color={Colors.onSurfaceVariant} />
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  toggleButton: {
    padding: 4,
  },
});

export default FormInput;
