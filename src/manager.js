var order    = JSON.parse(localStorage.getItem('dr_order'));
var rulesets = {};

if(!order) { 
	order = ['filename', 'referrer', 'mime'];
}

rulesets['filename'] = function(downloadItem, suggest) {
	filename_map = JSON.parse(localStorage.getItem('dr_filename_map'));

	var keys = Object.keys(filename_map);
	if(keys.length) {
		var idx, regex, matches;
		for(idx = 0; idx < keys.length; idx++) {
			regex   = new RegExp(keys[idx], 'i');
			matches = regex.exec(downloadItem.filename);
			if(matches) {
				suggest({ filename: filename_map[keys[idx]] + downloadItem.filename });
				return true;
			}
		}
	}

	return false;
}

rulesets['referrer'] = function(downloadItem, suggest) {
	ref_map = JSON.parse(localStorage.getItem('dr_referrer_map'));

	if(Object.keys(ref_map).length) {
		var matches;
		if(downloadItem.referrer) {
			matches    = downloadItem.referrer.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i);
		} else {
			matches = downloadItem.url.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i);
		}

		var ref_domain = matches && matches[1].replace(/^www\./i, '');

		if(ref_map[ref_domain]) {
            var suggestion = ref_map[ref_domain];
            if (suggestion.match("{(pathsegment[1-9]|hostname)}")) {
                var referrerUrl = new URL(downloadItem.referrer);
                suggestion = suggestion.replace("{hostname}", referrerUrl.hostname);
                var pathSegments = referrerUrl.pathname ? referrerUrl.pathname.split('/') : [];
                pathSegments = pathSegments.filter(function(segment) {
                    return segment ? true : false
                });
                pathSegments.forEach(function(segment, index) {
                    suggestion = segment ? suggestion.replace("{pathsegment" + ++index + "}", decodeURIComponent(segment)) : suggestion;
                });
            }
            suggest({filename: suggestion + downloadItem.filename});
			return true;
		}
	}

	if(JSON.parse(localStorage.getItem('dr_global_ref_folders'))) {
		suggest({ filename: ref_domain + '/' + downloadItem.filename });
		return true;
	}

	return false;
}

rulesets['mime'] = function(downloadItem, suggest) {
	mime_map  = JSON.parse(localStorage.getItem('dr_mime_map'));
	mime_type = downloadItem.mime;    

	// Octet-stream workaround
	if(mime_type == 'application/octet-stream') {
		var matches   = downloadItem.filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
		var extension = matches && matches[1];
		var mapping   = {
			'mp3': 'audio/mpeg',
			'pdf': 'application/pdf',
			'zip': 'application/zip',
			'png': 'image/png',
			'jpg': 'image/jpeg',
			'exe': 'application/exe',
			'avi': 'video/x-msvideo',
			'torrent': 'application/x-bittorrent'
		};

		if(mapping[extension]) {
			mime_type = mapping[extension];
		}
	}

	folder = mime_map[mime_type];
	if(folder) {
		suggest({ filename: folder + downloadItem.filename });
		return true;
	}

	return false;
}



chrome.downloads.onDeterminingFilename.addListener(function(downloadItem, suggest) {
	var done = false;

	order.every(function(idx) {
		done = rulesets[idx](downloadItem, suggest);
		if(done) {
			return false;
		}
		return true;
	});
});

var version = localStorage.getItem('dr_version');

if(!version || version != chrome.runtime.getManifest().version) {
	// Open the options page directly after installing or updating the extension
	chrome.tabs.create({ url: "options.html" });
	localStorage.setItem('dr_version', chrome.runtime.getManifest().version);
}
