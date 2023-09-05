
window.addEventListener('DOMContentLoaded', event => {
	// Toggle the side navigation
	const sidebarToggle = document.body.querySelector('#sidebarToggle');
	if (sidebarToggle) {
		// Uncomment Below to persist sidebar toggle between refreshes
		// if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
		//     document.body.classList.toggle('sb-sidenav-toggled');
		// }
		sidebarToggle.addEventListener('click', event => {
			event.preventDefault();
			document.body.classList.toggle('sb-sidenav-toggled');
			// localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
		});
	}

});


const contentSections = document.querySelectorAll('.container-fluid section'); // Get all anchor elements
const navLinks = document.querySelectorAll('.list-group-item-action'); // Get all navigation links
// Function to update the active state of navigation links based on scroll position
const updateActiveNav = () => {
	const scrollPosition = window.scrollY;
	const viewSpace = window.innerHeight * 0.3;
	// Loop through each anchor element and check if it is in the viewport
	contentSections.forEach((section, index) => {
		let sectionTop = section.getBoundingClientRect().top + scrollPosition;
		sectionTop = index == 0 ? 0 : sectionTop;
		const sectionBottom = section.getBoundingClientRect().bottom + scrollPosition;
		if (scrollPosition + viewSpace >= sectionTop && scrollPosition < sectionBottom) {
			// Set the corresponding navigation link to active state
			const state = 'selected';
			navLinks.forEach((link) => link.classList.remove(state));
			navLinks[index].classList.add(state);
		}
	});
};
document.addEventListener('DOMContentLoaded', () => {
	// Call the updateActiveNav function on page load and on scroll event
	window.addEventListener('scroll', updateActiveNav);
	updateActiveNav();
});


// Handle client-side navigation
const views = {}, titles = {};
document.querySelectorAll('nav a').forEach(link => {
	const viewId = link.getAttribute('href').substr(1);
	views[viewId] = document.getElementById(viewId);
	titles[viewId] = link.textContent;
});
for (const key in views) {
	views[key].querySelectorAll('.list-group-flush a').forEach(link => {
		const viewId = link.getAttribute('href').substr(1);
		views[viewId] = views[key];
		titles[viewId] = link.textContent;
	});
}
function showView() {
	const viewId = window.location.hash.substr(1);
	document.title = 'ComDev - Spellstone';
	if (viewId in views) {
		document.title += ' | ' + titles[viewId];
	}
	for (const key in views) {
		views[key].style.display = 'none';
	}
	views[viewId in views ? viewId : 'cycle'].style.display = 'block';
	updateActiveNav();
	refreshEditors();
}
window.addEventListener('popstate', function(event) {
	showView();
});


function copyText(button) {
	const text = editors[button.previousElementSibling.previousElementSibling.id].getValue();
	navigator.clipboard.writeText(text).then(() => {
		updateButtonContent(button, 'Copied');
	}).catch(err => {
		console.error('Failed to copy text:', err);
		updateButtonContent(button, 'Failed');
	});
}
function updateButtonContent(button, newContent) {
	button.textContent = newContent;
	setTimeout(() => {
		button.textContent = 'Copy';
	}, 1000);
}


function isRewardRarity(card, rarity) {
	return rarity && card.set == 2000 && card.rarity == rarity;
}
function id2Card(id, champ, rarity) {
	if (id == '') {
		return '';
	}
	const card = CARDS[id];
	if (card && ((champ && card.shard_card) || isRewardRarity(card, rarity))) {
		return card.name;
	}
	if (champ && id == newChamp) {
		return '(New champion)'
	}
	if (rarity == 3 && id == newEpic) {
		return '(New epic)'
	}
	return 'Invalid card';
}

function propagateCard(elementId, cardId, card) {
	const element = document.getElementById(elementId);
	element.value = cardId;
	const help = element.parentElement.nextElementSibling.firstChild;
	help.textContent = card;
}
function propagateEpic(input, card) {
	const epic = input.id.slice(-1);
	if (epic == 1) {
		propagateCard('rewardEpicClash', input.value, card);
		propagateCard('rewardEpicWar', input.value, card);
	}
	if (epic == 2) {
		propagateCard('rewardEpicGuildClash', input.value, card);
		propagateCard('rewardEpicExpedition', input.value, card);
	}
	if (epic == 3) {
		propagateCard('rewardEpicBrawl', input.value, card);
	}
	if (epic == 4) {
		propagateCard('rewardEpicDungeon', input.value, card);
	}
}

