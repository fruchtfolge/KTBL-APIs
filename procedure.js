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


var server = app.listen(8000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

})