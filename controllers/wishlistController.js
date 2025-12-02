const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.userId }).populate(
      'items.productId',
      'name price images averageRating'
    );

    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.userId, items: [] });
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Wishlist fetched',
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
      error: error.message,
    });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID required',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user.userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.userId, items: [] });
    }

    const exists = wishlist.items.some((item) => item.productId.equals(productId));
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist',
      });
    }

    wishlist.items.push({ productId });
    await wishlist.save();
    await wishlist.populate('items.productId', 'name price images averageRating');

    res.status(200).json({
      success: true,
      message: 'Added to wishlist',
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to wishlist',
      error: error.message,
    });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { wishlistItemId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user.userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    wishlist.items.id(wishlistItemId).deleteOne();
    await wishlist.save();
    await wishlist.populate('items.productId', 'name price images averageRating');

    res.status(200).json({
      success: true,
      message: 'Removed from wishlist',
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist',
      error: error.message,
    });
  }
};