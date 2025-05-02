import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEventSchema, formFieldTypes } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const formFieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Field label is required"),
  type: z.enum(formFieldTypes),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

// Extend the insertEventSchema with frontend validation
const eventFormSchema = insertEventSchema.extend({
  formFields: z.array(formFieldSchema).min(1, "At least one form field is required"),
  // Make dates optional strings instead of Dates
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine(
  (data) => {
    // Ensure that the end date is after the start date
    if (data.endDate && data.startDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>;
  isEditing?: boolean;
  eventId?: number;
}

export function EventForm({ defaultValues, isEditing = false, eventId }: EventFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      startDate: undefined,
      endDate: undefined,
      maxParticipants: undefined,
      status: "draft",
      formFields: [
        { id: crypto.randomUUID(), label: "First Name", type: "text", required: true },
        { id: crypto.randomUUID(), label: "Last Name", type: "text", required: true },
        { id: crypto.randomUUID(), label: "Email", type: "email", required: true },
        { id: crypto.randomUUID(), label: "Company/Institution", type: "text", required: false },
      ],
      createdById: user?.id || 1,
      ...defaultValues,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "formFields",
  });

  async function onSubmit(data: EventFormValues) {
    setIsSubmitting(true);
    try {
      // The date values should already be properly formatted strings
      const formattedData = {
        ...data,
        // No need to convert to Date object and back, as we're handling the format at the input level
      };
      
      if (isEditing && eventId) {
        await apiRequest("PUT", `/api/events/${eventId}`, formattedData);
        toast({
          title: "Event updated",
          description: "The event has been updated successfully.",
        });
      } else {
        await apiRequest("POST", "/api/events", formattedData);
        toast({
          title: "Event created",
          description: "The event has been created successfully.",
        });
      }
      
      navigate("/events");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function addField() {
    append({
      id: crypto.randomUUID(),
      label: "",
      type: "text",
      required: false,
    });
  }
  
  function moveFieldUp(index: number) {
    if (index > 0) {
      move(index, index - 1);
    }
  }
  
  function moveFieldDown(index: number) {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tech Conference 2023" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your event..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Virtual or physical location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Participants</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Leave empty for unlimited"
                        {...field}
                        value={field.value === undefined ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for unlimited participants
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        onChange={(e) => {
                          field.onChange(e.target.value ? e.target.value : undefined);
                        }}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        onChange={(e) => {
                          field.onChange(e.target.value ? e.target.value : undefined);
                        }}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Leave empty for open-ended events.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set to "Active" when ready to accept registrations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Registration Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-md bg-gray-50 relative"
                >
                  <div className="absolute left-2 top-4 flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveFieldUp(index)}
                      disabled={index === 0}
                      className="h-6 w-6"
                    >
                      <span className="sr-only">Move up</span>
                      <GripVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="ml-8 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`formFields.${index}.label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Label</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="First Name"
                                {...field}
                                // Allow editing of all fields
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`formFields.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              // Allow changing field types for all fields
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="select">Dropdown</SelectItem>
                                <SelectItem value="radio">Radio Buttons</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="textarea">Text Area</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {(form.watch(`formFields.${index}.type`) === "select" ||
                      form.watch(`formFields.${index}.type`) === "radio") && (
                      <FormField
                        control={form.control}
                        name={`formFields.${index}.options`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Options</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Option 1, Option 2, Option 3"
                                value={field.value?.join(", ") || ""}
                                onChange={(e) => {
                                  const options = e.target.value
                                    .split(",")
                                    .map((opt) => opt.trim())
                                    .filter(Boolean);
                                  field.onChange(options);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter options separated by commas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name={`formFields.${index}.required`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Required Field</FormLabel>
                            <FormDescription>
                              Make this field mandatory for registration
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              // Allow changing required status for all fields
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Allow removal of any field, even standard ones */}
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Field
                        </Button>
                      </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addField}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Field
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/events")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
