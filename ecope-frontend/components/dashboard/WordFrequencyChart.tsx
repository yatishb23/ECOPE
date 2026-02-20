'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WordFrequency } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useState, useMemo } from 'react';
import { CloudIcon, MessageSquare } from 'lucide-react';

interface WordFrequencyChartProps {
  data: WordFrequency[] | null;
  loading: boolean;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e'];
const formatLabel = (value: string) => {
  if (typeof value !== 'string') return value;
  return value.includes('.') ? value.split('.').pop() : value;
};
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-border shadow-xl rounded-lg p-3 min-w-[160px]">
        <p className="text-sm font-bold mb-2 text-slate-900 dark:text-slate-100 border-b pb-1">
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color || entry.fill }} 
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {formatLabel(entry.name)}:
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function WordFrequencyChart({ data, loading }: WordFrequencyChartProps) {
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  // Memoized stats for Y-axis and Word Cloud sizing
  const { sortedData, minCount, maxCount, range } = useMemo(() => {
    if (!data || data.length === 0) return { sortedData: [], minCount: 0, maxCount: 0, range: 0 };
    
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const min = Math.min(...data.map(d => d.count));
    const max = Math.max(...data.map(d => d.count));
    
    return { sortedData: sorted, minCount: min, maxCount: max, range: max - min || 1 };
  }, [data]);

  const yAxisTicks = useMemo(() => {
    const ticks = [];
    const step = maxCount > 10 ? Math.ceil(maxCount / 10) : 1;
    for (let i = 0; i <= maxCount + step; i += step) ticks.push(i);
    return ticks;
  }, [maxCount]);

  if (loading) return <Skeleton className="h-[500px] w-full rounded-xl" />;

  if (!data || data.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground italic">No keywords extracted yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Keyword Analysis
            </CardTitle>
            <CardDescription>Most recurring themes found in text data</CardDescription>
          </div>
          <div className="rounded-full bg-primary/10 p-2">
            <CloudIcon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="bar">Bar Analysis</TabsTrigger>
            <TabsTrigger value="pie">Distribution</TabsTrigger>
            <TabsTrigger value="cloud">Word Cloud</TabsTrigger>
          </TabsList>
          
          <div className="h-[400px] w-full mt-6">
            {/* --- Bar Chart View --- */}
            <TabsContent value="bar" className="h-full m-0 outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedData.slice(0, 15)}
                  margin={{ top: 10, right: 20, left: -25, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis 
                    dataKey="word" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0} 
                    tick={{ fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                  />
                  <YAxis ticks={yAxisTicks} allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                    {sortedData.slice(0, 15).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={activeWordIndex === null || activeWordIndex === index ? 1 : 0.3}
                        onMouseEnter={() => setActiveWordIndex(index)}
                        onMouseLeave={() => setActiveWordIndex(null)}
                        className="transition-all duration-300"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            {/* --- Pie Chart View --- */}
            <TabsContent value="pie" className="h-full m-0 outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={sortedData.slice(0, 10)}
                    dataKey="count"
                    nameKey="word"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={130}
                    paddingAngle={5}
                    label={({ word, percent }) => `${word} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {sortedData.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>
            
            {/* --- Word Cloud View --- */}
            <TabsContent value="cloud" className="h-full m-0 outline-none overflow-auto">
              <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 p-8 min-h-full">
                {sortedData.slice(0, 30).map((item, index) => {
                  const sizeRatio = (item.count - minCount) / range;
                  const fontSize = 0.9 + sizeRatio * 1.8; // 0.9rem to 2.7rem
                  
                  return (
                    <div
                      key={index}
                      className="cursor-default select-none transition-all duration-300 hover:scale-125 hover:rotate-2 filter drop-shadow-sm"
                      style={{ 
                        fontSize: `${fontSize}rem`,
                        fontWeight: item.count > (maxCount * 0.7) ? '800' : '600',
                        color: COLORS[index % COLORS.length],
                        opacity: 0.6 + (sizeRatio * 0.4)
                      }}
                      title={`${item.count} mentions`}
                    >
                      {item.word}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}