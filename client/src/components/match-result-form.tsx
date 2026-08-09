import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Target, Clock, User, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Match, Player } from "@shared/schema";

interface GoalEvent {
    minute: number;
    half: 1 | 2;
    team: "home" | "away";
    scorerName: string;
    assistName?: string;
}

interface MatchResultFormProps {
    match: Match;
    onSuccess?: () => void;
}

export default function MatchResultForm({ match, onSuccess }: MatchResultFormProps) {
    const { toast } = useToast();

    // Half scores
    const [ht1Home, setHt1Home] = useState<number>(match.firstHalfHomeScore ?? 0);
    const [ht1Away, setHt1Away] = useState<number>(match.firstHalfAwayScore ?? 0);
    const [ht2Home, setHt2Home] = useState<number>(match.secondHalfHomeScore ?? 0);
    const [ht2Away, setHt2Away] = useState<number>(match.secondHalfAwayScore ?? 0);

    // Full-time totals (derived)
    const ftHome = ht1Home + ht2Home;
    const ftAway = ht1Away + ht2Away;

    // Goals list
    const existingGoals = (match.goalEvents as GoalEvent[] | null) ?? [];
    const [goals, setGoals] = useState<GoalEvent[]>(existingGoals);

    // New goal draft
    const [newMin, setNewMin] = useState<number>(1);
    const [newHalf, setNewHalf] = useState<1 | 2>(1);
    const [newTeam, setNewTeam] = useState<"home" | "away">("home");
    const [newScorer, setNewScorer] = useState("");
    const [newAssist, setNewAssist] = useState("");

    // Fetch players for scorer/assister suggestions
    const { data: players = [] } = useQuery<Player[]>({ queryKey: ["/api/players"] });
    const playerNames = players.map((p) => `${p.firstName} ${p.lastName}`);

    const addGoal = () => {
        if (!newScorer.trim()) {
            toast({ title: "Scorer required", description: "Please enter the scorer's name.", variant: "destructive" });
            return;
        }
        setGoals((prev) => [
            ...prev,
            {
                minute: newMin,
                half: newHalf,
                team: newTeam,
                scorerName: newScorer.trim(),
                assistName: newAssist.trim() || undefined,
            },
        ]);
        setNewMin(1);
        setNewScorer("");
        setNewAssist("");
    };

    const removeGoal = (idx: number) => setGoals((prev) => prev.filter((_, i) => i !== idx));

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = {
                firstHalfHomeScore: ht1Home,
                firstHalfAwayScore: ht1Away,
                secondHalfHomeScore: ht2Home,
                secondHalfAwayScore: ht2Away,
                homeScore: ftHome,
                awayScore: ftAway,
                goalEvents: goals,
                status: "completed",
            };
            const res = await apiRequest("PATCH", `/api/matches/${match.id}`, payload);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
            toast({ title: "Result saved", description: "Match result has been recorded successfully." });
            onSuccess?.();
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        },
    });

    const numInput = (
        val: number,
        setter: (n: number) => void,
        label: string
    ) => (
        <div className="flex flex-col items-center gap-1">
            <Label className="text-xs text-gray-500">{label}</Label>
            <Input
                type="number"
                min={0}
                max={20}
                value={val}
                onChange={(e) => setter(Math.max(0, Math.min(20, Number(e.target.value))))}
                className="w-16 text-center text-lg font-bold"
            />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Match title */}
            <div className="text-sm text-gray-500 text-center">
                First Team vs <span className="font-semibold text-gray-800">{match.awayTeam}</span>
                &nbsp;·&nbsp;{new Date(match.date).toLocaleDateString()}
            </div>

            {/* Half Scores */}
            <div className="space-y-4">
                {/* 1st Half */}
                <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-center text-sm font-semibold text-blue-700 mb-3">1st Half</p>
                    <div className="flex items-center justify-center gap-4">
                        {numInput(ht1Home, setHt1Home, "Home")}
                        <span className="text-2xl font-bold text-gray-400 mt-4">–</span>
                        {numInput(ht1Away, setHt1Away, "Away")}
                    </div>
                </div>

                {/* 2nd Half */}
                <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-center text-sm font-semibold text-purple-700 mb-3">2nd Half</p>
                    <div className="flex items-center justify-center gap-4">
                        {numInput(ht2Home, setHt2Home, "Home")}
                        <span className="text-2xl font-bold text-gray-400 mt-4">–</span>
                        {numInput(ht2Away, setHt2Away, "Away")}
                    </div>
                </div>

                {/* Full Time Total */}
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Full Time</p>
                    <p className="text-4xl font-extrabold text-white">
                        {ftHome} <span className="text-gray-500 mx-1">–</span> {ftAway}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        HT {ht1Home}–{ht1Away}
                    </p>
                </div>
            </div>

            {/* Goals Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    Goals ({goals.length})
                </h3>

                {/* Add Goal Row */}
                <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
                    <div className="grid grid-cols-3 gap-2">
                        {/* Minute */}
                        <div>
                            <Label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                <Clock className="w-3 h-3" /> Minute
                            </Label>
                            <Input
                                type="number"
                                min={1}
                                max={120}
                                value={newMin}
                                onChange={(e) => setNewMin(Math.max(1, Math.min(120, Number(e.target.value))))}
                                className="text-center"
                            />
                        </div>

                        {/* Half */}
                        <div>
                            <Label className="text-xs text-gray-500 mb-1 block">Half</Label>
                            <select
                                value={newHalf}
                                onChange={(e) => setNewHalf(Number(e.target.value) as 1 | 2)}
                                className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={1}>1st Half</option>
                                <option value={2}>2nd Half</option>
                            </select>
                        </div>

                        {/* Team */}
                        <div>
                            <Label className="text-xs text-gray-500 mb-1 block">Team</Label>
                            <select
                                value={newTeam}
                                onChange={(e) => setNewTeam(e.target.value as "home" | "away")}
                                className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="home">Home (Us)</option>
                                <option value="away">Away (Opp)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {/* Scorer */}
                        <div>
                            <Label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                <User className="w-3 h-3" /> Scorer *
                            </Label>
                            <Input
                                list="player-list"
                                placeholder="Player name"
                                value={newScorer}
                                onChange={(e) => setNewScorer(e.target.value)}
                            />
                        </div>

                        {/* Assister */}
                        <div>
                            <Label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                <UserCheck className="w-3 h-3" /> Assist (optional)
                            </Label>
                            <Input
                                list="player-list"
                                placeholder="Assister name"
                                value={newAssist}
                                onChange={(e) => setNewAssist(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Hidden datalist for autocomplete */}
                    <datalist id="player-list">
                        {playerNames.map((name) => (
                            <option key={name} value={name} />
                        ))}
                    </datalist>

                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={addGoal}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Goal
                    </Button>
                </div>

                {/* Goals List */}
                {goals.length > 0 && (
                    <div className="space-y-2">
                        {[...goals]
                            .sort((a, b) => a.minute - b.minute)
                            .map((g, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${g.team === "home"
                                            ? "bg-green-50 border border-green-200"
                                            : "bg-red-50 border border-red-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={`text-xs font-mono ${g.team === "home"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {g.minute}&apos;
                                        </Badge>
                                        <span>
                                            <span className="font-semibold">{g.scorerName}</span>
                                            {g.assistName && (
                                                <span className="text-gray-500"> (assist: {g.assistName})</span>
                                            )}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            · Half {g.half} · {g.team === "home" ? "🏠 Home" : "✈️ Away"}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeGoal(idx)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2 border-t">
                <Button
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {mutation.isPending ? "Saving…" : "✓ Save Result & Mark Completed"}
                </Button>
            </div>
        </div>
    );
}
