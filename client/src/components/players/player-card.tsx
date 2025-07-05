import { format } from "date-fns";
import { Mail, Phone, Calendar, Ruler, Weight, Flag } from "lucide-react";
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

export default function PlayerCard({ player }: PlayerCardProps) {
  const positionColor = positionColors[player.position as keyof typeof positionColors] || positionColors.midfielder;
  const age = player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : null;
  
  // Find the country for nationality display
  const nationalityCountry = player.nationality 
    ? countries.find(country => country.name === player.nationality)
    : null;

  return (
    <Card className="content-card hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Avatar and Jersey Number */}
          <div className="relative">
            <Avatar className="w-16 h-16 mx-auto">
              <AvatarImage src={player.profilePicture || ""} alt={`${player.firstName} ${player.lastName}`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {player.firstName[0]}{player.lastName[0]}
              </AvatarFallback>
            </Avatar>
            {player.shirtNumber && (
              <Badge className="absolute -top-1 -right-1 w-6 h-6 p-0 rounded-full bg-primary text-primary-foreground">
                {player.shirtNumber}
              </Badge>
            )}
          </div>

          {/* Name and Position */}
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              {player.firstName} {player.lastName}
            </h3>
            <Badge className={positionColor}>
              {player.position.charAt(0).toUpperCase() + player.position.slice(1)}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
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
            {player.foot && (
              <div className="text-muted-foreground">
                <span className="font-medium">Foot:</span> {player.foot}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-2 pt-2 border-t border-border">
            {player.email && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span className="truncate">{player.email}</span>
              </div>
            )}
            {nationalityCountry && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <img 
                  src={`https://flagcdn.com/w20/${nationalityCountry.code.toLowerCase()}.png`}
                  alt={`${nationalityCountry.code} flag`}
                  className="w-4 h-3 rounded-sm border border-gray-200 object-cover"
                  onError={(e) => {
                    console.log('Flag image failed to load:', nationalityCountry.code);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
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
