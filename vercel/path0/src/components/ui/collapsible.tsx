/**
 * This file exports the Collapsible components from the `@radix-ui/react-collapsible` library.
 * These components (`Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`)
 * provide the building blocks for creating sections of content that can be expanded and collapsed,
 * often used for accordions or "show more" functionality.
 */
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

