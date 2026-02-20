// hooks/use-complaints.ts
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { showToast } from "@/lib/toast";
import { Complaint, ComplaintCategory, ComplaintUrgency, ComplaintStatus, ApiError, User } from "@/types";

export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [filters, setFilters] = useState({
    category: null as ComplaintCategory | null,
    urgency: null as ComplaintUrgency | null,
    status: null as ComplaintStatus | null,
    search: "",
  });

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("skip", ((currentPage - 1) * pageSize).toString());
      params.append("limit", pageSize.toString());
      if (filters.category) params.append("category", filters.category);
      if (filters.urgency) params.append("urgency", filters.urgency);
      if (filters.status) params.append("status", filters.status);
      if (filters.search.trim()) params.append("search", filters.search.trim());

      const response = await api.get<{ items: Complaint[]; total: number }>(`/api/v1/complaints/?${params.toString()}`);
      setTotalComplaints(response.data.total);
      setComplaints(response.data.items);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.data?.detail || apiError.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load current user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser) as User);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchComplaints();
    }
  }, [filters, currentPage, pageSize, currentUser]);

  return {
    complaints, loading, error, totalComplaints, 
    currentPage, setCurrentPage, pageSize, setPageSize,
    filters, setFilters, fetchComplaints, currentUser
  };
}