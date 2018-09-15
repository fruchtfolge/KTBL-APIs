var express = require('express');
var app = express();
var urlencode = require('urlencode');
var js2xmlparser = require("js2xmlparser");
var jsonexport = require('jsonexport');
var async = require('async');
var osmosis = require('osmosis');
var libxmljs = require('libxmljs-dom')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// example request for a procedure 'http://localhost:8000/procedure?procedureGroup=1&procedure=11&machCombination=518&size=1&resistance=leicht&distance=1&amount=0.0&workingWidth=1.8'
app.get('/procedure', function (req, res) {
	if (!req.query) {
		res.send ( 'Please enter adequate parameters to your request. The minimum request parameters consist of a crop type and according cropping system. Here is a valid example of such a request: ... See ... for additional help.');
	}
	/*
	else if (!req.query.crop) {
		res.send ( 'Please enter a valid crop type to your request. The minimum request parameters consist of a crop type and according cropping system. Here is a valid example of such a request: ... See ... for additional help.');
	}
	else if (!req.query.system) {
		res.send ( 'Please enter a valid cropping system for the crop ' + urlencode.decode(req.query.crop) + ' to your request. The minimum request parameters consist of a crop type and according cropping system. Here is a valid example of such a request: ... See ... for additional help.');
	}
	*/
	else {
		// get params from req url
		var item = [];
		item[0] = urlencode.decode(req.query.procedureGroup);
		item[1] = urlencode.decode(req.query.procedure);
		item[2] = urlencode.decode(req.query.machCombination);
		item[3] = urlencode.decode(req.query.size);
		item[4] = urlencode.decode(req.query.resistance);
		item[5] = urlencode.decode(req.query.distance);
		item[6] = urlencode.decode(req.query.amount);
		item[7] = urlencode.decode(req.query.workingWidth);

		osmosis
			.get('http://daten.ktbl.de/feldarbeit/home.html')
			.post('http://daten.ktbl.de/feldarbeit/entry.html', {'state': '1'})
			.config( 'headers', {'referer': 'http://daten.ktbl.de/feldarbeit/home.html'})
			.then(function(context,data,next) {
				data.cookie = context.request.headers['cookie'];
				next(context,data);
			})
			// Verfahrensgruppe
			.then(function (context,data,next) {
				osmosis
					.post('http://daten.ktbl.de/feldarbeit/entry.html', {'hgId': item[0], 'state': '2'})
					.config( 'headers', {'cookie': data.cookie, 'referer': 'http://daten.ktbl.de/feldarbeit/entry.html'})
					.then(function (context) {
						 next(context,data);
					})
					.error(console.error)
			})
			// Arbeitsverfahren
			.then(function (context,data,next) {
				osmosis
					.post('http://daten.ktbl.de/feldarbeit/entry.html', {'gId': item[1], 'state': '3'})
					.config( 'headers', {'cookie': data.cookie, 'referer': 'http://daten.ktbl.de/feldarbeit/entry.html'})
					.then(function (context) {
						 next(context,data);
					})
					.error(console.error)
			})
			// Maschinenkombination
			.then(function (context,data,next) {
				osmosis
					.post('http://daten.ktbl.de/feldarbeit/entry.html', {'avId': item[2], 'state': '4'})
					.config( 'headers', {'cookie': data.cookie, 'referer': 'http://daten.ktbl.de/feldarbeit/entry.html'})
					.then(function (context) {
						 next(context,data);
					})
					.error(console.error)
			})
			.then(function (context,data,next) {
				//console.log(data)
				osmosis
					.post('http://daten.ktbl.de/feldarbeit/entry.html', {'flaecheID': item[3], 'bodenID': item[4], 'hofID': item[5], 'mengeID': item[6], 'arbeit': item[7], 'state': '5'})
					.config( 'headers', {'cookie': data.cookie, 'referer': 'http://daten.ktbl.de/feldarbeit/entry.html'})
					.then(function (context) {
						next(context,data);
					})
					.error(console.error)
			})
			// prepare HTML file
			.then(function(context,data,next) {
				const dom = new JSDOM(context);
				var html = dom.window.document.documentElement.outerHTML;
				var contextObject = libxmljs.parseHtml(html);
				next(contextObject,data)
			})
			// scrape
			.then(function (context,data,next) {
				const dom = new JSDOM(context);
				var rows = dom.window.document.querySelectorAll('#tabs-2 > table > tbody > tr');
				var procedureName = dom.window.document.getElementsByName('gId')[0].options[dom.window.document.getElementsByName('gId')[0].selectedIndex].text;
				if (dom.window.document.getElementsByName('avId')[0].options[dom.window.document.getElementsByName('avId')[0].selectedIndex].text.includes('Dienstleistung')) {
					dienstleistung.push(item)
				}

				if (rows.length > 3) {
					var steps = []

					for (var i = 3; i < rows.length; i++) {
						var cells = rows[i].getElementsByTagName('td');
						if (cells.length < 10) {
							next(context,data)
							break;
						}
						var step = {}

						step.description = cells[0].innerHTML.trim();
						step.time = parseFloat(cells[2].innerHTML.trim().replace(',','.'));
						step.areaOutput = parseFloat(cells[3].innerHTML.trim().replace(',','.'));
						step.deprec = parseFloat(cells[4].innerHTML.trim().replace(',','.'));
						step.interest = parseFloat(cells[5].innerHTML.trim().replace(',','.'));
						step.others = parseFloat(cells[6].innerHTML.trim().replace(',','.'));
						step.maintenance = parseFloat(cells[7].innerHTML.trim().replace(',','.'));
						step.lubricants = parseFloat(cells[8].innerHTML.trim().replace(',','.'));
						step.fuelCons = parseFloat(cells[9].innerHTML.trim().replace(',','.'));
						step.abr = '';
						step.amount = parseFloat(item[6].replace(',','.'));
						step.workingWidth = parseFloat(item[7].replace(',','.'));

						steps.push(step)
					}

					var json = {
		    			'procedure': item[1],
		    			'machCombination': item[2],
		    			'size': item[3],
		    			'resistance': item[4],
		    			'distance': item[5],
		   				'amount': item[6],
		    			'workingWidth': item[7],
						'name': procedureName,
						'procedureGroup': item[0],
						'frequency': null,
						'month': null,
						'steps': steps
					}
					res.send(JSON.stringify(json));
				}
			})
			.done(function () {

			})
	}
})

