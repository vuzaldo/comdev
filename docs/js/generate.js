
'use strict';

const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!~';
const maxRuneID = 1000;
function base64decode(base64) {
	let dec = 0;
	for (let i = base64.length - 1; i >= 0; i--) {
		dec *= 64;
		dec += base64chars.indexOf(base64[i]);
	}
	const runeID = dec % maxRuneID;
	dec = (dec - runeID) / maxRuneID;
	dec = (dec - dec % 7) / 7;
	dec = (dec - dec % 3) / 3;
	return dec;
}
function hashHelp(message) {
	message = message ? message : '\u00A0';
	document.getElementById('deckHashHelp').textContent = message;
}
function hash2deck(hash) {
	const deck = [];
	let message = '';
	for (let i = 0; i < hash.length; i += 5) {
		const unitHash = hash.substr(i, 5);
		const id = base64decode(unitHash);
		const card = CARDS[id];
		if (CARDS[id]) {
			deck.push(card);
		}
		else {
			message = `Could not decode '${unitHash}' (${id})`;
		}
	}
	generateInput('dungeonCommander9', deck[0] ? deck[0].id : '');
	for (let i = 1; i < 19; i++) {
		generateInput('dungeonCard' + i, deck[i] ? deck[i].id : '');
	}
	if (!message && deck.length && deck.length < 19) {
		message = deck.length - 1 + '/18 cards loaded.';
	}
	document.getElementById('dungeonDeckHashLink').href = link + hash;
	if (!message && hash.length == 95) {
		convertQuads();
	}
	hashHelp(message);
}
function base64encode(id) {
	const card = CARDS[id];
	const level = card?.upgrade ? card.upgrade.length : 0;
	let fusion = Math.floor(id / 10000);
	fusion = fusion ? fusion : Math.floor(level / 7);
	let dec = parseInt(id) % 10000;
	dec = dec * 3 + fusion;
	dec = dec * 7 + level % 7;
	dec = dec * maxRuneID;
	let base64 = '';
	for (let i = 0; i < 5; i++) {
		const part = dec % 64;
		base64 += base64chars[part];
		dec = (dec - part) / 64;
	}
	return base64;
}
function convertQuads() {
	const quads = document.getElementById('convertQuads').checked;
	let hash = document.getElementById('dungeonDeckHash').value;
	if (!hash) return;
	hash = hash.match(new RegExp('.{1,5}', 'g'));
	hash = [hash[0], ...hash.slice(1).map(function(h) {
		const id = base64decode(h);
		const quad = quads ? '2' + id : id;
		const newId = CARDS[quad] ? quad : id;
		return base64encode(newId);
	})].join('');
	document.getElementById('dungeonDeckHash').value = hash;
	document.getElementById('dungeonDeckHashLink').href = link + hash;
}
const link = 'https://thesench.github.io/SIMSpellstone/DeckBuilder.html?hash=';
function updateDungeonHash() {
	let hash = [];
	const commander = document.getElementById('dungeonCommander9').value;
	hash.push(base64encode(commander in CARDS ? commander : 202));
	let last = 1;
	for (let i = 1; i <= 18; i++) {
		const card = document.getElementById('dungeonCard' + i).value;
		hash.push(base64encode(card in CARDS ? card : 500));
		last = card in CARDS ? i + 1 : last;
	}
	hash = hash.slice(0, last).join('');
	document.getElementById('dungeonDeckHash').value = hash;
	convertQuads();
	hashHelp('');
}

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

let commanders = Object.values(CARDS).filter(c => c.card_type == 1 && c.id > 100); // exclude player commanders
commanders = commanders.filter(c => !c.name.includes('Lightning Boss') && !c.name.includes('Party')); // exclude LBN and anniversary commanders
console.log(`${commanders.length} commanders`);
const mythicCommanders = commanders.filter(c => c.rarity == 5);
console.log(`${mythicCommanders.length} mythic commanders`);
const legendaryCommanders = commanders.filter(c => c.rarity == 4);
console.log(`${legendaryCommanders.length} legendary commanders`);
const epicCommanders = commanders.filter(c => c.rarity == 3);
console.log(`${epicCommanders.length} epic commanders`);

