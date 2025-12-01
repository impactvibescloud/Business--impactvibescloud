# Feature-Based Navigation Filtering

This document explains how to configure feature-based menu filtering in the application.

## Overview

The application now supports **two-level menu filtering**:
1. **User-level filtering** (accessTo): Based on user role/permissions
2. **Business-level filtering** (features): Based on business subscription/feature flags

Both filters are applied in sequence. A menu item must pass BOTH checks to be visible.

## How It Works

### 1. Feature API
The system calls `/api/features/check/{businessId}` with the auth token to get allowed features for the business.

**Expected API Response Format:**
```json
{
  "success": true,
  "features": {
    "Dashboard": true,
    "Agents": true,
    "Department": true,
    "Call Logs": false,
    "Billing": true,
    // ... more features
  }
}
```

Or alternative format:
```json
{
  "success": true,
  "data": {
    "Dashboard": true,
    "Agents": true,
    // ...
  }
}
```

### 2. Navigation Configuration
To enable feature-based filtering for a menu item, add a `feature` property to the item in `src/_nav.js`:

```javascript
{
  component: CNavItem,
  name: "Call Logs",
  to: "/callogs",
  icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
  group: "Call Logs",
  feature: "CallLogs"  // Add this line
}
```

**Important Notes:**
- If a menu item does NOT have a `feature` property, it will **always be shown** (after passing accessTo check)
- The `feature` value should match the key in the features API response
- The `name` property is still used for `accessTo` filtering

### 3. Filtering Logic

The filtering happens in `src/components/AppSidebar.js` in two steps:

**Step 1 - User Access Filter:**
```javascript
if (userdata.accessTo[item.name]) {
  // User has access
}
```

**Step 2 - Business Features Filter:**
```javascript
if (!item.feature || features[item.feature]) {
  // Feature not required OR feature is enabled
}
```

## Configuration Examples

### Example 1: Feature-Gated Premium Feature
```javascript
{
  component: CNavItem,
  name: "Call Dispositions",
  to: "/reports/call-dispositions",
  icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
  group: "Data & Analytics",
  feature: "CallDispositions"  // Requires business to have this feature
}
```

### Example 2: Always-Available Core Feature
```javascript
{
  component: CNavItem,
  name: "Dashboard",
  to: "/dashboard",
  icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  group: "",
  // NO 'feature' property = always visible (if user has access)
}
```

### Example 3: Grouped Features
```javascript
{
  component: CNavGroup,
  name: "Reports & Analytics",
  icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
  feature: "ReportsAnalytics",  // Parent group can have feature gate
  items: [
    {
      component: CNavItem,
      name: "Department Performance",
      to: "/department-performance",
      feature: "DepartmentPerformance"  // Individual items can have their own gates
    },
    {
      component: CNavItem,
      name: "Agent Performance",
      to: "/agent-performance",
      feature: "AgentPerformance"
    }
  ]
}
```

## Fallback Behavior

- **If features API fails**: Navigation items are filtered by `accessTo` only (permissive fallback)
- **If features object is empty**: All items are shown (after `accessTo` check)
- **If businessId is missing**: Features fetch is skipped, falls back to `accessTo` only
- **If token is missing**: Features fetch is skipped, falls back to `accessTo` only

## Feature Mapping Recommendations

Suggested feature naming convention to match with menu items:

| Menu Item Name | Recommended Feature Key |
|----------------|-------------------------|
| Dashboard | Dashboard |
| Agents | Agents |
| Department | Department |
| Department Performance | DepartmentPerformance |
| Call Dispositions | CallDispositions |
| Call Logs | CallLogs |
| Call Uses | CallUses |
| Call Settings | CallSettings |
| IVR Management | IVRManagement |
| Virtual Numbers | VirtualNumbers |
| Contacts | Contacts |
| Contact Lists | ContactLists |
| Audio Campaign | AudioCampaign |
| Billing | Billing |
| Support Tickets | SupportTickets |

## Adding New Feature-Gated Items

1. Add the menu item to `src/_nav.js`
2. Include the `feature` property with the appropriate key
3. Ensure the backend `/api/features/check/{businessId}` includes this feature key in the response
4. Test with different business accounts to verify filtering works

## Debugging

Enable console logging to see features data:
```javascript
console.log('Business features loaded:', businessFeatures);
```

This log appears in `AppSidebar.js` when features are fetched.

Check browser console for warnings:
- `"Cannot fetch features: missing businessId or token"`
- `"Failed to fetch business features"`

## Testing Checklist

- [ ] User with all features enabled sees all items
- [ ] User with specific features disabled doesn't see those items
- [ ] Items without `feature` property are always visible
- [ ] Features API failure doesn't break navigation (falls back gracefully)
- [ ] Page refresh preserves feature filtering
- [ ] Different business accounts have different menu visibility