// example request for a crops procedure collection 'http://localhost:8000/crop_procedures?crop=Ackergras+-+Anwelksilage&system=Ballen'
app.get('/crop_procedures', function (req, res) {
	if (!req.query) {
		res.send ( 'Please enter adequate parameters to your request. The minimum request parameters consist of a crop type and according cropping system. Here is a valid example of such a request: ... See ... for additional help.');
	}
	else if (!req.query.crop) {
		res.send ( 'Please enter a valid crop type to your request. The minimum request parameters consist of a crop type and according cropping system. Here is a valid example of such a request: ... See ... for additional help.');
	}
	else if (!req.query.system) {
		res.send ( 'Please enter a valid cropping system for the crop ' + urlencode.decode(req.query.crop) + ' to your request. The minimum request parameters consist of a crop type and according cropping system. Here is a valid example of such a request: ... See ... for additional help.');
	}
	else {
		// get params from req url
		var crop = urlencode.decode(req.query.crop);
		var system = urlencode.decode(req.query.system);
		var size = urlencode.decode(req.query.size);
		if (size == 'undefined') {
			size = 2
		};
		var yields = urlencode.decode(req.query.yield);
		if (yields == 'undefined') {
			yields = 'mittel, mittlerer Boden'
		}
		var mechanisation = urlencode.decode(req.query.mechanisation);
		if (mechanisation == 'undefined') {
			mechanisation = 102
		}
		var distance = urlencode.decode(req.query.distance);
		if (distance == 'undefined') {
			distance = 2
		}

		osmosis
			.get('http://daten.ktbl.de/vrpflanze/home.action')
			.find('div.aktionskastenUnten > a')
			.follow('@href')
			// farming type
			.post('http://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action', {'selectedWirtschaftsart': 'konventionell/integriert'})
			.then(function(context,data,next) {
				data.cookie = context.request.headers['cookie'];
				next(context,data);
			})
			// crop
			.then(function (context,data,next) {
				osmosis
					.post('http://daten.ktbl.de/vrpflanze/prodverfahren/loadAnbausystem.action', {'selectedKulturpflanze': crop})
					.config( 'headers', {'cookie': data.cookie, 'referer': 'http://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action'})
					.then(function (context) {
							return next(context,data);
					})
					.error(console.error)
			})
			// specifications
			.then(function (context,data,next) {
				osmosis
					.post('http://daten.ktbl.de/vrpflanze/prodverfahren/loadSpezifikationen.action', {'selectedAnbausystem': system})
					.config( 'headers', {'cookie': data.cookie, 'referer': 'http://daten.ktbl.de/vrpflanze/prodverfahren/loadAnbausystem.action'})
					.then(function (context) {
							return next(context,data);
					})
					.error(console.error)
			})
			// plot size
			.then(function (context,data,next) {
				osmosis
					.post('http://daten.ktbl.de/vrpflanze/prodverfahren/loadMechanisierungOnUpdateSchlaggroesse.action', {'selectedSchlaggroesse': size})
					.config( 'headers', {'cookie': data.cookie, 'referer': 'http://daten.ktbl.de/vrpflanze/prodverfahren/showResult.action'})
					.then(function (context) {
							return next(context,data);
					})
					.error(console.error)
			})
			// yield
			.then(function (context,data,next) {
				osmosis
					.post('http://daten.ktbl.de/vrpflanze/prodverfahren/loadSpecificationsOnUpdateErtragsniveau.action', {'selectedErtragsniveau': yields})
					.config( 'headers', {'cookie': data.cookie, 'referer': 'http://daten.ktbl.de/vrpflanze/prodverfahren/showResult.action'})
					.then(function (context) {
							return next(context,data);
					})
					.error(console.error)
			})
			// mechanisation & distance
			.then(function (context,data,next) {
				osmosis
					.post('http://daten.ktbl.de/vrpflanze/prodverfahren/loadResult.action', {'selectedMechanisierung': mechanisation, 'selectedEntfernung': distance})
					.config( 'headers', {'cookie': data.cookie, 'referer': 'http://daten.ktbl.de/vrpflanze/prodverfahren/showResult.action'})
					.then(function (context) {
							return next(context,data);
					})
					.error(console.error)
			})
			// scrape
			.then(function (context,data,next) {
				if (context) {
					const dom = new JSDOM(context);
					var rows = dom.window.document.querySelectorAll('#tab-1 > #avForm > div:nth-child(1) > table > tbody > tr:nth-child(n+4)');
					var workingSteps = [];

					for (var i = 0; i < rows.length; i++) {
						var cells = rows[i].getElementsByTagName('td');
						var entries = {};

						if (rows[i].querySelector('.tabelleKoerperUo')) {
							entries.frequency = parseFloat(cells[1].getElementsByTagName('input')[0].value.replace(',','.'));
							entries.month = cells[2].getElementsByTagName('select')[0].value;
							entries.name = cells[4].getElementsByTagName('b')[0].innerHTML.trim();
							if (cells[5].innerHTML.replace(/\t/g,'').replace(/\n/g,'') !== '') {
								entries.amount = cells[5].innerHTML.trim().replace(',','.').replace(/\t/g,'').split('\n');
							}
							else {
								entries.amount = '';
							}
							entries.steps = [];
							var j = i+1;
							while (rows[j].querySelector('.tabelleKoerperUo') === null && j < rows.length -1 && rows[j].querySelector('.tabelleFuss') === null ) {
								var cellsStep = rows[j].getElementsByTagName('td');
								var step = {};
								step.abr = cellsStep[3].innerHTML.trim();
								step.description = cellsStep[4].innerHTML.trim();
								step.time = parseFloat(cellsStep[6].innerHTML.trim().replace(',','.'));
								step.fuelCons = parseFloat(cellsStep[7].innerHTML.trim().replace(',','.'));
								step.deprec = parseFloat(cellsStep[8].innerHTML.trim().replace(',','.'));
								step.interest = parseFloat(cellsStep[9].innerHTML.trim().replace(',','.'));
								step.others = parseFloat(cellsStep[10].innerHTML.trim().replace(',','.'));
								step.maintenance = parseFloat(cellsStep[11].innerHTML.trim().replace(',','.'));
								step.lubricants = parseFloat(cellsStep[12].innerHTML.trim().replace(',','.'));
								step.services = parseFloat(cellsStep[13].innerHTML.trim().replace(',','.'));
								entries.steps.push(step);
								j++;
							}
							workingSteps.push(entries);
						}
					}
					res.send(JSON.stringify(workingSteps));
				}
			})
			.done(function () {
				//res.send(JSON.stringify(data.workingSteps));
			});
	}
})

var server = app.listen(8001, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

})
