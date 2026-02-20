// app/complaints/page.tsx
"use client";

import { useState } from "react";
import { useComplaints } from "@/hooks/use-complaints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X, Loader2, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NewComplaintDialog } from "@/components/complaints/NewComplaintDialog";
import { EditComplaintDialog } from "@/components/complaints/EditComplaintDialog"; // Assume similar extraction
import {
  Complaint,
  ComplaintCategory,
  ComplaintUrgency,
  ComplaintStatus,
} from "@/types";

const CATEGORIES = [
  "Employee Experience",
  "Facilities",
  "Finance",
  "HR / Payroll",
  "HR / Workplace Culture",
  "Health & Safety",
  "IT Support",
  "Management",
  "Office Supplies",
  "Security",
  "Workplace Culture",
  "Other",
];
const URGENCIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export default function ComplaintsPage() {
  const {
    complaints,
    loading,
    error,
    totalComplaints,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    filters,
    setFilters,
    fetchComplaints,
    currentUser
  } = useComplaints();

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );

  const getUrgencyColor = (u: string | null) => {
    const colors: any = {
      Critical: "bg-red-500",
      High: "bg-orange-500",
      Medium: "bg-yellow-500",
      Low: "bg-green-500",
    };
    return colors[u || ""] || "bg-gray-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-500";
      case "In Progress":
        return "bg-yellow-500";
      case "Resolved":
        return "bg-green-500";
      case "Closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // Helper function to get role-specific page description
  const getRoleDescription = () => {
    if (!currentUser) return "Manage and track complaints";
    
    switch (currentUser.role) {
      case 'employee':
        return "View and manage your submitted complaints";
      case 'support':
        return "Manage complaints assigned to you and your own submissions";
      case 'admin':
        return "Manage and track all system complaints";
      default:
        return "Manage and track complaints";
    }
  };

  // Helper function to get role-specific empty state message
  const getRoleEmptyMessage = () => {
    if (!currentUser) return "No complaints found";
    
    switch (currentUser.role) {
      case 'employee':
        return "You haven't submitted any complaints yet";
      case 'support':
        return "No complaints assigned to you or submitted by you";
      case 'admin':
        return "No complaints found in the system";
      default:
        return "No complaints found";
    }
  };

  // Helper function to get role-specific empty state description
  const getRoleEmptyDescription = () => {
    if (!currentUser) return "Try changing your search criteria or create a new complaint.";
    
    switch (currentUser.role) {
      case 'employee':
        return "Submit your first complaint using the button below to get started.";
      case 'support':
        return "Complaints will appear here when they are assigned to you or when you submit your own.";
      case 'admin':
        return "Complaints from all users will appear here. Try changing your search criteria or create a new complaint.";
      default:
        return "Try changing your search criteria or create a new complaint.";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complaints</h1>
          <p className="text-muted-foreground">
            {getRoleDescription()}
          </p>
          {currentUser && currentUser.role !== 'admin' && (
            <div className="mt-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  currentUser.role === 'employee' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  currentUser.role === 'support' ? 'bg-green-50 text-green-700 border-green-200' :
                  'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                {currentUser.role === 'employee' ? '👤 Employee View - Your Complaints' :
                 currentUser.role === 'support' ? '🎧 Support View - Assigned & Your Complaints' :
                 'Role-based View'}
              </Badge>
            </div>
          )}
        </div>
        <Button onClick={() => setIsNewOpen(true)} className="bg-indigo-600">
          <Plus className="mr-2 h-4 w-4" /> 
          {currentUser?.role === 'employee' ? 'Submit New Complaint' : 'New Complaint'}
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border rounded-lg p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <Select
          value={filters.category || "all"}
          onValueChange={(v) =>
            setFilters({
              ...filters,
              category: v === "all" ? null : (v as any),
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={(v) =>
            setFilters({ ...filters, status: v === "all" ? null : (v as any) })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() =>
            setFilters({
              category: null,
              urgency: null,
              status: null,
              search: "",
            })
          }
        >
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>

      {/* Table Section */}
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Complaint</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Loader2 className="animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-muted-foreground">
                        {getRoleEmptyMessage()}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {getRoleEmptyDescription()}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="max-w-xs truncate font-medium">
                    {c.complaint_text}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.category || "Unset"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getUrgencyColor(c.urgency)} text-white`}
                    >
                      {c.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(c.status)} text-white`}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedComplaint(c)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-t gap-4">
          <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md">
            Showing{" "}
            <span className="font-medium text-foreground">
              {complaints.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, totalComplaints)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {totalComplaints}
            </span>{" "}
            complaints
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] h-9 bg-background">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md overflow-hidden bg-background">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-none h-9 border-r"
              >
                Previous
              </Button>

              <div className="flex items-center text-sm px-4 border-r h-9 bg-muted/20">
                <span className="text-muted-foreground mr-1">Page</span>
                <span className="font-medium">{currentPage}</span>
                <span className="text-muted-foreground mx-1">of</span>
                <span className="font-medium">
                  {Math.ceil(totalComplaints / pageSize)}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(totalComplaints / pageSize)),
                  )
                }
                disabled={currentPage >= Math.ceil(totalComplaints / pageSize)}
                className="rounded-none h-9"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <NewComplaintDialog
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
        onSuccess={fetchComplaints}
      />

      {selectedComplaint && (
        <EditComplaintDialog
          complaint={selectedComplaint}
          open={!!selectedComplaint}
          onOpenChange={(open) => !open && setSelectedComplaint(null)}
          onSuccess={fetchComplaints}
        />
      )}
    </div>
  );
}
