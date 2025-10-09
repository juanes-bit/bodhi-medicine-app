'use client';

type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-800/60 ${className}`}
    />
  );
}
