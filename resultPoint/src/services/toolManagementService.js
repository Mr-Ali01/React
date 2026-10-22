/**
 * ResultPoint Tools & Calculators Management Service
 *
 * Central authority for calculator and tool registry, availability toggles,
 * context-specific applicability scoping (university/course/regulation),
 * configuration validation, and integration with student/public navigation.
 *
 * Security & Integrity:
 * - Deterministic configuration validation (numeric ranges, allowed rounding modes, linear conversion formulas)
 * - Strict injection prevention (rejects script tags, eval, arbitrary function execution)
 * - Guarded deletion (blocks permanent deletion of tools referenced by saved calculations or routes)
 * - Stable tool IDs (IDs are immutable once registered)
 * - Audit trail logging via auditHistoryService
 * - Custom event broadcasting ('rp_tools_updated') for real-time reactivity
 */

import { STORAGE_KEYS } from './storageKeys.js';
import { TOOLS_DATA, CATEGORIES_CONFIG } from '../data/toolsData.js';
import { academicCatalogService } from './academicCatalogService.js';
import { auditHistoryService } from './auditHistoryService.js';

export const TOOL_UPDATED_EVENT = 'rp_tools_updated';
export const TOOL_STATUSES = ['enabled', 'disabled'];

// Safe storage accessors
function safeGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Failed to parse localStorage key ${key}:`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to set localStorage key ${key}:`, err);
  }
}

function dispatchToolsUpdated(action, tool) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(TOOL_UPDATED_EVENT, {
          detail: { action, tool, timestamp: new Date().toISOString() }
        })
      );
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.warn('Failed to dispatch tool update event:', err);
  }
}

/**
 * Returns baseline default configuration parameters for a given tool.
 */
function getDefaultToolConfig(toolId, category = '') {
  const isCgpaSgpa = toolId.includes('cgpa') || toolId.includes('sgpa') || category.includes('CGPA');
  const isConverter = toolId.includes('convert') || category.includes('Converter');
  const isGrade = toolId.includes('grade') || category.includes('Grade');

  if (isCgpaSgpa) {
    return {
      defaultScale: '10.0',
      maxCreditsPerSubject: 10,
      minCreditsPerSubject: 1,
      allowDecimalCredits: true,
      decimalPrecision: 2,
      roundingMode: 'HALF_UP', // 'HALF_UP' | 'FLOOR' | 'CEILING'
      allowCustomCourseEntry: true
    };
  }

  if (isConverter) {
    return {
      defaultConversionFormula: toolId.includes('jntuh') ? '(CGPA - 0.5) * 10' : 'CGPA * 10',
      allowManualMultiplier: true,
      maxPercentage: 100,
      decimalPrecision: 2
    };
  }

  if (isGrade) {
    return {
      passingMarksThreshold: 40,
      maxMarks: 100,
      useStandardGradeLetters: true
    };
  }

  return {
    allowGuestUsage: true,
    saveToHistoryByDefault: true,
    decimalPrecision: 2
  };
}

