# Feature Mapping Reference

This document shows the mapping between navigation menu items and feature flags from the `/api/features/check/{businessId}` API.

## Current Feature Mappings

| Menu Item | Feature Flag | Currently Enabled (Test Business) |
|-----------|--------------|-----------------------------------|
| Dashboard | *(none - always visible)* | ✓ Always shown |
| Agents | *(none - always visible)* | ✓ Always shown |
| Department | *(none - always visible)* | ✓ Always shown |
| **Department Performance** | `advancedReporting` | ❌ Hidden (false) |
| **Call Dispositions** | `advancedDispositions` | ❌ Hidden (false) |
| **Reports & Analytics** | `analytics` | ❌ Hidden (false) |
| **Agent Performance** | `advancedReporting` | ❌ Hidden (false) |
| **Call Logs** | `callRecording` | ❌ Hidden (false) |
| Call Uses | *(none - always visible)* | ✓ Always shown |
| Call Settings | *(none - always visible)* | ✓ Always shown |
| **IVR Management** | `ivrManagement` | ❌ Hidden (false) |
| Virtual Numbers | *(none - always visible)* | ✓ Always shown |
| Contacts | *(none - always visible)* | ✓ Always shown |
| Contact Lists | *(none - always visible)* | ✓ Always shown |
| **Audio Campaign** | `bulkOperations` | ❌ Hidden (false) |
| Billing | *(none - always visible)* | ✓ Always shown |
| **Support Tickets** | `ticketing` | ❌ Hidden (false) |

## API Response Structure

```json
{
  "success": true,
  "businessId": "68d3c1bbcf0bcde3eac2606b",
  "features": {
    "ivrManagement": false,
    "callRecording": false,
    "advancedReporting": false,
    "apiAccess": false,
    "customIntegrations": false,
    "whiteLabeling": false,
    "bulkOperations": false,
    "advancedDispositions": false,
    "sipTrunking": false,
    "callTransfer": false,
    "voicemail": false,
    "smsIntegration": false,
    "clickToCall": false,
    "callQueue": false,
    "ringGroups": false,
    "conferencing": false,
    "analytics": false,
    "crm": false,
    "ticketing": false,
    "customFields": false
  }
}
```

## How It Works

1. **AppSidebar** fetches features from `/api/features/check/{businessId}` on mount
2. Navigation items with a `feature` property are checked against the API response
3. If `features[item.feature] === false`, the menu item is **hidden**
4. If `features[item.feature] === true`, the menu item is **shown**
5. Items without a `feature` property are **always visible**

## Testing the Fix

With the current API response (all features false), the following items should be **hidden**:
- ❌ IVR Management
- ❌ Department Performance
- ❌ Call Dispositions
- ❌ Reports & Analytics
- ❌ Agent Performance
- ❌ Call Logs
- ❌ Audio Campaign
- ❌ Support Tickets

And these should remain **visible**:
- ✓ Dashboard
- ✓ Agents
- ✓ Department
- ✓ Call Uses
- ✓ Call Settings
- ✓ Virtual Numbers
- ✓ Contacts
- ✓ Contact Lists
- ✓ Billing

## Enabling Features

To enable a feature for a business, update the feature flag in the backend:

```json
{
  "features": {
    "ivrManagement": true,  // This will show IVR Management menu item
    // ...
  }
}
```

## Adding New Feature-Gated Items

To add a new menu item with feature gating:

```javascript
{
  component: CNavItem,
  name: "My New Feature",
  icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
  to: "/my-feature",
  group: "Features",
  feature: "myNewFeature",  // Add this line
}
```

Then ensure the backend API includes `myNewFeature` in the response.
