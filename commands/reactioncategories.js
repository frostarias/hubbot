module.exports = {
	help: ()=> "Creates categories for reaction roles",
	usage: ()=> [" - Lists available categories and their IDs",
				 " create [name] [description] - Creates new react role category",
				 " delete [ID] - Deletes category (does not delete associated reaction roles)",
				 " add [ID] [role] - Adds react role to the category",
				 " remove [ID] [role] - Removes react role from the category",
				 " name [ID] [new name] - Changes category name",
				 " description [ID] [new desription] - Changes category description",
				 " post [channel] <ID> - Posts category's roles in a channel. If no category is given, posts all",
				 " info [ID] - Gets info on a category (eg: roles registered to it)"],
	execute: async (bot, msg, args)=> {
		var categories = await bot.utils.getReactionCategories(bot, msg.guild.id);
		if(!categories || categories.length < 1) return msg.channel.createMessage('No categories have been indexed');

		msg.channel.createMessage({embed: {
			title: "Categories",
			description: "All categories registered for the server",
			fields: categories.map(c => {
				return {name: c.name, value: `ID: ${c.hid}\nDescription: ${c.description}`}
			})
		}})
	},
	alias: ['reactcategories', 'rc'],
	subcommands: {}
}

module.exports.subcommands.create = {
	help: ()=> "Creates a new reaction role category",
	usage: ()=> [" [name] (new line) [description] - Creates a new category with the given name and description (NOTE: description needs to be on new line)"],
	execute: async (bot, msg, args)=> {
		var nargs = args.join(" ").split("\n");
		var code = bot.utils.genCode(bot.CHARS);
		bot.db.query(`INSERT INTO reactcategories (hid, server_id, name, description) VALUES (?,?,?,?)`,[
			code,
			msg.guild.id,
			nargs[0],
			nargs.slice(1).join("\n")
		], (err, rows)=> {
			if(err) {
				console.log(err);
				msg.channel.createMessage('Something went wrong')
			} else {
				msg.channel.createMessage("Category created! ID: "+code);
			}
		})
	}
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes a category",
	usage: ()=> [" [id] - Deletes a reaction category"],
	execute: async (bot, msg, args) => {
		var category = bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');
		await bot.utils.deleteReactionCategory(bot, msg.guild.id, args[0]);
		msg.channel.createMessage("Category deleted!");
	}
}

module.exports.subcommands.name = {
	help: ()=> "Changes name for a category",
	usage: ()=> " [ID] [name] - Changes name for the given category",
	execute: async (bot, msg, args)=> {
		var category = bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');

		bot.db.query(`UPDATE reactcategories SET name=? WHERE hid=?`,[args.slice(1).join(" "), args[0]],(err,rows)=> {
			if(err) {
				console.log(err);
				msg.channel.createMessage('Something went wrong');
			} else {
				msg.channel.createMessage('Description changed!')
			}
		})

		var res = await bot.utils.updateReactRolePost(bot, msg.guild.id, msg);
		if(!res) msg.channel.createMessage('Something went wrong while updating posts');
	},
	alias: ["describe", "desc"]
}

module.exports.subcommands.description = {
	help: ()=> "Changes description for a category",
	usage: ()=> " [ID] [description] - Changes description for the given category",
	execute: async (bot, msg, args)=> {
		var category = bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');

		bot.db.query(`UPDATE reactcategories SET description=? WHERE hid=?`,[args.slice(1).join(" "), args[0]],(err,rows)=> {
			if(err) {
				console.log(err);
				msg.channel.createMessage('Something went wrong');
			} else {
				msg.channel.createMessage('Description changed!')
			}
		})

		var res = await bot.utils.updateReactRolePost(bot, msg.guild.id, msg);
		if(!res) msg.channel.createMessage('Something went wrong while updating posts');
	},
	alias: ["describe", "desc"]
}

module.exports.subcommands.add = {
	help: ()=> "Changes description for a category",
	usage: ()=> " [ID] [role] - Adds role to a category",
	execute: async (bot, msg, args)=> {
		var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');

		var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == args[1] || r.name == args.slice(1).join(" ")).id;
		if(!role) return msg.channel.createMessage('Role not found');
		var rr = await bot.utils.getReactionRole(bot, msg.guild.id, role);
		if(!rr) return msg.channel.createMessage('Reaction role not found');
		console.log(role);
		console.log(rr);
		console.log(category);

		bot.db.query(`UPDATE reactroles SET category=? WHERE server_id=? AND role_id=?`,[category.hid, msg.guild.id, role], (err, rows)=>{
			if(err) {
				console.log(err);
				msg.channel.createMessage('Something went wrong')
			} else {
				msg.channel.createMessage('Role added to category!')

			}
		})

		var res = await bot.utils.updateReactCategoryPost(bot, msg.guild.id, msg, args[0]);
		if(!res) msg.channel.createMessage('Something went wrong while updating posts');
	}
}