const legendaries = Object.values(CARDS).filter(c => c.card_type == 2 && c.rarity == 4 && !c.shard_card && !c.mythic); // exclude champions and mythics
console.log(`\n${legendaries.length} legendary cards`);
const standardLegendaries = legendaries.filter(c => c.set == 1000);
console.log(`${standardLegendaries.length} standard legendaries`);
// const rewardLegendaries = legendaries.filter(c => c.set == 2000);
// console.log(`${rewardLegendaries.length} reward legendaries`);
const epics = Object.values(CARDS).filter(c => c.card_type == 2 && c.rarity == 3 && !c.mythic); // exclude mythics
console.log(`${epics.length} epics`);
const rewardEpics = epics.filter(c => c.set == 2000);
console.log(`${rewardEpics.length} reward epics`);

function isTribe(card, tribe) {
	const hasTribe = Array.isArray(card.sub_type) && card.sub_type.includes(tribe);
	return hasTribe || card.sub_type == tribe || PSEUDO_TRIBES[card.id] == tribe;
}
function generateCardList(cards, amount, fill = true) {
	let list = cards.filter(c => isTribe(c, eventTribeId) && !c.fusion_level);
	if (fill && list.length < amount) { // not enough cards from the selected tribe, try to fill the list using others
		let differentTribes = cards.filter(c => !isTribe(c, eventTribeId) && !c.fusion_level);
		shuffleArray(differentTribes);
		differentTribes = differentTribes.slice(0, amount - list.length);
		list = list.concat(differentTribes);
	}
	shuffleArray(list);
	return list.slice(0, amount).map(c => c.id);
}
function generateInput(elementId, newValue, filter = filterInput) {
	const input = document.getElementById(elementId);
	input.value = newValue;
	filter(input, false);
}
function generateBGE() {
	const bges = Object.keys(BGES).filter(id => id < newBGE && BGES[id].tribe == eventBGE);
	shuffleArray(bges);
	generateInput('bgeId', bges[0], filterBge);
}
function generateDungeon(update = true) {
	const start = generateCardList(epicCommanders, 3);
	generateInput('dungeonCommander1', start[0]);
	generateInput('dungeonCommander2', start[1]);
	generateInput('dungeonCommander3', start[2]);
	const middle = generateCardList(legendaryCommanders, 3);
	generateInput('dungeonCommander4', middle[0]);
	generateInput('dungeonCommander5', middle[1]);
	generateInput('dungeonCommander6', middle[2]);
	let finalCommanders = legendaryCommanders.filter(c => !middle.includes(c.id));
	finalCommanders = finalCommanders.concat(mythicCommanders);
	const final = generateCardList(finalCommanders, 3);
	generateInput('dungeonCommander7', final[0]);
	generateInput('dungeonCommander8', final[1]);
	generateInput('dungeonCommander9', final[2]);
	const cards = generateCardList(legendaries.filter(c => c.cost > 0), 18);
	for (let i = 1; i <= cards.length; i++) {
		generateInput('dungeonCard' + i, cards[i - 1]);
	}
	updateDungeonHash();
	if (update) {
		updateEditors();
	}
}
function generate() {
	if (!eventBGE) return;
	generateBGE();
	generateInput('rewardChamp', newChamp);
	generateInput('rewardFlask', options?.flask ? options.flask : newFlask, filterItem);
	const legendaries = generateCardList(standardLegendaries, 3, false);
	generateInput('Legendary1', legendaries[0]);
	generateInput('Legendary3', legendaries[2] ? legendaries[2] : legendaries[0]);
	generateInput('Legendary2', legendaries[1]);
	// generateInput('rewardLegendary', generateCardList(rewardLegendaries, 1)[0]);
	const epics = generateCardList(rewardEpics, 3);
	generateInput('rewardEpic1', epics[0]);
	generateInput('rewardEpic2', epics[1]);
	generateInput('rewardEpic3', epics[2]);
	const names = EVENT_NAMES[eventBGE];
	shuffleArray(names);
	document.getElementById('clashName').value = names[0] + ' Clash';
	document.getElementById('guildClashName').value = names[1] + ' Guild Clash';
	const dungeonName = names[2] + ' Dungeon';
	document.getElementById('dungeonName').value = dungeonName;
	document.getElementById('dungeonEnemyName').value = dungeonName;
	generateDungeon(false);
	document.getElementById('warName').value = names[3] + ' Guild War';
	document.getElementById('brawlName').value = names[4] + ' Brawl';
	if (options?.map)
		selectMapCycle.value = findSelectorOption(selectMapCycle, options.map);
	else
		selectMapCycle.selectedIndex = Math.floor(Math.random() * (selectMapCycle.options.length));
	const expeditionItem = ITEMS[EXPEDITION[selectMapCycle.value].point_item];
	document.getElementById('expeditionName').value = expeditionItem + ' Expedition';
	selectMapCycle.dispatchEvent(new Event('change'));
}


