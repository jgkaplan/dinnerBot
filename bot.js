const config = require('./config.json');
const { Client, RichEmbed } = require('discord.js');
const axios = require('axios');
const moment = require('moment-timezone');

const client = new Client();

function isToday(day){
	return day.date() == moment().tz('America/New_York').date()
		&& day.year() == moment().tz('America/New_York').year()
		&& day.month() == moment().tz('America/New_York').month();
}

client.on('message', msg => {
	if(msg.author === client.user || (msg.member != null && !msg.member.roles.find(r => r.name === "bot_access"))) return;
	if (msg.content.toLowerCase().startsWith(config.startingSymbol + 'ping')) {
		msg.reply('pong');
	}else if (msg.content.toLowerCase().startsWith(config.startingSymbol + 'poll')) {
		const embed = new RichEmbed()
			.setTitle('Dinner Poll')
			.setColor(0x9909f2)
			.setDescription('Where do people want to go for dinner?\n \
				🇧: Becker, 🇯: Bethe, 🇷: Rose, 🇨: Cook, 🇰: Keeton');
			// .setFooter('🇧: Becker, 🇯: Bethe, 🇷: Rose, 🇨: Cook, 🇰: Keeton');
		msg.channel.send(embed).then((sentMessage) => {
			sentMessage.react('🇧').then(() => { //B
				return sentMessage.react('🇯'); //J
			}).then(() => {
				return sentMessage.react('🇷'); //R
			}).then(() => {
				return sentMessage.react('🇨'); //C
			}).then(() => {
				return sentMessage.react('🇰'); //K
			});
		}).catch((err) => {});
	}else if (msg.content.toLowerCase().startsWith(config.startingSymbol + 'dining') || msg.content.toLowerCase().startsWith(config.startingSymbol + 'dinner')) {
		axios.get('https://now.dining.cornell.edu/api/1.0/dining/eateries.json').then((diningData) => {
			let diningHalls = diningData.data.data.eateries;
			// let hallFoods = diningHalls
			// 				.filter((hall) => {
			// 					return hall.diningItems.length != 0 && config.diningShortNames.includes(hall.nameshort)
			// 				}).map((hall) => {
			// 					return {name: hall.nameshort, food: hall.diningItems}
			// 				});
			let hallFoods = diningHalls
							.filter((hall) => {
								return hall.operatingHours.length != 0 && config.diningShortNames.includes(hall.nameshort)
							}).map((hall) => {
								let meals = hall.operatingHours.find(function(event){
									return isToday(moment(event.date, 'YYYY-MM-DD'))
								});
								if (meals){
									meals = meals.events;
								}else{
									return;
								}
								let menu = meals.find(function(meal){
									return meal.descr == "Dinner";
								});
								if (menu){
									menu = menu.menu;
								}else{
									return;
								}
								return {name: hall.nameshort, food: menu}
							}).filter((hall) => hall != undefined);
			if(hallFoods.length == 0){
				msg.channel.send('Error: No food data, or dining halls are closed.');
				return;
			}
			const embed = new RichEmbed()
				.setTitle('West Campus Menus')
				.setColor(0x7bc043)
				.setDescription('Menus of the West Campus dining halls');
            // let potatoHalls = [];
			for(let hall of hallFoods){
				// let tmp = hall.food.reduce(function(memo, food) {
				//     if (!memo[food.category]) memo[food.category] = [];
				//     memo[food.category].push(food.item);
				//     return memo;
				// }, {});
				// let foodList = Object.keys(tmp).map(function(category){
				// 	let l = [`${category}`];
				// 	for(v of tmp[category]){
				// 		l.push(`\t- ${v}`);
				// 	}
				// 	return l.join('\n');
				// }).join('\n');
                // let hasPotatoes = false;
				let foodList = hall.food.map(function(menuItem){
					let l = [`__${menuItem.category}__`];
					for(item of menuItem.items){
						l.push(`\t- ${item.item}`);
                        // if(item.includes('potato')){
                        //     hasPotatoes = true;
                        // }
					}
					return l.join('\n');
				}).join('\n');
                // if(hasPotatoes){
                //     potatoHalls.push(hall.name);
                // }
                console.log(hall);
				embed.addField(hall.name, foodList);
			}
			msg.channel.send(embed);
			// console.log(diningHalls.map(function(o){return o.nameshort}));
			// msg.channel.send('Retrieved Dining data')
		}).catch((err) => {
			console.log(err);
			msg.channel.send('Error: Unable to fetch dining data.');
		});
	}else if(msg.content.toLowerCase().startsWith(config.startingSymbol + 'owo')){
		let u = (Math.floor(Math.random()*2)?'u':'U');
		let w = (Math.floor(Math.random()*2)?'w':'W');
		msg.channel.send(u + w + u);
	}else if(msg.content.toLowerCase().startsWith(config.startingSymbol + 'uwu')){
		let o = (Math.floor(Math.random()*2)?'o':'O');
		let w = (Math.floor(Math.random()*2)?'w':'W');
		msg.channel.send(o + w + o);
	}else if(msg.content.toLowerCase().startsWith(config.startingSymbol + 'help')){
		const embed = new RichEmbed()
				.setTitle('Command Help')
				.setColor(0x0392cf)
				.setDescription('Here are the commands that can be used with this bot.')
				.addField(config.startingSymbol+'ping', 'The server will respond with Pong.')
				.addField(config.startingSymbol+'poll', 'Start a dinner poll. Click the reacts to vote.')
				.addField(config.startingSymbol+'dining', 'Get information about dinner options at the West Campus dining halls.')
				.addField(config.startingSymbol+'anyone or @anyone', 'Alert a random person in the channel.')
				.addField(config.startingSymbol+'owo', 'uwu')
				.addField(config.startingSymbol+'uwu', 'owo')
				.addField(config.startingSymbol+'help', 'Display this help information.');
		msg.channel.send(embed);
	}else if(msg.content.toLowerCase().startsWith(config.startingSymbol + 'anyone') || msg.content.toLowerCase().includes('@anyone')) {
		msg.channel.send("", {reply: msg.channel.members.random()});
	}
	// else{
	// 	msg.channel.fetchMessages({
	// 		limit: 10
	// 	}).then(messages => {
	// 		messages
	// 	})
 //  .catch(console.error);
	// 	let lastMsg = msg.channel.lastSendMessage || "";
	// 	console.log(lastMsg);
	// 	let hasEchoed = msg.channel.botReplied || false;
	// 	if(msg.content.toLowerCase() == lastMsg && !hasEchoed){
	// 		msg.channel.send(lastMsg);
	// 		msg.channel.botReplied = true;
	// 	}else{
	// 		msg.channel.lastSentMessage = msg.content.toLowerCase();
	// 		msg.channel.botReplied = false;
	// 	}
	// }
});

client.login(process.env.BOTKEY);
