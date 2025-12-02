import axios from 'axios';

/**
 * Fetch allowed features for a business
 * @param {string} businessId - The business ID
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - Object with feature flags
 */
export const getBusinessFeatures = async (businessId, token) => {
  try {
    if (!businessId) {
      console.warn('featureCheck: No businessId provided');
      return { featuresMap: {}, featuresMenu: [] };
    }

    const response = await axios.get(`/api/features/check/${businessId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.success) {
      // Normalize response to include both a feature map and a featuresMenu array
      const featuresMap = response.data.features || response.data.data || {};
      const featuresMenu = response.data.featuresMenu || [];
      return { featuresMap, featuresMenu };
    }

    return { featuresMap: {}, featuresMenu: [] };
  } catch (error) {
    console.error('Failed to fetch business features:', error);
    return { featuresMap: {}, featuresMenu: [] };
  }
};

/**
 * Check if a feature is enabled
 * @param {Object} features - Features object from API
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean}
 */
export const isFeatureEnabled = (features, featureName) => {
  if (!features || typeof features !== 'object') return false;
  return !!features[featureName];
};

/**
 * Filter navigation items based on enabled features
 * @param {Array} navItems - Navigation items array
 * @param {Object} features - Features object from API
 * @returns {Array} - Filtered navigation items
 */
export const filterNavigationByFeatures = (navItems, features) => {
  if (!features || Object.keys(features).length === 0) {
    // If no features loaded, show all items (fallback)
    return navItems;
  }

  return navItems.filter((item) => {
    // If item has no feature requirement, always show it
    if (!item.feature) return true;
    
    // Check if the feature is enabled
    return isFeatureEnabled(features, item.feature);
  });
};

/**
 * Filter navigation using the featuresMenu array returned from API.
 * It matches items by their `to` path and respects `enabled` flag.
 * Also supports nested groups by applying filtering recursively.
 */
export const filterNavigationByFeaturesMenu = (navItems, featuresMenu = [], featuresMap = {}) => {
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
      if (!item.feature) {
        acc.push(item);
        return acc;
      }

      if (isFeatureEnabled(featuresMap, item.feature)) acc.push(item);
      return acc;
    }, []);
  };

  return filterRecursive(navItems);
};