function escapeXML(text) {
	return text.replace(/[<>&'"]/g, function(char) {
		switch (char) {
			case '<': return '&lt;';
			case '>': return '&gt;';
			case '&': return '&#38;';
			case '\'': return '&apos;';
			case '"': return '&quot;';
		}
	});
}
function skipEscape(parameter) {
	return parameter.includes('_COMMENT') || parameter.includes('EVENT_NAME');
}
function updateEditor(template) {
	let generated = TEMPLATES[template];
	for (const param in parameters[template]) {
		const paramRegex = new RegExp(`\\{${param}}`, 'g');
		let value = parameters[template][param].toString();
		value = skipEscape(param) ? value : escapeXML(value);
		generated = generated.replace(paramRegex, value);
	}
	if (generated != previous[template]) {
		// console.log('Updating editor:', template);
		const scrollInfo = editors[template].getScrollInfo();
		editors[template].setValue(generated);
		editors[template].scrollTo(scrollInfo.left, scrollInfo.top);
	}
	previous[template] = generated;
}

function updateEditors() {
	updateParameters();
	for (const template in editors) {
		updateEditor(template);
	}
	// console.log('\n');
}

const eventNumber = 105 + numCycles;
const clashId = 22198 + numCycles * 2;
const dungeonId = 28067 + numCycles;
const warId = 30087 + numCycles;
const expeditionId = 7101 + numCycles;
const brawlId = 8111 + numCycles;
const eventBgeId = 6105 + numCycles;
const rewardBoxId = 6090 + numCycles;
const eventRewardBoxId = 11093 + numCycles;
let eventBGE, eventTribeId, eventMap, eventMapX, eventMapY;

let newChamp = 4073, newEpic = 2255;
while (CARDS[newChamp]) newChamp++;
while (CARDS[newEpic]) newEpic++;
let newBGE = 167;
while (BGES[newBGE]) newBGE++;
let newFlask = 2801;
while (ITEMS[newFlask]) newFlask++;

