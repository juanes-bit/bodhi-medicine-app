import { Image, type ImageProps } from "react-native"
import { cld, type CloudinaryOptions } from "../../lib/cloudinary"

interface ImageCdnProps extends Omit<ImageProps, "source"> {
  src: string
  alt?: string
  cloudinaryOptions?: CloudinaryOptions
  fallback?: string
}

export function ImageCdn({
  src,
  alt,
  cloudinaryOptions = {},
  fallback = "/abstract-colorful-swirls.png",
  ...props
}: ImageCdnProps) {
  const optimizedSrc = src ? cld(src, cloudinaryOptions) : fallback

  return (
    <Image
      source={{ uri: optimizedSrc }}
      accessibilityLabel={alt}
      {...props}
      onError={(error) => {
        console.warn("Image load error:", error)
        // Could implement fallback logic here
      }}
    />
  )
}
