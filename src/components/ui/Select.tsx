"use client"

import { useState } from "react"
import { View, Text, Pressable, Modal, FlatList } from "react-native"
import { ChevronDown } from "lucide-react-native"
import { cn } from "../../lib/utils"

interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  label?: string
  placeholder?: string
  value?: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  error?: string
  className?: string
  disabled?: boolean
}

export function Select({
  label,
  placeholder = "Seleccionar...",
  value,
  onValueChange,
  options,
  error,
  className,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setIsOpen(false)
  }

  return (
    <View className={cn("space-y-2", className)}>
      {label && <Text className="text-sm font-medium text-foreground">{label}</Text>}

      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "h-12 rounded-2xl border border-border bg-background px-4 flex-row items-center justify-between",
          "focus:border-primary-500 focus:bg-white",
          error && "border-red-500",
          disabled && "bg-muted opacity-50",
        )}
      >
        <Text className={cn("text-base", selectedOption ? "text-foreground" : "text-muted-foreground")}>
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown size={20} color="#9ca3af" />
      </Pressable>

      {error && <Text className="text-sm text-red-500">{error}</Text>}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable className="flex-1 bg-black/50 justify-center px-4" onPress={() => setIsOpen(false)}>
          <View className="bg-white rounded-2xl max-h-80 overflow-hidden">
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item.value)}
                  className={cn(
                    "px-4 py-3 border-b border-border active:bg-muted",
                    item.value === value && "bg-primary-50",
                  )}
                >
                  <Text
                    className={cn(
                      "text-base",
                      item.value === value ? "text-primary-600 font-medium" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}