const parameters = {}, previous = {};
for (const template in editors) {
	parameters[template] = {};
	previous[template] = '';
}
let template = 'event_timeline_clash';
parameters[template]['EVENT_NUMBER'] = eventNumber;
parameters[template]['EVENT_ID'] = clashId;
parameters[template]['EVENT_NEXT_ID'] = clashId + 1;
parameters[template]['START_TIME'] = clashStartTime;
parameters[template]['START_TIME_COMMENT'] = convertTimestamp(clashStartTime);
parameters[template]['START_TIME_2'] = guildClashStartTime;
parameters[template]['START_TIME_COMMENT_2'] = convertTimestamp(guildClashStartTime);
template = 'event_timeline_dungeons';
parameters[template]['EVENT_NUMBER'] = eventNumber;
parameters[template]['EVENT_ID'] = dungeonId;
parameters[template]['START_TIME'] = dungeonStartTime;
parameters[template]['START_TIME_COMMENT'] = convertTimestamp(dungeonStartTime);
template = 'event_timeline_wars_clash';
parameters[template]['EVENT_ID'] = warId;
parameters[template]['START_TIME'] = warStartTime;
parameters[template]['START_TIME_COMMENT'] = convertTimestamp(warStartTime);
parameters[template]['START_TIME_COMMENT_NEXT_DAY'] = convertTimestamp(warStartTime + day);
template = 'event_timeline_expeditions';
parameters[template]['EVENT_ID'] = expeditionId;
parameters[template]['START_TIME'] = nextStartTime;
parameters[template]['START_TIME_COMMENT'] = convertTimestamp(nextStartTime);
template = 'event_timeline_brawls';
parameters[template]['EVENT_ID'] = brawlId;
parameters[template]['START_TIME'] = brawlStartTime;
parameters[template]['START_TIME_COMMENT'] = convertTimestamp(brawlStartTime);
template = 'event_timeline_n3rjc_BGE';
parameters[template]['EVENT_ID'] = eventBgeId;
parameters[template]['START_TIME'] = nextStartTime;
parameters[template]['START_TIME_COMMENT'] = convertTimestamp(nextStartTime);
parameters[template]['END_TIME'] = nextStartTime + cycleDuration * 2;
parameters[template]['END_TIME_COMMENT'] = convertTimestamp(parameters[template]['END_TIME']);
template = 'reward_box';
parameters[template]['BOX_ID'] = rewardBoxId;
template = 'event_timeline_n3rjc_AC';
parameters[template]['EVENT_ID'] = eventRewardBoxId;
parameters[template]['BOX_ID'] = rewardBoxId;
parameters[template]['START_TIME'] = nextStartTime;
parameters[template]['START_TIME_COMMENT'] = convertTimestamp(nextStartTime);

const stoneTiers = {
	event_timeline_clash: [600, 400, 350, 250, 225, 200, 175, 150, 125, 100, 75, 50, 25, 10],
	event_timeline_clash_GC: [600, 450, 375, 300, 240, 195, 150, 105, 75, 45, 30, 15],
	event_timeline_dungeons: [150, 120, 100, 80, 60, 40],
	event_timeline_wars_clash: [400, 300, 250, 200, 160, 130, 100, 70, 50, 30, 20, 10],
	event_timeline_expeditions: [1000, 800, 600, 500, 400, 350, 300, 275, 225, 175, 150, 130, 110, 90, 80, 60, 40, 20],
	event_timeline_brawls: [1000, 800, 600, 500, 400, 350, 300, 275, 225, 175, 150, 130, 110, 90, 80, 60, 40, 20]
}
function scaleStones(stones, scale) {
	const scaledAmount = (stones * scale).toFixed(2);
	const rounded = Math.ceil(parseFloat(scaledAmount));
	const rounded5 = Math.ceil(rounded / 5) * 5; // next multiple of 5
	return rounded5;
}
function updateStoneTiers(template, scale, GC = '') {
	for (let i = 0; i < stoneTiers[template + GC]?.length; i++) {
		const stones = scaleStones(stoneTiers[template + GC][i], scale);
		parameters[template]['STONES_TIER_' + (i + 1) + GC] = stones;
	}
}

