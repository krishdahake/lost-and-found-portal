const express = require('express');
const path = require('path');
const fs = require('fs');
const FoundItem = require('../models/FoundItem');
const auth = require('../middleware/auth');
const requireStaff = require('../middleware/requireStaff');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   POST /api/items/private
// @desc    Submit a new private/valuable item request
// @access  Private (Students or Staff)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const {
      itemName,
      description,
      foundLocation,
      foundDate,
      foundTime,
      category,
      identifyingCharacteristics,
      estimatedValue,
      additionalNotes
    } = req.body;

    // Validation
    if (!itemName || !description || !foundLocation || !foundDate || !foundTime) {
      return res.status(400).json({ message: 'Please provide all required fields (Item Name, Description, Location, Date, Time)' });
    }

    // Image is optional for private items
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const privateItem = new FoundItem({
      itemName,
      description,
      imageUrl,
      foundLocation,
      foundDate: new Date(foundDate),
      foundTime,
      category: category || 'others',
      uploadedBy: req.userId,
      reportType: 'PRIVATE',
      privateStatus: 'SUBMITTED',
      identifyingCharacteristics: identifyingCharacteristics || '',
      estimatedValue: estimatedValue || '',
      additionalNotes: additionalNotes || '',
      statusHistory: [{
        status: 'SUBMITTED',
        changedBy: req.userId,
        changedAt: new Date(),
        note: 'Private request submitted by user'
      }]
    });

    await privateItem.save();
    await privateItem.populate('uploadedBy', 'name email userType');

    res.status(201).json({
      message: 'Private item request submitted securely. Staff will review your submission.',
      item: privateItem
    });
  } catch (error) {
    console.error('Submit private item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/items/private/my-requests
// @desc    Get current user's private item requests
// @access  Private
router.get('/my-requests', auth, async (req, res) => {
  try {
    const items = await FoundItem.find({
      uploadedBy: req.userId,
      reportType: 'PRIVATE'
    })
      .populate('uploadedBy', 'name email userType')
      .populate('reviewedBy', 'name email')
      .populate('returnedBy', 'name email')
      .populate('statusHistory.changedBy', 'name email userType')
      .sort({ createdAt: -1 });

    // Hide staff-internal notes from student view
    const sanitizedItems = items.map(item => {
      const doc = item.toObject();
      if (req.user.userType !== 'staff') {
        delete doc.staffNote;
      }
      return doc;
    });

    res.json({ items: sanitizedItems });
  } catch (error) {
    console.error('Get my private requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/items/private/staff/all
// @desc    Get all private item requests for staff management
// @access  Private (Staff only)
router.get('/staff/all', auth, requireStaff, async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 15 } = req.query;

    let query = { reportType: 'PRIVATE' };

    if (status && status !== 'ALL') {
      query.privateStatus = status;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search) {
      query.$and = [
        { reportType: 'PRIVATE' },
        {
          $or: [
            { itemName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { foundLocation: { $regex: search, $options: 'i' } },
            { identifyingCharacteristics: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await FoundItem.find(query)
      .populate('uploadedBy', 'name email userType rollNumber department')
      .populate('reviewedBy', 'name email')
      .populate('returnedBy', 'name email')
      .populate('statusHistory.changedBy', 'name email userType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FoundItem.countDocuments(query);

    // Summary counts for dashboard badges
    const statusCounts = await FoundItem.aggregate([
      { $match: { reportType: 'PRIVATE' } },
      { $group: { _id: '$privateStatus', count: { $sum: 1 } } }
    ]);

    const countsMap = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      FOUND: 0,
      READY_FOR_COLLECTION: 0,
      RETURNED: 0,
      REJECTED: 0,
      TOTAL: total
    };

    statusCounts.forEach(sc => {
      if (countsMap[sc._id] !== undefined) {
        countsMap[sc._id] = sc.count;
      }
    });

    res.json({
      items,
      counts: countsMap,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Staff get private items error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/items/private/:id
// @desc    Get single private request detail
// @access  Private (Owner or Staff)
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await FoundItem.findById(req.params.id)
      .populate('uploadedBy', 'name email userType rollNumber department phone')
      .populate('reviewedBy', 'name email')
      .populate('returnedBy', 'name email')
      .populate('statusHistory.changedBy', 'name email userType');

    if (!item || item.reportType !== 'PRIVATE') {
      return res.status(404).json({ message: 'Private request not found' });
    }

    // Access control: only owner or staff can view
    const isOwner = item.uploadedBy._id.toString() === req.userId.toString();
    const isStaff = req.user.userType === 'staff';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view this request' });
    }

    const doc = item.toObject();
    if (!isStaff) {
      delete doc.staffNote;
    }

    res.json(doc);
  } catch (error) {
    console.error('Get private request detail error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/items/private/:id/status
// @desc    Update private request status & add timeline entry
// @access  Private (Staff only)
router.put('/:id/status', auth, requireStaff, async (req, res) => {
  try {
    const { status, note, staffNote, studentMessage, depositLocation } = req.body;

    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'FOUND', 'READY_FOR_COLLECTION', 'RETURNED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }

    const item = await FoundItem.findById(req.params.id);

    if (!item || item.reportType !== 'PRIVATE') {
      return res.status(404).json({ message: 'Private request not found' });
    }

    item.privateStatus = status;

    if (staffNote !== undefined) {
      item.staffNote = staffNote;
    }

    if (studentMessage !== undefined) {
      item.studentMessage = studentMessage;
    }

    if (depositLocation) {
      item.depositLocation = depositLocation;
    }

    if (status === 'UNDER_REVIEW' || status === 'FOUND') {
      item.reviewedBy = req.userId;
      item.reviewedAt = new Date();
    }

    if (status === 'RETURNED') {
      item.returnedBy = req.userId;
      item.returnedAt = new Date();
    }

    item.statusHistory.push({
      status,
      changedBy: req.userId,
      changedAt: new Date(),
      note: note || `Status changed to ${status} by staff`
    });

    await item.save();
    await item.populate('uploadedBy', 'name email userType rollNumber department');
    await item.populate('reviewedBy', 'name email');
    await item.populate('returnedBy', 'name email');
    await item.populate('statusHistory.changedBy', 'name email userType');

    res.json({
      message: `Status successfully updated to ${status}`,
      item
    });
  } catch (error) {
    console.error('Update private status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/items/private/:id/notes
// @desc    Update staff note and/or student message
// @access  Private (Staff only)
router.put('/:id/notes', auth, requireStaff, async (req, res) => {
  try {
    const { staffNote, studentMessage } = req.body;

    const item = await FoundItem.findById(req.params.id);

    if (!item || item.reportType !== 'PRIVATE') {
      return res.status(404).json({ message: 'Private request not found' });
    }

    if (staffNote !== undefined) item.staffNote = staffNote;
    if (studentMessage !== undefined) item.studentMessage = studentMessage;

    await item.save();
    await item.populate('uploadedBy', 'name email userType');
    await item.populate('reviewedBy', 'name email');
    await item.populate('returnedBy', 'name email');
    await item.populate('statusHistory.changedBy', 'name email userType');

    res.json({
      message: 'Notes updated successfully',
      item
    });
  } catch (error) {
    console.error('Update notes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/items/private/:id
// @desc    Cancel or delete private request (Owner if SUBMITTED, or Staff anytime)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await FoundItem.findById(req.params.id);

    if (!item || item.reportType !== 'PRIVATE') {
      return res.status(404).json({ message: 'Private request not found' });
    }

    const isOwner = item.uploadedBy.toString() === req.userId.toString();
    const isStaff = req.user.userType === 'staff';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    // Owner can only cancel if still in SUBMITTED state
    if (isOwner && !isStaff && item.privateStatus !== 'SUBMITTED') {
      return res.status(400).json({
        message: 'Cannot cancel request once it has been taken under review by staff. Please contact staff directly.'
      });
    }

    await item.deleteOne();

    res.json({ message: 'Private request deleted successfully' });
  } catch (error) {
    console.error('Delete private request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
