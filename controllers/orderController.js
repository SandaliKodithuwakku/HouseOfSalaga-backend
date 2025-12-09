const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

exports.createOrder = async (req, res) => {
  try {
    const { deliveryAddress, phoneNumber, paymentMethod, cartItems } = req.body;

    if (!deliveryAddress || !phoneNumber || !cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    let totalAmount = 0;
    const processedItems = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      totalAmount += product.price * item.quantity;
      processedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    const shippingFee = 50;
    const order = new Order({
    userId: req.user.userId,
    items: processedItems,
    totalAmount,
    shippingFee,
    deliveryAddress,
    phoneNumber,
    paymentMethod: paymentMethod || 'cash_on_delivery',
  });
      await order.save();
    await order.populate('userId', 'email name');

    // Clear cart
    await Cart.findOneAndUpdate({ userId: req.user.userId }, { items: [] });

    // Send confirmation email
    await sendOrderConfirmationEmail(order.userId.email, {
      orderId: order._id,
      totalAmount: order.totalAmount + order.shippingFee,
      deliveryAddress,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId: req.user.userId })
      .populate('items.productId', 'name price images')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({ userId: req.user.userId });

    res.status(200).json({
      success: true,
      message: 'Orders fetched',
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

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('items.productId', 'name price images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (!order.userId.equals(req.user.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order fetched',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message,
    });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select('status trackingNumber createdAt');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (!order.userId.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order tracking',
      data: {
        orderId: order._id,
        status: order.status,
        trackingNumber: order.trackingNumber || 'N/A',
        orderDate: order.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error tracking order',
      error: error.message,
    });
  }
};