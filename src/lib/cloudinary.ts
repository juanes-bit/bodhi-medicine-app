import Constants from "expo-constants"

const CLOUDINARY_CLOUD = Constants.expoConfig?.extra?.cloudinary || "daayxpmsz"

export interface CloudinaryOptions {
  w?: number
  h?: number
  c?: "fill" | "fit" | "scale" | "crop"
  q?: "auto" | number
  f?: "auto" | "jpg" | "png" | "webp"
}

export function cld(url: string, options: CloudinaryOptions = {}): string {
  if (!url || !url.includes("cloudinary.com")) {
    return url
  }

  const { w, h, c = "fill", q = "auto", f = "auto" } = options

  const transformations = [`f_${f}`, `q_${q}`, w && `w_${w}`, h && `h_${h}`, (w || h) && `c_${c}`]
    .filter(Boolean)
    .join(",")

  // Replace /upload/ with /upload/{transformations}/
  return url.replace("/upload/", `/upload/${transformations}/`)
}

export function cloudinaryUrl(path: string, options: CloudinaryOptions = {}): string {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload`
  const transformations = [
    "f_auto",
    "q_auto",
    options.w && `w_${options.w}`,
    options.h && `h_${options.h}`,
    (options.w || options.h) && `c_${options.c || "fill"}`,
  ]
    .filter(Boolean)
    .join(",")

  return `${baseUrl}/${transformations}/${path}`
}
