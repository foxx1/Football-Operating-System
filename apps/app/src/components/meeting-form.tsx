import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertMeetingSchema, type Meeting, type InsertMeeting, type Staff } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface MeetingFormProps {
    meeting?: Meeting;
    onSuccess?: () => void;
    prefillData?: Partial<InsertMeeting>;
}

export default function MeetingForm({ meeting, onSuccess, prefillData }: MeetingFormProps) {
    const { toast } = useToast();

    // Fetch staff to select organizer
    const { data: staffMembers = [], isLoading: isLoadingStaff, isError: isStaffError } = useQuery<Staff[]>({
        queryKey: ["/api/staff"],
    });

    const form = useForm<InsertMeeting>({
        resolver: zodResolver(insertMeetingSchema),
        defaultValues: meeting
            ? {
                title: meeting.title,
                description: meeting.description || "",
                meetingType: meeting.meetingType,
                date: meeting.date,
                startTime: meeting.startTime,
                duration: meeting.duration,
                location: meeting.location,
                organizerId: meeting.organizerId,
                attendees: meeting.attendees || [],
                agenda: meeting.agenda || "",
                notes: meeting.notes || "",
                status: meeting.status,
                priority: meeting.priority,
            }
            : {
                title: prefillData?.title || "",
                description: "",
                meetingType: "team",
                date: prefillData?.date || new Date().toISOString().split("T")[0],
                startTime: prefillData?.startTime || "10:00",
                duration: 60,
                location: "Conference Room",
                organizerId: undefined, // Will be set when staff loads
                attendees: [],
                agenda: "",
                notes: "",
                status: "scheduled",
                priority: "medium",
            },
    });

    // Update organizerId when staff loads if not already set
    useEffect(() => {
        if (!meeting && staffMembers.length > 0 && !form.getValues("organizerId")) {
            form.setValue("organizerId", staffMembers[0].id);
        }
    }, [staffMembers, meeting, form]);

    const createMutation = useMutation({
        mutationFn: async (data: InsertMeeting) => {
            const res = await apiRequest("POST", "/api/meetings", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
            toast({
                title: "Meeting scheduled",
                description: "The meeting has been successfully scheduled.",
            });
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: InsertMeeting) => {
            const res = await apiRequest("PATCH", `/api/meetings/${meeting!.id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
            toast({
                title: "Meeting updated",
                description: "The meeting details have been successfully updated.",
            });
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: InsertMeeting) => {
        // Ensure organizerId is a number
        data.organizerId = Number(data.organizerId);
        data.duration = Number(data.duration);

        if (meeting) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Meeting Title" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="meetingType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="team">Team</SelectItem>
                                        <SelectItem value="tactical">Tactical</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="individual">Individual</SelectItem>
                                        <SelectItem value="medical">Medical</SelectItem>
                                        <SelectItem value="board">Board</SelectItem>
                                        <SelectItem value="sponsors">Sponsors</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex gap-2">
                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Duration (min)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="Room / Location" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="organizerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Organizer</FormLabel>
                                <Select
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    value={field.value?.toString() || ""}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select organizer" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {staffMembers.length > 0 ? (
                                            staffMembers.map((staff) => (
                                                <SelectItem key={staff.id} value={staff.id.toString()}>
                                                    {staff.firstName} {staff.lastName}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-staff" disabled>No staff members found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Meeting description..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="agenda"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Agenda</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Meeting agenda..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {meeting ? "Update Meeting" : "Schedule Meeting"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
