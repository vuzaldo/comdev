
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

const rewardEpics = Object.values(CARDS).filter(c => isRewardRarity(c, 3));
console.log(`${rewardEpics.length} reward epics`)
const rewardRares = Object.values(CARDS).filter(c => isRewardRarity(c, 2));
console.log(`${rewardRares.length} reward rares`)

function generateRewards(cards, amount) {
	let rewards = cards.filter(c => c.sub_type == eventTribeId && !c.fusion_level);
	if (rewards.length < amount) {
		let differentTribes = cards.filter(c => c.sub_type != eventTribeId && !c.fusion_level);
		differentTribes = differentTribes.slice(0, amount - rewards.length);
		rewards = rewards.concat(differentTribes);
	}
	shuffleArray(rewards);
	return rewards.slice(0, amount).map(c => c.id);
}
function generateInput(elementId, newValue) {
	const input = document.getElementById(elementId);
	input.value = newValue;
	filterInput(input, false);
}
function generate() {
	if (!eventBGE) return;
	generateInput('rewardChamp', newChamp);
	const epics = generateRewards(rewardEpics, 4);
	generateInput('rewardEpic1', epics[0]);
	generateInput('rewardEpic2', epics[1]);
	generateInput('rewardEpic3', epics[2]);
	generateInput('rewardEpic4', epics[3]);
	const rares = generateRewards(rewardRares, 6);
	document.getElementById('clashName').value = eventBGE + ' Clash';
	generateInput('rewardRareClash', rares[0]);
	document.getElementById('guildClashName').value = eventBGE + ' Guild Clash';
	generateInput('rewardRareGuildClash', rares[1]);
	document.getElementById('dungeonName').value = eventBGE + ' Dungeon';
	document.getElementById('dungeonEnemyName').value = 'Savage ' + eventBGE + 's';
	generateInput('rewardRareDungeon', rares[2]);
	document.getElementById('warName').value = eventBGE + ' Guild War';
	generateInput('rewardRareWar', rares[3]);
	document.getElementById('expeditionName').value = eventBGE + ' Expedition';
	generateInput('rewardRareExpedition', rares[4]);
	document.getElementById('brawlName').value = eventBGE + ' Brawl';
	generateInput('rewardRareBrawl', rares[5]);
	selectMapCycle.selectedIndex = Math.floor(Math.random() * (selectMapCycle.options.length - 1)) + 1; // Exclude first "label" element
	selectMapCycle.dispatchEvent(new Event('change'));
}


