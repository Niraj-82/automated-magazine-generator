// src/hooks/useSubmissions.ts
import { useState, useEffect, useCallback } from 'react';
import { Submission, SubmissionStatus } from '../types';
import { submissionService, getErrorMessage } from '../services/api';

interface SubmissionStats {
  total: number;
  approved: number;
  needsReview: number;
  rejected: number;
  blocked: number;
  avgGrammarScore: number;
  avgToneScore: number;
  totalSafetyFlags: number;
  pipelineSuccessRate: number;
}

interface UseSubmissionsReturn {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  stats: SubmissionStats | null;
  statsLoading: boolean;
  fetchSubmissions: (params?: { page?: number; limit?: number; status?: string; category?: string; search?: string }) => Promise<void>;
  createSubmission: (formData: FormData) => Promise<Submission | null>;
  updateStatus: (id: string, status: SubmissionStatus, comment?: string) => Promise<boolean>;
  deleteSubmission: (id: string) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  totalPages: number;
  currentPage: number;
  total: number;
}

export function useSubmissions(): UseSubmissionsReturn {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSubmissions = useCallback(async (params?: { page?: number; limit?: number; status?: string; category?: string; search?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await submissionService.getAll(params);
      const paginated = res.data.data;
      if (paginated) {
        setSubmissions(paginated.data || []);
        setTotalPages(paginated.totalPages || 1);
        setCurrentPage(paginated.page || 1);
        setTotal(paginated.total || 0);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      // Keep existing data on error — don't clear
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubmission = useCallback(async (formData: FormData): Promise<Submission | null> => {
    try {
      const res = await submissionService.create(formData);
      const newSub = res.data.data;
      if (newSub) {
        setSubmissions((prev) => [newSub, ...prev]);
        setTotal((prev) => prev + 1);
      }
      return newSub || null;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    }
  }, []);

  // Optimistic status update
  const updateStatus = useCallback(async (id: string, status: SubmissionStatus, comment?: string): Promise<boolean> => {
    // Save current state for rollback
    const prevSubmissions = [...submissions];
    // Optimistic update
    setSubmissions((prev) =>
      prev.map((s) => (s._id === id ? { ...s, status, facultyComment: comment || s.facultyComment } : s))
    );
    try {
      await submissionService.updateStatus(id, status, comment);
      return true;
    } catch (err) {
      // Rollback on failure
      setSubmissions(prevSubmissions);
      setError(getErrorMessage(err));
      return false;
    }
  }, [submissions]);

  const deleteSubmission = useCallback(async (id: string): Promise<boolean> => {
    try {
      await submissionService.delete(id);
      setSubmissions((prev) => prev.filter((s) => s._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await submissionService.getStats();
      if (res.data.data) {
        setStats(res.data.data);
      }
    } catch {
      // Stats failure is non-critical — don't set error
    } finally {
      setStatsLoading(false);
    }
  }, []);

  return {
    submissions, loading, error, stats, statsLoading,
    fetchSubmissions, createSubmission, updateStatus, deleteSubmission, fetchStats,
    totalPages, currentPage, total,
  };
}

export default useSubmissions;
