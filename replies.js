const rp = require('request-promise');
const moment = require('moment');
const googleKey = process.env.GOOGLE_API_KEY;
const darkSkyKey = process.env.DARKSKY_API_KEY;

const today = moment().unix();
const tenYearsAgo = moment().subtract(10, 'years').unix();

const cities = require('./data/climacticCities'); 

const googleAPICall = placename => {
	const locationQueryString = placename.replace(/[-!#$%^&*()_+|~=`{}\[\]:";'<>?\s]/g, '').replace(',', ',+');
	const googleOptions = {
		uri: `https://maps.googleapis.com/maps/api/geocode/json?address=${locationQueryString}&key=${googleKey}`,
		headers: {
				'User-Agent': 'Request-Promise'
		},
		json: true 
	};
	return rp(googleOptions);
};

const getGoogleCoords = incomingTweet => {
	// gets longitude and latitude for location through google geocode API. picks a random city to retrieve data for if the tweet being processed doesn't include location data

	let place = incomingTweet.place 
		? incomingTweet.place 
		: cities[Math.floor(Math.random() * cities.length)]; 
	return googleAPICall(place)
	.then(response => new Promise((resolve, reject) => {
			if (response.results.length) resolve(Object.assign({}, response.results[0].geometry.location, { place }));
			else {
				place = cities[Math.floor(Math.random() * cities.length)];
				return googleAPICall(place)
					.then(response => resolve(Object.assign({}, response.results[0].geometry.location, { place })))
			}
		})
	)
};

// gets historical weather given a coordinates and a unix-formatted time
const makeDarkSkyOptions = (lat, lng, date) => ({
	uri: `https://api.darksky.net/forecast/${darkSkyKey}/${lat},${lng},${date}`,
	headers: {
		'User-Agent': 'Request-Promise'
	},
	json: true 
});

const weatherReply = incomingTweet => 
	
	getGoogleCoords(incomingTweet)
	.then(({ lat, lng, place }) => 
		//gets current forecast + forecast from 10y ago
		Promise.all([
			rp(makeDarkSkyOptions(lat, lng, tenYearsAgo)), 
			rp(makeDarkSkyOptions(lat, lng, today))
		])
	// calculates average temperature on given day from max + min temp
		.then(data => data.map(d => (d.daily.data[0].temperatureMin + d.daily.data[0].temperatureMax) / 2))
		.then(([prevTemp, newTemp]) => ({
			pctChange: ((newTemp - prevTemp) / prevTemp * 100).toFixed(1),
			prevTemp, 
			newTemp
		}))
		.then(({ prevTemp, newTemp, pctChange }) => {
			pctChange = pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`;
			const content = `Hi @${incomingTweet.screen_name}. Avg temp in ${place} 10 yrs ago was ${prevTemp.toFixed(1)}°F; today it is ${newTemp.toFixed(1)}°F. (${pctChange} change)`
			return ({
				tweetIdToReplyTo: incomingTweet.id,
				content,
			});
		}))
	.catch(e => console.log(e));

const infoReply = incomingTweet => {
	var content = `Thanks for your interest in climate change, @${incomingTweet.screen_name}. For more information, please see http://bit.ly/2gecocA. Have a beautiful day!`;
	return ({
		tweetIdToReplyTo: incomingTweet.id,
		content, 
	});
};

module.exports = { weatherReply, infoReply };