import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Clock,
    CheckSquare,
    Bell,
    Dumbbell,
    Users,
    Trophy,
    X,
    Edit,
    Trash2
} from "lucide-react";
import { useLocation } from "wouter";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    addWeeks,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
} from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Match, Meeting, TrainingSession } from "@shared/schema";
import TrainingForm from "@/components/training-form";
import MatchForm from "@/components/match-form";
import MeetingForm from "@/components/meeting-form";
import { ar, enUS } from "date-fns/locale";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";

type EventType = "match" | "training" | "meeting" | "event" | "task" | "reminder" | "other";
type MatchType = "league" | "cup" | "friendly";

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: EventType;
    matchType?: MatchType;
    time?: string;
    originalData?: Match | Meeting | TrainingSession;
}

type ViewMode = "month" | "week";

const eventColors: Record<EventType, { bg: string; text: string; border: string }> = {
    match: { bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800" },
    training: { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
    meeting: { bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
    event: { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
    task: { bg: "bg-indigo-100 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
    reminder: { bg: "bg-yellow-100 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-800" },
    other: { bg: "bg-gray-100 dark:bg-gray-900/20", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-800" }
};

export function InteractiveCalendar({ teamIds }: { teamIds?: number[] } = {}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { t, isRtl, locale } = useI18n();
    const dateLocale = locale === "ar" ? ar : enUS;
    const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
    const NextIcon = isRtl ? ChevronLeft : ChevronRight;

    // Form state
    const [eventType, setEventType] = useState<EventType>("training");
    const [matchType, setMatchType] = useState<MatchType>("league");
    const [eventTitle, setEventTitle] = useState("");
    const [eventTime, setEventTime] = useState("10:00");
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

    // Dialog states
    const [isTrainingOpen, setIsTrainingOpen] = useState(false);
    const [isMatchOpen, setIsMatchOpen] = useState(false);
    const [isMeetingOpen, setIsMeetingOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    // Fetch data
    const { data: matches = [] } = useQuery<Match[]>({ queryKey: ["/api/matches"] });
    const { data: meetingsResponse } = useQuery<Meeting[] | { data: Meeting[] }>({ queryKey: ["/api/meetings"] });
    const { data: trainingSessions = [] } = useQuery<TrainingSession[]>({ queryKey: ["/api/training-sessions"] });
    const { data: teams = [] } = useQuery<any[]>({ queryKey: ["/api/teams"] });
    const { data: staff = [] } = useQuery<any[]>({ queryKey: ["/api/staff"] });

    const meetings: Meeting[] = Array.isArray(meetingsResponse)
        ? meetingsResponse
        : meetingsResponse?.data ?? [];

    // When scoped to specific teams (technical staff dashboard), only show
    // matches and training sessions that belong to one of those teams.
    // Meetings have no team association in the schema, so they stay unfiltered.
    const scopedMatches = teamIds ? matches.filter(m => teamIds.includes(m.homeTeamId)) : matches;
    const scopedTrainingSessions = teamIds ? trainingSessions.filter(s => teamIds.includes(s.teamId)) : trainingSessions;

    // Combine and map events
    const events = useMemo(() => {
        const allEvents: CalendarEvent[] = [];

        scopedMatches.forEach(match => {
            allEvents.push({
                id: `match-${match.id}`,
                title: `${match.homeTeamId === 1 ? 'vs ' + match.awayTeam : match.awayTeam}`, // Simplified title logic
                date: parseISO(match.date),
                type: "match",
                matchType: (match.competition?.toLowerCase().includes("cup") ? "cup" : "league") as MatchType, // Simple heuristic
                time: match.kickoffTime,
                originalData: match
            });
        });

        meetings.forEach(meeting => {
            allEvents.push({
                id: `meeting-${meeting.id}`,
                title: meeting.title,
                date: parseISO(meeting.date),
                type: "meeting",
                time: meeting.startTime,
                originalData: meeting
            });
        });

        scopedTrainingSessions.forEach(session => {
            allEvents.push({
                id: `training-${session.id}`,
                title: session.title,
                date: parseISO(session.date),
                type: "training",
                time: session.startTime,
                originalData: session
            });
        });

        return allEvents;
    }, [scopedMatches, meetings, scopedTrainingSessions]);

    // Mutations
    const createTrainingMutation = useMutation({
        mutationFn: async (data: any) => apiRequest("POST", "/api/training-sessions", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
            toast({
                title: t("calendar.toast.trainingCreatedTitle"),
                description: t("calendar.toast.trainingCreatedDescription"),
            });
        },
        onError: () => {
            toast({ title: t("calendar.toast.trainingCreateFailed"), variant: "destructive" });
        }
    });

    const deleteMatchMutation = useMutation({
        mutationFn: async (id: number) => apiRequest("DELETE", `/api/matches/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
            toast({ title: t("calendar.toast.matchDeleted") });
        }
    });

    const deleteMeetingMutation = useMutation({
        mutationFn: async (id: number) => apiRequest("DELETE", `/api/meetings/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
            toast({ title: t("calendar.toast.meetingDeleted") });
        }
    });

    const deleteTrainingMutation = useMutation({
        mutationFn: async (id: number) => apiRequest("DELETE", `/api/training-sessions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
            toast({ title: t("calendar.toast.trainingDeleted") });
        }
    });

    const handlePrevious = () => {
        if (viewMode === "month") {
            setCurrentDate(addMonths(currentDate, -1));
        } else {
            setCurrentDate(addWeeks(currentDate, -1));
        }
    };

    const handleNext = () => {
        if (viewMode === "month") {
            setCurrentDate(addMonths(currentDate, 1));
        } else {
            setCurrentDate(addWeeks(currentDate, 1));
        }
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleCreateEvent = () => {
        setOpenPopoverId(null);
        setEditingEvent(null); // Ensure we are in create mode
        if (eventType === "training") {
            setIsTrainingOpen(true);
        } else if (eventType === "match") {
            setIsMatchOpen(true);
        } else if (eventType === "meeting") {
            setIsMeetingOpen(true);
        }
    };

    const handleQuickCreate = () => {
        if (eventType === "training") {
            if (!eventTitle) {
                toast({ title: t("calendar.toast.titleRequired"), variant: "destructive" });
                return;
            }

            // Use the first assigned team (if scoped), else the first team overall, otherwise 1 (fallback)
            const defaultTeamId = teamIds?.[0] ?? (teams.length > 0 ? teams[0].id : 1);
            const defaultCoachId = staff.length > 0 ? staff[0].id : 1;

            createTrainingMutation.mutate({
                title: eventTitle,
                date: format(selectedDate!, "yyyy-MM-dd"),
                startTime: eventTime,
                duration: 90,
                sessionType: "technical",
                location: "Training Ground",
                teamId: defaultTeamId,
                coachId: defaultCoachId,
                description: "Quick entry session",
            });
            setOpenPopoverId(null);
        } else {
            handleCreateEvent();
        }
    };

    const handleEditEvent = (event: CalendarEvent) => {
        setEditingEvent(event);
        if (event.type === "training") {
            setIsTrainingOpen(true);
        } else if (event.type === "match") {
            setIsMatchOpen(true);
        } else if (event.type === "meeting") {
            setIsMeetingOpen(true);
        }
    };

    const handleDeleteEvent = (event: CalendarEvent) => {
        if (!confirm(t("calendar.deleteConfirm"))) return;

        const id = (event.originalData as any).id;
        if (event.type === "match") {
            deleteMatchMutation.mutate(id);
        } else if (event.type === "meeting") {
            deleteMeetingMutation.mutate(id);
        } else if (event.type === "training") {
            deleteTrainingMutation.mutate(id);
        }
    };

    // Helper function to get events for a specific day
    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(event.date, day));
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;

        // Week day headers
        const weekDays = [];
        const weekStartDate = startOfWeek(new Date());
        for (let i = 0; i < 7; i++) {
            weekDays.push(
                <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-2">
                    {format(addDays(weekStartDate, i), "EEE", { locale: dateLocale })}
                </div>
            );
        }

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const dayEvents = getEventsForDay(cloneDay);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isDayToday = isToday(day);
                const dayId = day.toString();

                days.push(
                    <div
                        key={dayId}
                        className={`min-h-[100px] border border-border p-2 transition-colors ${!isCurrentMonth ? "bg-muted/30" : "bg-background"
                            } ${isDayToday ? "ring-2 ring-primary" : ""}`}
                        onClick={() => {
                            setOpenPopoverId(dayId);
                            setSelectedDate(cloneDay);
                            setEventType("training"); // Reset to default
                            setMatchType("league");
                            setEventTitle(""); // Reset title
                            setEventTime("10:00"); // Reset time
                        }}
                    >
                        <Popover
                            open={openPopoverId === dayId}
                            onOpenChange={(open) => {
                                if (!open) setOpenPopoverId(null);
                            }}
                        >
                            <PopoverTrigger asChild>
                                <div className="w-full h-full cursor-pointer">
                                    <div className={`text-sm font-medium mb-1 ${!isCurrentMonth ? "text-muted-foreground" : isDayToday ? "text-primary font-bold" : "text-foreground"
                                        }`}>
                                        {format(cloneDay, dateFormat)}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map(event => {
                                            const colors = eventColors[event.type];
                                            return (
                                                <Popover key={event.id}>
                                                    <PopoverTrigger asChild>
                                                        <div
                                                            className={`group relative text-xs px-2 py-1 rounded ${colors.bg} ${colors.text} truncate border ${colors.border} cursor-pointer hover:opacity-80`}
                                                            title={`${event.title} ${event.time ? `- ${event.time}` : ""}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Don't set openPopoverId here, let the nested popover handle it
                                                            }}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span className="truncate">{event.title}</span>
                                                            </div>
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-4 w-auto" align="start" side={isRtl ? "left" : "right"}>
                                                        <EventDetails
                                                            event={event}
                                                            closePopover={() => document.body.click()}
                                                            onEdit={handleEditEvent}
                                                            onDelete={handleDeleteEvent}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            );
                                        })}
                                        {dayEvents.length > 3 && (
                                            <div className="text-xs text-muted-foreground px-2">
                                                {translateWithParams(t, "calendar.moreCount", {
                                                    count: String(dayEvents.length - 3),
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="p-4" align="start" side={isRtl ? "left" : "right"}>
                                <EventCreationForm
                                    date={cloneDay}
                                    closePopover={() => setOpenPopoverId(null)}
                                    eventTitle={eventTitle}
                                    setEventTitle={setEventTitle}
                                    eventType={eventType}
                                    setEventType={setEventType}
                                    matchType={matchType}
                                    setMatchType={setMatchType}
                                    eventTime={eventTime}
                                    setEventTime={setEventTime}
                                    onCreate={handleCreateEvent}
                                    onQuickCreate={handleQuickCreate}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toString()} className="grid grid-cols-7">
                    {days}
                </div>
            );
            days = [];
        }

        return (
            <div>
                <div className="grid grid-cols-7 border-b border-border">
                    {weekDays}
                </div>
                {rows}
            </div>
        );
    };

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate);
        const weekDays = [];

        for (let i = 0; i < 7; i++) {
            const day = addDays(weekStart, i);
            const dayEvents = getEventsForDay(day);
            const isDayToday = isToday(day);
            const dayId = day.toString();

            weekDays.push(
                <div key={i} className="flex-1 border-r border-border last:border-r-0">
                    <Popover
                        open={openPopoverId === dayId}
                        onOpenChange={(open) => {
                            if (open) {
                                setOpenPopoverId(dayId);
                                setSelectedDate(day);
                                setEventType("training");
                                setMatchType("league");
                                setEventTitle(""); // Reset title
                                setEventTime("10:00"); // Reset time
                            } else {
                                setOpenPopoverId(null);
                            }
                        }}
                    >
                        <PopoverTrigger asChild>
                            <div
                                className={`text-center py-3 border-b border-border cursor-pointer hover:bg-muted/70 transition-colors ${isDayToday ? "bg-primary/10" : "bg-muted/30"
                                    }`}
                            >
                                <div className="text-xs font-semibold text-muted-foreground">
                                    {format(day, "EEE", { locale: dateLocale })}
                                </div>
                                <div className={`text-lg font-bold mt-1 ${isDayToday ? "text-primary" : "text-foreground"
                                    }`}>
                                    {format(day, "d")}
                                </div>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="p-4" align="center" side="bottom">
                            <EventCreationForm
                                date={day}
                                closePopover={() => setOpenPopoverId(null)}
                                eventTitle={eventTitle}
                                setEventTitle={setEventTitle}
                                eventType={eventType}
                                setEventType={setEventType}
                                matchType={matchType}
                                setMatchType={setMatchType}
                                eventTime={eventTime}
                                setEventTime={setEventTime}
                                onCreate={handleCreateEvent}
                                onQuickCreate={handleQuickCreate}
                            />
                        </PopoverContent>
                    </Popover>

                    <div className="p-3 space-y-2 min-h-[400px]">
                        {dayEvents.map(event => {
                            const colors = eventColors[event.type];
                            return (
                                <Popover key={event.id}>
                                    <PopoverTrigger asChild>
                                        <div
                                            className={`group relative p-3 rounded-lg border ${colors.border} ${colors.bg} cursor-pointer hover:opacity-90`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className={`font-medium text-sm ${colors.text}`}>
                                                    {event.title}
                                                </div>
                                            </div>
                                            {event.time && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {event.time}
                                                </div>
                                            )}
                                            <div className="flex gap-1 mt-2">
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    {t(`calendar.type.${event.type}`)}
                                                </Badge>
                                                {event.matchType && (
                                                    <Badge variant="secondary" className="text-[10px] h-5">
                                                        {t(`calendar.matchType.${event.matchType}`)}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-4 w-auto" align="center" side={isRtl ? "left" : "right"}>
                                        <EventDetails
                                            event={event}
                                            closePopover={() => document.body.click()}
                                            onEdit={handleEditEvent}
                                            onDelete={handleDeleteEvent}
                                        />
                                    </PopoverContent>
                                </Popover>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return <div className="flex border border-border rounded-lg overflow-hidden">{weekDays}</div>;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" />
                            {t("calendar.title")}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                <Button
                                    variant={viewMode === "month" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("month")}
                                    className="h-7 text-xs"
                                >
                                    {t("calendar.month")}
                                </Button>
                                <Button
                                    variant={viewMode === "week" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("week")}
                                    className="h-7 text-xs"
                                >
                                    {t("calendar.week")}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrevious}>
                                <PrevIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleNext}>
                                <NextIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleToday}>
                                {t("calendar.today")}
                            </Button>
                        </div>
                        <h3 className="text-lg font-semibold">
                            {viewMode === "month"
                                ? format(currentDate, "MMMM yyyy", { locale: dateLocale })
                                : translateWithParams(t, "calendar.weekOf", {
                                      date: format(startOfWeek(currentDate), "MMM d, yyyy", { locale: dateLocale }),
                                  })
                            }
                        </h3>
                    </div>
                </CardHeader>
                <CardContent>
                    {viewMode === "month" ? renderMonthView() : renderWeekView()}

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
                        <span className="text-sm font-medium text-muted-foreground">{t("calendar.legend")}</span>
                        {Object.entries(eventColors).map(([type, colors]) => (
                            <div key={type} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded ${colors.bg} border ${colors.border}`}></div>
                                <span className="text-xs text-muted-foreground">{t(`calendar.type.${type}`)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <Dialog open={isTrainingOpen} onOpenChange={setIsTrainingOpen}>
                <DialogContent className="max-w-[98vw] w-full max-h-[95vh] overflow-y-auto p-2">
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? t("calendar.editTraining") : t("calendar.scheduleTraining")}</DialogTitle>
                    </DialogHeader>
                    <TrainingForm
                        session={editingEvent?.type === "training" ? editingEvent.originalData as TrainingSession : undefined}
                        prefillData={!editingEvent && selectedDate ? {
                            date: format(selectedDate, "yyyy-MM-dd"),
                            title: eventTitle,
                            startTime: eventTime
                        } : undefined}
                        onSuccess={() => {
                            setIsTrainingOpen(false);
                            setEditingEvent(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isMatchOpen} onOpenChange={setIsMatchOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? t("calendar.editMatch") : t("calendar.scheduleMatch")}</DialogTitle>
                    </DialogHeader>
                    <MatchForm
                        match={editingEvent?.type === "match" ? editingEvent.originalData as Match : undefined}
                        prefillData={!editingEvent && selectedDate ? {
                            date: format(selectedDate, "yyyy-MM-dd"),
                            competition: matchType,
                            kickoffTime: eventTime,
                            // Match doesn't have a generic 'title' field that maps 1:1, usually it's Home vs Away
                        } : undefined}
                        onSuccess={() => {
                            setIsMatchOpen(false);
                            setEditingEvent(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isMeetingOpen} onOpenChange={setIsMeetingOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? t("calendar.editMeeting") : t("calendar.scheduleMeeting")}</DialogTitle>
                    </DialogHeader>
                    <MeetingForm
                        meeting={editingEvent?.type === "meeting" ? editingEvent.originalData as Meeting : undefined}
                        prefillData={!editingEvent && selectedDate ? {
                            date: format(selectedDate, "yyyy-MM-dd"),
                            title: eventTitle,
                            startTime: eventTime
                        } : undefined}
                        onSuccess={() => {
                            setIsMeetingOpen(false);
                            setEditingEvent(null);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

// Event Creation Form Component
const EventCreationForm = ({
    date,
    closePopover,
    eventTitle,
    setEventTitle,
    eventType,
    setEventType,
    matchType,
    setMatchType,
    eventTime,
    setEventTime,
    onCreate,
    onQuickCreate
}: {
    date: Date;
    closePopover: () => void;
    eventTitle: string;
    setEventTitle: (val: string) => void;
    eventType: EventType;
    setEventType: (val: EventType) => void;
    matchType: MatchType;
    setMatchType: (val: MatchType) => void;
    eventTime: string;
    setEventTime: (val: string) => void;
    onCreate: () => void;
    onQuickCreate: () => void;
}) => {
    const { t, locale } = useI18n();
    const dateLocale = locale === "ar" ? ar : enUS;

    return (
        <div className="space-y-4 w-64" onClick={(e) => e.stopPropagation()}>
            <div>
                <h4 className="font-semibold mb-2">{format(date, "MMMM d, yyyy", { locale: dateLocale })}</h4>
            </div>

            <div className="space-y-2">
                <Label>{t("calendar.eventTitle")}</Label>
                <Input
                    placeholder={t("calendar.eventTitlePlaceholder")}
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>{t("calendar.eventType")}</Label>
                <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="match">{t("calendar.type.match")}</SelectItem>
                        <SelectItem value="training">{t("calendar.type.training")}</SelectItem>
                        <SelectItem value="meeting">{t("calendar.type.meeting")}</SelectItem>
                        <SelectItem value="event">{t("calendar.type.event")}</SelectItem>
                        <SelectItem value="task">{t("calendar.type.task")}</SelectItem>
                        <SelectItem value="reminder">{t("calendar.type.reminder")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {eventType === "match" && (
                <div className="space-y-2">
                    <Label>{t("calendar.matchType")}</Label>
                    <Select value={matchType} onValueChange={(v) => setMatchType(v as MatchType)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="league">{t("calendar.matchType.league")}</SelectItem>
                            <SelectItem value="cup">{t("calendar.matchType.cup")}</SelectItem>
                            <SelectItem value="friendly">{t("calendar.matchType.friendly")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-2">
                <Label>{t("calendar.time")}</Label>
                <Input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2 pt-2">
                {eventType === "training" ? (
                    <>
                        <Button size="sm" onClick={onQuickCreate} className="w-full">
                            {t("calendar.quickCreate")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={onCreate} className="w-full">
                            {t("calendar.moreDetails")}
                        </Button>
                    </>
                ) : (
                    <Button size="sm" onClick={onCreate} className="w-full">
                        {translateWithParams(t, "calendar.createEvent", { type: t(`calendar.type.${eventType}`) })}
                    </Button>
                )}
            </div>
        </div>
    );
};

// Event Details Component
const EventDetails = ({
    event,
    closePopover,
    onEdit,
    onDelete
}: {
    event: CalendarEvent;
    closePopover: () => void;
    onEdit: (event: CalendarEvent) => void;
    onDelete: (event: CalendarEvent) => void;
}) => {
    const colors = eventColors[event.type];
    const { t, isRtl, locale } = useI18n();
    const dateLocale = locale === "ar" ? ar : enUS;
    return (
        <div className="space-y-4 w-64" onClick={(e) => e.stopPropagation()}>
            <div className={`p-3 rounded-t-md -mx-4 -mt-4 mb-4 ${colors.bg} border-b ${colors.border}`}>
                <div className="flex justify-between items-start">
                    <h4 className={`font-bold ${colors.text}`}>{event.title}</h4>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-6 w-6 -mt-1", isRtl ? "-ml-1" : "-mr-1")}
                        onClick={closePopover}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className={`text-xs ${colors.text} opacity-80 mt-1 flex items-center gap-1`}>
                    <Clock className="h-3 w-3" />
                    {format(event.date, "MMMM d, yyyy", { locale: dateLocale })} {t("calendar.at")} {event.time}
                </div>
            </div>

            <div className="flex gap-2">
                <Badge variant="outline">
                    {t(`calendar.type.${event.type}`)}
                </Badge>
                {event.matchType && (
                    <Badge variant="secondary">
                        {t(`calendar.matchType.${event.matchType}`)}
                    </Badge>
                )}
            </div>

            <div className="flex gap-2 pt-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                        closePopover();
                        onEdit(event);
                    }}
                >
                    <Edit className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                    {t("calendar.edit")}
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                        closePopover();
                        onDelete(event);
                    }}
                >
                    <Trash2 className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                    {t("calendar.delete")}
                </Button>
            </div>
        </div>
    );
};
