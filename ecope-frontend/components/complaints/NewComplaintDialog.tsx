// components/complaints/NewComplaintDialog.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus } from "lucide-react";
import api from "@/lib/api";
import { showToast } from "@/lib/toast";
import { ComplaintPrediction, Complaint } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewComplaintDialog({ open, onOpenChange, onSuccess }: Props) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [prediction, setPrediction] = useState<ComplaintPrediction | null>(null);

  const getPrediction = async () => {
    try {
      setPredictionLoading(true);
      const res = await api.post<ComplaintPrediction>("/api/v1/complaints/classify", { complaint_text: text });
      setPrediction(res.data);
    } catch (error) {
      showToast("error", "Prediction failed", "Could not classify complaint");
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await api.post("/api/v1/complaints/", { complaint_text: text });
      showToast("success", "Created", "Complaint added successfully");
      setText("");
      setPrediction(null);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      showToast("error", "Error", "Failed to create complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Complaint</DialogTitle>
          <DialogDescription>Add a new complaint to the system.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Complaint Details</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-32" />
          </div>
          <Button variant="outline" onClick={getPrediction} disabled={!text.trim() || predictionLoading}>
            {predictionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Predict Category & Urgency
          </Button>
          {prediction && (
             <div className="border rounded-lg p-4 bg-muted/20 flex gap-4">
                <div className="flex-1">
                    <p className="text-xs font-bold mb-1">CATEGORY: {prediction.category}</p>
                    <Progress value={prediction.confidence_category * 100} className="h-1" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold mb-1">URGENCY: {prediction.urgency}</p>
                    <Progress value={prediction.confidence_urgency * 100} className="h-1" />
                </div>
             </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!text.trim() || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Complaint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}