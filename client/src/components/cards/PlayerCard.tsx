import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal, 
  Star, 
  MapPin, 
  Calendar,
  Phone,
  Mail,
  Heart,
  Activity,
  Award
} from "lucide-react";
import { Player } from "@shared/schema";
import { motion } from "framer-motion";

interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  isHovered?: boolean;
  onEdit: (player: Player) => void;
  onDelete: (playerId: number) => void;
  onPreview: (player: Player) => void;
  onSelect: (player: Player) => void;
  getPositionColor: (position: string) => string;
}

export default function PlayerCard({
  player,
  isSelected = false,
  isHovered = false,
  onEdit,
  onDelete,
  onPreview,
  onSelect,
  getPositionColor
}: PlayerCardProps) {
  const [isCardHovered, setIsCardHovered] = useState(false);

  const age = new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card 
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-300 group
          ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
          ${isCardHovered ? 'shadow-xl transform-gpu' : 'hover:shadow-lg'}
          ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
        `}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
        onClick={() => onSelect(player)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
        )}

        {/* Hover overlay */}
        <motion.div
          className={`
            absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none
            ${isCardHovered ? 'opacity-100' : 'opacity-0'}
          `}
          initial={{ opacity: 0 }}
          animate={{ opacity: isCardHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        <CardContent className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-white/10">
                  <AvatarImage 
                    src={player.profilePicture || undefined}
                    alt={`${player.firstName} ${player.lastName}`}
                    className="object-cover object-center"
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {player.firstName[0]}{player.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Status indicator */}
                <div className={`
                  absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                  ${player.isActive ? 'bg-green-500' : 'bg-gray-400'}
                `} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                  {player.firstName} {player.lastName}
                </h3>
                <div className="flex items-center gap-2">
                  {player.shirtNumber && (
                    <span className="text-sm text-muted-foreground">#{player.shirtNumber}</span>
                  )}
                  <Badge className={getPositionColor(player.position)}>
                    {player.position}
                  </Badge>
                </div>
              </div>
            </div>


          </div>

          {/* Basic info */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{age} years old</span>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{player.nationality}</span>
            </div>
            
            {player.height && player.weight && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Activity className="w-4 h-4 mr-2" />
                <span>{player.height}cm • {player.weight}kg</span>
              </div>
            )}
          </div>

          {/* Phone number - always visible */}
          {player.phoneNumber && (
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <Phone className="w-4 h-4 mr-2" />
              <span>{player.phoneNumber}</span>
            </div>
          )}

          {/* Action buttons */}
          <motion.div
            className="flex space-x-2 mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: isCardHovered ? 1 : 0, 
              y: isCardHovered ? 0 : 10 
            }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(player);
              }}
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(player);
              }}
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete ${player.firstName} ${player.lastName}?`)) {
                  onDelete(player.id);
                }
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </motion.div>
        </CardContent>

        {/* Favorite/Star indicator */}
        <motion.div
          className="absolute top-3 right-3"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: isSelected ? 1 : 0, 
            scale: isSelected ? 1 : 0 
          }}
          transition={{ duration: 0.2 }}
        >
          <Star className="w-5 h-5 text-yellow-500 fill-current" />
        </motion.div>
      </Card>
    </motion.div>
  );
}