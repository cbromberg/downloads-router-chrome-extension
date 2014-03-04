function save_options() {
	var maps = [{}, {}];
	var tables = [
		document.getElementById('mime_mapping_table').getElementsByTagName('tbody')[0],
		document.getElementById('referrer_mapping_table').getElementsByTagName('tbody')[0]
	];

	for(var idx in tables) {
		for(var i = 0; i < tables[idx].rows.length - 1; i++) {
			fields = tables[idx].rows[i].getElementsByTagName('input');
			if(fields[0].value != '' && fields[1].value != '') {
				target_directory = check_trailing(fields[1].value);
				//maps[idx][fields[0].value] = fields[1].value;
				maps[idx][fields[0].value] = target_directory;
			}
		}
	}

	localStorage.setItem('dr_mime_map', JSON.stringify(maps[0]));
	localStorage.setItem('dr_referrer_map', JSON.stringify(maps[1]));

	// Flash a status message
	var status = document.getElementById('status');
	status.innerHTML = '<span class="green">&#10004;</span> Settings saved!';
	status.style.display = 'block';
	setTimeout(function() {
		status.innerHTML = '';
		status.style.display = 'none';
	}, 1500);
}

function restore_options() {
	/* Could do with a bit of a cleanup.. */

	var mime_table = document.getElementById('mime_mapping_table').getElementsByTagName('tbody')[0];
	var ref_table  = document.getElementById('referrer_mapping_table').getElementsByTagName('tbody')[0];
	var mime_map   = localStorage.getItem('dr_mime_map');
	var ref_map    = localStorage.getItem('dr_referrer_map');

	if(mime_map) {
		mime_map = JSON.parse(mime_map);
	} else {
		mime_map = { 'image/jpeg': 'images/', 'application/x-bittorrent': 'torrents/' };
		localStorage.setItem('dr_mime_map', JSON.stringify(mime_map));
	}

	if(ref_map) {
		ref_map = JSON.parse(ref_map);
	} else {
		ref_map = {};
		localStorage.setItem('dr_referrer_map', JSON.stringify(ref_map));
	}

	for(var key in mime_map) {
		var mimeInput         = document.createElement('input');
		mimeInput.type        = 'text';
		mimeInput.value       = key;
		mimeInput.placeholder = key;

		var pathInput         = document.createElement('input');
		pathInput.type        = 'text';
		pathInput.value       = mime_map[key];
		pathInput.placeholder = mime_map[key];
		/* 
		 * [2014-02-16] This causes Chromium 32.0.1700.107 (248368) to crash...
		 *
		 * pathInput.type = 'file';
		 * pathInput.webkitdirectory = true;
		 * pathInput.multiple = true;
		 */

		add_table_row(mime_table, mimeInput, pathInput);
	}

	for(var key in ref_map) {
		var refInput          = document.createElement('input');
		refInput.type         = 'url';
		refInput.value        = key;
		refInput.placeholder  = key;

		var pathInput         = document.createElement('input');
		pathInput.type        = 'text';
		pathInput.value       = ref_map[key];
		pathInput.placeholder = ref_map[key];

		add_table_row(ref_table, refInput, pathInput);
	}
}

function check_trailing(path) {
	if(path.slice(-1) == '/' || path.slice(-1) == '\\') {
		return path;
	}

	if(navigator.platform.indexOf('Win') != -1) {
		if(path.indexOf('\\') != -1) { // Could be an escape, but it's a half-decent guess
			return path + '\\';
		}
	}

	// Windows with no \ delimiter, OSX, Linux, other thing; let's just attempt with a forward slash for now
	return path + '/'
}

function add_table_row(table, element1, element2) {
	var newRow    = table.insertRow(table.rows.length - 1);
	var srcCell   = newRow.insertCell(0);
	var spaceCell = newRow.insertCell(1);
	var destCell  = newRow.insertCell(2);
	var delCell   = newRow.insertCell(3);

	srcCell.appendChild(element1);
	destCell.appendChild(element2);

	var delInput       = document.createElement('button');
	delInput.className = 'btn delete';
	delInput.innerHTML = '&#215;';
	delInput.onclick   = function() {
		var current = window.event.srcElement;
		while((current = current.parentElement) && current.tagName != 'TR');
		current.parentElement.removeChild(current);
	}

	delCell.appendChild(delInput);
	spaceCell.appendChild(document.createTextNode('➜'));

	newRow.appendChild(srcCell);
	newRow.appendChild(spaceCell);
	newRow.appendChild(destCell);
	newRow.appendChild(delCell);
}

/* The following two functions are invoked from the options page,
 * for adding empty rows to the corresponding tables. */

function add_mime_route() {
	var table             = document.getElementById('mime_mapping_table').getElementsByTagName('tbody')[0];
	var mimeInput         = document.createElement('input');
	mimeInput.type        = 'text';
	mimeInput.placeholder = 'E.g. image/jpeg';
	var pathInput         = document.createElement('input');
	pathInput.type        = 'text';
	pathInput.placeholder = 'some/folder/';

	add_table_row(table, mimeInput, pathInput);
}

function add_referrer_route() {
	var table             = document.getElementById('referrer_mapping_table').getElementsByTagName('tbody')[0];
	var refInput          = document.createElement('input');
	refInput.type         = 'url';
	refInput.placeholder  = 'E.g. 9gag.com (no http://)';
	var pathInput         = document.createElement('input');
	pathInput.type        = 'text';
	pathInput.placeholder = 'some/folder/';

	add_table_row(table, refInput, pathInput);
}

function options_setup() {
	var cont   = document.getElementById('wrap');
	var navs   = cont.querySelectorAll('ul#nav li');
	var tabs   = cont.querySelectorAll('.tab');
	var active = 'routing';

	// Handle new installations by showing the usage instructions and a quick message
	if(!localStorage.getItem('dr_mime_map')) {
		active = 'usage';

		var status = document.getElementById('status');
		status.innerHTML = 'Thank you for installing Downloads Router!<br>Please read the instructions below, then head over to the Routing rules to configure the extension.';
		status.style.display = 'block';
		setTimeout(function() {
			status.innerHTML = '';
			status.style.display = 'none';
		}, 7500);
	}

	navs[0].parentNode.dataset.current = active;

	for(var i = 0; i < tabs.length; i++) {
		if(tabs[i].id != active) {
			tabs[i].style.display = 'none';
		}

		navs[i].onclick = handle_click;
		if(navs[i].dataset.tab == active) {
			navs[i].setAttribute('class', 'active');
		}
	}

	restore_options();
}

function handle_click() {
	var current  = this.parentNode.dataset.current;
	var selected = this.dataset.tab;

	if(current == selected) {
		return;
	}

	document.getElementById(current).style.display  = 'none';
	document.getElementById(selected).style.display = 'block';
	document.getElementById('nav_' + current).removeAttribute('class', 'active');

	this.setAttribute('class', 'active');
	this.parentNode.dataset.current = selected;
}

/* Event listeners */

document.addEventListener('DOMContentLoaded', options_setup);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#add_mime_route').addEventListener('click', add_mime_route);
document.querySelector('#add_referrer_route').addEventListener('click', add_referrer_route);
