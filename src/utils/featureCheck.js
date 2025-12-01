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
      return {};
    }

    const response = await axios.get(`/api/features/check/${businessId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.success) {
      return response.data.features || response.data.data || {};
    }

    return {};
  } catch (error) {
    console.error('Failed to fetch business features:', error);
    return {};
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
