const CronJob = require('cron').CronJob;
const PSATweets = require('./data/cronTweets');
const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

const PSACron = new CronJob('* */15 * * * *', function() {
  //every fifteen minutes, tweets a random climate change fact
    client.post('statuses/update', {
      status: PSATweets[Math.floor(Math.random() * PSATweets.length)]
    }, (error, tweet, response) => {
     if (error) {
         console.log(error);
       } else {
         console.log("Successfully sent tweet at " + new Date());
       }
    }) 
}, null, true, 'America/Los_Angeles');