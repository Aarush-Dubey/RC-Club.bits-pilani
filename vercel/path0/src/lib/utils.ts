/**
 * This file provides utility functions for the application.
 * The `cn` function merges multiple class names, resolving Tailwind CSS class conflicts.
 * It combines the functionality of `clsx` for conditional classes and `tailwind-merge`
 * for intelligently merging Tailwind CSS classes.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

