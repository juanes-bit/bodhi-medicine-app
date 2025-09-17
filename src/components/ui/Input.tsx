import { forwardRef } from "react"
import { TextInput, View, Text } from "react-native"
import { cn } from "../../lib/utils"

interface InputProps {
  label?: string
  error?: string
  className?: string
  containerClassName?: string
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  secureTextEntry?: boolean
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad"
  autoCapitalize?: "none" | "sentences" | "words" | "characters"
  autoComplete?: string
  editable?: boolean
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      className,
      containerClassName,
      placeholder,
      value,
      onChangeText,
      secureTextEntry,
      keyboardType = "default",
      autoCapitalize = "sentences",
      autoComplete,
      editable = true,
      ...props
    },
    ref,
  ) => {
    return (
      <View className={cn("space-y-2", containerClassName)}>
        {label && <Text className="text-sm font-medium text-foreground">{label}</Text>}
        <TextInput
          ref={ref}
          className={cn(
            "h-12 rounded-2xl border border-border bg-background px-4 text-base text-foreground",
            "focus:border-primary-500 focus:bg-white",
            error && "border-red-500",
            !editable && "bg-muted text-muted-foreground",
            className,
          )}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          {...props}
        />
        {error && <Text className="text-sm text-red-500">{error}</Text>}
      </View>
    )
  },
)

Input.displayName = "Input"
