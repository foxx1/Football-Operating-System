import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  PlayerIcons, 
  ArrowIcons, 
  LineIcons, 
  EquipmentIcons 
} from "@/assets/tactical-icons";

interface TacticalToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
}

export function TacticalToolbar({ selectedTool, onToolSelect }: TacticalToolbarProps) {
  const tools = [
    { 
      category: "Players", 
      items: [
        { id: "player-red", name: "Red Player", icon: PlayerIcons.red },
        { id: "player-blue", name: "Blue Player", icon: PlayerIcons.blue },
        { id: "player-green", name: "Green Player", icon: PlayerIcons.green },
      ]
    },
    { 
      category: "Arrows", 
      items: [
        { id: "arrow-straight", name: "Straight Arrow", icon: ArrowIcons.straight },
        { id: "arrow-curved", name: "Curved Arrow", icon: ArrowIcons.curved },
        { id: "arrow-pass", name: "Pass Arrow", icon: ArrowIcons.pass },
        { id: "arrow-run", name: "Run Arrow", icon: ArrowIcons.run },
        { id: "arrow-diagonal", name: "Diagonal Arrow", icon: ArrowIcons.diagonal },
      ]
    },
    { 
      category: "Lines", 
      items: [
        { id: "line-solid", name: "Solid Line", icon: LineIcons.solid },
        { id: "line-dashed", name: "Dashed Line", icon: LineIcons.dashed },
      ]
    },
    { 
      category: "Equipment", 
      items: [
        { id: "cone", name: "Cone", icon: EquipmentIcons.cone },
        { id: "ball", name: "Ball", icon: EquipmentIcons.ball },
        { id: "flag", name: "Flag", icon: EquipmentIcons.flag },
        { id: "marker", name: "Marker", icon: EquipmentIcons.marker },
      ]
    },
  ];

  return (
    <Card className="p-4 bg-white/95 backdrop-blur-sm border shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Tactical Tools</h3>
      
      <div className="space-y-4">
        {tools.map((category, categoryIndex) => (
          <div key={category.category}>
            <h4 className="text-sm font-medium text-gray-600 mb-2">{category.category}</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {category.items.map((tool) => (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToolSelect(tool.id)}
                  className="flex items-center gap-2 h-12 justify-start"
                  title={tool.name}
                >
                  <img src={tool.icon} alt={tool.name} className="w-6 h-6" />
                  <span className="text-xs truncate">{tool.name}</span>
                </Button>
              ))}
            </div>
            {categoryIndex < tools.length - 1 && <Separator />}
          </div>
        ))}
      </div>
      
      <Separator className="my-4" />
      
      <div className="space-y-2">
        <Button
          variant={selectedTool === "select" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolSelect("select")}
          className="w-full"
        >
          Select Tool
        </Button>
        <Button
          variant={selectedTool === "erase" ? "destructive" : "outline"}
          size="sm"
          onClick={() => onToolSelect("erase")}
          className="w-full"
        >
          Erase Tool
        </Button>
      </div>
    </Card>
  );
}