function updateParameters() {
	const rewardChamp = '10' + document.getElementById('rewardChamp').value;
	const rewardFlask = document.getElementById('rewardFlask').value;
	const scaleQuantity = document.getElementById('rewardFlaskScale').value;
	const scaleQuantity2 = document.getElementById('rewardFlaskScale2').value;
	const separateScale = ['event_timeline_expeditions', 'event_timeline_brawls'];
	for (const template in parameters) {
		eventBGE && (parameters[template]['EVENT_BGE'] = eventBGE);
		eventMap && (parameters[template]['MAP_ID'] = eventMap);
		if (eventMapX != null) (parameters[template]['MAP_X'] = eventMapX);
		if (eventMapY != null) (parameters[template]['MAP_Y'] = eventMapY);
		parameters[template]['STONES_ID'] = rewardChamp;
		parameters[template]['FLASK_ID'] = rewardFlask;
		const scale = separateScale.includes(template) ? scaleQuantity2 : scaleQuantity;
		updateStoneTiers(template, scale);
	}
	template = 'event_timeline_clash';
	parameters[template]['EVENT_NAME'] = document.getElementById('clashName').value;
	parameters[template]['LEGENDARY_CARD_ID'] = document.getElementById('LegendaryClash').value;
	parameters[template]['EPIC_CARD_ID'] = document.getElementById('rewardEpicClash').value;
	parameters[template]['EVENT_NAME_2'] = document.getElementById('guildClashName').value;
	parameters[template]['LEGENDARY_CARD_ID_2'] = document.getElementById('LegendaryGuildClash').value;
	parameters[template]['EPIC_CARD_ID_2'] = document.getElementById('rewardEpicGuildClash').value;
	const tower = document.getElementById('selectTower').selectedOptions[0];
	parameters[template]['TOWER_TYPE'] = tower.text;
	parameters[template]['TOWER_EFFECT_ID'] = tower.value;
	updateStoneTiers(template, scaleQuantity, '_GC');
	template = 'event_timeline_dungeons';
	parameters[template]['EVENT_NAME'] = document.getElementById('dungeonName').value;
	parameters[template]['ENEMY_NAME'] = document.getElementById('dungeonEnemyName').value;
	parameters[template]['LEGENDARY_CARD_ID'] = document.getElementById('LegendaryDungeon').value;
	parameters[template]['LEGENDARY_CARD_ID_2'] = document.getElementById('LegendaryDungeon2').value;
	parameters[template]['EPIC_CARD_ID'] = document.getElementById('rewardEpicDungeon').value;
	parameters[template]['STONES_MILESTONE_1'] = scaleStones(100, scaleQuantity);
	parameters[template]['STONES_MILESTONE_2'] = scaleStones(100, scaleQuantity);
	eventTribeId && (parameters[template]['EVENT_TRIBE_ID'] = eventTribeId);
	const tribeRuneId = { 'Angel': 5501, 'Elemental': 5502, 'Undead': 5503, 'Goblin': 5504, 'Dragon': 5505,
							'Seafolk': 5506, 'Avian': 5507, 'Frog': 5508, 'Mecha': 5509, 'Insect': 5510 }
	eventBGE && (parameters[template]['TRIBE_RUNE_ID'] = tribeRuneId[eventBGE]);
	let commander = 1;
	for (const [phase, commanders] of [['STARTING', 3], ['MIDDLE', 4], ['FINAL', 2]]) {
		for (let i = 1; i <= commanders; i++) {
			const param = `${phase}_COMMANDER_${i}`;
			const elementId = `dungeonCommander${commander}`
			const commanderId = document.getElementById(elementId).value;
			parameters[template][param] = commanderId;
			parameters[template][param + '_COMMENT'] = id2Card(commanderId, 1);
			['Min', 'Max'].forEach(m => {
				const element = document.getElementById(elementId + `${m}Lvl`);
				if (element) {
					const p = param + `_${m.toUpperCase()}_LVL`;
					parameters[template][p] = element.value;
				}
			});
			commander++;
		}
	}
	for (let i = 1; i <= 18; i++) {
		const param = 'FIXED_CARD_' + i;
		const elementId = 'dungeonCard' + i;
		const cardId = document.getElementById(elementId).value;
		parameters[template][param] = cardId;
		parameters[template][param + '_COMMENT'] = id2Card(cardId, 2);
		parameters[template][param + '_MIN_LVL'] = document.getElementById(elementId + 'MinLvl').value;
	}
	template = 'event_timeline_wars_clash';
	parameters[template]['EVENT_NAME'] = document.getElementById('warName').value;
	parameters[template]['LEGENDARY_CARD_ID'] = document.getElementById('LegendaryWar').value;
	parameters[template]['EPIC_CARD_ID'] = document.getElementById('rewardEpicWar').value;
	template = 'event_timeline_expeditions';
	parameters[template]['EVENT_NAME'] = document.getElementById('expeditionName').value;
	parameters[template]['LEGENDARY_CARD_ID'] = document.getElementById('LegendaryExpedition').value;
	parameters[template]['EPIC_CARD_ID'] = document.getElementById('rewardEpicExpedition').value;
	template = 'event_timeline_brawls';
	parameters[template]['EVENT_NAME'] = document.getElementById('brawlName').value;
	parameters[template]['LEGENDARY_CARD_ID'] = document.getElementById('LegendaryBrawl').value;
	parameters[template]['EPIC_CARD_ID'] = document.getElementById('rewardEpicBrawl').value;
	if (eventMap) {
		const expedition = EXPEDITION[eventMap];
		const expParams = 'MAP ITEM POINT_ITEM PORTRAIT BANNER BUNDLE ICON POINTS_BUNDLE'.split(' ');
		let i = 0;
		for (const param in expedition) {
			parameters['event_timeline_expeditions']['EXPEDITION_' + expParams[i]] = expedition[param];
			i++;
		}
	}
	template = 'event_timeline_n3rjc_BGE';
	parameters[template]['BGE_NAME'] = document.getElementById('bgeName').value;
	parameters[template]['BGE_DESCRIPTION'] = document.getElementById('bgeDescription').value;
	parameters[template]['BGE_EFFECT_ID'] = document.getElementById('bgeId').value;
	if (eventBGE) {
		parameters[template]['BGE_BANNER'] = BGE_BANNERS[eventBGE].banner_prefab;
		parameters[template]['BGE_BUNDLE'] = BGE_BANNERS[eventBGE].bundle;
	}
	template = 'reward_box';
	eventBGE && (parameters[template]['EVENT_BGE_LOWERCASE'] = eventBGE.toLowerCase());
	// const cardId = document.getElementById('rewardLegendary').value;
	// parameters[template]['LEGENDARY_CARD'] = cardId;
	// parameters[template]['LEGENDARY_CARD_COMMENT'] = id2Card(cardId, 0, 4, true);
	for (let i = 1; i < 4; i++) {
		const cardId = document.getElementById(`rewardEpic${i}`).value;
		parameters[template][`EPIC_CARD_${i}`] = cardId;
		parameters[template][`EPIC_CARD_${i}_COMMENT`] = id2Card('1' + cardId, 0, 3, true);
	}
	template = 'event_timeline_n3rjc_AC';
	eventBGE && (parameters[template]['EVENT_BGE_LOWERCASE'] = eventBGE.toLowerCase());
}


