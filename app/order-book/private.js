'use strict';

class PrivateOrderBooks {

    constructor() {
        this.orderBookMap = {}; // account --> order book
    }

    get(account) {
        return this.orderBookMap[account] || [];
    }

    add(order) {
        if (!this.orderBookMap[order.account]) {
            this.orderBookMap[order.account] = [];
        }

        this.orderBookMap[order.account].push(order);
    }

    change(newOrder, oldOrder) {
        var index = this.orderBookMap[newOrder.account].indexOf(oldOrder);
        this.orderBookMap[newOrder.account].splice(index, 1, newOrder);
    }

    remove(order) {
        var index = this.orderBookMap[order.account].indexOf(order);
        this.orderBookMap[order.account].splice(index, 1);
    }
}

module.exports = PrivateOrderBooks;