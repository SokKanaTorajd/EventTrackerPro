import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertParticipantSchema, FormField as SchemaFormField } from "@shared/schema";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Extend the insertParticipantSchema with frontend validation
const participantFormSchema = insertParticipantSchema.extend({
  email: z.string().email("Please enter a valid email address"),
});

type ParticipantFormValues = z.infer<typeof participantFormSchema>;

interface ParticipantFormProps {
  eventId: number;
  formFields: SchemaFormField[];
}

export function ParticipantForm({ eventId, formFields }: ParticipantFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isPreviouslyApproved, setIsPreviouslyApproved] = useState(false);

  const form = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      eventId,
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      linkedInProfile: "",
      gender: "",
      formData: {},
    },
  });

  // Check if email has been previously approved when it changes
  const email = form.watch("email");
  
  useEffect(() => {
    const checkEmailHistory = async () => {
      if (!email || !email.includes('@')) return;
      
      setCheckingEmail(true);
      try {
        const response = await fetch(`/api/check-history?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        setIsPreviouslyApproved(data.previouslyApproved);
      } catch (error) {
        console.error("Error checking email history:", error);
      } finally {
        setCheckingEmail(false);
      }
    };

    // Debounce the email check
    const timer = setTimeout(checkEmailHistory, 500);
    return () => clearTimeout(timer);
  }, [email]);

  async function onSubmit(data: ParticipantFormValues) {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/participants", data);
      
      toast({
        title: "Registration submitted",
        description: isPreviouslyApproved 
          ? "You've been automatically approved based on your previous participation." 
          : "Your registration has been submitted and is pending review.",
      });
      
      // Redirect to a thank you page or event details
      navigate(`/events/${eventId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render dynamic form fields
  const renderFormField = (field: SchemaFormField, index: number) => {
    const fieldName = `formData.${field.id}` as any;
    
    // Handle required standard fields that are not in formData
    if (field.label === "First Name") {
      return (
        <FormField
          key={field.id}
          control={form.control}
          name="firstName"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...formField} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    } else if (field.label === "Last Name") {
      return (
        <FormField
          key={field.id}
          control={form.control}
          name="lastName"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...formField} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    } else if (field.label === "Email") {
      return (
        <FormField
          key={field.id}
          control={form.control}
          name="email"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="your.email@example.com" 
                    {...formField} 
                    className={isPreviouslyApproved ? "pr-10 border-green-500" : ""}
                  />
                  {checkingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {isPreviouslyApproved && !checkingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-xs font-medium">
                      Previously approved
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
              {isPreviouslyApproved && (
                <FormDescription className="text-green-600">
                  You've participated before! Your registration will be automatically approved.
                </FormDescription>
              )}
            </FormItem>
          )}
        />
      );
    } else if (field.label === "Company/Institution") {
      return (
        <FormField
          key={field.id}
          control={form.control}
          name="company"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>Company/Institution</FormLabel>
              <FormControl>
                <Input placeholder="Company/Institution/College" {...formField} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    // Handle custom form fields
    switch (field.type) {
      case "text":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input placeholder={field.label} {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "email":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder={`your.${field.label.toLowerCase()}@example.com`} 
                    {...formField} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "textarea":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Textarea placeholder={field.label} {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "select":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <Select
                  onValueChange={formField.onChange}
                  defaultValue={formField.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "radio":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem className="space-y-3">
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    defaultValue={formField.value}
                    className="flex flex-col space-y-1"
                  >
                    {field.options?.map((option) => (
                      <FormItem
                        key={option}
                        className="flex items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem value={option} />
                        </FormControl>
                        <FormLabel className="font-normal">{option}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "checkbox":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {field.label}
                  </FormLabel>
                  <FormDescription>
                    Check this box if this applies to you
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Registration Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Standard fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formFields.map(renderFormField)}
            </div>
            
            {/* LinkedIn profile field */}
            <FormField
              control={form.control}
              name="linkedInProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://linkedin.com/in/your-profile" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Your LinkedIn profile will help with the background check
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Gender field */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Registration"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