const tribes = FACTIONS.filter(f => !f.hidden && f.tribe == 1);
tribes.sort((a, b) => a.name.localeCompare(b.name));
const selectTribe = document.getElementById('selectTribe');
tribes.forEach(tribe => {
	const option = document.createElement('option');
	option.value = tribe.id;
	option.text = tribe.name;
	selectTribe.appendChild(option);
});
selectTribe.addEventListener('change', function() {
	const selectedOption = this.options[this.selectedIndex];
	eventBGE = selectedOption.text;
	eventTribeId = selectedOption.value;
	updateEditors();
	document.getElementById('generateBtn').disabled = false;
	document.getElementById('generateDungeonBtn').disabled = false;
});


const selectMap = document.getElementById('selectMap');
const selectMapCycle = document.getElementById('selectMapCycle');
for (const mapId in MAPS) {
	const option = document.createElement('option');
	option.value = mapId;
	const mapName = MAPS[mapId].name;
	option.text = mapId > 99 ? `${mapName} (${mapId})` : mapName;
	selectMap.appendChild(option);
	if (EXPEDITION[mapId]) {
		selectMapCycle.appendChild(option.cloneNode(true));
	}
	if (mapId == 35) {
		let separator = document.createElement('option');
		separator.disabled = true;
		selectMap.appendChild(separator);
		separator = document.createElement('option');
		separator.disabled = true;
		separator.text = 'LIMITED TIME EVENTS';
		selectMap.appendChild(separator);
	}
}

