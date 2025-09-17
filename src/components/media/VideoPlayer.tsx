"use client"

import { useState, useRef, useEffect } from "react"
import { View, Pressable, Text, Dimensions } from "react-native"
import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av"
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { cn } from "../../lib/utils"
import { formatDuration } from "../../lib/utils"

interface VideoPlayerProps {
  uri: string
  lessonId: number
  userId: number
  onProgress?: (position: number, duration: number) => void
  className?: string
}

export function VideoPlayer({ uri, lessonId, userId, onProgress, className }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null)
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null)
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [savedPosition, setSavedPosition] = useState(0)

  const screenData = Dimensions.get("window")
  const isLoaded = status?.isLoaded ?? false
  const isPlaying = isLoaded && (status as any).isPlaying
  const duration = isLoaded ? (status as any).durationMillis / 1000 : 0
  const position = isLoaded ? (status as any).positionMillis / 1000 : 0

  // Load saved position on mount
  useEffect(() => {
    const loadSavedPosition = async () => {
      try {
        const saved = await AsyncStorage.getItem(`video_position_${userId}_${lessonId}`)
        if (saved) {
          const pos = Number.parseFloat(saved)
          setSavedPosition(pos)
          if (videoRef.current) {
            await videoRef.current.setPositionAsync(pos * 1000)
          }
        }
      } catch (error) {
        console.warn("Failed to load saved position:", error)
      }
    }

    loadSavedPosition()
  }, [userId, lessonId])

  // Save position periodically
  useEffect(() => {
    if (position > 0 && duration > 0) {
      const savePosition = async () => {
        try {
          await AsyncStorage.setItem(`video_position_${userId}_${lessonId}`, position.toString())
        } catch (error) {
          console.warn("Failed to save position:", error)
        }
      }

      // Save every 5 seconds
      const interval = setInterval(savePosition, 5000)
      return () => clearInterval(interval)
    }
  }, [position, duration, userId, lessonId])

  // Report progress to parent
  useEffect(() => {
    if (onProgress && position > 0 && duration > 0) {
      onProgress(position, duration)
    }
  }, [position, duration, onProgress])

  const handlePlayPause = async () => {
    if (!videoRef.current) return

    if (isPlaying) {
      await videoRef.current.pauseAsync()
    } else {
      await videoRef.current.playAsync()
    }
  }

  const handleMute = async () => {
    if (!videoRef.current) return

    await videoRef.current.setIsMutedAsync(!isMuted)
    setIsMuted(!isMuted)
  }

  const handleFullscreen = async () => {
    if (!videoRef.current) return

    try {
      await videoRef.current.presentFullscreenPlayer()
    } catch (error) {
      console.warn("Fullscreen error:", error)
    }
  }

  const handleSeek = async (seekPosition: number) => {
    if (!videoRef.current || !duration) return

    const newPosition = Math.max(0, Math.min(duration, seekPosition))
    await videoRef.current.setPositionAsync(newPosition * 1000)
  }

  const toggleControls = () => {
    setIsControlsVisible(!isControlsVisible)
  }

  return (
    <View className={cn("relative bg-black rounded-2xl overflow-hidden", className)}>
      <Pressable onPress={toggleControls} className="relative">
        <Video
          ref={videoRef}
          source={{ uri }}
          style={{
            width: screenData.width - 32, // Account for padding
            height: (screenData.width - 32) * 0.5625, // 16:9 aspect ratio
          }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isLooping={false}
          isMuted={isMuted}
          onPlaybackStatusUpdate={setStatus}
        />

        {/* Controls Overlay */}
        {isControlsVisible && (
          <View className="absolute inset-0 bg-black/30 justify-center items-center">
            {/* Play/Pause Button */}
            <Pressable
              onPress={handlePlayPause}
              className="w-16 h-16 bg-white/20 rounded-full items-center justify-center"
            >
              {isPlaying ? <Pause size={32} color="white" /> : <Play size={32} color="white" />}
            </Pressable>

            {/* Bottom Controls */}
            <View className="absolute bottom-0 left-0 right-0 p-4">
              {/* Progress Bar */}
              <View className="flex-row items-center space-x-2 mb-2">
                <Text className="text-white text-xs min-w-[40px]">{formatDuration(Math.floor(position))}</Text>

                <View className="flex-1 h-1 bg-white/30 rounded-full">
                  <View
                    className="h-full bg-white rounded-full"
                    style={{
                      width: duration > 0 ? `${(position / duration) * 100}%` : "0%",
                    }}
                  />
                </View>

                <Text className="text-white text-xs min-w-[40px]">{formatDuration(Math.floor(duration))}</Text>
              </View>

              {/* Control Buttons */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-4">
                  <Pressable onPress={handleMute}>
                    {isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
                  </Pressable>
                </View>

                <Pressable onPress={handleFullscreen}>
                  <Maximize size={20} color="white" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Pressable>

      {/* Resume from saved position */}
      {savedPosition > 30 && position < 30 && (
        <View className="absolute top-4 left-4 right-4">
          <View className="bg-black/80 rounded-2xl p-3">
            <Text className="text-white text-sm mb-2">
              Continuar desde {formatDuration(Math.floor(savedPosition))}?
            </Text>
            <View className="flex-row space-x-2">
              <Pressable
                onPress={() => handleSeek(savedPosition)}
                className="bg-primary-600 px-4 py-2 rounded-xl flex-1"
              >
                <Text className="text-white text-center font-medium">Continuar</Text>
              </Pressable>
              <Pressable onPress={() => setSavedPosition(0)} className="bg-white/20 px-4 py-2 rounded-xl flex-1">
                <Text className="text-white text-center font-medium">Desde el inicio</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
