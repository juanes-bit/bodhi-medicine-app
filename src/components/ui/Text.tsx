import type React from "react"
import { Text as RNText, type TextProps as RNTextProps } from "react-native"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const textVariants = cva("text-foreground", {
  variants: {
    variant: {
      default: "text-base",
      h1: "text-4xl font-bold",
      h2: "text-3xl font-bold",
      h3: "text-2xl font-semibold",
      h4: "text-xl font-semibold",
      body: "text-base",
      caption: "text-sm text-muted-foreground",
      small: "text-xs text-muted-foreground",
      large: "text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {
  children: React.ReactNode
  className?: string
}

export function Text({ children, variant, className, ...props }: TextProps) {
  return (
    <RNText className={cn(textVariants({ variant }), className)} {...props}>
      {children}
    </RNText>
  )
}
