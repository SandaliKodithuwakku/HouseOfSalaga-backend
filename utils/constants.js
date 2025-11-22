const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

const PAYMENT_METHODS = {
  CASH_ON_DELIVERY: 'cash_on_delivery',
};

const DEFAULT_SHIPPING_FEE = 50;

module.exports = {
  ORDER_STATUS,
  USER_ROLES,
  PAYMENT_METHODS,
  DEFAULT_SHIPPING_FEE,
};