const [bgWidth, bgHeight] = [1660, 768];
const [marginLeft, marginTop] = [16.5, 12];
function coordinates2Position(x, y) {
	const left = (marginLeft + 100 * x / bgWidth) + '%';
	const top = 100 - (marginTop + 100 * y / bgHeight) + '%';
	return [left, top];
}
function position2Coordinates(left, top) {
	const x = Math.round((parseFloat(left) - marginLeft) * (bgWidth / 100));
	const y = Math.round((100 - parseFloat(top) - marginTop) * (bgHeight / 100));
	return [x, y];
}
function limitCoordinates(x, y) {
	x = x ? x : 0;
	y = y ? y : 0;
	x = x < 0 ? 0 : x > 999 ? 999 : x;
	y = y < 65 ? 65 : y > 665 ? 665 : y;
	return [x, y];
}
function placeNode(node, x, y) {
	const [left, top] = coordinates2Position(x, y);
	node.style.left = left;
	node.style.top = top;
}

function createNode(x, y, icon, showLevel, upgradeNodeType) {
	const container = document.createElement('div');
	container.classList.add('position-absolute');
	container.style.width = '5.5%';
	if (icon != 'map_tower') {
		const gemBase = document.createElement('img');
		const baseIcon = showLevel ? 'gem_base__boss_LG' : upgradeNodeType ? 'gem_base__empty_LG' : 'gem_base_LG';
		gemBase.src = `assets/nodes/${baseIcon}.png`;
		gemBase.style.width = '125%';
		gemBase.style.position = 'absolute';
		gemBase.style.left = '-13%';
		gemBase.style.transform = 'translateY(63%)';
		container.appendChild(gemBase);
	}
	const element = document.createElement('img');
	element.src = `assets/nodes/${icon ? icon : 'gem_LG'}.png`
	element.style.width = '100%';
	const adjust = { 'Lava_Vial': [90, 10, 0], 'Coconut_A_100': [83, 10, 10], 'santaHat': [100, -8, 20], 'Obsidian_Gravel_01': [100, 0, 30],
					'Burning_Target_110': [80, 15, -8], 'arcane_vapor': [75, 16, -5], 'purple_fire': [65, 28, 0], 'machine_parts': [135, -12, -16],
					'KnightNode': [75, 18, 0], 'herocoin': [80, 10, 0], 'sparkler100': [100, 5, 0], 'machine_parts_200': [135, -12, -16],
					'firework': [135, -20, 0] };
	if (adjust[icon]) {
		element.style.width = adjust[icon][0] + '%';
		element.style.transform = `translateX(${adjust[icon][1]}%) translateY(${adjust[icon][2]}%)`
	}
	element.style.position = 'absolute';
	container.appendChild(element);
	placeNode(container, x, y);
	return container;
}

function switchHidden() {
	const showHidden = document.getElementById('switchHidden').checked;
	const useBackup = document.getElementById('switchBackup').checked;
	const map = document.getElementById('selectedMap');
	Array.from(map.children).forEach(node => {
		const hidden = useBackup ? node.dataset.wasHidden : node.dataset.hidden;
		node.style.display = hidden ? showHidden ? 'block' : 'none' : 'block';
	});
}

function propagateEventNode() {
	if (selectMap.value == selectMapCycle.value) {
		let node = document.getElementById('eventNodeCopy');
		if (!node) {
			node = createNode(eventMapX, eventMapY, 'map_tower');
			node.id = 'eventNodeCopy';
			document.getElementById('selectedMap').appendChild(node);
		}
		else {
			placeNode(node, eventMapX, eventMapY);
		}
	}
}