export const toolManagementService = {
  /**
   * Initialize tool registry idempotently from baseline TOOLS_DATA
   */
  initialize() {
    const raw = safeGet(STORAGE_KEYS.TOOLS, null);
    const nowIso = new Date().toISOString();

    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      // Seed from TOOLS_DATA
      const seededTools = TOOLS_DATA.map((t, idx) => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        category: t.category || 'Academic Performance',
        icon: t.icon || 'Calculator',
        iconColor: t.iconColor || 'blue',
        route: t.route || '/calculators',
        popularity: t.popularity || 80,
        usageCount: t.usageCount || 0,
        isNew: Boolean(t.isNew),
        keywords: Array.isArray(t.keywords) ? [...t.keywords] : [],
        status: 'enabled', // 'enabled' | 'disabled'
        isPublic: true,
        displayOrder: idx + 1,
        applicability: {
          universities: ['all'],
          courses: ['all'],
          regulations: ['all']
        },
        config: getDefaultToolConfig(t.id, t.category),
        createdAt: nowIso,
        updatedAt: nowIso
      }));

      safeSet(STORAGE_KEYS.TOOLS, seededTools);
      return seededTools;
    }

    // Merge any missing tools from TOOLS_DATA while preserving user customizations
    let modified = false;
    const tools = [...raw];

    TOOLS_DATA.forEach((def, idx) => {
      const existing = tools.find((t) => t.id === def.id);
      if (!existing) {
        tools.push({
          id: def.id,
          name: def.name,
          description: def.description || '',
          category: def.category || 'Academic Performance',
          icon: def.icon || 'Calculator',
          iconColor: def.iconColor || 'blue',
          route: def.route || '/calculators',
          popularity: def.popularity || 80,
          usageCount: def.usageCount || 0,
          isNew: Boolean(def.isNew),
          keywords: Array.isArray(def.keywords) ? [...def.keywords] : [],
          status: 'enabled',
          isPublic: true,
          displayOrder: tools.length + 1,
          applicability: {
            universities: ['all'],
            courses: ['all'],
            regulations: ['all']
          },
          config: getDefaultToolConfig(def.id, def.category),
          createdAt: nowIso,
          updatedAt: nowIso
        });
        modified = true;
      } else if (existing.route !== def.route) {
        // Synchronize canonical route if updated in TOOLS_DATA while preserving user customizations
        existing.route = def.route;
        modified = true;
      }
    });

    if (modified) {
      safeSet(STORAGE_KEYS.TOOLS, tools);
    }

    return tools;
  },

  /**
   * Retrieve all tools with search, filtering, and sorting
   */
  getAllTools(options = {}) {
    const list = this.initialize();
    let results = [...list];

    // 1. Search Query
    if (options.search && typeof options.search === 'string' && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      results = results.filter((t) => {
        const nameMatch = (t.name || '').toLowerCase().includes(q);
        const idMatch = (t.id || '').toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const catMatch = (t.category || '').toLowerCase().includes(q);
        const kwMatch = Array.isArray(t.keywords) && t.keywords.some((k) => k.toLowerCase().includes(q));
        return nameMatch || idMatch || descMatch || catMatch || kwMatch;
      });
    }

    // 2. Status Filter
    if (options.status && options.status !== 'all') {
      const targetStatus = options.status.toLowerCase();
      results = results.filter((t) => (t.status || 'enabled').toLowerCase() === targetStatus);
    }

    // 3. Category Filter
    if (options.category && options.category !== 'all' && options.category !== 'All Tools') {
      results = results.filter((t) => t.category === options.category);
    }

    // 4. University Applicability Filter
    if (options.universityId && options.universityId !== 'all') {
      results = results.filter((t) => {
        const univs = t.applicability?.universities || ['all'];
        return univs.includes('all') || univs.includes(options.universityId);
      });
    }

    // 5. Course Applicability Filter
    if (options.courseId && options.courseId !== 'all') {
      results = results.filter((t) => {
        const courses = t.applicability?.courses || ['all'];
        return courses.includes('all') || courses.includes(options.courseId);
      });
    }

    // 6. Sorting
    const sortBy = options.sortBy || 'popularity';
    results.sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      if (sortBy === 'usage') return (b.usageCount || 0) - (a.usageCount || 0);
      if (sortBy === 'displayOrder') return (a.displayOrder || 0) - (b.displayOrder || 0);
      return (b.popularity || 0) - (a.popularity || 0);
    });

    return results;
  },

  /**
   * Retrieve a tool by stable ID
   */
  getToolById(toolId) {
    if (!toolId) return null;
    const tools = this.initialize();
    return tools.find((t) => t.id === toolId || t.id.toLowerCase() === String(toolId).toLowerCase()) || null;
  },

  /**
   * Retrieve a tool by its route pathname or hash anchor
   */
  getToolByRoute(pathname) {
    if (!pathname) return null;
    const tools = this.initialize();
    const withoutQuery = String(pathname).trim().split('?')[0];
    const cleanPath = withoutQuery === '/' ? '/' : withoutQuery.replace(/\/+$/, '');
    const cleanPathWithoutHash = cleanPath.split('#')[0].replace(/\/+$/, '') || '/';
    const hash = cleanPath.includes('#') ? cleanPath.slice(cleanPath.indexOf('#')) : '';

    // Legacy URL alias compatibility (e.g. /calculators/credite-calculate)
    if (cleanPathWithoutHash === '/calculators/credite-calculate') {
      const aliasMatch = tools.find((t) => t.id === 'credits-calculator');
      if (aliasMatch) return aliasMatch;
    }

    // 1. Exact match against full route (including hash if present in pathname)
    let match = tools.find((t) => t.route === cleanPath || t.route === pathname);
    if (match) return match;

    // 2. If pathname included a specific hash, match against tool with that exact hash
    if (hash) {
      match = tools.find((t) => t.route === `${cleanPathWithoutHash}${hash}`);
      if (match) return match;
    }

    // 3. Exact match against base route (without hash) - prefer tool whose registered route has no hash
    match = tools.find((t) => {
      const toolBase = (t.route || '').split('#')[0].replace(/\/+$/, '') || '/';
      return toolBase === cleanPathWithoutHash && !t.route.includes('#');
    });
    if (match) return match;

    // 4. Exact match against base route even if tool has hash
    match = tools.find((t) => {
      const toolBase = (t.route || '').split('#')[0].replace(/\/+$/, '') || '/';
      return toolBase === cleanPathWithoutHash;
    });
    if (match) return match;

    // 5. Segment-safe subpath prefix match (e.g. /universities/123 matches /universities)
    // Enforces segment boundary so /calculators/sgpa will NEVER match /calculators/cgpa
    match = tools.find((t) => {
      const toolBase = (t.route || '').split('#')[0].replace(/\/+$/, '');
      if (!toolBase || toolBase === '/') return false;
      return cleanPathWithoutHash.startsWith(toolBase + '/');
    });

    return match || null;
  },

  /**
   * Retrieve all enabled tools available for navigation
   */
  getActiveTools(userContext = null) {
    const all = this.initialize();
    return all.filter((t) => {
      const avail = this.isToolAvailable(t.id, userContext);
      return avail.available;
    });
  },

  /**
   * Context-aware tool availability checker
   */
  isToolAvailable(toolIdOrRoute, academicContext = null) {
    const tool = this.getToolById(toolIdOrRoute) || this.getToolByRoute(toolIdOrRoute);

    if (!tool) {
      return { available: false, reason: 'Tool not found in registry.' };
    }

    // 1. Global Enable / Disable status check
    if ((tool.status || 'enabled').toLowerCase() === 'disabled') {
      return {
        available: false,
        reason: tool.statusReason || 'This calculator is currently unavailable or disabled by platform administrators.',
        tool,
        isDisabled: true
      };
    }

    // 2. Academic Context Scoping (University / Course / Regulation)
    if (academicContext && typeof academicContext === 'object') {
      const { universityId, courseId, regulationId } = academicContext;
      const applicability = tool.applicability || { universities: ['all'], courses: ['all'], regulations: ['all'] };

      // University check
      if (universityId && applicability.universities && !applicability.universities.includes('all')) {
        if (!applicability.universities.includes(universityId)) {
          return {
            available: false,
            reason: `This calculator is not enabled for the selected university (${universityId}).`,
            tool,
            isScopeRestricted: true
          };
        }
      }

      // Course check
      if (courseId && applicability.courses && !applicability.courses.includes('all')) {
        if (!applicability.courses.includes(courseId)) {
          return {
            available: false,
            reason: `This calculator is not enabled for the selected course (${courseId}).`,
            tool,
            isScopeRestricted: true
          };
        }
      }

      // Regulation check
      if (regulationId && applicability.regulations && !applicability.regulations.includes('all')) {
        if (!applicability.regulations.includes(regulationId)) {
          return {
            available: false,
            reason: `This calculator is not enabled for the selected regulation (${regulationId}).`,
            tool,
            isScopeRestricted: true
          };
        }
      }
    }

    return { available: true, tool };
  },

  /**
   * Update permitted tool metadata (name, description, category, keywords, etc.)
   */
  updateToolMetadata(toolId, updateData) {
    if (!toolId) throw new Error('Tool ID is required.');
    const tools = this.initialize();
    const idx = tools.findIndex((t) => t.id === toolId);
    if (idx === -1) throw new Error(`Tool with ID "${toolId}" does not exist.`);

    const existing = tools[idx];

    // Validate name
    if (updateData.name !== undefined) {
      if (!updateData.name || typeof updateData.name !== 'string' || !updateData.name.trim()) {
        throw new Error('Tool name cannot be empty.');
      }
      if (updateData.name.trim().length < 2) {
        throw new Error('Tool name must be at least 2 characters.');
      }
      if (updateData.name.trim().length > 80) {
        throw new Error('Tool name cannot exceed 80 characters.');
      }
    }

    // Validate description
    if (updateData.description !== undefined && typeof updateData.description === 'string') {
      if (updateData.description.length > 300) {
        throw new Error('Tool description cannot exceed 300 characters.');
      }
    }

    // Validate keywords
    if (updateData.keywords !== undefined && !Array.isArray(updateData.keywords)) {
      throw new Error('Keywords must be an array of strings.');
    }

    // Prevent ID modification
    if (updateData.id && updateData.id !== toolId) {
      throw new Error('Tool ID is immutable and cannot be modified.');
    }

    // Reject unsupported injection fields
    const allowedFields = [
      'name',
      'description',
      'category',
      'icon',
      'iconColor',
      'keywords',
      'displayOrder',
      'isNew'
    ];

    Object.keys(updateData).forEach((field) => {
      if (!allowedFields.includes(field) && field !== 'id') {
        throw new Error(`Unsupported metadata field "${field}".`);
      }
    });

    const updatedTool = {
      ...existing,
      name: updateData.name ? updateData.name.trim() : existing.name,
      description: updateData.description !== undefined ? updateData.description.trim() : existing.description,
      category: updateData.category || existing.category,
      icon: updateData.icon || existing.icon,
      iconColor: updateData.iconColor || existing.iconColor,
      keywords: Array.isArray(updateData.keywords) ? updateData.keywords : existing.keywords,
      displayOrder: typeof updateData.displayOrder === 'number' ? updateData.displayOrder : existing.displayOrder,
      isNew: updateData.isNew !== undefined ? Boolean(updateData.isNew) : existing.isNew,
      updatedAt: new Date().toISOString()
    };

    tools[idx] = updatedTool;
    safeSet(STORAGE_KEYS.TOOLS, tools);

    // Audit logging
    try {
      auditHistoryService.recordEvent({
        action: 'TOOL_UPDATED',
        entityType: 'tool',
        entityId: toolId,
        entityName: updatedTool.name,
        details: `Updated metadata for tool "${updatedTool.name}" (${updatedTool.category}).`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchToolsUpdated('UPDATE', updatedTool);
    return updatedTool;
  },

  /**
   * Change tool availability status ('enabled' or 'disabled')
   */
  setToolStatus(toolId, status, reason = '') {
    if (!toolId) throw new Error('Tool ID is required.');
    const normalizedStatus = String(status).toLowerCase();
    if (!TOOL_STATUSES.includes(normalizedStatus)) {
      throw new Error(`Invalid status "${status}". Allowed values: ${TOOL_STATUSES.join(', ')}.`);
    }

    const tools = this.initialize();
    const idx = tools.findIndex((t) => t.id === toolId);
    if (idx === -1) throw new Error(`Tool with ID "${toolId}" does not exist.`);

    const existing = tools[idx];
    if (existing.status === normalizedStatus) {
      return existing; // No change needed
    }

    const updatedTool = {
      ...existing,
      status: normalizedStatus,
      statusReason: reason ? String(reason).trim() : null,
      updatedAt: new Date().toISOString()
    };

    tools[idx] = updatedTool;
    safeSet(STORAGE_KEYS.TOOLS, tools);

    // Audit logging
    const action = normalizedStatus === 'enabled' ? 'TOOL_ENABLED' : 'TOOL_DISABLED';
    try {
      auditHistoryService.recordEvent({
        action,
        entityType: 'tool',
        entityId: toolId,
        entityName: updatedTool.name,
        details: `${normalizedStatus === 'enabled' ? 'Enabled' : 'Disabled'} calculator "${updatedTool.name}". ${reason ? `Reason: ${reason}` : ''}`.trim(),
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchToolsUpdated(action, updatedTool);
    return updatedTool;
  },

  /**
   * Validate and update supported tool configuration parameters
   */
  updateToolConfig(toolId, newConfig) {
    if (!toolId) throw new Error('Tool ID is required.');
    if (!newConfig || typeof newConfig !== 'object' || Array.isArray(newConfig)) {
      throw new Error('Tool configuration must be a valid key-value object.');
    }

    const tools = this.initialize();
    const idx = tools.findIndex((t) => t.id === toolId);
    if (idx === -1) throw new Error(`Tool with ID "${toolId}" does not exist.`);

    const existing = tools[idx];

    // Security validation against script injection, execution, and eval in config
    const rawConfigString = JSON.stringify(newConfig);
    if (
      rawConfigString.includes('<script') ||
      rawConfigString.includes('eval(') ||
      rawConfigString.includes('Function(') ||
      rawConfigString.includes('javascript:') ||
      rawConfigString.includes('exec(') ||
      rawConfigString.includes('spawn(') ||
      rawConfigString.includes('process.') ||
      rawConfigString.includes('window.') ||
      rawConfigString.includes('document.')
    ) {
      throw new Error('Security Error: Configuration contains forbidden executable script expressions.');
    }

    // Validate numeric constraints
    if (newConfig.maxCreditsPerSubject !== undefined) {
      const maxC = Number(newConfig.maxCreditsPerSubject);
      if (isNaN(maxC) || maxC < 1 || maxC > 50) {
        throw new Error('maxCreditsPerSubject must be a positive number between 1 and 50.');
      }
      if (newConfig.minCreditsPerSubject !== undefined && Number(newConfig.minCreditsPerSubject) > maxC) {
        throw new Error('minCreditsPerSubject cannot exceed maxCreditsPerSubject.');
      }
    }

    if (newConfig.decimalPrecision !== undefined) {
      const prec = Number(newConfig.decimalPrecision);
      if (isNaN(prec) || prec < 0 || prec > 6) {
        throw new Error('decimalPrecision must be an integer between 0 and 6.');
      }
    }

    if (newConfig.roundingMode !== undefined) {
      const allowedModes = ['HALF_UP', 'FLOOR', 'CEILING', 'round', 'floor', 'ceil'];
      if (!allowedModes.includes(newConfig.roundingMode)) {
        throw new Error(
          `Invalid roundingMode "${newConfig.roundingMode}". Allowed: ${allowedModes.join(', ')}.`
        );
      }
    }

    if (newConfig.defaultConversionFormula !== undefined) {
      const formula = String(newConfig.defaultConversionFormula).trim();
      // Primary Security Boundary: Strict token allowlist
      if (!/^[0-9a-zA-Z\s\*\-\.\(\)]+$/.test(formula)) {
        throw new Error('Security Error: Formula contains illegal characters. Only alphanumeric, spaces, and ()*.- are allowed.');
      }
      // Strict allowlisted deterministic templates: CGPA * N or (CGPA - offset) * N
      const isLinear =
        /^((CGPA\s*\*\s*\d+(\.\d+)?)|(\(\s*CGPA\s*-\s*\d+(\.\d+)?\s*\)\s*\*\s*\d+(\.\d+)?))$/i.test(formula);
      if (!isLinear) {
        throw new Error(
          'Unsupported conversion formula pattern. Must follow linear standard format (e.g. "CGPA * 10" or "(CGPA - 0.5) * 10").'
        );
      }
    }

    const updatedTool = {
      ...existing,
      config: {
        ...existing.config,
        ...newConfig
      },
      updatedAt: new Date().toISOString()
    };

    tools[idx] = updatedTool;
    safeSet(STORAGE_KEYS.TOOLS, tools);

    // Audit logging
    try {
      auditHistoryService.recordEvent({
        action: 'TOOL_CONFIG_UPDATED',
        entityType: 'tool',
        entityId: toolId,
        entityName: updatedTool.name,
        details: `Updated configuration parameters for calculator "${updatedTool.name}".`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit history log warning:', auditErr);
    }

    dispatchToolsUpdated('CONFIG_UPDATE', updatedTool);
    return updatedTool;
  },

  /**
   * Update institutional scoping / applicability (Universities, Courses, Regulations)
   */
  updateToolApplicability(toolId, applicability) {
    if (!toolId) throw new Error('Tool ID is required.');
    if (!applicability || typeof applicability !== 'object') {
      throw new Error('Applicability must be an object.');
    }

    const tools = this.initialize();
    const idx = tools.findIndex((t) => t.id === toolId);
    if (idx === -1) throw new Error(`Tool with ID "${toolId}" does not exist.`);

    const existing = tools[idx];

    // Validate university references if not ['all']
    if (Array.isArray(applicability.universities) && !applicability.universities.includes('all')) {
      const catalogUniversities = academicCatalogService.getUniversities();
      const validIds = catalogUniversities.map((u) => u.id);
      for (const uid of applicability.universities) {
        if (!validIds.includes(uid)) {
          throw new Error(`University reference "${uid}" does not exist in academic catalog.`);
        }
      }
    }

    const updatedTool = {
      ...existing,
      applicability: {
        universities: Array.isArray(applicability.universities) ? applicability.universities : ['all'],
        courses: Array.isArray(applicability.courses) ? applicability.courses : ['all'],
        regulations: Array.isArray(applicability.regulations) ? applicability.regulations : ['all']
      },
      updatedAt: new Date().toISOString()
    };

    tools[idx] = updatedTool;
    safeSet(STORAGE_KEYS.TOOLS, tools);

    try {
      auditHistoryService.recordEvent({
        action: 'TOOL_APPLICABILITY_UPDATED',
        entityType: 'tool',
        entityId: toolId,
        entityName: updatedTool.name,
        details: `Updated academic applicability for calculator "${updatedTool.name}".`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    dispatchToolsUpdated('APPLICABILITY_UPDATE', updatedTool);
    return updatedTool;
  },

  /**
   * Check references to prevent destructive deletion of active tools
   */
  canDeleteTool(toolId) {
    if (!toolId) return { canDelete: false, reasons: ['Tool ID is required'] };

    const reasons = [];

    // 1. Check if tool is a core baseline platform tool
    const isCoreTool = TOOLS_DATA.some((t) => t.id === toolId);
    if (isCoreTool) {
      reasons.push('This is a core ResultPoint platform tool defined in system routes');
    }

    // 2. Check if saved calculations exist for this tool
    try {
      const saved = safeGet(STORAGE_KEYS.SAVED_RESULTS, []);
      const toolMatch = saved.filter(
        (s) => s.tool && (s.tool.toLowerCase().includes(toolId) || toolId.includes(s.tool.toLowerCase()))
      );
      if (toolMatch.length > 0) {
        reasons.push(`${toolMatch.length} saved student calculation snapshot${toolMatch.length === 1 ? '' : 's'}`);
      }
    } catch {}

    const canDelete = reasons.length === 0;
    return {
      canDelete,
      reasons,
      message: canDelete
        ? 'Tool is unreferenced and can be safely deleted.'
        : `Cannot permanently delete calculator: It is referenced by ${reasons.join(', ')}. Please Disable this tool instead to preserve historical calculation records.`
    };
  },

  /**
   * Guarded deletion: only unreferenced custom tools can be permanently removed
   */
  deleteTool(toolId) {
    const refCheck = this.canDeleteTool(toolId);
    if (!refCheck.canDelete) {
      throw new Error(refCheck.message);
    }

    const tools = this.initialize();
    const idx = tools.findIndex((t) => t.id === toolId);
    if (idx === -1) throw new Error(`Tool with ID "${toolId}" does not exist.`);

    const deleted = tools.splice(idx, 1)[0];
    safeSet(STORAGE_KEYS.TOOLS, tools);

    try {
      auditHistoryService.recordEvent({
        action: 'TOOL_DELETED',
        entityType: 'tool',
        entityId: toolId,
        entityName: deleted.name,
        details: `Permanently deleted unreferenced custom calculator "${deleted.name}".`,
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    dispatchToolsUpdated('DELETE', deleted);
    return deleted;
  },

  /**
   * Safely restore baseline tool registry from canonical defaults
   */
  resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.TOOLS);
    const fresh = this.initialize();

    try {
      auditHistoryService.recordEvent({
        action: 'TOOL_REGISTRY_RESET',
        entityType: 'tool',
        entityId: 'all_tools',
        entityName: 'Tool Registry',
        details: 'Restored calculator registry and configurations to factory baseline defaults.',
        actor: 'Administrator'
      });
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    dispatchToolsUpdated('RESET', null);
    return fresh;
  },

  /**
   * Aggregated metrics for Admin Dashboard and Tools Management UI
   */
  getToolStats() {
    const tools = this.initialize();
    const enabled = tools.filter((t) => (t.status || 'enabled').toLowerCase() === 'enabled').length;
    const disabled = tools.filter((t) => (t.status || '').toLowerCase() === 'disabled').length;

    const categoryCounts = {};
    tools.forEach((t) => {
      const cat = t.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const sortedByUsage = [...tools].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    const mostUsedTool = sortedByUsage.length > 0 ? sortedByUsage[0] : null;

    return {
      total: tools.length,
      enabled,
      disabled,
      categoryCounts,
      categoriesList: CATEGORIES_CONFIG,
      mostUsedTool
    };
  }
};