function filterInput(input, update = true) {
	input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4);
	const rarity = input.id.includes('Epic') ? 3 : 0;
	const card = id2Card(input.value, input.id.includes('Champ'), rarity);
	const help = input.parentElement.nextElementSibling.firstChild;
	help.textContent = card;
	if (rarity == 3) {
		propagateEpic(input, card);
	}
	if (update) {
		updateEditors();
	}
}

function filterBge(input, update = true) {
	input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4);
	let name = '', description = '';
	const bge = BGES[input.value];
	if (bge) {
		name = bge.name;
		description = bge.desc;
	}
	else if (input.value == newBGE) {
		name = '(New BGE name)';
		description = '(New BGE description)';
	}
	else if (input.value != '') {
		name = 'Invalid BGE';
	}
	document.getElementById('bgeName').value = name;
	document.getElementById('bgeDescription').value = description;
	if (update) {
		updateEditors();
	}
}

function filterCoordinate(input) {
	input.value = input.value.replace(/[^0-9]/g, '').slice(0, 3);
	const nodeId = input.id.slice(0, -1);
	let x = parseInt(document.getElementById(nodeId + 'X').value);
	let y = parseInt(document.getElementById(nodeId + 'Y').value);
	[x, y] = limitCoordinates(x, y);
	placeNode(document.getElementById(nodeId), x, y);
	if (nodeId == 'eventNode') {
		eventMapX = x;
		eventMapY = y;
		updateEditors();
		propagateEventNode();
	}
}


function convertTimestamp(unixTime, showStandardTime = true) {
	const date = new Date(unixTime * 1000);
	let formatOptions = { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric', timeZone: 'UTC' };
	const dateFormat = new Intl.DateTimeFormat('en-US', formatOptions);
	formatOptions = { hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric', timeZone: 'UTC' };
	const timeFormat = new Intl.DateTimeFormat('en-US', formatOptions);
	const formattedDate = `${dateFormat.format(date)} at ${timeFormat.format(date)}`;
	if (!showStandardTime) {
		return formattedDate.replace(' at 17:00:00', '');
	}
	return formattedDate;
}

const referenceTime = 1689872400;
const day = 24 * 60 * 60;
const week = 7 * day;
const cycleDuration = 4 * week;
const currentUnixTime = Math.floor(Date.now() / 1000);
let nextStartTime = referenceTime;
let numCycles = 0;
while (nextStartTime < currentUnixTime) {
	nextStartTime += cycleDuration;
	numCycles++;
}

document.getElementById('startTime').textContent = convertTimestamp(nextStartTime, false);
document.getElementById('expeditionStartTime').textContent = convertTimestamp(nextStartTime, false);
const clashStartTime = nextStartTime + day;
document.getElementById('clashStartTime').textContent = convertTimestamp(clashStartTime, false);
const guildClashStartTime = clashStartTime + week;
document.getElementById('guildClashStartTime').textContent = convertTimestamp(guildClashStartTime, false);
const dungeonStartTime = guildClashStartTime + week;
document.getElementById('dungeonStartTime').textContent = convertTimestamp(dungeonStartTime, false);
const warStartTime = dungeonStartTime + week - day;
document.getElementById('warStartTime').textContent = convertTimestamp(warStartTime, false);
const brawlStartTime = nextStartTime + week;
document.getElementById('brawlStartTime').textContent = convertTimestamp(brawlStartTime, false);


const editorSettings = {
	lineNumbers: true,
	mode: 'xml',
	theme: 'default',
	indentWithTabs: true,
	indentUnit: 4
};
const editors = {};
document.querySelectorAll('textarea.code').forEach(textArea => {
	editors[textArea.id] = CodeMirror.fromTextArea(textArea, editorSettings);
	editors[textArea.id].setValue('Loading template...');
});
// editors['event_timeline_dungeons'].getWrapperElement().style.minHeight = '40rem';
'wars_clash expeditions brawls n3rjc_BGE n3rjc_AC'.split(' ').forEach(e => {
	editors['event_timeline_' + e].getWrapperElement().style.minHeight = '15rem';
});
editors['reward_box'].getWrapperElement().style.minHeight = '15rem';
function refreshEditors() {
	for (const template in editors) {
		editors[template].refresh();
	}
}

// Load initial view based on the URL
showView();