[selectMap, selectMapCycle].forEach(selector => {
	selector.addEventListener('change', function() {
		const mapId = selector.value;
		const selectedMap = document.getElementById(this.id.replace('select', 'selected'));
		const mapBackground = selectedMap.getElementsByClassName('img-fluid')[0];
		mapBackground.src = `assets/maps/${MAPS[mapId].mapBG}.png`;
		mapBackground.alt = `${MAPS[mapId].mapBG}`;
		while (selectedMap.childElementCount > 1) {
			selectedMap.removeChild(selectedMap.lastChild);
		}
		const isEventNode = this.id.includes('Cycle');
		NODES[mapId]?.forEach(node => {
			const wasHidden = node.id in NODE_VISIBILITY ? NODE_VISIBILITY[node.id] == 0 : node.hidden;
			const hidden = isEventNode ? wasHidden : node.hidden;
			if (!hidden || !isEventNode) {
				const element = createNode(node.x, node.y, node.icon, node.show_level, node.expansion);
				if (hidden) element.dataset.hidden = hidden;
				if (wasHidden) element.dataset.wasHidden = wasHidden;
				selectedMap.appendChild(element);
			}
		});
		if (!isEventNode) switchHidden();
		const last = LAST_EVENT_NODES[mapId];
		const [x, y] = isEventNode && last ? [last.x, last.y] : [300, 300];
		const icon = isEventNode ? 'map_tower' : 'gem_7';
		const node = createNode(x, y, icon);
		node.id = isEventNode ? 'eventNode' : 'node';
		const nodeX = document.getElementById(node.id + 'X');
		const nodeY = document.getElementById(node.id + 'Y');
		nodeX.value = x; nodeY.value = y;
		node.style.cursor = 'grab';
		node.style.willChange = 'transform';
		node.style.transform = 'translateZ(0)';
		node.addEventListener('mousedown', event => {
			event.preventDefault();
			activeNode = node;
			const parent = selectedMap.getBoundingClientRect();
			const rect = node.getBoundingClientRect();
			offsetX = event.clientX - rect.left;
			offsetY = event.clientY - rect.top;
			node.style.cursor = 'grabbing';
		});
		selectedMap.appendChild(node);
		mapBackground.onload = function() {
			selectedMap.style.display = 'block';
		};
		if (isEventNode) {
			eventMap = mapId;
			eventMapX = x;
			eventMapY = y;
			updateEditors();
		}
		propagateEventNode();
	});
});
selectMap.dispatchEvent(new Event('change'));

let offsetX, offsetY, activeNode = null;
document.addEventListener('mousemove', (event) => {
	if (!activeNode) return;
	const parent = activeNode.parentElement.getBoundingClientRect();
	const rect = activeNode.getBoundingClientRect();
	const left = ((event.clientX - parent.left - offsetX) / parent.width) * 100 + '%';
	const top = ((event.clientY - parent.top - offsetY) / parent.height) * 100 + '%';
	let [x, y] = position2Coordinates(left, top);
	[x, y] = limitCoordinates(x, y);
	document.getElementById(activeNode.id + 'X').value = x;
	document.getElementById(activeNode.id + 'Y').value = y;
	placeNode(activeNode, x, y);
});
document.addEventListener('mouseup', () => {
	if (activeNode) {
		activeNode.style.cursor = 'grab'; // Restore cursor after dragging
		if (activeNode.id == 'eventNode') {
			eventMapX = document.getElementById('eventNodeX').value;
			eventMapY = document.getElementById('eventNodeY').value;
			updateEditors();
			propagateEventNode();
		}
		activeNode = null;
	}
});


const autoSelectEventOptions = {
	105: { tribe: 'Insect', map: 'Distorted Beetleton' },
	106: { tribe: 'Goblin', map: 'Return to Karthos' },
	107: { tribe: 'Elemental', map: 'Conflux Convergence', flask: '2802' },
	108: { tribe: 'Seafolk', map: 'Pharos Temple', flask: '2803' },
	109: { tribe: 'Angel', map: 'Skyhaven Assault', flask: '2816' },
};

function findSelectorOption(selector, option) {
	const options = Array.from(selector.querySelectorAll('option'));
	return options.find(o => o.text == option).value;
}
const options = autoSelectEventOptions[eventNumber];
if (options) {
	options.tribe && (selectTribe.value = findSelectorOption(selectTribe, options.tribe));
	options.map && (selectMapCycle.value = findSelectorOption(selectMapCycle, options.map));
}

selectTribe.dispatchEvent(new Event('change'));
selectMapCycle.dispatchEvent(new Event('change'));
