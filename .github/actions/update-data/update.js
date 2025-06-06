
const core = require('@actions/core')
const https = require('https')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')

cards = [
	"cards_config",
	"cards_heroes",
	"cards_premium_aether",
	"cards_premium_chaos",
	"cards_premium_wyld",
	"cards_reward",
	"cards_shard",
	"cards_special",
	"cards_standard",
	"cards_story",
	"fusion_recipes_cj2"
	]
events = [
	"event_timeline_bge",
	"event_timeline_brawls",
	"event_timeline_clash",
	"event_timeline_dungeons",
	"event_timeline_expeditions",
	"event_timeline_n3rjc",
	"event_timeline_raids",
	"event_timeline_wars_clash"
	]
maps = [
	"campaigns",
	"map_config",
	"map_expansions_btzw6",
	"map_upgrades",
	"missions",
	"missions_event"
	]
store = [
	"bundle_packages_n5j",
	"drop_rates_sd4u2nt4",
	"event_box",
	"items_dsvn3j",
	"market",
	"slot_machined3rj32rh",
	"step_box",
	]
arena = [
	"pvp_live_arena",
	"reward_box"
	]
challenges = [
	"challenges_3n4",
	"cycled_event_configs",
	"cycled_events"
	]
other = [
	"achievements",
	"assetbundles",
	"battleground_effects",
	"cards_dev_km86x",
	"config",
	"daily_login_bonus_fjh32sd",
	"feature_locks",
	"guide",
	"guilds",
	"heroes_xfkj2",
	"hunting_da90x",
	"levels",
	"missions_archive",
	"mythic_hall_hxcj8",
	"purchases_n38",
	"recipes_mj8d",
	"tutorial1",
	"vip_levels",
	"warnings"
	]

localization = [
	"localization/english",
	"localization/french",
	"localization/german",
	"localization/russian",
	"localization/spanish",
	"localization/english_images",
	"localization/french_images",
	"localization/german_images",
	"localization/russian_images",
	"localization/spanish_images"
	]

obsolete = [
	"account_upgrades",
	"arena",
	"bonus_hg6",
	"cards",
	"event_timeline_wars",
	"events",
	"passive_missions",
	"purchases_30sale_v2h",
	"raids_v2_hjcv4jn",
	"raids_x42",
	"steam_dlc",
	"updates"
	]

files = cards.concat(events).concat(maps).concat(store) // required BGE cycle
files = files.concat(arena).concat(challenges).concat(other)

async function downloadFiles(files, dir = '') {
	for ([i, filename] of files.entries()) {
		console.log(i + 1 + '/' + files.length, filename)
		filename += '.xml'
		options = {
			hostname: 'spellstone.synapse-games.com',
			path: '/assets/' + filename,
			headers: { 'User-Agent': 'Mozilla/5.0' }
		}
		response = await new Promise((resolve, reject) => {
			https.get(options, resolve)
		})
		filePath = path.join(rootDir, 'xmls', dir, filename)
		fileStream = fs.createWriteStream(filePath)
		response.pipe(fileStream)
		await new Promise((resolve, reject) => {
			fileStream.on('finish', resolve)
			fileStream.on('error', reject)
		})
		if (!fs.readFileSync(filePath).includes('<root')) {
			throw new Error('Network/server error')
		}
	}
}
async function download() {
	console.log('\nDownloading XML files:')
	await downloadFiles(files)
	console.log('\nLocalization files:')
	await downloadFiles(localization)
	console.log('\nObsolete files:')
	await downloadFiles(obsolete, 'obsolete')
}

const parser = new xml2js.Parser({ explicitArray: false })
async function parseXML(xml) {
	return new Promise((resolve, reject) => {
		parser.parseString(xml, (err, result) => {
			if (err) {
				reject(err)
			} else {
				resolve(result)
			}
		})
	})
}

function saveData(file, string) {
	fs.writeFileSync(path.join(rootDir, 'src', 'js', file), string)
	fs.writeFileSync(path.join(rootDir, 'docs', 'js', file), string)
}

