# KTBL Database - APIs

The KTBL Database provides information about time consumption, machine costs and diesel costs for selected production processes within agriculture.
Currently, there is no native API implemented on their site. This repo provides a (scraping) client aimed at filling that gap.

## Installation
```
npm install ktbl-apis
```

## Methods

### ```cropProcedures(options)```

Returns an array of objects with all standard working procedures defined for a given crop / cropping system combination
`Options` is an object that takes the following minimum query parameters:
```crop``` The crop you want information about -> see vocab/CropObject.json for options
```system``` The cropping system you want information about -> see vocab/CropObject.json for options

Optional query parameters:
```size``` Plot sizes in ha -> 1,2,5,10,20,40,80 ha
```yield``` Yield parameters available for the specified crop -> see vocab/CropObject.json for options
```mechanisation``` Mechanisation utilised -> 45, 67, 83, 102, 120, 200, 230 kW
```distance``` Distances in km -> 1,2,3,4,5,6,10,15,20,30 km
```getIds``` Boolean. Whether to also query the internal KTBL IDs (used in the `procedure` method) for the machine combinations. Significantly slows down the response time.

Example:
```js
const ktbl = require('ktbl-apis')

// Query crop procedures
ktbl.cropProcedures({
  'crop': 'Ackergras - Anwelksilage',
  'type': 'konventionell/integriert',
  'system': 'Ballen'
})
.then(result => {
  /* where result yields:
	[{
	  "frequency": 0.2,
	  "month": "OKT1",
	  "name": "Bodenprobe",
	  "amount": "",
	  "steps": [{
	    "abr": "BP",
	    "description": "Entnahme von Hand; Fahrten mit Pick-up",
	    "time": 0.04,
	    "fuelCons": 0.03,
	    "deprec": 0.11,
	    "interest": 0.01,
	    "others": 0.04,
	    "maintenance": 0.03,
	    "lubricants": 0.02,
	    "services": 0
	  }]
	}, {
	  "frequency": 1,
	  "month": "OKT2",
	  "name": "Gülle ausbringen, ab Hof",
	  "amount": ["20.00", "m³"],
	  "steps": [{
	    "abr": "FA",
	    "description": "Pumptankwagen, 5 m³; Schleppschlauchverteiler, 7,5 m; 45 kW",
	    "time": 2.01,
	    "fuelCons": 7.05,
	    "deprec": 19.12,
	    "interest": 4.63,
	    "others": 2.51,
	    "maintenance": 18.45,
	    "lubricants": 4.94,
	    "services": 0
	  }]
	},...
	*/
})
.catch(err => {
  // handle errors
})
```


### ```procedure(options)```

Returns information on a single working procedure. See vocab/machCombiObject.json for available combinations.

Options is an object with the following minimum properties:
```procedureGroup``` See vocab/machCombiObject.json for available options.
```procedure``` See vocab/machCombiObject.json for available options.
```machCombination``` See vocab/machCombiObject.json for available options.
```size``` Plot sizes in ha -> 1,2,5,10,20,40,80 ha
```resistance``` See vocab/machCombiObject.json for available options.
```distance``` Distances in km -> 1,2,3,4,5,6,10,15,20,30 km
```amount``` See vocab/machCombiObject.json for available options.
```workingWidth``` See vocab/machCombiObject.json for available options.

Example:
```js
const ktbl = require('ktbl-apis')

// Query a single working step
ktbl.procedure({
  procedureGroupId: '3',
  procedureId: '290',
  machCombinationId: '2493',
  size: '1',
  resistance: 'leicht',
  distance: '1',
  amount: '130.0',
  workingWidth: '4.0',
})
.then(result => {
  /* result yields:
	{
	  "procedureId": "290",
	  "machCombinationId": "2493",
	  "machCombination": "4 m; 102 kW",
	  "size": "1",
	  "resistance": "leicht",
	  "distance": "1",
	  "amount": "130.0",
	  "workingWidth": "4.0",
	  "name": "Säen von Gerste mit Kreiselegge und Sämaschine",
	  "procedureGroupId": "3",
	  "procedureGroup": "Bestellung",
	  "steps": [{
	    "description": "4 m; 102 kW",
	    "name": "Feldarbeit",
	    "time": 1.03,
	    "areaOutput": 1.49,
	    "deprec": 17.36,
	    "interest": 4.51,
	    "others": 1.72,
	    "maintenance": 17.48,
	    "lubricants": 8.41,
	    "fuelCons": 12.01,
	    "abr": "",
	    "amount": 130,
	    "workingWidth": 4
	  }]
	}
	*/
})
.catch(err => {
  // handle errors
})
```


## Legal notice
This repo is not affiliated to KTBL and thus only shows a potential way to access the database via API.
