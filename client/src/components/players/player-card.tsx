import { format } from "date-fns";
import { Mail, Phone, Calendar, Ruler, Weight, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "@/components/ui/flag-icon";
import { countries } from "@/lib/countries";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { cn, getDisplayName } from "@/lib/utils";
import { Player } from "@shared/schema";

interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onViewProfile?: (player: Player) => void;
}

const positionColors = {
  goalkeeper: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  defender: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  midfielder: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  forward: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
};

export default function PlayerCard({ player, onEdit, onViewProfile }: PlayerCardProps) {
  const { isRtl, t } = useI18n();
  const displayName = getDisplayName(player, isRtl);
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
              <AvatarImage src={player.profilePicture || ""} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {player.firstName[0]}{player.lastName[0]}
              </AvatarFallback>
            </Avatar>
            {player.shirtNumber && (
              <Badge className="absolute -top-1 -right-1 w-6 h-6 p-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {player.shirtNumber}
              </Badge>
            )}
          </div>

          {/* Name and Position */}
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              {displayName}
            </h3>
            <Badge className={positionColor}>
              {t(`position.${player.position}`)}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {age && (
              <div className={cn("flex items-center text-muted-foreground", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                <Calendar className="w-4 h-4" />
                <span>{translateWithParams(t, "players.years", { age: String(age) })}</span>
              </div>
            )}
            {player.height && (
              <div className={cn("flex items-center text-muted-foreground", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                <Ruler className="w-4 h-4" />
                <span>{player.height}cm</span>
              </div>
            )}
            {player.weight && (
              <div className={cn("flex items-center text-muted-foreground", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                <Weight className="w-4 h-4" />
                <span>{player.weight}kg</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-2 pt-2 border-t border-border">
            {player.email && (
              <div className={cn("flex items-center justify-center text-sm text-muted-foreground", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                <Mail className="w-3 h-3" />
                <span className="truncate">{player.email}</span>
              </div>
            )}
            {nationalityCountry && (
              <div className={cn("flex items-center justify-center text-sm text-muted-foreground", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                <FlagIcon countryCode={nationalityCountry.code} size="sm" className={isRtl ? "ml-2" : "mr-2"} />
                <span>{nationalityCountry.code} - {player.nationality}</span>
              </div>
            )}
            {player.phoneNumber && (
              <div className={cn("flex items-center justify-center text-sm text-muted-foreground", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                <Phone className="w-3 h-3" />
                <span>{player.phoneNumber}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn("flex pt-2", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onViewProfile?.(player)}
            >
              {t("players.viewProfile")}
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit?.(player)}
            >
              {t("players.edit")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
