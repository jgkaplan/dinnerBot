const config = require('./config.json');
const { Client, RichEmbed } = require('discord.js');
const axios = require('axios');
const moment = require('moment');

const client = new Client();

function isToday(day){
	return day.date() == moment().date()
		&& day.year() == moment().year()
		&& day.month() == moment().month();
}

client.on('message', msg => {
	if(msg.author === client.user) return;
	if (msg.content.toLowerCase().startsWith(config.startingSymbol + 'ping')) {
		msg.reply('pong');
	}else if (msg.content.toLowerCase().startsWith(config.startingSymbol + 'poll')) {
		const embed = new RichEmbed()
			.setTitle('Dinner Poll')
			.setColor(0x9909f2)
			.setDescription('Where do people want to go for dinner?')
			.setFooter('🇧: Becker, 🇹: Bethe, 🇷: Rose, 🇨: Cook, 🇰: Keeton');
		msg.channel.send(embed).then((sentMessage) => {
			sentMessage.react('🇧');
			sentMessage.react('🇹');
			sentMessage.react('🇷');
			sentMessage.react('🇨');
			sentMessage.react('🇰');
		}).catch((err) => {});
	}else if (msg.content.toLowerCase().startsWith(config.startingSymbol + 'dining')) {
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
				let foodList = hall.food.map(function(menuItem){
					let l = [`__${menuItem.category}__`];
					for(item of menuItem.items){
						l.push(`\t- ${item.item}`);
					}
					return l.join('\n');
				}).join('\n');
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
		let uwu = (Math.floor(Math.random()*2)?'u':'U')
				+ (Math.floor(Math.random()*2)?'w':'W')
				+ (Math.floor(Math.random()*2)?'u':'U');
		msg.channel.send(uwu);
	}else if(msg.content.toLowerCase().startsWith(config.startingSymbol + 'uwu')){
		let owo = (Math.floor(Math.random()*2)?'o':'O')
				+ (Math.floor(Math.random()*2)?'w':'W')
				+ (Math.floor(Math.random()*2)?'o':'O');
		msg.channel.send(owo);
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
	}
	if(msg.content.toLowerCase().startsWith(config.startingSymbol + 'anyone') || msg.content.toLowerCase().includes('@anyone')) {
		msg.channel.send("", {reply: msg.channel.members.random()});
	}
});

client.login(process.env.BOTKEY);