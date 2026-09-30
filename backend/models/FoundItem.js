const mongoose = require('mongoose');

// Found Item Schema (3NF: No transitive dependency)
// Location is normalized to avoid redundancy
const foundItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: false // Optional for private items
  },
  // Location where item was found/lost
  foundLocation: {
    type: String,
    required: true,
    trim: true
  },
  // Date and time when item was found/lost
  foundDate: {
    type: Date,
    required: true
  },
  foundTime: {
    type: String,
    required: true
  },
  // Location where item is deposited (optional for private requests)
  depositLocation: {
    type: String,
    required: false,
    trim: true
  },
  // Reference to user who uploaded (foreign key - normalized)
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Report type: NORMAL (public) or PRIVATE (valuable/sensitive)
  reportType: {
    type: String,
    enum: ['NORMAL', 'PRIVATE'],
    default: 'NORMAL'
  },
  // Status of the item (used for NORMAL items)
  status: {
    type: String,
    enum: ['available', 'claimed', 'returned'],
    default: 'available'
  },
  // Private request status lifecycle (used only for PRIVATE items)
  privateStatus: {
    type: String,
    enum: ['SUBMITTED', 'UNDER_REVIEW', 'FOUND', 'READY_FOR_COLLECTION', 'RETURNED', 'REJECTED'],
    default: 'SUBMITTED'
  },
  // Category for better organization
  category: {
    type: String,
    enum: ['electronics', 'documents', 'accessories', 'clothing', 'books', 'others'],
    default: 'others'
  },
  // === PRIVATE-SPECIFIC FIELDS ===
  // Identifying characteristics for private items
  identifyingCharacteristics: {
    type: String,
    trim: true
  },
  // Approximate value/range
  estimatedValue: {
    type: String,
    trim: true
  },
  // Additional notes from requester
  additionalNotes: {
    type: String,
    trim: true
  },
  // Internal staff note (NOT visible to students)
  staffNote: {
    type: String,
    trim: true
  },
  // Student-facing update/message from staff
  studentMessage: {
    type: String,
    trim: true
  },
  // Status history for audit trail
  statusHistory: [{
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true }
  }],
  // Audit fields for private workflow
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  returnedAt: {
    type: Date
  },
  // Claim Details - stored when someone claims the item (NORMAL items only)
  claimDetails: {
    claimantName: {
      type: String,
      trim: true
    },
    claimantEmail: {
      type: String,
      trim: true
    },
    claimantPhone: {
      type: String,
      trim: true
    },
    claimantId: {
      type: String,
      trim: true
    },
    ownershipProof: {
      type: String,
      trim: true
    },
    claimedAt: {
      type: Date
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
foundItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
foundItemSchema.index({ status: 1, createdAt: -1 });
foundItemSchema.index({ category: 1 });
foundItemSchema.index({ reportType: 1 });
foundItemSchema.index({ reportType: 1, privateStatus: 1 });
foundItemSchema.index({ reportType: 1, uploadedBy: 1 });

const FoundItem = mongoose.model('FoundItem', foundItemSchema);

module.exports = FoundItem;
