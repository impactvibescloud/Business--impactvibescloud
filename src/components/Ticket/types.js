/**
 * @typedef {Object} TicketMessage
 * @property {string} _id
 * @property {string} ticketId
 * @property {Object} sender
 * @property {string} sender._id
 * @property {string} sender.name
 * @property {string} sender.email
 * @property {string} message
 * @property {string} statusUpdate
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Ticket
 * @property {string} id
 * @property {string} subject
 * @property {string} description
 * @property {string} [priority]
 * @property {string} [category]
 * @property {"Open" | "In Progress" | "Resolved" | "Closed"} status
 * @property {Object} createdBy
 * @property {string} createdBy._id
 * @property {string} createdBy.name
 * @property {string} createdBy.email
 * @property {Object} businessId
 * @property {string} businessId._id
 * @property {string} businessId.businessName
 * @property {string} createdAt
 * @property {string} resolvedAt
 * @property {string} assignedTo
 * @property {string} lastMessage
 * @property {string} updatedAt
 * @property {TicketMessage[]} [messages]
 */

export const statusMap = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed"
};

export const reverseStatusMap = {
  "Open": "open",
  "In Progress": "in_progress",
  "Resolved": "resolved",
  "Closed": "closed"
};

export const PAGE_SIZE = 10;
