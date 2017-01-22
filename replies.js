const rp = require('request-promise');
const moment = require('moment');
const googleKey = process.env.GOOGLE_API_KEY;
const darkSkyKey = process.env.DARKSKY_API_KEY;

const today = moment().unix();
const tenYearsAgo = moment().subtract(10, 'years').unix();

const cities = require('./data/climacticCities'); 

const weatherReply = incomingTweet => {
	
	// picks a random city to retrieve data for if the tweet being processed doesn't include location data
	const place = incomingTweet.place ? incomingTweet.place : cities[Math.floor(Math.random() * cities.length)]; 
	const locationQueryString = place.replace(', ', ',+');

	const googleURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${locationQueryString}&key=${googleKey}`
	const googleOptions = {
		uri: googleURL,
		headers: {
				'User-Agent': 'Request-Promise'
		},
		json: true 
	};

	// gets longitude and latitude for location through google geocode API
	return rp(googleOptions)
	.then(response => response.results[0].geometry.location)
	.then(({ lat, lng }) => {

		// forecast from 10 years ago
		const oldDataOptions = {
			uri: `https://api.darksky.net/forecast/${darkSkyKey}/${lat},${lng},${tenYearsAgo}`,
			headers: {
					'User-Agent': 'Request-Promise'
				},
				json: true 
			};  

		// current forecast
		const newDataOptions = {
			uri: `https://api.darksky.net/forecast/${darkSkyKey}/${lat},${lng},${today}`,
			headers: {
					'User-Agent': 'Request-Promise'
			},
			json: true 
		};
				
		return rp(oldDataOptions)
		// calculates average temperature on given day from max + min temp
		.then(data => ((data.daily.data[0].temperatureMin + data.daily.data[0].temperatureMax) / 2))
		.then(prevTemp => rp(newDataOptions)
			.then(data => ((data.daily.data[0].temperatureMin + data.daily.data[0].temperatureMax) / 2)) 
			.then(newTemp => {

				let pctChange = ((newTemp - prevTemp) / prevTemp * 100).toFixed(1)
				pctChange = pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`

				const content = `Hi @${incomingTweet.screen_name}. Avg temp in ${place} 10 yrs ago was ${prevTemp.toFixed(1)}°F; today it is ${newTemp.toFixed(1)}°F. (${pctChange} change)`
				return ({
					tweetIdToReplyTo: incomingTweet.id,
					content,
				});
			})
		)
	})
	.catch(e => console.log(e));
};

const infoReply = incomingTweet => {
	var content = `Thanks for your interest in climate change, @${incomingTweet.screen_name}. For more information, please see http://bit.ly/2gecocA. Have a beautiful day!`;
	return ({
		tweetIdToReplyTo: incomingTweet.id,
		content, 
	});
};

module.exports = { weatherReply, infoReply };