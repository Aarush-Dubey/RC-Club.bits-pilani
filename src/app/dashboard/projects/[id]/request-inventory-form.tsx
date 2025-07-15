
"use client"

import { useState } from "react"
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, PlusCircle, Trash2, ChevronsUpDown, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { InventoryItem, Project } from "../page"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import type { AppUser } from "@/context/auth-context"
import { addInventoryRequest } from "./actions"

const createFormSchema = (inventory: InventoryItem[]) => z.object({
  requestedInventory: z.array(
    z.object({
      itemId: z.string().min(1, "Please select an item."),
      quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
    }).refine(
      (data) => {
        const item = inventory.find(i => i.id === data.itemId);
        if (!item) return true; // Let the itemId validation handle this
        return data.quantity <= item.availableQuantity;
      },
      (data) => {
        const item = inventory.find(i => i.id === data.itemId);
        return {
          message: `Max ${item?.availableQuantity} avail.`,
          path: ["quantity"],
        };
      }
    )
  ).min(1, "You must request at least one item."),
});

interface RequestInventoryFormProps {
  onFormSubmit: () => void;
  project: Project;
  inventory: InventoryItem[];
  currentUser: AppUser | null;
}

export function RequestInventoryForm({ onFormSubmit, project, inventory, currentUser }: RequestInventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const formSchema = createFormSchema(inventory);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestedInventory: [{ itemId: "", quantity: 1 }],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requestedInventory"
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to request inventory.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await addInventoryRequest({
        projectId: project.id,
        projectTitle: project.title,
        userId: currentUser.uid,
        requests: data.requestedInventory,
      });

      toast({
        title: "Request Submitted",
        description: "Your inventory request has been sent for approval.",
      });
      onFormSubmit();
    } catch (error) {
      console.error("Error creating inventory request:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not submit the request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-auto max-h-[60vh] sm:h-auto">
          <div className="space-y-4 pr-4">
              <div className="space-y-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 rounded-md border bg-muted/20 p-2">
                        <FormField
                            control={form.control}
                            name={`requestedInventory.${index}.itemId`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                              "w-full justify-between",
                                              !field.value && "text-muted-foreground"
                                            )}
                                          >
                                            {field.value
                                              ? inventory.find(
                                                  (item) => item.id === field.value
                                                )?.name
                                              : "Select item"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                          <CommandInput placeholder="Search inventory..." />
                                          <CommandList>
                                            <CommandEmpty>No item found.</CommandEmpty>
                                            <CommandGroup>
                                              {inventory.map((item) => (
                                                <CommandItem
                                                  value={item.name}
                                                  key={item.id}
                                                  onSelect={() => {
                                                    form.setValue(`requestedInventory.${index}.itemId`, item.id)
                                                  }}
                                                  disabled={item.availableQuantity === 0}
                                                >
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      item.id === field.value
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                    )}
                                                  />
                                                  <div className="flex justify-between w-full">
                                                      <span>{item.name}</span>
                                                      <span className="text-xs text-muted-foreground">
                                                          ({item.availableQuantity} avail.)
                                                      </span>
                                                  </div>
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`requestedInventory.${index}.quantity`}
                            render={({ field }) => (
                                <FormItem className="w-24">
                                    <FormControl>
                                        <Input type="number" placeholder="Qty" {...field} min={1} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", quantity: 1 })}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Another Item
              </Button>
          </div>
        </ScrollArea>
        <div className="pt-4 border-t">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </div>
      </form>
    </Form>
  )
}
