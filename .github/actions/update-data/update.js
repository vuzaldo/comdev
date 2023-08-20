
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
	"config",
	"guide",
	"guilds",
	"levels",
	"recipes_mj8d",
	"tutorial1"
	]
obsolete = [
	"arena",
	"cards",
	"events",
	"passive_missions"
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
		fileStream = fs.createWriteStream(path.join(rootDir, 'xmls', dir, filename))
		response.pipe(fileStream)
		await new Promise((resolve, reject) => {
			fileStream.on('finish', resolve)
			fileStream.on('error', reject)
		})
	}
}
async function download() {
	console.log('\nDownloading XML files:')
	await downloadFiles(files)
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
	console.log('\nParsing card data:')
	cardData = {}
	factions = []
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
	console.log('\nTotal:', Object.keys(cardData).length, 'cards\n')
	factions = 'var FACTIONS = ' + JSON.stringify(factions)
	cardData = 'var CARDS = ' + JSON.stringify(cardData)
	itemData = {}
	xml = fs.readFileSync(path.join(rootDir, 'xmls', 'items_dsvn3j.xml'))
	json = await parseXML(xml)
	json.root.item.forEach(item => {
		itemData[item.id] = item
	})
	mapData = {}
	nodes = {}
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
						icon = node.icon?.$.id
						show_level = node.show_level
						hidden = node.hidden
						nodes[node.location_id].push({ icon, x: node.x, y: node.y, show_level, hidden })
					}
				})
			}
			if (json.map_expansion) {
				json.map_expansion.forEach(expansion => {
					node = expansion.map_node
					if (node) {
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
	string = '\n' + [factions, cardData, mapData, nodes].join('\n\n') + '\n'
	saveData('data.js', string)
}

async function templates() {
	console.log('\nCopying templates:')
	templates = {}
	for (filename of events) {
		filePath = path.join(rootDir, 'templates', filename + '_TEMPLATE.xml')
		if (!fs.existsSync(filePath)) {
			continue
		}
		console.log(filename + '_TEMPLATE.xml')
		templates[filename] = fs.readFileSync(filePath).toString()
	}
	templates = 'var TEMPLATES = ' + JSON.stringify(templates)
	filePath = path.join(rootDir, 'templates', 'expedition_parameters.json')
	expedition_parameters = JSON.parse(fs.readFileSync(filePath))
	expedition_parameters = 'var EXPEDITION = ' + JSON.stringify(expedition_parameters)
	string = '\n' + [templates, expedition_parameters].join('\n\n') + '\n'
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