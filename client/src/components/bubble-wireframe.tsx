import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BubbleTacticalBoardWireframe() {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Bubble.io Football Tactical Board - Wireframe Design
      </h1>
      
      {/* Main Layout */}
      <Card className="shadow-lg">
        <CardHeader className="bg-green-600 text-white">
          <CardTitle className="text-center">Tactical Board Layout</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          
          {/* Top Toolbar */}
          <div className="bg-gray-800 text-white p-4 flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <select className="bg-gray-700 text-white px-3 py-2 rounded border">
                <option>Formation: 4-4-2</option>
                <option>Formation: 4-3-3</option>
                <option>Formation: 3-5-2</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                📏 Line
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                ➡️ Arrow
              </Button>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                💾 Save
              </Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                🔗 Share
              </Button>
            </div>
          </div>

          {/* Main Pitch Area */}
          <div className="p-6 bg-gradient-to-b from-green-400 to-green-500 relative">
            <div className="bg-green-600 rounded-lg p-8 relative overflow-hidden border-4 border-white" style={{aspectRatio: '105/68'}}>
              
              {/* Pitch Markings Simulation */}
              <div className="absolute inset-0 opacity-30">
                {/* Center Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white transform -translate-x-0.5"></div>
                {/* Center Circle */}
                <div className="absolute left-1/2 top-1/2 w-20 h-20 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                {/* Penalty Areas */}
                <div className="absolute left-0 top-1/2 w-16 h-32 border-2 border-white transform -translate-y-1/2"></div>
                <div className="absolute right-0 top-1/2 w-16 h-32 border-2 border-white transform -translate-y-1/2"></div>
              </div>

              {/* Home Team Players (Red) */}
              <div className="absolute left-8 bottom-4">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">1</div>
              </div>
              <div className="absolute left-16 bottom-16">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">2</div>
              </div>
              <div className="absolute left-8 bottom-16">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">3</div>
              </div>
              <div className="absolute left-24 bottom-16">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">4</div>
              </div>
              <div className="absolute left-4 bottom-16">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">5</div>
              </div>
              
              {/* Midfield */}
              <div className="absolute left-6 bottom-32">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">6</div>
              </div>
              <div className="absolute left-12 bottom-28">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">7</div>
              </div>
              <div className="absolute left-20 bottom-28">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">8</div>
              </div>
              <div className="absolute left-26 bottom-32">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">9</div>
              </div>
              
              {/* Forward */}
              <div className="absolute left-10 bottom-44">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">10</div>
              </div>
              <div className="absolute left-18 bottom-44">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">11</div>
              </div>

              {/* Away Team Players (Blue) */}
              <div className="absolute right-8 top-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">1</div>
              </div>
              <div className="absolute right-16 top-16">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">2</div>
              </div>
              <div className="absolute right-8 top-16">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">3</div>
              </div>
              <div className="absolute right-24 top-16">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">4</div>
              </div>
              <div className="absolute right-4 top-16">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">5</div>
              </div>
              
              {/* Midfield */}
              <div className="absolute right-6 top-32">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">6</div>
              </div>
              <div className="absolute right-12 top-28">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">7</div>
              </div>
              <div className="absolute right-20 top-28">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">8</div>
              </div>
              <div className="absolute right-26 top-32">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">9</div>
              </div>
              
              {/* Forward */}
              <div className="absolute right-10 top-44">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">10</div>
              </div>
              <div className="absolute right-18 top-44">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg cursor-move">11</div>
              </div>

              {/* Sample Tactical Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Pass Arrow */}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                          refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="lime" />
                  </marker>
                </defs>
                <line x1="15%" y1="70%" x2="35%" y2="50%" 
                      stroke="lime" strokeWidth="3" markerEnd="url(#arrowhead)" />
                
                {/* Movement Line */}
                <line x1="65%" y1="30%" x2="85%" y2="50%" 
                      stroke="red" strokeWidth="2" strokeDasharray="5,5" />
              </svg>
            </div>
          </div>

          {/* Bottom Panel */}
          <div className="bg-gray-100 p-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              
              {/* Instructions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Instructions</CardTitle>
                </CardHeader>
                <CardContent className="text-xs">
                  <ul className="space-y-1">
                    <li>• Drag players to reposition</li>
                    <li>• Select formation from dropdown</li>
                    <li>• Use drawing tools for tactics</li>
                    <li>• Save and share your setups</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Team Colors</CardTitle>
                </CardHeader>
                <CardContent className="text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full border border-white"></div>
                    <span>Home Team</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border border-white"></div>
                    <span>Away Team</span>
                  </div>
                </CardContent>
              </Card>

              {/* Drawing Tools */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Drawing Tools</CardTitle>
                </CardHeader>
                <CardContent className="text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-lime-500"></div>
                      <span>Pass (Green)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-red-500 border-dashed border-t-2 border-red-500"></div>
                      <span>Run (Red Dashed)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Specifications */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bubble.io Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <strong>Main Container:</strong> Group element with football pitch background
              </div>
              <div className="bg-green-50 p-3 rounded">
                <strong>Players:</strong> Repeating group with draggable plugin
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <strong>Drawing:</strong> FabricJS Canvas plugin for tactical lines
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <strong>Formations:</strong> Dropdown with preset position data
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Drag & drop player positioning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Formation quick-switching</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Tactical line & arrow drawing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Save & share tactical setups</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Responsive mobile design</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>TacticalPad-style clean layout</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}