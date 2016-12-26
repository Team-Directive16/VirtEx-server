'use strict';

var OrderAction = require('./order-action');

class Order {

    /**
     * Immutable order object
     *
     * @param {number}              id: order id
     * @param {number}           price: order price
     * @param {number}        quantity: order quantity
     * @param {OrderAction}     action: orders action (BID or ASK)
     * @param {string}         account: account order belongs to
     * @param {number} initialQuantity: initial order quantity
     */
    constructor(id, price, quantity, action, account, initialQuantity) {
        if (id == null) { // == match null and also undefined
            return new Error('Invalid order id');
        }

        if (price == null || isNaN(price)) {
            throw new Error('Invalid price');
        }

        if (quantity == null || isNaN(quantity) || quantity <= 0) {
            throw new Error('Invalid quantity', quantity);
        }

        if (action !== OrderAction.BID && action !== OrderAction.ASK) {
            throw new Error('Invalid order action');
        }

        if (account == null) {
            throw new Error('Invalid account');
        }

        this.id = id;
        this.price = price;
        this.quantity = quantity;
        this.action = action;
        this.account = account;
        this.initialQuantity = initialQuantity == null ? quantity : initialQuantity;

        this.created = -1 * Date.now(); // -1 simmplified sorting in reversed order

        Object.freeze(this); // immutable
    }

    /**
     * If order is a bid order
     *
     * @returns {boolean} true if order is a bid order, otherwise false
     */
    isBid() {
        return this.action === OrderAction.BID;
    }

    /**
     * Returns true if order can be matched with given counterpart
     *
     * @param {Order} order: counterpart order
     *
     * @returns {boolean} true if can be matched, otherwise false
     */
    canMatch(order) {
        if (this.isBid() === order.isBid()) {
            return false; // can't match two BID or two ASK orders
        }

        if (this.isBid()) {
            return this.price >= order.price; // this (BID) >= order (ASK)
        }

        // ASK
        return this.price <= order.price; // this (ASK) <= order (BID)
    }

    /**
     * Returns true if this order has a better price than given counterpart order
     *
     * @param {Order} order: counterpart order
     *
     * @returns {boolean} true if better price
     */
    hasBetterPrice(order) {
        if (this.isBid() !== order.isBid()) {
            throw new Error('Cannot compare prices between orders with different actions');
        }

        if (this.isBid()) {
            return this.price >= order.price;
        }

        // ASK
        return this.price <= order.price;
    }

    /**
     * Returns new order object with reduced quantity
     *
     * @param {number} amount: amount to reduce existing quantity by
     *
     * @returns {Order} new order object with reduced quantity
     */
    reduceQuantity(amount) {
        return new Order(this.id, this.price, this.quantity - amount, this.action, this.account, this.initialQuantity);
    }
}

module.exports = Order;