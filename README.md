# KTBL Database - Missing APIs

The KTBL Database provides information about time consumption, machine costs and diesel costs for selected production processes within agriculture.
Currently, there is no native API implemented on their site. This repo provides a Node JS server aimed at filling that gap.

## Methods

### ```/crop_procedures```

Return an array with all standard working procedures defined for a given crop / cropping system combination
Minimum query parameters:  
```crop``` The crop you want information about -> see CropObject.json for options  
```system``` The cropping system you want information about -> see CropObject.json for options  

Optional query parameters:  
```size``` Plot sizes in ha -> 1,2,5,10,20,40,80 ha  
```yield``` Yield parameters available for the specified crop -> see CropObject.json for options  
```mechanisation``` Mechanisation utilised -> 45, 67, 83, 102, 120, 200, 230 kW  
```distance``` Distances in km -> 1,2,3,4,5,6,10,15,20,30 km  

Example request:  
```http://localhost:8000/crop_procedures?crop=Ackergras+-+Anwelksilage&system=Ballen```

returns:  
```json	
[{
	"frequency": 0.2,
	"month": "OKT1",
	"name": "Bodenprobe",
	"amount": "",
	"steps": [{
		"abr": "BP",
		"description": "Entnahmegerät am Quad; Fahrten mit Quad",
		"time": 0.04,
		"fuelCons": 0,
		"deprec": 0.23,
		"interest": 0.02,
		"others": 0.01,
		"maintenance": 0.15,
		"lubricants": 0.13,
		"services": 0
	}]
}, {
	"frequency": 1,
	"month": "OKT2",
	...
```

### ```/procedure```

Return information on single working procedure. See machCombiObject.json for available combinations and legal query parameters.  
Minimum query parameters:  
```procedureGroup```  
```procedure```  
```machCombination```  
```size```  
```resistance```  
```distance```  
```amount```  
```workingWidth```  

Example request:  
```http://localhost:8000/procedure?procedureGroup=1&procedure=11&machCombination=518&size=1&resistance=leicht&distance=1&amount=0.0&workingWidth=1.8```

returns:  
```json	
{
	"procedure": "11",
	"machCombination": "518",
	"size": "1",
	"resistance": "leicht",
	"distance": "1",
	"amount": "0.0",
	"workingWidth": "1.8",
	"name": "Eggen mit Federzinkenegge (angebaut)",
	"procedureGroup": "1",
	"frequency": null,
	"month": null,
	"steps": [{
		"description": "2 m; 30 kW",
		"time": 1.16,
		"areaOutput": 1.11,
		"deprec": 3.18,
		"interest": 0.91,
		"others": 1.58,
		"maintenance": 8.85,
		"lubricants": 3.47,
		"fuelCons": 4.95,
		"abr": "",
		"amount": 0,
		"workingWidth": 1.8
	}]
}
```

## Legal notice
This repo is not affiliated to KTBL and thus only shows a potential way to access the database via API. Before using a server of this kind a permission of KTBL is required however.

