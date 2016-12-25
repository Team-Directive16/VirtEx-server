class Trade {

    /**
     * Immutable trade object
     *
     * @param {number}          price: trade price
     * @param {number}       quantity: trade quantity
     * @param {OrderAction} aggressor: trade aggressor
     */
    constructor(price, quantity, aggressor) {
        this.price = price;
        this.quantity = quantity;
        this.aggressor = aggressor;

        this.created = Date.now();

        Object.freeze(this); // immutable
    }
}

module.exports = Trade;