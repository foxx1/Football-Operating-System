import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Trophy, Calendar, MapPin, Users, Edit, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Match } from "@shared/schema";

export default function MatchesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["/api/matches"],
  });

  const filteredMatches = matches.filter((match: Match) => {
    const matchesSearch = 
      match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.competition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.venue.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || match.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      postponed: "bg-yellow-100 text-yellow-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getCompetitionColor = (competition: string) => {
    const colors = {
      league: "bg-blue-50 border-blue-200",
      cup: "bg-purple-50 border-purple-200",
      friendly: "bg-green-50 border-green-200",
    };
    return colors[competition as keyof typeof colors] || "bg-gray-50 border-gray-200";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matches & Fixtures</h1>
          <p className="text-gray-600 mt-1">Manage upcoming matches and review past results</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Schedule Match
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Matches</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="postponed">Postponed</option>
        </select>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMatches.map((match: Match) => (
          <Card key={match.id} className={`hover:shadow-lg transition-shadow ${getCompetitionColor(match.competition)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                      {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {match.competition}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mb-1">
                    First Team vs {match.awayTeam}
                  </CardTitle>
                  <div className="text-sm text-gray-600 capitalize">
                    {match.matchType} Match
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{new Date(match.date).toLocaleDateString()}</span>
                <Clock className="w-4 h-4 ml-4 mr-1" />
                <span>{match.kickoffTime}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="truncate">{match.venue}</span>
              </div>

              {match.status === "completed" && match.homeScore !== null && match.awayScore !== null && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {match.homeScore} - {match.awayScore}
                  </div>
                  <div className="text-sm text-gray-600">Final Score</div>
                </div>
              )}

              {match.attendance && (
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Attendance: {match.attendance.toLocaleString()}</span>
                </div>
              )}

              {match.weatherConditions && (
                <div className="text-xs text-gray-500">
                  Weather: {match.weatherConditions}
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                {match.status === "scheduled" && (
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-1" />
                    Squad
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedStatus !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Get started by scheduling your first match."
              }
            </p>
            {!searchTerm && selectedStatus === "all" && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Match
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}