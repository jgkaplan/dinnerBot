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
	if (msg.content.startsWith(config.startingSymbol + 'ping')) {
		msg.reply('pong');
	}else if (msg.content.startsWith(config.startingSymbol + 'poll')) {
		const embed = new RichEmbed()
			.setTitle('Dinner Poll')
			.setColor(0xB83201)
			.setDescription('Where do people want to go for dinner?')
			.setFooter('🇧: Becker, 🇹: Bethe, 🇷: Rose, 🇨: Cook, 🇰: Keeton');
		msg.channel.send(embed).then((sentMessage) => {
			sentMessage.react('🇧');
			sentMessage.react('🇹');
			sentMessage.react('🇷');
			sentMessage.react('🇨');
			sentMessage.react('🇰');
		}).catch((err) => {});
	}else if (msg.content.startsWith(config.startingSymbol + 'dining')) {
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
				.setColor(0xB83201)
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
					let l = [`${menuItem.category}`];
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
	}else if(msg.content.startsWith(config.startingSymbol + 'help')){

	}
	if(msg.content.startsWith(config.startingSymbol + 'anyone') || msg.content.includes('@anyone')) {
		msg.channel.send("", {reply: msg.channel.members.random()});
	}
});

client.login(config.token);