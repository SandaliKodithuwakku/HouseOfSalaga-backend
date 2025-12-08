const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getProductReviews = async (req, res) => {
  try {
    const { productId, page = 1, limit = 10 } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID required',
      });
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ productId })
      .populate('userId', 'name')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments({ productId });

    res.status(200).json({
      success: true,
      message: 'Reviews fetched',
      data: {
        reviews,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message,
    });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment } = req.body;

    // Validation
    if (!productId || !orderId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Verify order exists and user purchased the product
    const order = await Order.findById(orderId);
    if (!order || !order.userId.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products from your orders',
      });
    }

    const productInOrder = order.items.some((item) => item.productId.equals(productId));
    if (!productInOrder) {
      return res.status(403).json({
        success: false,
        message: 'Product not found in your order',
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ productId, userId: req.user.userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    const review = new Review({
      productId,
      userId: req.user.userId,
      orderId,
      rating,
      title,
      comment,
    });

    await review.save();
    await review.populate('userId', 'name');

    // Update product average rating
    const reviews = await Review.find({ productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, {
      averageRating: avgRating,
      totalReviews: reviews.length,
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message,
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (!review.userId.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review',
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;

    await review.save();
    await review.populate('userId', 'name');

    // Update product average rating
    const reviews = await Review.find({ productId: review.productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(review.productId, {
      averageRating: avgRating,
      totalReviews: reviews.length,
    });

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message,
    });
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId: req.user.userId })
      .populate('productId', 'name images price')
      .populate('orderId', '_id')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Review.countDocuments({ userId: req.user.userId });

    res.status(200).json({
      success: true,
      message: 'User reviews fetched successfully',
      data: {
        reviews,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message,
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (!review.userId.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(reviewId);

    // Update product average rating
    const reviews = await Review.find({ productId });
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(productId, {
        averageRating: avgRating,
        totalReviews: reviews.length,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        totalReviews: 0,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message,
    });
  }
};