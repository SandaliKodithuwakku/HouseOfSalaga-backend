const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Category = require('../models/Category');
const cloudinary = require('../config/cloudinary');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Current month stats
    const [
      currentMonthOrders,
      lastMonthOrders,
      currentMonthUsers,
      lastMonthUsers,
      totalProducts,
      totalReviews,
    ] = await Promise.all([
      Order.find({ createdAt: { $gte: startOfCurrentMonth } }),
      Order.find({ 
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
      }),
      User.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
      User.countDocuments({ 
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
      }),
      Product.countDocuments(),
      Review.countDocuments(),
    ]);

    // Calculate totals
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    
    const allOrders = await Order.find();
    const totalRevenue = allOrders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0) + (order.shippingFee || 0);
    }, 0);

    // Calculate current month revenue
    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0) + (order.shippingFee || 0);
    }, 0);

    // Calculate last month revenue
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0) + (order.shippingFee || 0);
    }, 0);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(1);
    };

    const revenueGrowth = calculateGrowth(currentMonthRevenue, lastMonthRevenue);
    const ordersGrowth = calculateGrowth(currentMonthOrders.length, lastMonthOrders.length);
    const usersGrowth = calculateGrowth(currentMonthUsers, lastMonthUsers);

    res.status(200).json({
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: {
        totalRevenue: totalRevenue.toFixed(2),
        revenueGrowth: revenueGrowth,
        totalOrders,
        ordersGrowth: ordersGrowth,
        totalProducts,
        productsGrowth: 0,
        totalUsers,
        usersGrowth: usersGrowth,
        totalReviews,
        reviewsGrowth: 0,
        currentMonthRevenue: currentMonthRevenue.toFixed(2),
        currentMonthOrders: currentMonthOrders.length,
        averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message,
    });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, sizes, colors, variants } = req.body;

    // Validation
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, description, price, category)',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload product image',
      });
    }

    // Find or create category
    let categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      categoryDoc = new Category({ name: category });
      await categoryDoc.save();
    }

    // Upload image to Cloudinary
    let uploadedImage = null;
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'house-of-salaga/products' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      uploadedImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (uploadError) {
      return res.status(400).json({
        success: false,
        message: 'Image upload failed',
        error: uploadError.message,
      });
    }

    // Parse sizes, colors, and variants from JSON strings
    let sizesArray = [];
    let colorsArray = [];
    let variantsArray = [];

    if (sizes) {
      try {
        sizesArray = JSON.parse(sizes);
      } catch (e) {
        sizesArray = [];
      }
    }

    if (colors) {
      try {
        colorsArray = JSON.parse(colors);
      } catch (e) {
        colorsArray = [];
      }
    }

    if (variants) {
      try {
        variantsArray = JSON.parse(variants);
      } catch (e) {
        variantsArray = [];
      }
    }

    // Calculate total stock from variants if provided, otherwise use base stock
    let totalStock = parseInt(stock) || 0;
    if (variantsArray.length > 0) {
      totalStock = variantsArray.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    }

    // Create product
    const product = new Product({
      name,
      description,
      price,
      category: categoryDoc._id,
      stock: totalStock,
      sizes: sizesArray,
      colors: colorsArray,
      variants: variantsArray,
      images: [uploadedImage],
      isNew: true,
      createdBy: req.user.userId,
    });

    await product.save();
    await product.populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding product',
      error: error.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, category, stock, sizes, colors, variants } = req.body;

    let product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (stock !== undefined) product.stock = stock;

    // Handle category - find or create like in addProduct
    if (category) {
      let categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        categoryDoc = new Category({ name: category });
        await categoryDoc.save();
      }
      product.category = categoryDoc._id;
    }

    // Update sizes if provided
    if (sizes) {
      try {
        product.sizes = JSON.parse(sizes);
      } catch (e) {
        // If parsing fails, keep existing
      }
    }

    // Update colors if provided
    if (colors) {
      try {
        product.colors = JSON.parse(colors);
      } catch (e) {
        // If parsing fails, keep existing
      }
    }

    // Update variants if provided
    if (variants) {
      try {
        const variantsArray = JSON.parse(variants);
        product.variants = variantsArray;
        // Recalculate total stock from variants
        product.stock = variantsArray.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      } catch (e) {
        // If parsing fails, keep existing
      }
    }

    // Handle image upload if new image provided
    if (req.file) {
      try {
        // Delete old image if exists
        if (product.images.length > 0) {
          await cloudinary.uploader.destroy(product.images[0].publicId);
        }

        // Upload new image
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'house-of-salaga/products' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        product.images = [
          {
            url: result.secure_url,
            publicId: result.public_id,
          },
        ];
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: 'Image upload failed',
          error: uploadError.message,
        });
      }
    }

    await product.save();
    await product.populate('category', 'name');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Delete images from Cloudinary
    for (const image of product.images) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: {
        users,
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
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name price')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: {
        orders,
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
      message: 'Error fetching orders',
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status',
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order',
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

    await Review.findByIdAndDelete(reviewId);

    // Update product average rating
    const reviews = await Review.find({ productId: review.productId });
    if (reviews.length > 0) {
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(review.productId, {
        averageRating: avgRating,
        totalReviews: reviews.length,
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

exports.getSalesReport = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'delivered' });

    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    res.status(200).json({
      success: true,
      message: 'Sales report',
      data: {
        totalSales,
        totalOrders,
        averageOrderValue,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message,
    });
  }
};