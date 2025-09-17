import * as Linking from "expo-linking"
import { router } from "expo-router"

export const deepLinkConfig = {
  scheme: "bodhi",
  prefixes: ["bodhi://"],
}

export function handleDeepLink(url: string) {
  const { hostname, path } = Linking.parse(url)

  switch (hostname) {
    case "course":
      if (path) {
        const courseId = path.replace("/", "")
        router.push(`/courses/${courseId}`)
      }
      break

    case "lesson":
      if (path) {
        const lessonId = path.replace("/", "")
        // We need course ID to navigate to lesson, this might need adjustment
        router.push(`/courses/1/lesson/${lessonId}`)
      }
      break

    case "checkout":
      if (path === "/success") {
        router.push("/paywall/success")
      } else if (path === "/cancel") {
        router.push("/(tabs)/membership")
      }
      break

    case "pricing":
      router.push("/paywall/pricing")
      break

    default:
      router.push("/")
  }
}

export function createDeepLink(type: "course" | "lesson", id: string | number): string {
  return `bodhi://${type}/${id}`
}