async function parse() {
	console.log('\nParsing card data...')
	cardData = {}, factions = []
	for ([i, filename] of cards.entries()) {
		console.log(i + 1 + '/' + cards.length, filename)
		try {
			xml = fs.readFileSync(path.join(rootDir, 'xmls', filename + '.xml'))
			json = await parseXML(xml)
			json = json.root
			if (json.unitType) {
				factions = json.unitType.filter(f => f.name)
			}
			if (json.unit) {
				console.log(json.unit.length, 'units')
				json.unit.forEach(unit => {
					cardData[unit.id] = unit
				})
			}
		} catch (error) {
			console.error('Error parsing card XML:', error)
			continue
		}
	}
	console.log('\nTotal:', Object.keys(cardData).length, 'cards')
	tribes = factions.filter(f => !f.hidden && f.tribe == 1)
	factions = 'var FACTIONS = ' + JSON.stringify(factions)
	cardData = 'var CARDS = ' + JSON.stringify(cardData)
	console.log('\nParsing item data...')
	itemData = {}, items = {}
	xml = fs.readFileSync(path.join(rootDir, 'xmls', 'items_dsvn3j.xml'))
	json = await parseXML(xml)
	json.root.item.forEach(item => {
		itemData[item.id] = item
		items[item.id] = item.name
	})
	console.log('Total:', Object.keys(itemData).length, 'items')
	items = 'var ITEMS = ' + JSON.stringify(items)
	console.log('\nParsing map data...')
	mapData = {}, nodes = {}
	for ([i, filename] of maps.entries()) {
		console.log(i + 1 + '/' + maps.length, filename)
		try {
			xml = fs.readFileSync(path.join(rootDir, 'xmls', filename + '.xml'))
			json = await parseXML(xml)
			json = json.root
			if (json.location) {
				json.location.forEach(location => {
					mapData[location.id] = { name: location.name, mapBG: location.mapBG }
				})
			}
			if (json.campaign) {
				json.campaign.forEach(node => {
					if (node.location_id != 0) {
						if (!nodes[node.location_id]) {
							nodes[node.location_id] = []
						}
						id = node.id
						icon = node.icon?.$.id
						show_level = node.show_level
						hidden = node.hidden
						nodes[node.location_id].push({ id, icon, x: node.x, y: node.y, show_level, hidden })
					}
				})
			}
			if (json.map_expansion) {
				json.map_expansion.forEach(expansion => {
					node = expansion.map_node
					if (node && nodes[node.map]) {
						icon = itemData[expansion.currency_item].icon
						nodes[node.map].unshift({ icon, x: node.x, y: node.y, expansion: '1' })
					}
				})
			}
		} catch (error) {
			console.error('Error parsing map XML:', error)
			continue
		}
	}
	console.log('\nTotal:', Object.keys(mapData).length, 'maps')
	mapData = 'var MAPS = ' + JSON.stringify(mapData)
	nodes = 'var NODES = ' + JSON.stringify(nodes)
	lastEventNodes = {}
	xml = fs.readFileSync(path.join(rootDir, 'xmls', 'event_timeline_wars_clash.xml'))
	json = await parseXML(xml)
	json.root.event.forEach(event => {
		node = event.map_node
		node && (lastEventNodes[node.map] = { x: node.x, y: node.y })
	})
	lastEventNodes = 'var LAST_EVENT_NODES = ' + JSON.stringify(lastEventNodes)
	console.log('\nParsing BGE data...')
	bges = {}, effects = {}
	xml = fs.readFileSync(path.join(rootDir, 'xmls', 'battleground_effects.xml'))
	bgeBlocks = [...xml.toString().matchAll(/<battleground>([\s\S]*?)<\/battleground>/g)]
	bgeBlocks.forEach(block => {
		bge = block[1]
		id = bge.match(/<id>([\s\S]*?)<\/id>/)
		effect = bge.match(/<effect>([\s\S]*?)<\/effect>/)
		if (id && effect) {
			effects[id[1].trim()] = effect[1].trim()
		}
	})
	json = await parseXML(xml)
	icon2tribe = tribes.reduce((result, t) => {
		result[t.icon.substring(7, 11)] = t.name
		return result
	}, {})
	json.root.battleground.forEach(bge => {
		tribe = icon2tribe[bge.icon?.substring(7, 11)]
		name = bge.name
		desc = bge.desc ? bge.desc : ''
		icon = bge.icon ? bge.icon : ''
		effect = effects[bge.id]
		bges[bge.id] = { tribe, name, desc, icon, effect }
	})
	console.log('Total:', Object.keys(bges).length, 'BGEs')
	bges = 'var BGES = ' + JSON.stringify(bges)
	string = '\n' + [factions, cardData, items, mapData, nodes, lastEventNodes, bges].join('\n\n') + '\n'
	saveData('data.js', string)
}

async function templates() {
	console.log('\nCopying templates:')
	templates = {}
	n3rjc = 'event_timeline_n3rjc'
	files = events.concat([n3rjc + '_AC', 'reward_box'])
	files.push('battleground_effects')
	for (filename of files) {
		filePath = path.join(rootDir, 'templates', filename + '_TEMPLATE.xml')
		if (!fs.existsSync(filePath)) {
			continue
		}
		console.log(filename + '_TEMPLATE.xml')
		templates[filename] = fs.readFileSync(filePath, 'utf8')
	}
	templates = 'var TEMPLATES = ' + JSON.stringify(templates)
	filePath = path.join(rootDir, 'templates', 'expedition_parameters.json')
	expedition_parameters = JSON.parse(fs.readFileSync(filePath))
	expedition_parameters = 'var EXPEDITION = ' + JSON.stringify(expedition_parameters)
	filePath = path.join(rootDir, 'templates', 'bge_banners.json')
	bge_banners = JSON.parse(fs.readFileSync(filePath))
	bge_banners = 'var BGE_BANNERS = ' + JSON.stringify(bge_banners)
	filePath = path.join(rootDir, 'templates', 'node_visibility.json')
	node_visibility = JSON.parse(fs.readFileSync(filePath))
	node_visibility = 'var NODE_VISIBILITY = ' + JSON.stringify(node_visibility)
	filePath = path.join(rootDir, 'templates', 'pseudo_tribes.json')
	pseudo_tribes = JSON.parse(fs.readFileSync(filePath))
	pseudo_tribes = 'var PSEUDO_TRIBES = ' + JSON.stringify(pseudo_tribes)
	filePath = path.join(rootDir, 'templates', 'event_names.json')
	event_names = JSON.parse(fs.readFileSync(filePath))
	event_names = 'var EVENT_NAMES = ' + JSON.stringify(event_names)
	string = '\n' + [templates, expedition_parameters, bge_banners, node_visibility, pseudo_tribes, event_names].join('\n\n') + '\n'
	string = string.replace(/\\r/g, '')
	saveData('templates.js', string)
}

async function updateData() {
	await download()
	await parse()
	await templates()
}

try {
	rootDir = path.resolve(core.getInput('working-directory'))
	rootDir = rootDir.split('.github')[0] // for local execution
	updateData()
} catch (error) {
	console.error(error.message)
	core.setFailed(error.message)
}