var express = require('express');
var app = express();
var urlencode = require('urlencode');
var js2xmlparser = require("js2xmlparser");
var jsonexport = require('jsonexport');
var async = require('async');
var osmosis = require('osmosis');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// example request for a crops procedure collection 'http://localhost:8000/procedure_collections?crop=Ackergras+-+Anwelksilage&system=Ballen'
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


var server = app.listen(8000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

})