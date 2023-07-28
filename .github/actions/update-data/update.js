
const core = require('@actions/core')
const https = require('https')
const fs = require('fs')
const path = require('path')

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
	"battleground_effects",
	"config",
	"guide",
	"guilds",
	"levels",
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
		fileStream = fs.createWriteStream(path.join(rootDir, dir, filename))
		response.pipe(fileStream)
		await new Promise((resolve, reject) => {
			fileStream.on('finish', resolve)
			fileStream.on('error', reject)
		})
		// break
	}
}
async function download() {
	console.log('\nDownloading XML files:')
	await downloadFiles(files)
	console.log('\nObsolete files:')
	await downloadFiles(obsolete, 'obsolete')
}

try {
	rootDir = path.resolve(core.getInput('working-directory'))
	rootDir = rootDir.split('.github')[0] // for local execution
	rootDir = path.join(rootDir, 'xmls')
	download()
} catch (error) {
	console.error(error.message)
	core.setFailed(error.message)
}