
"use client"

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createNewRole } from "./actions";

// Helper to format permission keys into readable text
const formatPermissionName = (name: string) => {
    return name
        .replace(/([A-Z])/g, ' $1') // insert a space before all caps
        .replace(/^./, (str) => str.toUpperCase()); // uppercase the first character
};

const formSchema = z.object({
  roleName: z.string().min(3, "Role name must be at least 3 characters long."),
  permissions: z.record(z.boolean()),
});

type FormValues = z.infer<typeof formSchema>;

interface NewRoleFormProps {
  allPermissions: Record<string, boolean>;
  onFormSubmit: () => void;
}

export function NewRoleForm({ allPermissions, onFormSubmit }: NewRoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const permissionKeys = Object.keys(allPermissions);
  const defaultPermissions = permissionKeys.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as Record<string, boolean>);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleName: "",
      permissions: defaultPermissions,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      await createNewRole(data.roleName, data.permissions);
      toast({
        title: "Role Created",
        description: `Successfully created the '${data.roleName}' role.`,
      });
      onFormSubmit();
    } catch (error) {
      console.error("Error creating role:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="roleName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Event Coordinator" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
            <FormLabel>Permissions</FormLabel>
            <ScrollArea className="h-64 rounded-md border p-4">
                 <div className="grid grid-cols-1 gap-y-2">
                     {permissionKeys.map((key) => (
                        <FormField
                            key={key}
                            control={form.control}
                            name={`permissions.${key}`}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {formatPermissionName(key)}
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                    ))}
                 </div>
            </ScrollArea>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Role
        </Button>
      </form>
    </Form>
  );
}
