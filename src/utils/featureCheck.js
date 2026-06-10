import axios from 'axios';

// By default enable remote feature API. Set to `true` for local development to bypass.
const IGNORE_FEATURE_API = false;

// Mapping of known nav `to` paths (or names) to backend feature keys.
const NAV_FEATURE_MAP = {
  '/dashboard': 'dashboard',
  '/branch': 'agents',
  '/department': 'department',
  '/department-performance': 'department_performance',
  '/reports': 'reports',
  '/agent-performance': 'agent_performance',
  '/callogs': 'call_logs',
  '/calluses': 'call_uses',
  '/callmonitor': 'call_monitor',
  '/call-settings': 'call_settings',
  '/sticky-agents': 'call_settings',
  '/ivr-management': 'ivr_management',
  '/virtual-numbers': 'virtual_numbers',
  '/contacts': 'contacts',
  '/leads': 'leads',
  '/leads/fields': 'leads',
  '/campaigns/audio': 'audio_campaign',
  '/billing': 'billing',
  '/tickets': 'support_tickets',
  '/reports/cdr': 'cdr',
  // Follow-ups page lives under the Reports umbrella — reuse the
  // existing `reports` feature flag rather than requiring a separate
  // backend feature key. Any business with Reports access sees it.
  '/follow-ups': 'reports',
  '/reports/agent-status': 'reports',
  // Maps the v2 Migrations & Ops page to the existing 'settings' feature
  // so it shows up for anyone with Settings access — no separate backend
  // feature flag needed.
  '/migrations': 'settings',
};

/**
 * Helper: derive feature key for a nav item using explicit fields, `to` path, or name.
 */
export const getFeatureKeyForNavItem = (item) => {
  if (!item) return null;
  if (item.featureKey) return item.featureKey;
  // Prefer an explicit mapping from route `to` -> backend feature key when available.
  if (item.to && NAV_FEATURE_MAP[item.to]) return NAV_FEATURE_MAP[item.to];
  // Fall back to legacy `feature` field if mapping not available.
  if (item.feature) return item.feature;
  if (item.name) {
    // fallback: slugify the name (e.g. "Call Settings" -> "call_settings")
    return item.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
  }
  return null;
};

/**
 * Fetch allowed features for a business
 * @param {string} businessId - The business ID
 * @param {string} token - Authorization token (optional)
 * @returns {Promise<Object>} - Object with feature flags and labels
 */
export const getBusinessFeatures = async (businessId, token) => {
  try {
    if (IGNORE_FEATURE_API) {
      console.info('featureCheck: ignoring remote /api/v1/feature-controll per local override');
      return { featuresMap: {}, featuresMenu: [], featuresLabels: {} };
    }
    if (!businessId) {
      console.warn('featureCheck: No businessId provided');
      return { featuresMap: {}, featuresMenu: [], featuresLabels: {} };
    }

    const url = `/api/v1/feature-controll?businessId=${encodeURIComponent(businessId)}`;
    const response = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
    });

    // Normalize the response shapes we have seen in the wild
    const body = response?.data || {};
    const data = body.data || body.features || body || {};

    // backend may return an array of features under `data.features` or `features`
    const featuresArray = Array.isArray(data.features)
      ? data.features
      : Array.isArray(body.features)
      ? body.features
      : Array.isArray(data)
      ? data
      : [];

    const featuresMap = {};
    const featuresLabels = {};

    if (Array.isArray(featuresArray) && featuresArray.length > 0) {
      featuresArray.forEach((f) => {
        const key = f?.key || f?.name || (typeof f === 'string' ? f : null);
        if (key) {
          featuresMap[key] = true;
          featuresLabels[key] = f?.label || f?.name || key;
        }
      });
    } else if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Sometimes backend returns an object map: { featureKey: true }
      Object.keys(data).forEach((k) => {
        const v = data[k];
        featuresMap[k] = !!v;
        if (v && typeof v === 'object' && v.label) featuresLabels[k] = v.label;
        else featuresLabels[k] = k;
      });
    }

    // Persist a simple cache so other parts of the app can read features without refetching
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('businessFeaturesMap', JSON.stringify(featuresMap));
        localStorage.setItem('businessFeaturesLabels', JSON.stringify(featuresLabels));
        localStorage.setItem('businessFeaturesRaw', JSON.stringify(body));
      }
    } catch (err) {
      // ignore localStorage errors
    }

    return { featuresMap, featuresMenu: [], featuresLabels };
  } catch (error) {
    console.error('Failed to fetch business features:', error?.message || error);
    return { featuresMap: {}, featuresMenu: [], featuresLabels: {} };
  }
};

/**
 * Check if a feature is enabled. If `features` is not provided, read cache from localStorage.
 */
export const isFeatureEnabled = (features, featureName) => {
  let fmap = features;
  if (!fmap) {
    try {
      fmap = JSON.parse(localStorage.getItem('businessFeaturesMap') || '{}');
    } catch (err) {
      fmap = {};
    }
  }
  if (!featureName) return false;
  return !!fmap[featureName];
};

/**
 * Filter navigation items based on enabled features
 * This supports both flat nav items and groups (items arrays).
 */
export const filterNavigationByFeatures = (navItems, features) => {
  if (!navItems || !Array.isArray(navItems)) return [];

  // If no features loaded, show items as-is (fallback)
  const hasFeatureData = features && Object.keys(features).length > 0;

  const filterRecursive = (items) => {
    return items.reduce((acc, item) => {
      // If group, apply recursively to children
      if (item.items && Array.isArray(item.items)) {
        const children = filterRecursive(item.items);
        if (children.length > 0) acc.push({ ...item, items: children });
        return acc;
      }

      // Determine the feature key for this navigation item
      const key = getFeatureKeyForNavItem(item);

      // If we don't have feature data or item has no mapped key, keep item
      if (!hasFeatureData || !key) {
        acc.push(item);
        return acc;
      }

      // If the mapped key exists in features, gate by it
      if (Object.prototype.hasOwnProperty.call(features, key)) {
        if (isFeatureEnabled(features, key)) acc.push(item);
        return acc;
      }

      // If feature key not present in features, do NOT include the item (strict mode)
      return acc;
    }, []);
  };

  return filterRecursive(navItems);
};

/**
 * Filter navigation using the featuresMenu array returned from API.
 * It matches items by their `to` path and respects `enabled` flag.
 * Also supports nested groups by applying filtering recursively.
 */
export const filterNavigationByFeaturesMenu = (navItems, featuresMenu = [], featuresMap = {}, featuresLabels = {}) => {
  if (!Array.isArray(featuresMenu) || featuresMenu.length === 0) {
    // No menu data provided, fallback to featuresMap-based filtering
    return filterNavigationByFeatures(navItems, featuresMap);
  }

  const findMenuEntry = (to) => featuresMenu.find((m) => m && m.to === to);

  const filterRecursive = (items) => {
    return items.reduce((acc, item) => {
      // If group (has items), recurse into children
      if (item.items && Array.isArray(item.items)) {
        const children = filterRecursive(item.items);
        if (children.length > 0) {
          acc.push({ ...item, items: children });
        }
        return acc;
      }

      // For single nav item, try to find its entry in featuresMenu
      const entry = findMenuEntry(item.to);
      if (entry) {
        if (entry.enabled) acc.push(item);
        return acc;
      }

      // If not found in menu response, fallback to feature flag mapping
      const key = getFeatureKeyForNavItem(item);
      if (!key) {
        acc.push(item);
        return acc;
      }

      if (isFeatureEnabled(featuresMap, key)) acc.push(item);
      return acc;
    }, []);
  };

  return filterRecursive(navItems);
};
