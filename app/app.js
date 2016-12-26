'use strict';

// Initialize Firebase
let config = {};
if (process.env.NODE_ENV === 'PRODUCTION') {
    config.apiKey = process.env.apiKey;
    config.authDomain = process.env.authDomain;
    config.databaseURL = process.env.databaseURL;
    config.storageBucket = process.env.storageBucket;
    config.messagingSenderId = process.env.messagingSenderId;
} else {
    config = require('../virtex-firebase-service-account');
}

let firebase = require('firebase').initializeApp(config);
let ref = firebase.database().ref();
let tradesRef = ref.child('trade-history');

let app = require('http').createServer();
let io = require('socket.io')(app);

const port = process.env.PORT || 8081;
app.listen(port, () => {
    console.log(`server listening on port:${port}`);
});

let Order = require('./order/order');
let AggregatedOrderBook = require('./order-book/aggregated');
let PrivateOrderBooks = require('./order-book/private');
let Matcher = require('./matcher');

let matcher = new Matcher();
let orderID = 0;

let data = {
    bidAggregatedOrderBook: new AggregatedOrderBook(),
    askAggregatedOrderBook: new AggregatedOrderBook(),
    privateOrderBook: new PrivateOrderBooks(),
    tradeHistory: []
};

matcher.on('new-trade', function (trade) {
    data.tradeHistory.unshift(trade);
    io.to('trade-history').emit('trade-history', 'new', trade);
});

matcher.on('new-order', function (order) {
    console.log('matcher: new order', order.id, order.price, order.quantity, order.action, order.account);

    data.privateOrderBook.add(order);
    io.to('account-' + order.account).emit('private-order-book', 'added', order);

    let update = order.isBid() ? data.bidAggregatedOrderBook.add(order) : data.askAggregatedOrderBook.add(order);
    io.to('aggregated-order-book').emit('aggregated-order-book', update.type, order.action, update.data);
});

matcher.on('matched-order', function (order) {
    console.log('matcher: matched order', order.id, order.price, order.quantity);

    data.privateOrderBook.remove(order);
    io.to('account-' + order.account).emit('private-order-book', 'removed', order);

    let update = order.isBid() ? data.bidAggregatedOrderBook.reduce(order.price, order.quantity)
        : data.askAggregatedOrderBook.reduce(order.price, order.quantity);
    io.to('aggregated-order-book').emit('aggregated-order-book', update.type, order.action, update.data);
});

matcher.on('partially-matched-order', function (newOrder, oldOrder, matchedQuantity) {
    console.log('matcher: partially-matched-order', newOrder.id, newOrder.price, newOrder.quantity, newOrder.action, newOrder.account);

    data.privateOrderBook.change(newOrder, oldOrder);
    io.to('account-' + newOrder.account).emit('private-order-book', 'changed', newOrder);

    let update = newOrder.isBid() ? data.bidAggregatedOrderBook.reduce(newOrder.price, matchedQuantity)
        : data.askAggregatedOrderBook.reduce(newOrder.price, matchedQuantity);
    io.to('aggregated-order-book').emit('aggregated-order-book', update.type, newOrder.action, update.data);
});

io.on('connection', function (socket) {
    console.log('new connection', socket.id);

    socket.on('order', function (order) {

        order.price = parseFloat(order.price);
        order.quantity = parseFloat(order.quantity);

        matcher.onNewOrder(new Order(++orderID, order.price, order.quantity, order.action, order.account));
    });

    socket.on('aggregated-order-book', function () {
        socket.join('aggregated-order-book');
        socket.emit('aggregated-order-book', 'initial', 'bid', data.bidAggregatedOrderBook.orderBook);
        socket.emit('aggregated-order-book', 'initial', 'ask', data.askAggregatedOrderBook.orderBook);
    });

    socket.on('private-order-book', function (account) {
        console.log('private order book', account, data.privateOrderBook.get(account).length, 'orders');

        for (let i = 0; i < socket.rooms.length; i++) {
            if (/^account-/.test(socket.rooms[i])) {
                socket.leave(socket.rooms[i]);
            }
        }

        socket.join('account-' + account);

        socket.emit('private-order-book', 'initial', data.privateOrderBook.get(account));
    });

    socket.on('trade-history', function () {
        socket.join('trade-history');
        socket.emit('trade-history', 'initial', data.tradeHistory);
    });

    socket.on('disconnect', () => console.log('Client disconnected'));
});