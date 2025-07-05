// Test component to verify flag display
export function FlagTest() {
  return (
    <div className="p-4 space-y-2 border rounded-lg">
      <h3 className="font-semibold">Flag Test:</h3>
      <div className="flex items-center gap-2">
        <span className="text-xl">🇺🇸</span>
        <span>United States</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl">🇧🇭</span>
        <span>Bahrain</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl">🇸🇦</span>
        <span>Saudi Arabia</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl">🇦🇪</span>
        <span>UAE</span>
      </div>
    </div>
  );
}