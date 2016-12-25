'use strict';

class AggregatedOrderBook {

    constructor() {
        this.orderBook = {};
    }

    add(order) {
        var type;

        if (this.orderBook[order.price]) {
            type = 'change';
            this.orderBook[order.price] += order.quantity;
        } else {
            type = 'new';
            this.orderBook[order.price] = order.quantity;
        }

        return {
            type: type,
            data: {
                price: order.price,
                quantity: this.orderBook[order.price]
            }
        };
    }

    reduce(price, quantity) {
        this.orderBook[price] -= quantity;

        if (this.orderBook[price] === 0) {
            Reflect.deleteProperty(this.orderBook, price);

            return {
                type: 'removal',
                data: {
                    price: price
                }
            };
        }

        return {
            type: 'change',
            data: {
                price: price,
                quantity: this.orderBook[price]
            }
        };
    }
}

module.exports = AggregatedOrderBook;