function updateEditor(template) {
	let generated = TEMPLATES[template];
	for (param in parameters[template]) {
		const paramRegex = new RegExp(`\\{${param}}`, 'g');
		generated = generated.replace(paramRegex, parameters[template][param]);
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
let eventBGE, eventTribeId, eventMap, eventMapX, eventMapY;

let newChamp = 4073, newEpic = 2255;
while (CARDS[newChamp]) newChamp++;
while (CARDS[newEpic]) newEpic++;

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

function updateParameters() {
	for (const template in parameters) {
		eventBGE && (parameters[template]['EVENT_BGE'] = eventBGE);
		eventMap && (parameters[template]['MAP_ID'] = eventMap);
		if (eventMapX != null) (parameters[template]['MAP_X'] = eventMapX);
		if (eventMapY != null) (parameters[template]['MAP_Y'] = eventMapY);
		parameters[template]['STONES_ID'] = '10' + document.getElementById('rewardChamp').value;
	}
	template = 'event_timeline_clash';
	parameters[template]['EVENT_NAME'] = document.getElementById('clashName').value;
	parameters[template]['EPIC_CARD_ID'] = document.getElementById('rewardEpicClash').value;
	parameters[template]['RARE_CARD_ID'] = document.getElementById('rewardRareClash').value;
	parameters[template]['EVENT_NAME_2'] = document.getElementById('guildClashName').value;
	parameters[template]['EPIC_CARD_ID_2'] = document.getElementById('rewardEpicGuildClash').value;
	parameters[template]['RARE_CARD_ID_2'] = document.getElementById('rewardRareGuildClash').value;
	template = 'event_timeline_dungeons';
	parameters[template]['EVENT_NAME'] = document.getElementById('dungeonName').value;
	parameters[template]['ENEMY_NAME'] = document.getElementById('dungeonEnemyName').value;
	parameters[template]['EPIC_CARD_ID'] = document.getElementById('rewardEpicDungeon').value;
	parameters[template]['RARE_CARD_ID'] = document.getElementById('rewardRareDungeon').value;
	eventTribeId && (parameters[template]['EVENT_TRIBE_ID'] = eventTribeId);
	const tribeRuneId = { 'Angel': 5501, 'Elemental': 5502, 'Undead': 5503, 'Goblin': 5504, 'Dragon': 5505,
							'Seafolk': 5506, 'Avian': 5507, 'Frog': 5508, 'Mecha': 5509, 'Insect': 5510 }
	eventBGE && (parameters[template]['TRIBE_RUNE_ID'] = tribeRuneId[eventBGE]);
	template = 'event_timeline_wars_clash';
	parameters[template]['EVENT_NAME'] = document.getElementById('warName').value;
	parameters[template]['EPIC_CARD_ID'] = document.getElementById('rewardEpicWar').value;
	parameters[template]['RARE_CARD_ID'] = document.getElementById('rewardRareWar').value;
	template = 'event_timeline_expeditions';
	parameters[template]['EVENT_NAME'] = document.getElementById('expeditionName').value;
	parameters[template]['EPIC_CARD_ID'] = document.getElementById('rewardEpicExpedition').value;
	parameters[template]['RARE_CARD_ID'] = document.getElementById('rewardRareExpedition').value;
	template = 'event_timeline_brawls';
	parameters[template]['EVENT_NAME'] = document.getElementById('brawlName').value;
	parameters[template]['EPIC_CARD_ID'] = document.getElementById('rewardEpicBrawl').value;
	parameters[template]['RARE_CARD_ID'] = document.getElementById('rewardRareBrawl').value;
	if (eventMap) {
		const expedition = EXPEDITION[eventMap];
		const expParams = 'MAP ITEM POINT_ITEM PORTRAIT BANNER BUNDLE ICON POINTS_BUNDLE'.split(' ')
		let i = 0;
		for (const param in expedition) {
			parameters['event_timeline_expeditions']['EXPEDITION_' + expParams[i]] = expedition[param];
			i++;
		}
	}
}

updateEditors();


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
});
// selectTribe.selectedIndex = 6; // Goblin
// selectTribe.dispatchEvent(new Event('change'));


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
					'KnightNode': [75, 18, 0], 'herocoin': [80, 10, 0], 'sparkler100': [100, 5, 0] };
	if (adjust[icon]) {
		element.style.width = adjust[icon][0] + '%';
		element.style.transform = `translateX(${adjust[icon][1]}%) translateY(${adjust[icon][2]}%)`
	}
	element.style.position = 'absolute';
	container.appendChild(element);
	placeNode(container, x, y);
	return container;
}

[selectMap, selectMapCycle].forEach(selector => {
	selector.addEventListener('change', function() {
		const selectedOption = selector.options[selector.selectedIndex];
		const mapId = selectedOption.value;
		const selectedMap = document.getElementById(this.id.replace('select', 'selected'));
		const mapBackground = selectedMap.getElementsByClassName('img-fluid')[0];
		mapBackground.src = `assets/maps/${MAPS[mapId].mapBG}.png`;
		mapBackground.alt = `${MAPS[mapId].mapBG}`;
		while (selectedMap.childElementCount > 1) {
			selectedMap.removeChild(selectedMap.lastChild);
		}
		const isEventNode = this.id.includes('Cycle');
		NODES[mapId]?.forEach(node => {
			if (!node.hidden || !isEventNode) {
				const element = createNode(node.x, node.y, node.icon, node.show_level, node.expansion);
				if (node.hidden) element.dataset.hidden = node.hidden;
				selectedMap.appendChild(element);
			}
		});
		if (!isEventNode) switchHidden();
		const [x, y] = [300, 300];
		const icon = isEventNode ? 'map_tower' : 'gem_7';
		const node = createNode(x, y, icon);
		node.id = isEventNode ? 'eventNode' : 'node';
		document.getElementById(node.id + 'X').value = x;
		document.getElementById(node.id + 'Y').value = y;
		node.style.cursor = 'grab';
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
	});
});
selectMap.selectedIndex = 1; // Elaria
// selectMap.selectedIndex = 22; // Distorted Beetleton
selectMap.dispatchEvent(new Event('change'));
// selectMapCycle.selectedIndex = 24; // Return to Karthos
// selectMapCycle.dispatchEvent(new Event('change'));

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
		}
		activeNode = null;
	}
});

function switchHidden() {
	const showHidden = document.getElementById('switchHidden').checked;
	const map = document.getElementById('selectedMap');
	Array.from(map.children).forEach(node => {
		if (node.dataset.hidden) {
			node.style.display = showHidden ? 'block' : 'none';
		}
	});
}
