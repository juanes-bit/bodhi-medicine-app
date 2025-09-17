import { redirect } from "next/navigation"

export default function Page() {
  // Redirect to the main app since this is a React Native/Expo project
  redirect("/app")
}
