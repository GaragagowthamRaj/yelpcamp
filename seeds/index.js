const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp')
    .then(() => console.log("Connected"))
    .catch(err => console.log(err));

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 30) + 10;
        const camp = new Campground({
            author: '68c2dd093f83734d5e587e66',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'best experince in this place enjoy the view and experince is awsome',
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/dtur0szub/image/upload/v1757926503/YelpCamp/mnfnlnq82d34xiwv6qmf.jpg',
                    filename: 'YelpCamp/mnfnlnq82d34xiwv6qmf',
                },
                {
                    url: 'https://res.cloudinary.com/dtur0szub/image/upload/v1757926504/YelpCamp/etmtmtvu1nyesttz8i0x.jpg',
                    filename: 'YelpCamp/etmtmtvu1nyesttz8i0x',
                }
            ]
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})
