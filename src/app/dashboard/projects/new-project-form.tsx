
"use client"

import { useState } from "react"
import { useForm, useFieldArray, type SubmitHandler, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { addDoc, collection, doc, serverTimestamp, writeBatch } from "firebase/firestore"
import { CalendarIcon, Loader2, Sparkles, Trash2, PlusCircle, ChevronsUpDown, Check } from "lucide-react"
import { format } from "date-fns"

import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { User, InventoryItem } from "./page"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import type { AppUser } from "@/context/auth-context"


const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  type: z.enum(["plane", "drone", "other"], {
    required_error: "You need to select a project type.",
  }),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  memberIds: z.array(z.string()).min(1, "At least one team member is required."),
  leadId: z.string().min(1, "A project lead must be selected."),
  targetCompletionDate: z.date().optional(),
  requestedInventory: z.array(z.object({
    itemId: z.string().min(1, "Please select an item."),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  })).optional(),
}).refine(data => data.memberIds.includes(data.leadId), {
    message: "Project lead must be a team member.",
    path: ["leadId"],
})

type FormValues = z.infer<typeof formSchema>

interface NewProjectFormProps {
  onFormSubmit: () => void
  users: User[]
  inventory: InventoryItem[]
  currentUser: AppUser | null
}

export function NewProjectForm({ onFormSubmit, users, inventory, currentUser }: NewProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false)

  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "plane",
      description: "",
      memberIds: currentUser ? [currentUser.uid] : [],
      leadId: currentUser ? currentUser.uid : "",
      requestedInventory: [],
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requestedInventory"
  });

  const selectedMembers = form.watch("memberIds")
  const availableLeads = users.filter(u => selectedMembers?.includes(u.id))
  
  const filteredUsers = users.filter(user => user.name.toLowerCase().includes(memberSearch.toLowerCase()))

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to create a project.",
      });
      return;
    }
    setIsSubmitting(true)
    try {
      const batch = writeBatch(db);

      // 1. Create the project document
      const projectRef = doc(collection(db, "projects"));
      batch.set(projectRef, {
        id: projectRef.id, // Store readable ID
        title: data.title,
        type: data.type,
        description: data.description,
        leadId: data.leadId,
        memberIds: data.memberIds,
        targetCompletionDate: data.targetCompletionDate || null,
        createdById: currentUser.uid,
        status: "pending_approval",
        createdAt: serverTimestamp(),
        hasPendingReturns: false,
        newItemRequestIds: [],
        inventoryUsedIds: [],
      });

      // 2. Create inventory request documents
      const inventoryRequestIds: string[] = [];
      if (data.requestedInventory) {
          for (const req of data.requestedInventory) {
              const requestRef = doc(collection(db, "inventory_requests"));
              batch.set(requestRef, {
                  id: requestRef.id, // Store readable ID
                  projectId: projectRef.id,
                  requestedById: currentUser.uid,
                  itemId: req.itemId,
                  quantity: req.quantity,
                  reason: `Initial request for project: ${data.title}`,
                  status: 'pending',
                  isOverdue: false,
                  createdAt: serverTimestamp(),
              });
              inventoryRequestIds.push(requestRef.id);
          }
      }

      // 3. Update project with inventory request IDs
      batch.update(projectRef, { inventoryUsedIds: inventoryRequestIds });
      
      await batch.commit();

      toast({
        title: "Project Submitted",
        description: "Your project is now pending approval.",
      })
      onFormSubmit()
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not create the project. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[calc(100vh-12rem)] sm:h-[65vh]">
          <div className="space-y-6 pr-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="m-2">
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Autonomous Drone Swarm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="m-2">
                  <FormLabel>Project Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="plane">Plane</SelectItem>
                      <SelectItem value="drone">Drone</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="memberIds"
                render={({ field }) => (
                  <FormItem className="m-2 flex flex-col">
                    <FormLabel>Team Members</FormLabel>
                    <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                            {field.value?.length > 0
                              ? `${field.value.length} selected`
                              : "Select team members..."
                            }
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                           <CommandInput placeholder="Search members..." onValueChange={setMemberSearch} />
                            <CommandList>
                              <CommandEmpty>No members found.</CommandEmpty>
                              <CommandGroup>
                                {filteredUsers.map((user) => (
                                    <CommandItem
                                      key={user.id}
                                      value={user.name}
                                      onSelect={() => {
                                        const selected = field.value?.includes(user.id)
                                        const newValue = selected
                                          ? field.value?.filter((id) => id !== user.id)
                                          : [...(field.value || []), user.id]
                                        field.onChange(newValue)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value?.includes(user.id) ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {user.name}
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
                name="leadId"
                render={({ field }) => (
                  <FormItem className="m-2">
                    <FormLabel>Project Lead</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={availableLeads.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project lead from the team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLeads.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetCompletionDate"
              render={({ field }) => (
                <FormItem className="m-2 flex flex-col">
                  <FormLabel>Target Completion Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="m-2 space-y-4">
                <FormLabel>Requested Inventory</FormLabel>
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
                                                  >
                                                    <Check
                                                      className={cn(
                                                        "mr-2 h-4 w-4",
                                                        item.id === field.value
                                                          ? "opacity-100"
                                                          : "opacity-0"
                                                      )}
                                                    />
                                                    {item.name}
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
                                          <Input type="number" placeholder="Qty" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </div>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", quantity: 1 })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                    <Button type="button" variant="link" className="text-primary p-0 h-auto" disabled>
                        or Request a New Item
                    </Button>
                </div>
            </div>


            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="m-2">
                  <div className="flex justify-between items-center">
                    <FormLabel>Project Description</FormLabel>
                    <Button type="button" variant="ghost" size="sm" disabled>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Enhance with AI
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the goals and technology of your project."
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <div className="pt-4 border-t">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit for Approval
          </Button>
        </div>
      </form>
    </Form>
  )
}

    