import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEmailTemplateSchema } from "@shared/schema";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extend the insertEmailTemplateSchema with frontend validation
const emailTemplateFormSchema = insertEmailTemplateSchema.extend({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Email subject is required"),
  body: z.string().min(10, "Email body must be at least 10 characters"),
});

type EmailTemplateFormValues = z.infer<typeof emailTemplateFormSchema>;

interface EmailTemplateFormProps {
  defaultValues?: Partial<EmailTemplateFormValues>;
  isEditing?: boolean;
  templateId?: number;
}

export function EmailTemplateForm({ defaultValues, isEditing = false, templateId }: EmailTemplateFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("edit");

  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(emailTemplateFormSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      type: "approval",
      isDefault: false,
      createdById: user?.id || 1,
      ...defaultValues,
    },
  });

  async function onSubmit(data: EmailTemplateFormValues) {
    setIsSubmitting(true);
    try {
      if (isEditing && templateId) {
        await apiRequest("PUT", `/api/email-templates/${templateId}`, data);
        toast({
          title: "Template updated",
          description: "The email template has been updated successfully.",
        });
      } else {
        await apiRequest("POST", "/api/email-templates", data);
        toast({
          title: "Template created",
          description: "The email template has been created successfully.",
        });
      }
      
      navigate("/email-templates");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const watchBody = form.watch("body");
  const watchType = form.watch("type");
  const watchSubject = form.watch("subject");

  const getPlaceholderContext = () => {
    return {
      firstName: "John",
      lastName: "Doe",
      eventName: "Tech Conference 2023"
    };
  };

  const replacePlaceholders = (text: string) => {
    const context = getPlaceholderContext();
    return text
      .replace(/{{firstName}}/g, context.firstName)
      .replace(/{{lastName}}/g, context.lastName)
      .replace(/{{eventName}}/g, context.eventName);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Email Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Approval Template" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="approval">Approval</SelectItem>
                        <SelectItem value="rejection">Rejection</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The purpose of this email template
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Default Template</FormLabel>
                      <FormDescription>
                        Use this as the default template for {watchType} emails
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Subject line of the email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Email Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit" className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Write your email content here..."
                          className="min-h-[300px] font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Available placeholders: {'{{firstName}}, {{lastName}}, {{eventName}}'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="preview" className="py-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="border-b pb-4 mb-4">
                      <div className="font-semibold text-sm text-muted-foreground">To:</div>
                      <div>john.doe@example.com</div>
                    </div>
                    <div className="border-b pb-4 mb-4">
                      <div className="font-semibold text-sm text-muted-foreground">Subject:</div>
                      <div>{watchSubject}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-muted-foreground mb-2">Message:</div>
                      <div className="whitespace-pre-wrap">{replacePlaceholders(watchBody)}</div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/email-templates")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
