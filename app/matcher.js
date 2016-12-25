'use strict';

var EventEmitter = require('events');
var Trade = require('./trade/trade');

class Matcher extends EventEmitter {
    constructor() {
        super();

        this.bidOrders = []; // sorted lowest to highest price (best offer)
        this.askOrders = []; // sorted highest to lowest price (best offer)
    }

    /**
     * Attempts to match new order with existing orders, otherwise adds it to be matched
     *
     * @param {Order} newOrder:
     *
     * @returns {void}
     */
    onNewOrder(newOrder) {
        var order = this.match(newOrder, newOrder.isBid() ? this.askOrders : this.bidOrders);

        if (order) {
            let index = 0;
            let orders = order.isBid() ? this.bidOrders : this.askOrders;

            // console.log('1.before: ', orders);

            while (!!orders[index] && orders[index].hasBetterPrice(order)) {
                index++;
            }

            this.emit('new-order', order);
            orders.splice(index, 0, order);

            // console.log('2.after: ', orders);
        }
    }

    /**
     * Matches an order with potential candidate orders
     *
     * @param {Order}         toMatch: new order that needs a match
     * @param {Array} candidateOrders: potential orders that can be matched
     *
     * @returns {order} null if order has been fully matched, otherwise remaining part of the order
     */
    match(toMatch, candidateOrders) {
        var order = toMatch;

        while (!!candidateOrders[0] && order.canMatch(candidateOrders[0])) {
            let existingOrder = candidateOrders[0];
            let matchedQuantity = Math.min(order.quantity, existingOrder.quantity);

            // match at existing order's price, and lowest quantity
            this.emit('new-trade', new Trade(existingOrder.price, matchedQuantity, order.action));

            if (order.quantity >= existingOrder.quantity) {
                this.emit('matched-order', existingOrder);
                candidateOrders.splice(0, 1); // existing fully matched, remove

                if (order.quantity === existingOrder.quantity) {
                    return null; // new order fully matched
                }

                order = order.reduceQuantity(existingOrder.quantity); // returns new order
            } else {
                candidateOrders[0] = existingOrder.reduceQuantity(order.quantity); // existing order partially matched
                this.emit('partially-matched-order', candidateOrders[0], existingOrder, matchedQuantity);

                return null; // new order fully matched
            }
        }

        return order;
    }
}

module.exports = Matcher;