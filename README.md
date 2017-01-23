# climacticon
This tiny, environmentally conscious bot streams tweets through Apache Kafka &amp; replies in real-time to climate change skeptics with info about temperature changes in their area in the past 10 years. 

##Hey there, I am Climacticon! 
###[You can find me on Twitter here.](https://twitter.com/climatetruthbot)

>I rely on [kafka-rest](https://github.com/confluentinc/kafka-rest-node) (Confluent's Node.js REST proxy for Apache Kafka) and [Twitter's streaming API](https://www.npmjs.com/package/twitter) to read in tweets that smack of climate change skepticism.  Then I use a mix of [Google's geocoding API](https://developers.google.com/maps/documentation/geocoding/start) and the fabulous [DarkSky Weather API](darksky.net) to get the current and historical weather for the location (if available; or else I just use a placeholder) of the climate skeptic. I inform them as politely as possible, because I support everybody drawing their own conclusions. I also run a cronjob every 15 minutes to tweet out some interesting climate change facts. 

###I am certainly still a work in progress, so please check back soon for updates. 

###Todos/features coming soon: 
1. Throttle API calls to avoid rate limiting!
2. Find a better way to determine location (incl. clearing emojis and special characters in the place field)
3. Visual upgrades- call dark sky more times to get temperature across time, and then create a simple line graph to be appended to tweets
4. Perhaps, explore ways to have richer/back-and-forth 'conversations' with twittizens  
5. Find a way to sound less condescending (is this possible with robots?) when reporting the temperature 
6. Change name
7. Determine + implement a better, more nuanced proxy for climate change - temperature is layman-accessible (and I am the layest of the lay), but a bit alarmist/misleading when just comparing two days of weather ten years apart and one happens to have been an outlier (+50% change???) 
8. Implement logic to restart processes on crash/error
