"use client";

import React, { useState, ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Prediction {
  category: string;
  urgency: string;
  confidence_category: number;
  confidence_urgency: number;
}

interface ComplaintDialogProps {
  isNewComplaintOpen: boolean;
  setIsNewComplaintOpen: (open: boolean) => void;
  getPrediction: () => void;
  prediction: Prediction | null;
  predictionLoading: boolean;
  getUrgencyColor: (urgency: string) => string;
}

const ComplaintDialog: React.FC<ComplaintDialogProps> = ({
  isNewComplaintOpen,
  setIsNewComplaintOpen,
  getPrediction,
  prediction,
  predictionLoading,
  getUrgencyColor,
}) => {
  const [newComplaintText, setNewComplaintText] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleCreateComplaint = async (): Promise<void> => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("complaint_text", newComplaintText);

      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      });

      // Reset state
      setIsNewComplaintOpen(false);
      setNewComplaintText("");
      setAttachments([]);

    } catch (error) {
      console.error("Error creating complaint:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isNewComplaintOpen} onOpenChange={setIsNewComplaintOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Complaint</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new complaint to the system for processing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          
          {/* Complaint Text */}
          <div className="grid gap-2">
            <Label htmlFor="complaint-text">Complaint Details</Label>
            <Textarea
              id="complaint-text"
              placeholder="Enter detailed complaint description..."
              value={newComplaintText}
              onChange={(e) => setNewComplaintText(e.target.value)}
              className="min-h-32"
            />
          </div>

          {/* Attachments */}
          <div className="grid gap-2">
            <Label htmlFor="attachments">Attachments</Label>
            <Input
              id="attachments"
              type="file"
              multiple
              accept="*/*"
              onChange={handleFileChange}
            />

            {attachments.length > 0 && (
              <div className="bg-muted/30 p-3 rounded-md text-sm space-y-1">
                {attachments.map((file, index) => (
                  <div key={index} className="text-muted-foreground">
                    • {file.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prediction Button */}
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={getPrediction}
              disabled={!newComplaintText.trim() || predictionLoading}
            >
              {predictionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Predict Category & Urgency
            </Button>
          </div>

          {/* Prediction Results */}
          {prediction && (
            <div className="border rounded-lg p-5 bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <h4 className="font-semibold text-base">
                  AI Prediction Results
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Category */}
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="text-sm font-medium mb-2">
                    Category Prediction
                  </p>

                  <Badge variant="outline" className="bg-background font-medium">
                    {prediction.category}
                  </Badge>

                  <div className="flex items-center gap-3 mt-3">
                    <Progress
                      value={prediction.confidence_category * 100}
                      className="h-2"
                    />
                    <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md">
                      {Math.round(prediction.confidence_category * 100)}%
                    </span>
                  </div>
                </div>

                {/* Urgency */}
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="text-sm font-medium mb-2">
                    Urgency Prediction
                  </p>

                  <Badge
                    className={`${getUrgencyColor(
                      prediction.urgency
                    )} text-white`}
                  >
                    {prediction.urgency}
                  </Badge>

                  <div className="flex items-center gap-3 mt-3">
                    <Progress
                      value={prediction.confidence_urgency * 100}
                      className="h-2"
                    />
                    <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md">
                      {Math.round(prediction.confidence_urgency * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setIsNewComplaintOpen(false);
              setNewComplaintText("");
              setAttachments([]);
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreateComplaint}
            disabled={!newComplaintText.trim() || isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Complaint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintDialog;
