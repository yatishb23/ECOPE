"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { User, Complaint } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  RefreshCw,
  Calendar,
  ChevronRight,
  LayoutGrid,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TeamWorkloadPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, cRes] = await Promise.all([
        api.get<User[]>("/api/v1/users"),
        api.get<{ items: Complaint[] }>("/api/v1/complaints?limit=1000")
      ]);
      const support = uRes.data.filter(u => u.role === "support" && u.is_active);
      setUsers(support);
      setComplaints(cRes.data.items);
      if (support.length > 0 && !selectedUserId) setSelectedUserId(support[0].id.toString());
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Data sync failed", err);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedUser = useMemo(() => users.find(u => u.id === Number(selectedUserId)), [users, selectedUserId]);
  const userTasks = useMemo(() => complaints.filter(c => c.assigned_to === selectedUser?.email), [complaints, selectedUser]);
  const unassignedTasks = useMemo(() => complaints.filter(c => !c.assigned_to), [complaints]);

  if (loading && users.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-white">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400 dark:text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-neutral-100 p-6 lg:p-10 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-700 transition-colors duration-500">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white mb-2">Team <span className="font-semibold text-primary dark:text-white">Operations</span></h1>
          <div className="flex items-center gap-3 text-slate-500 dark:text-neutral-500 text-sm">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-500" /> Secure Environment</span>
            <span>•</span>
            <span>Last Sync: {lastRefreshed.toLocaleTimeString()}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchData} 
          className="bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded-full px-6 shadow-sm"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Sync Engine
        </Button>
      </div>

      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Horizontal Member Selector */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-neutral-500">Support Personnel</h2>
            <Badge variant="outline" className="border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-500 font-mono text-[10px]">
              {users.length} Active Agents
            </Badge>
          </div>
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex space-x-4">
              {users.map((user) => {
                const count = complaints.filter(c => c.assigned_to === user.email).length;
                const isActive = selectedUserId === user.id.toString();
                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id.toString())}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 min-w-[240px] text-left group",
                      isActive 
                        ? "bg-white dark:bg-neutral-800 border-primary/20 dark:border-neutral-700 shadow-md dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]" 
                        : "bg-slate-200/50 dark:bg-neutral-900/40 border-transparent dark:border-neutral-900 hover:border-slate-300 dark:hover:border-neutral-800"
                    )}
                  >
                    <Avatar className="h-12 w-12 border-2 border-white dark:border-neutral-800 shadow-sm">
                      <AvatarImage src={`https://api.dicebear.com/7.x/neutral/svg?seed=${user.email}`} />
                      <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className={cn("text-sm font-semibold truncate", isActive ? "text-primary dark:text-white" : "text-slate-700 dark:text-neutral-400")}>
                        {user.full_name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-600 truncate mb-1">{user.email}</p>
                      <div className="flex items-center gap-2">
                         <div className={cn("h-1 w-full bg-slate-300 dark:bg-neutral-800 rounded-full overflow-hidden")}>
                            <div 
                              className="h-full bg-primary dark:bg-neutral-600" 
                              style={{ width: `${Math.min((count / 15) * 100, 100)}%` }} 
                            />
                         </div>
                         <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500">{count}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* Focused Workload View */}
        {selectedUser && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Agent Sidebar Stats */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white rounded-3xl overflow-hidden shadow-sm dark:shadow-none ring-1 ring-slate-200 dark:ring-neutral-800">
                <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-neutral-800 dark:to-neutral-900" />
                <CardContent className="-mt-12 text-center pb-8">
                  <Avatar className="h-20 w-20 mx-auto border-4 border-white dark:border-[#0a0a0a] mb-4 shadow-lg">
                    <AvatarImage src={`https://api.dicebear.com/7.x/neutral/svg?seed=${selectedUser.email}`} />
                  </Avatar>
                  <h3 className="text-xl font-bold">{selectedUser.full_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 mb-6 uppercase tracking-widest">{selectedUser.role}</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl border border-slate-100 dark:border-none">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase">Tasks</p>
                      <p className="text-lg font-bold text-primary dark:text-white">{userTasks.length}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl border border-slate-100 dark:border-none">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase">Load</p>
                      <p className="text-lg font-bold text-primary dark:text-white">{(userTasks.length / 10 * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 bg-white/50 dark:bg-neutral-900/30 rounded-3xl border border-slate-200 dark:border-neutral-800/50 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 dark:text-neutral-600 uppercase mb-4 flex items-center gap-2">
                  <LayoutGrid className="h-3 w-3 text-primary" /> System Backlog
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-neutral-500">Unassigned</span>
                    <span className="text-red-600 dark:text-red-500 font-mono font-bold">{unassignedTasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-neutral-500">Critical Priority</span>
                    <span className="text-slate-900 dark:text-white font-mono font-semibold">{complaints.filter(c => c.urgency === 'Critical').length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Feed */}
            <div className="lg:col-span-9">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  Active Queue <ChevronRight className="h-4 w-4 text-slate-300 dark:text-neutral-700" />
                </h2>
                <div className="flex gap-2">
                  <Badge className="bg-primary/10 text-primary dark:bg-neutral-800 dark:text-neutral-400 hover:bg-primary/20 dark:hover:bg-neutral-800 border-none">Recent</Badge>
                  <Badge variant="outline" className="border-slate-200 dark:border-neutral-800 text-slate-400 dark:text-neutral-600">Archived</Badge>
                </div>
              </div>

              <ScrollArea className="h-[600px] pr-4">
                {userTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-neutral-700 border-2 border-dashed border-slate-200 dark:border-neutral-900 rounded-3xl">
                    <Briefcase className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm">No tasks allocated to this agent</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Complaint }) {
  const urgencyStyles: any = {
    Critical: "bg-red-500/10 text-red-600 dark:text-red-500 border-red-200 dark:border-red-500/20",
    High: "bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-200 dark:border-orange-500/20",
    Medium: "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700",
    Low: "bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500 border-slate-200 dark:border-neutral-700",
  };

  return (
    <Card className="bg-white dark:bg-neutral-900/50 border-slate-200 dark:border-neutral-800 group hover:shadow-md dark:hover:bg-neutral-800/40 transition-all duration-300 rounded-2xl overflow-hidden border dark:border-none ring-slate-200/50 dark:ring-neutral-800/50">
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
        <Badge className={cn("text-[9px] font-bold uppercase tracking-wider h-5 border shadow-none", urgencyStyles[task.urgency || 'Low'])}>
          {task.urgency}
        </Badge>
        <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-700 italic">ID: {task.id.toString().slice(-5)}</span>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed line-clamp-2 mb-4 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
          {task.complaint_text}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase">
            <Clock className="h-3 w-3" />
            {new Date(task.created_at).toLocaleDateString()}
          </div>
          <Badge variant="secondary" className="bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500 text-[9px] rounded-md h-5 border-none">
            {task.category || "General"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}