module.exports.subcommands.remove = {
	help: ()=> "Changes description for a category",
	usage: ()=> " [ID] [role] - Adds role to a category",
	execute: async (bot, msg, args)=> {
		var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category)
			return msg.channel.createMessage('Category does not exist');

		var role = msg.roleMentions.length > 0 ?
				   msg.roleMentions[0] :
				   msg.guild.roles.find(r => r.id == args[1] || r.name == args.slice(1).join(" ")).id;
		if(!role) return msg.channel.createMessage('Role not found');
		var rr = await bot.utils.getReactionRole(bot, msg.guild.id, role);
		if(!rr) return msg.channel.createMessage('Reaction role not found');
		console.log(role);
		console.log(rr);
		console.log(category);

		bot.db.query(`UPDATE reactroles SET category=? WHERE server_id=? AND role_id=?`,["uncategorized", msg.guild.id, role], (err, rows)=>{
			if(err) {
				console.log(err);
				msg.channel.createMessage('Something went wrong')
			} else {
				msg.channel.createMessage('Role removed from category!')
			}
		})
	}
}

module.exports.subcommands.post = {
	help: ()=> "Posts a message with all possible reaction roles",
	usage: ()=> " [category] [channel] - Posts reaction roles message in given channel",
	execute: async (bot, msg, args) => {
		var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category) return msg.channel.createMessage('Category does not exist');

		var channel = msg.channelMentions.length > 0 ?
				   msg.guild.channels.find(ch => ch.id == msg.channelMentions[1]) :
				   msg.guild.channels.find(ch => ch.id == args[0] || ch.name == args[1]);
		if(!channel) return msg.channel.createMessage('Channel not found');

		var roles = await bot.utils.getReactionRolesByCategory(bot, msg.guild.id, category.hid);
		console.log(roles);

		var reacts = [];
		var pass = []

		var rls = roles.map(r => {
			var role = msg.guild.roles.find(x => x.id == r.role_id);
			if(role){
				reacts.push(r.emoji);
				pass.push(r.role_id);
			 	return {name: `${role.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`,
			 			value: r.description || "*(no description provided)*\n\n"};
			} else {
			 	return undefined
			}
		}).filter(x => x!=undefined);
		console.log(rls);

		await channel.createMessage({embed: {
			title: category.name,
			description: category.description,
			fields: rls
		}}).then(message => {
			reacts.forEach(rc => message.addReaction(rc));
			bot.db.query(`INSERT INTO reactposts (server_id, channel_id, message_id, category_id, roles) VALUES (?,?,?,?,?)`, [
				message.guild.id,
				message.channel.id,
				message.id,
				category.hid,
				roles.map(r => { return {emoji: r.emoji, role_id: r.role_id} })
			])
		})
	}
}

module.exports.subcommands.info = {
	help: ()=> "Get info on a reaction category",
	usage: ()=> [" [id] - Get info on a reaction category"],
	execute: async (bot, msg, args) => {
		var category = await bot.utils.getReactionCategory(bot, msg.guild.id, args[0]);
		if(!category) return msg.channel.createMessage('Category does not exist');

		var roles = await bot.utils.getReactionRolesByCategory(bot, msg.guild.id, args[0]);
		if(roles.length == 0 || !roles) return msg.channel.createMessage('No reaction roles available');
		var invalid = [];
		await msg.channel.createMessage({embed: {
			title: `${category.name} (${category.hid})`,
			description: category.description,
			fields: roles.map(r => {
				var rl = msg.guild.roles.find(x => x.id == r.role_id);
				 if(rl) {
				 	return {name: `${rl.name} (${r.emoji.includes(":") ? `<${r.emoji}>` : r.emoji})`, value: r.description || "*(no description provided)*"}
				 } else {
				 	invalid.push(r.role_id);
				 	return {name: r.role_id, value: '*Role not found. Removing after list.*'}
				 }
			})
		}})

		if(invalid.length > 0) {
			bot.db.query(`DELETE FROM reactroles WHERE role_id IN (`+invalid.join(", ")+")",(err, rows)=> {
				if(err) {
					console.log(err);
				} else {
					msg.channel.createMessage('Deleted reaction roles that no longer exist');
				}
			})
		}
	}
}