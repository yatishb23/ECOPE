'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeTrends } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Info, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface TimeSeriesChartProps {
  data: TimeTrends | null;
  loading: boolean;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

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

export default function TimeSeriesChart({ data, loading }: TimeSeriesChartProps) {
  const { dailyData, monthlyData, maxCount, categories } = useMemo(() => {
    if (!data) return { dailyData: [], monthlyData: [], maxCount: 0, categories: [] };

    let currentMax = 0;
    const cats = data.categories || [];

    const dData = (data.daily_counts?.dates || []).map((date, index) => {
      const count = data.daily_counts.counts[index] || 0;
      if (count > currentMax) currentMax = count;
      return { date, count };
    });

    const mData = (data.monthly_by_category || []).map(item => {
      let rowTotal = 0;
      cats.forEach(cat => {
        rowTotal += (item[cat] as number) || 0;
      });
      if (rowTotal > currentMax) currentMax = rowTotal;
      return item;
    });

    return { dailyData: dData, monthlyData: mData, maxCount: currentMax, categories: cats };
  }, [data]);

  const yAxisTicks = useMemo(() => {
    const ticks = [];
    const step = maxCount > 10 ? Math.ceil(maxCount / 10) : 1;
    for (let i = 0; i <= maxCount + step; i += step) {
      ticks.push(i);
    }
    return ticks;
  }, [maxCount]);

  if (loading) return <Skeleton className="h-[550px] w-full rounded-xl" />;

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trends & Analysis
            </CardTitle>
            <CardDescription>Comprehensive view of activity volume</CardDescription>
          </div>
          <div className="rounded-full bg-muted p-2">
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="by-category" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
          </TabsList>
          
          {/* Increased container height to 500px for a "Larger" look */}
          <div className="h-[500px] w-full mt-6">
            <TabsContent value="monthly" className="h-full m-0 outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: -20, bottom: 60 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 11 }} axisLine={false} />
                  <YAxis ticks={yAxisTicks} allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey={(d) => categories.reduce((acc, cat) => acc + (d[cat] as number || 0), 0)} stroke="#6366f1" fill="url(#colorCount)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="daily" className="h-full m-0 outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 10, right: 20, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" interval="preserveEnd" height={80} tick={{ fontSize: 10 }} axisLine={false} />
                  <YAxis ticks={yAxisTicks} allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            {/* --- LARGER BY CATEGORY CHART --- */}
            <TabsContent value="by-category" className="h-full m-0 outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} />
                  <YAxis ticks={yAxisTicks} allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} />
                  
                  {/* Tooltip background removed as requested */}
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  
                  <Legend verticalAlign="top" align="right" iconType="circle" formatter={formatLabel} wrapperStyle={{ paddingBottom: '30px' }} />
                  
                  {categories.map((cat, index) => (
                    <Bar 
                      key={cat} 
                      dataKey={cat} 
                      name={cat}
                      stackId="a" 
                      fill={COLORS[index % COLORS.length]} 
                      // Increased barSize for a more substantial look
                      barSize={60} 
                      radius={index === categories.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}