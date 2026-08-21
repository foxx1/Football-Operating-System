import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertMatchSchema, type Match, type InsertMatch, type Team } from "@shared/schema";
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
import { useI18n } from "@/contexts/I18nContext";

interface MatchFormProps {
    match?: Match;
    onSuccess?: () => void;
    prefillData?: Partial<InsertMatch>;
}

export default function MatchForm({ match, onSuccess, prefillData }: MatchFormProps) {
    const { toast } = useToast();
    const { t } = useI18n();

    // Fetch teams to select home team (assuming user manages one of the teams)
    const { data: teams = [] } = useQuery<Team[]>({
        queryKey: ["/api/teams"],
    });

    const form = useForm<InsertMatch>({
        resolver: zodResolver(insertMatchSchema),
        defaultValues: match
            ? {
                homeTeamId: match.homeTeamId,
                awayTeam: match.awayTeam,
                competition: match.competition,
                matchType: match.matchType,
                date: match.date,
                kickoffTime: match.kickoffTime,
                venue: match.venue,
                status: match.status,
                notes: match.notes || "",
            }
            : {
                homeTeamId: teams[0]?.id, // Default to first team if available
                awayTeam: "",
                competition: prefillData?.competition || "league",
                matchType: "home",
                date: prefillData?.date || new Date().toISOString().split("T")[0],
                kickoffTime: prefillData?.kickoffTime || "15:00",
                venue: "",
                status: "scheduled",
                notes: "",
            },
    });

    // Set default home team when data loads
    useEffect(() => {
        if (!match && teams.length > 0 && !form.getValues("homeTeamId")) {
            form.setValue("homeTeamId", teams[0].id);
        }
    }, [teams, match, form]);

    const createMutation = useMutation({
        mutationFn: async (data: InsertMatch) => {
            const res = await apiRequest("POST", "/api/matches", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
            toast({
                title: t("matches.form.toast.scheduledTitle"),
                description: t("matches.form.toast.scheduledDesc"),
            });
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast({
                title: t("matches.form.toast.errorTitle"),
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: InsertMatch) => {
            const res = await apiRequest("PATCH", `/api/matches/${match!.id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
            toast({
                title: t("matches.form.toast.updatedTitle"),
                description: t("matches.form.toast.updatedDesc"),
            });
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast({
                title: t("matches.form.toast.errorTitle"),
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: InsertMatch) => {
        // Ensure homeTeamId is a number
        data.homeTeamId = Number(data.homeTeamId);

        if (match) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="homeTeamId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("matches.form.homeTeam")}</FormLabel>
                                <Select
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    defaultValue={field.value?.toString()}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("matches.form.selectTeam")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {teams.map((team) => (
                                            <SelectItem key={team.id} value={team.id.toString()}>
                                                {team.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="awayTeam"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("matches.form.opponent")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("matches.form.opponentNamePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="competition"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("matches.form.competition")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("matches.form.selectCompetition")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="league">{t("matches.form.league")}</SelectItem>
                                        <SelectItem value="cup">{t("matches.form.cup")}</SelectItem>
                                        <SelectItem value="friendly">{t("matches.form.friendly")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="matchType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("matches.form.matchType")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("matches.form.selectType")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="home">{t("matches.form.home")}</SelectItem>
                                        <SelectItem value="away">{t("matches.form.away")}</SelectItem>
                                        <SelectItem value="neutral">{t("matches.form.neutral")}</SelectItem>
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
                                <FormLabel>{t("matches.form.date")}</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="kickoffTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("matches.form.kickoffTime")}</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="venue"
                        render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>{t("matches.form.venue")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("matches.form.venuePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>{t("matches.form.notes")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("matches.form.notesPlaceholder")} {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {match ? t("matches.form.updateMatch") : t("matches.form.scheduleMatch")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
