import { format } from "date-fns";
import { Mail, Phone, Calendar, Ruler, Weight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "@/components/ui/flag-icon";
import { countries } from "@/lib/countries";
import { Player } from "@shared/schema";

interface PlayerCardProps {
  player: Player;
}

const positionColors = {
  goalkeeper: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  defender: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  midfielder: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  forward: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
};

export default function PlayerCardNew({ player }: PlayerCardProps) {
  const positionColor = positionColors[player.position as keyof typeof positionColors] || positionColors.midfielder;
  const age = player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : null;
  
  // Find the country for nationality display - EXACT COPY FROM STAFF CARD
  const nationalityCountry = player.nationality 
    ? countries.find(country => country.name === player.nationality)
    : null;

  return (
    <Card className="content-card hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Avatar and Jersey Number */}
          <div className="relative">
            <Avatar className="h-20 w-20 mx-auto ring-4 ring-white/10">
              <AvatarImage 
                src={player.profilePicture || undefined}
                alt={`${player.firstName} ${player.lastName}`}
                className="object-cover object-center"
              />
              <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                {player.firstName[0]}{player.lastName[0]}
              </AvatarFallback>
            </Avatar>
            {player.shirtNumber && (
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {player.shirtNumber}
              </div>
            )}
          </div>

          {/* Name and Position */}
          <div>
            <h3 className="font-bold text-lg text-foreground">
              {player.firstName} {player.lastName}
            </h3>
            <Badge className={`text-xs ${positionColor}`}>
              {player.position.charAt(0).toUpperCase() + player.position.slice(1)}
            </Badge>
          </div>

          {/* Player Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {age && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{age} years</span>
              </div>
            )}
            {player.height && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Ruler className="w-4 h-4" />
                <span>{player.height}cm</span>
              </div>
            )}
            {player.weight && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Weight className="w-4 h-4" />
                <span>{player.weight}kg</span>
              </div>
            )}
          </div>

          {/* Contact Info - EXACT COPY FROM STAFF CARD */}
          <div className="space-y-2 pt-2 border-t border-border">
            {player.email && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span className="truncate">{player.email}</span>
              </div>
            )}
            
            {nationalityCountry && (
              <div className="flex items-center text-sm text-gray-600">
                <FlagIcon countryCode={nationalityCountry.code} size="sm" className="mr-2" />
                <span>{nationalityCountry.code} - {player.nationality}</span>
              </div>
            )}
            
            {player.phoneNumber && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>{player.phoneNumber}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              View Profile
            </Button>
            <Button variant="default" size="sm" className="flex-1">
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}