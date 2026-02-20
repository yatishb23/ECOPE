'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryRelationships } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Info, BarChart3 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

interface CategoryChartProps {
  data: CategoryRelationships | null;
  loading: boolean;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Helper to clean labels like "Urgency.Critical" -> "Critical"
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

export default function CategoryChart({ data, loading }: CategoryChartProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const { categoryUrgencyData, categoryStatusData, sortedCategoryData, maxCount } = useMemo(() => {
    if (!data) return { categoryUrgencyData: [], categoryStatusData: [], sortedCategoryData: [], maxCount: 0 };

    let currentMax = 0;

    const urgencyData = (data.category_urgency?.categories || []).map((category, catIdx) => {
      const dataPoint: any = { name: category };
      let rowTotal = 0;
      data.category_urgency.urgency_levels?.forEach((level, levelIdx) => {
        const val = data.category_urgency.data?.[catIdx]?.[levelIdx] || 0;
        dataPoint[level] = val;
        rowTotal += val;
      });
      if (rowTotal > currentMax) currentMax = rowTotal;
      return dataPoint;
    });

    const statusData = (data.category_status?.categories || []).map((category, catIdx) => {
      const dataPoint: any = { name: category };
      data.category_status.statuses?.forEach((status, statusIdx) => {
        dataPoint[status] = data.category_status.data?.[catIdx]?.[statusIdx] || 0;
      });
      return dataPoint;
    });

    const overviewData = (data.category_urgency?.categories || []).map((category, index) => {
      const total = data.category_urgency.data?.[index]?.reduce((sum, val) => sum + val, 0) || 0;
      return { name: category, count: total };
    }).sort((a, b) => b.count - a.count);

    return { 
      categoryUrgencyData: urgencyData, 
      categoryStatusData: statusData, 
      sortedCategoryData: overviewData,
      maxCount: currentMax 
    };
  }, [data]);

  const yAxisTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= maxCount + 1; i++) {
      ticks.push(i);
    }
    return ticks;
  }, [maxCount]);

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Complaint Categories
            </CardTitle>
            <CardDescription>Cleaned labels for better readability</CardDescription>
          </div>
          <div className="rounded-full bg-muted p-2">
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="by-urgency">By Urgency</TabsTrigger>
            <TabsTrigger value="by-status">By Status</TabsTrigger>
          </TabsList>
          
          <div className="h-[400px] w-full mt-4">
            <TabsContent value="overview" className="h-full m-0 outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedCategoryData} margin={{ top: 10, right: 10, left: -25, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11 }} height={80} axisLine={false} />
                  <YAxis ticks={yAxisTicks} allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={45}>
                    {sortedCategoryData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={activeCategory === null || activeCategory === index ? 1 : 0.3}
                        onMouseEnter={() => setActiveCategory(index)}
                        onMouseLeave={() => setActiveCategory(null)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="by-urgency" className="h-full m-0 outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryUrgencyData} margin={{ top: 10, right: 10, left: -25, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11 }} height={80} axisLine={false} />
                  <YAxis ticks={yAxisTicks} allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    formatter={formatLabel} // Legend label cleanup
                    wrapperStyle={{ paddingBottom: '20px' }} 
                  />
                  {data?.category_urgency?.urgency_levels?.map((level, index) => (
                    <Bar 
                      barSize={45}
                      key={level} 
                      dataKey={level} 
                      name={level} // The formatLabel helper handles this in Tooltip
                      stackId="a" 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="by-status" className="h-full m-0 outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStatusData} margin={{ top: 10, right: 10, left: -25, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11 }} height={80} axisLine={false} />
                  <YAxis ticks={yAxisTicks} allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    formatter={formatLabel} // Legend label cleanup
                    wrapperStyle={{ paddingBottom: '20px' }} 
                  />
                  {data?.category_status?.statuses?.map((status, index) => (
                    <Bar 
                      barSize={45}
                      key={status} 
                      dataKey={status} 
                      name={status}
                      stackId="a" 
                      fill={COLORS[index % COLORS.length]} 
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