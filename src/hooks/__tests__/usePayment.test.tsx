import React, { useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client"
import { BodhiAPI } from "../../api/sdk"
import { useCreateCheckoutSession } from "../usePayment"

describe("useCreateCheckoutSession", () => {
  it("passes the planId to BodhiAPI.createCheckoutSession", async () => {
    const createCheckoutSessionMock = jest
      .spyOn(BodhiAPI, "createCheckoutSession")
      .mockResolvedValue({ url: "https://example.com" })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    function TestComponent() {
      const { mutate } = useCreateCheckoutSession()

      useEffect(() => {
        mutate("yearly")
      }, [mutate])

      return null
    }

    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>,
      )
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(createCheckoutSessionMock).toHaveBeenCalledWith("yearly")

    await act(async () => {
      root.unmount()
    })

    queryClient.clear()
    createCheckoutSessionMock.mockRestore()
    container.remove()
  })
})
