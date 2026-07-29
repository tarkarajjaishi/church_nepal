"use client";

import { Card, CardContent } from "@/components/ui/card";

// Helper function to generate sample data
const generateSampleData = () => {
  const data = [];
  // Generate 12 months of signups
  for (let i = 0; i < 12; i++) {
    const row = { cohort: `Month ${i+1}`, values: [] as number[] };
    // For each cohort, calculate retention for up to 12 months since signup
    for (let j = 0; j < 12; j++) {
      if (j === 0) {
        // Month 0 always has 100% retention
        row.values.push(100);
      } else if (j > i) {
        // No data for future months beyond current cohort
        row.values.push(-1); // -1 indicates no data
      } else {
        // Simulate decay: retention decreases over time
        let baseRetention = 100 * Math.pow(0.9, j);
        // Add some randomness
        const randomFactor = 0.85 + Math.random() * 0.3;
        const retention = Math.min(100, Math.max(0, baseRetention * randomFactor));
        row.values.push(Number(retention.toFixed(1)));
      }
    }
    data.push(row);
  }
  return data;
};

const RetentionHeatmap = () => {
  const data = generateSampleData();
  const monthsSinceSignup = Array.from({ length: 12 }, (_, i) => `M+${i}`);

  // Calculate min and max values for color scaling
  const allValues = data.flatMap(row => row.values.filter(v => v >= 0));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // Function to get color based on retention percentage
  const getColorClass = (value: number) => {
    if (value < 0) return 'bg-[var(--panel-2)]'; // No data
    const ratio = (value - minValue) / (maxValue - minValue || 1);
    // Scale from light teal (low) to dark teal (high)
    const intensity = Math.floor(ratio * 9); // 0 to 9 scale
    const colorMap = [
      'bg-[color:from-hsl(var(--accent-hue)_var(--accent-saturation)_calc(var(--accent-lightness)_+_15%))]',
      'bg-[color:from-hsl(var(--accent-hue)_var(--accent-saturation)_calc(var(--accent-lightness)_+_12%))]',
      'bg-[color:from-hsl(var(--accent-hue)_var(--accent-saturation)_calc(var(--accent-lightness)_+_10%))]',
      'bg-[color:from-hsl(var(--accent-hue)_var(--accent-saturation)_calc(var(--accent-lightness)_+_7%))]',
      'bg-[color:from-hsl(var(--accent-hue)_var(--accent-saturation)_calc(var(--accent-lightness)_+_4%))]',
      'bg-[color:from-hsl(var(--accent-hue)_var(--accent-saturation)_calc(var(--accent-lightness)_+_2%))]',
      'bg-[color:from-hsl(var(--accent-hue)_var(--accent-saturation)_var(--accent-lightness))]',
      'bg-[color:from-hsl(var(--accent-hue)_var(--accent-saturation)_calc(var(--accent-lightness)_-_2%))]',
      'bg-[color:from-hsl(var(--accent-hue)_var(--accent-saturation)_calc(var(--accent-lightness)_-_5%))]',
      'bg-[color:from-hsl(var(--accent-hue)_var(--accent-saturation)_calc(var(--accent-lightness)_-_8%))]',
    ];
    return colorMap[Math.min(intensity, 9)];
  };

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-[var(--text-strong)] font-medium border-b border-[var(--border-soft)]">Cohort</th>
                {monthsSinceSignup.map((month, idx) => (
                  <th key={idx} className="p-2 text-center text-[var(--text-strong)] font-medium border-b border-[var(--border-soft)] text-xs md:text-sm">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-[var(--panel-2)]' : ''}>
                  <td className="p-2 text-[var(--text)] font-medium border-r border-[var(--border-soft)] text-xs md:text-sm">
                    {row.cohort}
                  </td>
                  {row.values.map((value, colIndex) => (
                    <td 
                      key={`${rowIndex}-${colIndex}`} 
                      className={`p-1 h-8 w-8 md:h-10 md:w-10 text-center align-middle ${value < 0 ? 'cursor-not-allowed' : 'cursor-default'}`}
                    >
                      <div 
                        className={`h-full w-full flex items-center justify-center rounded-sm ${getColorClass(value)} ${
                          value >= 0 ? 'hover:opacity-80 transition-opacity' : ''
                        }`}
                        title={value < 0 ? 'No data' : `${value}% retained after ${colIndex} months`}
                      >
                        {value >= 0 && (
                          <span className="text-xs font-medium text-[var(--text-strong)]">
                            {value >= 10 ? Math.round(value) : ''}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <p className="text-[var(--text)] text-xs mb-2">Legend: Color intensity represents retention percentage</p>
          <div className="flex items-center gap-1">
            <div className="text-[var(--text)] text-xs mr-2">Low</div>
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 ${getColorClass(minValue + (maxValue - minValue) * (i / 4))}`}
              />
            ))}
            <div className="text-[var(--text)] text-xs ml-2">High</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RetentionHeatmap;
