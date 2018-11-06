# KTBL Database - APIs

The KTBL Database provides information about contribution margins (including prices and yields), standard gross margins, and production process specifications for a wide variety of crops.
Currently, there is no native API for the calculated data implemented on their site. This repo provides a (scraping) client aimed at filling that gap.

## Installation
```
npm install ktbl-apis
```

## Table of content

- Methods
  - [```cropList([options])```](#cropListoptions)
  -   [```contributionMargin(options)```](#contributionmarginoptio  ns)
  - [```standardGrossMargin(crop,   region)```](#standardgrossmargincrop-region)
  - [```cropProcedures(options)```](#cropproceduresoptions)
  - [```procedure(options)```](#procedureoptions)

## API

### ```cropList([options])```
Returns an array of strings with all available options for the query.  

- `options` *\<object\>*
  - `farmingType` *\<string\>*
  - `crop` *\<string\>*
  - `system` *\<string\>*

Results are obtained from the [KTBL Verfahrensrechner Tool](https://daten.ktbl.de/vrpflanze/home.action).

Examples:

```js
const ktbl = require('ktbl-apis')

// Query all available farming types
ktbl.cropList()
.then(result => {
  // ['konventionell/integriert', 'ökologisch']
})
.catch(e => {
  console.log(e);
})

// query all crops for a certain farming type
ktbl.cropList({
  farmingType: 'ökologisch'
})
.then(result => {
  // ["Ackerbohnen - Erbsen - Gemenge", "Ackerbohnen - Hafer - Gemenge", "Blumenkohl", ...]
})
.catch(e => {
  console.log(e);
})

// query all systems for a certain crop of a farming type
ktbl.cropList({
  farmingType: 'ökologisch',
  crop: 'Ackerbohnen - Erbsen - Gemenge'
})
.then(result => {
  // ['nichtwendend, ohne Düngung', 'wendend, ohne Düngung']
})
.catch(e => {
  console.log(e);
})

// query all available specifications for a combination of
// farmingType, crop, and system.
// Will return an array of objects that can be chained with the cropProcedures method
ktbl.cropList({
  farmingType: 'ökologisch',
  crop: 'Ackerbohnen - Erbsen - Gemenge',
  system: 'nichtwendend, ohne Düngung'
})
.then(result => {
  /*
  [{
    "type": "ökologisch",
    "crop": "Ackerbohnen - Erbsen - Gemenge",
    "system": "nichtwendend, ohne Düngung",
    "size": "0",
    "yield": "mittel, leichter Boden",
    "mechanisation": "45",
    "distance": "1",
    "getIds": true
  }, {
    "type": "ökologisch",
    ...
  */
})
.catch(e => {
  console.log(e);
})
```
### ```contributionMargin(options)```
Returns the default KTBL contribution margin for a crop.  

- `options` *\<object\>*
  - `farmingType` *\<string\>*
  - `crop` *\<string\>*
  - `system` *\<string\>*

Results are obtained from the [KTBL Leistungs-Kostenrechnung Pflanzenbau Tool](https://daten.ktbl.de/dslkrpflanze/postHv.html).

Example:
```js
const ktbl = require('ktbl-apis')

// Query default KTBL contribution margin for a crop
ktbl.contributionMargin({
  farmingType: 'ökologisch',
  crop: 'Ackerbohnen - Erbsen - Gemenge',
  system: 'nichtwendend, ohne Düngung'
})
.then(result => {
  /*
  {
    "revenues": [{
      "name": "Ackerbohnen, ökologisch",
      "amount": {
        "value": 1.97,
        "unit": "t/ha"
      },
      "price": {
        "value": 451,
        "unit": "€/t"
      },
      "total": {
        "value": 888.47,
        "unit": "€/ha"
      }
    }, {
      "name": "Futtererbsen, ökologisch",
      "amount": {
      ...
    },
    "directCosts": [Object],
    "variableCosts": [Object],
    "fixCosts": [Object]
  */
})
.catch(err => {
  console.log(err)
})
```

### ```standardGrossMargin(crop, region)```
Returns the prices, yields, direct costs and standard gross margins from 2001 - *present* for a crop in a specific region. Region can be any state (*Bundesland*) or county (*Regierungsbezirk*) in Germany.  
As the standard gross margin is not available for all crops that are present in the other methods, a more or less intelligent guess is made which crop (or crop group) is most suitable for the query.

- crop *\<string\>*
- region *\<string\>* **Default:** 'Deutschland'

Results are obtained from the [KTBL SDB Databse Tool](https://daten.ktbl.de/sdb/welcome.do).

Example:
```js
const ktbl = require('ktbl-apis')

// Query standard gross margin for a crop
ktbl.standardGrossMargin('Ackerbohnen - Erbsen - Gemenge', 'Detmold')
.then(result => {
/*
[
  [{
    "crop": "Ackerbohnen - Erbsen - Gemenge",
    "sdbCrop": "Eiweißpflanzen",
    "year": 2017,
    "region": "Detmold",
    "mainProduct": {
      "yield": 34.1,
      "price": 17.79,
      "revenue": 607
    },
    "byProduct": {
      "yield": 0,
      "price": 0,
      "revenue": 0
    },
    "varCosts": {
      "seeds": 99,
      "fertilizer": 45,
      "pesticides": 115,
      "others": 79
    },
    "total": {
      "sdb": 269,
      "revenues": 607,
      "varCosts": 338
    }
  }, {
    "crop": "Ackerbohnen - Erbsen - Gemenge",
    "sdbCrop": "Eiweißpflanzen",
    "year": 2016,
    ...
    */
})
.catch(err => {
  console.log(err)
})
```

### ```cropProcedures(options)```

Returns an array of objects with all standard working procedures defined for a given crop / cropping system combination.  
See the `cropList` method for all available combinations of `farmingType`, `crop`, `system` and the other specifications.

- `options` *\<object\>*
    - `farmingType` *\<string\>*
    - `crop` *\<string\>*
    - `system` *\<string\>*
    - `size` *\<string\>*|*\<integer\>* **Default:** `2`
    - `yield` *\<string\>* **Default:** KTBL default value
    - `distance` *\<string\>*|*\<integer\>* **Default:** `2`
    - `getIds` *\<bool\>* **Default:** `false`

Results are obtained from the [KTBL Verfahrensrechner Tool](https://daten.ktbl.de/vrpflanze/home.action).

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

Returns information on a single working procedure.  
The available `procedureGroup`, `procedure`, and `machCombination` combinations can be queried with the `getIds` option of the `cropProcedures` method.

- `options` *\<object\>*
    - `procedureGroup` *\<string\>*|*\<integer\>*
    - `procedure` *\<string\>*|*\<integer\>*
    - `machCombination` *\<string\>*|*\<integer\>*
    - `size` *\<string\>*|*\<integer\>* **Default:** `2`
    - `resistance` *\<string\>* **Default:** KTBL default value
    - `distance` *\<string\>*|*\<integer\>* **Default:** `2`
    - `amount` *\<string\>*|*\<integer\>* **Default:** KTBL default value
    - `workingWidth` *\<string\>*|*\<integer\>* **Default:** KTBL default value

Results are obtained from the [KTBL Feldarbeitsrechner Tool](https://daten.ktbl.de/feldarbeit/home.html).

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
