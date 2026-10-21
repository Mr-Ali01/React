import { authService } from './authService.js';
import { activityHistoryService } from './activityHistoryService.js';
import { STORAGE_KEYS } from './storageKeys.js';

const PENDING_CALC_KEY = 'resultpoint_pending_calculation';

/**
 * Service to manage calculator result saving, activity history recording,
 * and preserving pending calculations across authentication sessions.
 */
export const calculationSaveService = {
  /**
   * Save a calculation directly for the authenticated student.
   *
   * @param {Object} params
   * @param {string} params.tool - Title of the calculator
   * @param {string} params.query - Short summary/description
   * @param {string} params.score - Formatted output score (e.g., '8.72 CGPA', '78.5%')
   * @param {Array} params.metrics - Metric key-value pairs
   * @param {Object} params.details - Detailed inputs/breakdown
   * @param {string} params.path - URL path of the calculator
   * @param {Object} params.rawData - Raw input state for restoration
   * @param {number|string} params.semester - Semester number if applicable
   * @returns {{ success: boolean, record?: Object, error?: string, unauthenticated?: boolean }}
   */
  saveCalculation(calcData = {}, userOverride = null) {
    const user = userOverride || authService.getCurrentUser();
    if (!user || (!user.id && !user.userId)) {
      return {
        success: false,
        error: 'User is not authenticated. Please log in to save your result.',
        unauthenticated: true,
      };
    }

    const userId = user.id || user.userId;
    const userEmail = user.email || '';

    // Normalize properties across different calculator formats
    const tool = calcData.tool || calcData.calculatorType || calcData.title || 'Academic Calculator';
    const query = calcData.query || calcData.summary || calcData.result || 'Evaluation';
    const score = String(calcData.score !== undefined ? calcData.score : calcData.result || 'Computed');
    const metrics = Array.isArray(calcData.metrics) ? calcData.metrics : [];
    const details = calcData.details || calcData.data || null;
    const path = calcData.path || (typeof window !== 'undefined' ? (window?.location?.pathname || '/calculators') : '/calculators');
    const rawData = calcData.rawData || calcData.data || null;
    const semester = calcData.semester || null;

    try {
      const now = new Date();
      const calcId = `calc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const calcRecord = {
        id: calcId,
        userId,
        userEmail,
        tool,
        query,
        score,
        metrics,
        details,
        path,
        rawData,
        date: now.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }),
        timestamp: now.toISOString(),
      };

      // 1. Save to saved results list in localStorage
      let existingSaved = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SAVED_RESULTS);
        existingSaved = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(existingSaved)) existingSaved = [];
      } catch {
        existingSaved = [];
      }

      // Check for exact duplicate within last 5 seconds to prevent spam
      const isDuplicate = existingSaved.some(
        (item) =>
          item.userId === userId &&
          item.tool === tool &&
          item.score === score &&
          Math.abs(new Date(item.timestamp || item.date).getTime() - now.getTime()) < 5000
      );

      if (!isDuplicate) {
        const updatedSaved = [calcRecord, ...existingSaved];
        localStorage.setItem(STORAGE_KEYS.SAVED_RESULTS, JSON.stringify(updatedSaved.slice(0, 100)));
      }

      // 2. Record to activityHistoryService for Calculation History tab
      try {
        const badgeList = ['Calculator', tool.replace(' Calculator', '')];
        if (semester) badgeList.push(`Sem ${semester}`);

        activityHistoryService.recordActivity({
          type: 'calculation',
          action: 'calculated',
          title: `Used ${tool}`,
          description: query || `Evaluation score: ${score}`,
          entityId: calcId,
          badgeValues: badgeList,
          resultMetric: {
            label: 'Result',
            value: String(score),
            color: 'blue',
          },
          metadata: {
            activityType: 'Calculator Usage',
            tool,
            path,
            output: score,
            metrics,
            semester,
            details,
            remarks: query || 'Saved from public calculator.',
          },
        });
      } catch (actErr) {
        console.warn('Could not record activity history for calculation:', actErr);
      }

      // 3. Dispatch events for real-time reactivity across tabs and components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('calculation_history_updated', { detail: calcRecord }));
        window.dispatchEvent(new CustomEvent('activity_history_updated'));
        window.dispatchEvent(new CustomEvent('storage'));
      }

      return {
        success: true,
        record: calcRecord,
      };
    } catch (err) {
      console.error('Failed to save calculation:', err);
      return {
        success: false,
        error: err.message || 'An error occurred while saving the calculation.',
      };
    }
  },

  /**
   * Preserve a pending calculation before user authenticates.
   * Strips sensitive credentials, records origin and path, and syncs across storage.
   */
  setPendingCalculation(calcData) {
    if (!calcData || typeof calcData !== 'object') return null;

    try {
      const currentUser = authService.getCurrentUser();
      const currentPath = typeof window !== 'undefined' ? (window.location?.pathname || '/calculators') : '/calculators';

      // Cleanse and normalize payload — strictly avoid storing credentials, passwords, or tokens
      const sanitized = {
        id: calcData.id || `pending_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tool: calcData.tool || calcData.calculatorType || calcData.title || 'Academic Calculation',
        calculatorType: calcData.calculatorType || calcData.tool || calcData.title || 'Academic Calculation',
        score: String(calcData.score !== undefined ? calcData.score : (calcData.result || '0.00')),
        scale: calcData.scale || '10.0',
        query: calcData.query || calcData.summary || 'Academic evaluation summary',
        summary: calcData.summary || calcData.query || 'Academic evaluation summary',
        metrics: Array.isArray(calcData.metrics) ? calcData.metrics : [],
        details: calcData.details || calcData.data || null,
        rawData: calcData.rawData || calcData.data || null,
        metadata: calcData.metadata || {},
        semester: calcData.semester || null,
        university: calcData.university || calcData.metadata?.university || null,
        course: calcData.course || calcData.metadata?.course || null,
        regulation: calcData.regulation || calcData.metadata?.regulation || null,
        path: calcData.path || currentPath,
        savedAt: new Date().toISOString(),
        originUserId: currentUser?.id || currentUser?.userId || null,
      };

      // Explicitly delete sensitive parameters if they were accidentally attached
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.authToken;
      delete sanitized.credentials;

      const payload = JSON.stringify(sanitized);
      sessionStorage.setItem(STORAGE_KEYS.PENDING_CALCULATION, payload);
      localStorage.setItem(STORAGE_KEYS.PENDING_CALCULATION, payload);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pending_calculation_updated', { detail: sanitized }));
      }

      return sanitized;
    } catch (err) {
      console.warn('Failed to store pending calculation:', err);
      return null;
    }
  },

  /**
   * Retrieve preserved pending calculation with validation and account-isolation.
   * Discards calculations if they belong to a different account (preventing cross-account leakage).
   */
  getPendingCalculation(currentUser = null) {
    try {
      const activeUser = currentUser || authService.getCurrentUser();
      const raw = sessionStorage.getItem(STORAGE_KEYS.PENDING_CALCULATION) || localStorage.getItem(STORAGE_KEYS.PENDING_CALCULATION);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        this.clearPendingCalculation();
        return null;
      }

      // Check timestamp validity (expire after 24 hours)
      if (parsed.savedAt) {
        const ageHours = (Date.now() - new Date(parsed.savedAt).getTime()) / (1000 * 60 * 60);
        if (ageHours > 24) {
          this.clearPendingCalculation();
          return null;
        }
      }

      // Account-isolation safeguard: If the pending calculation was saved by a specific user,
      // and another user is currently logged in, discard to prevent cross-account leakage.
      if (parsed.originUserId && activeUser) {
        const currentUserId = activeUser.id || activeUser.userId;
        if (currentUserId && parsed.originUserId !== currentUserId) {
          console.warn('Discarding pending calculation: originated from a different user account.');
          this.clearPendingCalculation();
          return null;
        }
      }

      return parsed;
    } catch (err) {
      console.warn('Failed to parse pending calculation:', err);
      return null;
    }
  },

  /**
   * Clear preserved pending calculation from all stores.
   */
  clearPendingCalculation() {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.PENDING_CALCULATION);
      localStorage.removeItem(STORAGE_KEYS.PENDING_CALCULATION);
      // Clean legacy key if present
      sessionStorage.removeItem(PENDING_CALC_KEY);
      localStorage.removeItem(PENDING_CALC_KEY);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pending_calculation_updated', { detail: null }));
      }
    } catch {}
  },

  /**
   * Save pending calculation for an authenticated user.
   * If saving fails, preserves the calculation for retry without creating duplicates.
   */
  savePendingCalculationForUser(user) {
    const activeUser = user || authService.getCurrentUser();
    if (!activeUser) {
      return { saved: false, success: false, error: 'User is not authenticated' };
    }

    const pending = this.getPendingCalculation(activeUser);
    if (!pending) {
      return { saved: false, success: false, error: 'No pending calculation found' };
    }

    const result = this.saveCalculation(pending, activeUser);
    if (result.success) {
      this.clearPendingCalculation();
      return { saved: true, success: true, record: result.record };
    }

    // Preserve calculation on failure for retry
    return {
      saved: false,
      success: false,
      error: result.error || 'Failed to save calculation.',
      pending
    };
  },

  /**
   * Retrieve saved calculations scoped to a student.
   */
  getSavedCalculations(user) {
    const currentUser = user || authService.getCurrentUser();
    if (!currentUser) return [];
    const userId = currentUser.id || currentUser.userId;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVED_RESULTS);
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.filter((item) => item.userId === userId);
    } catch {
      return [];
    }
  },
};

export default calculationSaveService;
