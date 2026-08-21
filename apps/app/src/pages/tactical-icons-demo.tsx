import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TacticalIconsDemo() {
  const iconCategories = [
    {
      title: "Player Icons",
      icons: [
        { name: "Red Player", path: "/src/assets/tactical-icons/player-red.svg" },
        { name: "Blue Player", path: "/src/assets/tactical-icons/player-blue.svg" },
        { name: "Green Player", path: "/src/assets/tactical-icons/player-green.svg" },
      ]
    },
    {
      title: "Arrow Icons",
      icons: [
        { name: "Straight Arrow", path: "/src/assets/tactical-icons/arrow-straight.svg" },
        { name: "Curved Arrow", path: "/src/assets/tactical-icons/arrow-curved.svg" },
        { name: "Pass Arrow (Green)", path: "/src/assets/tactical-icons/arrow-pass.svg" },
        { name: "Run Arrow (Red Dashed)", path: "/src/assets/tactical-icons/arrow-run.svg" },
        { name: "Diagonal Arrow", path: "/src/assets/tactical-icons/arrow-diagonal.svg" },
      ]
    },
    {
      title: "Line Icons",
      icons: [
        { name: "Solid Line", path: "/src/assets/tactical-icons/line-solid.svg" },
        { name: "Dashed Line", path: "/src/assets/tactical-icons/line-dashed.svg" },
      ]
    },
    {
      title: "Equipment Icons",
      icons: [
        { name: "Training Cone", path: "/src/assets/tactical-icons/cone.svg" },
        { name: "Football", path: "/src/assets/tactical-icons/ball.svg" },
        { name: "Flag", path: "/src/assets/tactical-icons/flag.svg" },
        { name: "Position Marker", path: "/src/assets/tactical-icons/marker.svg" },
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Football Tactical Icons Pack</h1>
        <p className="text-gray-600 text-lg">
          A comprehensive collection of flat SVG icons designed for football tactical planning and coaching diagrams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {iconCategories.map((category) => (
          <Card key={category.title} className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {category.icons.map((icon) => (
                  <div key={icon.name} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 flex items-center justify-center mb-2 bg-white rounded-lg shadow-sm">
                      <img 
                        src={icon.path} 
                        alt={icon.name}
                        className="max-w-12 max-h-12"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center">{icon.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Player Icons</h3>
              <p className="text-gray-600">Use different colors to represent different teams or player roles. Red for home team, blue for away team, green for specific positions or movements.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Arrow Types</h3>
              <ul className="text-gray-600 space-y-1">
                <li><strong>Straight:</strong> Direct movements or passes</li>
                <li><strong>Curved:</strong> Bent runs or curved passes</li>
                <li><strong>Pass (Green):</strong> Ball movement between players</li>
                <li><strong>Run (Red Dashed):</strong> Player movement without ball</li>
                <li><strong>Diagonal:</strong> Angled movements or crosses</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Training Equipment</h3>
              <p className="text-gray-600">Cones for marking positions, balls for drill setups, flags for boundaries, and markers for key positions.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}