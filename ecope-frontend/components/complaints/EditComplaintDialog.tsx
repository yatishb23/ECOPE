"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Save,
  Trash,
  FileText,
  MessageSquare,
} from "lucide-react";
import api from "@/lib/api";
import { showToast } from "@/lib/toast";
import { Complaint, ApiError } from "@/types";

interface Props {
  complaint: Complaint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Employee Experience", "Facilities", "Finance", "HR / Payroll",
  "HR / Workplace Culture", "Health & Safety", "IT Support",
  "Management", "Office Supplies", "Security", "Workplace Culture", "Other"
];
const URGENCIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export function EditComplaintDialog({ complaint, open, onOpenChange, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Local form state
  const [formData, setFormData] = useState({
    complaint_text: "",
    category: "",
    urgency: "",
    status: "",
    assigned_to: "",
    response: "",
  });

  // Sync props to state when dialog opens or complaint changes
  useEffect(() => {
    if (complaint) {
      setFormData({
        complaint_text: complaint.complaint_text || "",
        category: complaint.category || "",
        urgency: complaint.urgency || "",
        status: complaint.status || "Open",
        assigned_to: complaint.assigned_to || "",
        response: complaint.response || "",
      });
    }
  }, [complaint]);

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);
      await api.put(`/api/v1/complaints/${complaint.id}`, {
        ...formData,
        category: formData.category || null,
        urgency: formData.urgency || null,
        assigned_to: formData.assigned_to || null,
        response: formData.response || null,
      });

      showToast("success", "Updated", "Complaint updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const apiError = error as ApiError;
      showToast("error", "Update Failed", apiError.message || "Could not save changes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await api.delete(`/api/v1/complaints/${complaint.id}`);
      showToast("success", "Deleted", "Complaint removed from system");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      showToast("error", "Delete Failed", "Could not remove complaint");
    } finally {
      setIsSubmitting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
            <DialogDescription>View and update complaint information.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" /> Details
              </TabsTrigger>
              <TabsTrigger value="response">
                <MessageSquare className="h-4 w-4 mr-2" /> Response
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid gap-2">
                <Label>Complaint Text</Label>
                <Textarea
                  value={formData.complaint_text}
                  onChange={(e) => setFormData({ ...formData, complaint_text: e.target.value })}
                  className="min-h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({...formData, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select 
                    value={formData.urgency} 
                    onValueChange={(v) => setFormData({...formData, urgency: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      {URGENCIES.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v) => setFormData({...formData, status: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Input
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    placeholder="Staff name..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="response" className="space-y-4">
              <div className="grid gap-2">
                <Label>Official Response</Label>
                <Textarea
                  placeholder="Enter response to this complaint..."
                  value={formData.response}
                  onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                  className="min-h-32"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="mr-auto text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash className="h-4 w-4 mr-2" /> Delete
            </Button>
            
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={isSubmitting} className="bg-indigo-600">
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested Delete Confirmation */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the complaint record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? "Deleting..." : "Yes, Delete Complaint"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}