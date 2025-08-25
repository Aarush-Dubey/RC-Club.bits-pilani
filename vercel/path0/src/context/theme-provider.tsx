/**
 * This file provides a theme provider component that wraps the `next-themes` library.
 * It allows the application to support light and dark modes, and handles theme switching
 * and persistence across sessions. It is used in the root layout to apply the theme
 * to the entire application.
 */
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

