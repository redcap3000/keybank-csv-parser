

/*

	keybankCVSAnayltics

	Takes a keybank banking log, available through their web interface for download,
	figures out transactions that have occured more than once, totals them,
	then writes a json file with that information.


	May be used as a starting point for further analysis if you are so inclined

	Ronaldo Barbachano 2017
*/

fs = require('mz/fs')
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};
try{
	let cvsFile = fs.readFileSync(process.argv[2]);
	if(cvsFile){
		// reset /set resultObjects
		resultObjects = []
		cvsFile = cvsFile.toString()
		keys = []
		stats = []
		keybankFields = ['Date','Amount','Description','Ref#']
		// skip fiest three rows... 
		if(typeof cvsFile != 'undefined'){
			cvsFile.toString().split('\n').filter(function(o,i){
				if(i > 2){
					let row = o.split(',')
					let obj = {}
					keys = ['Date','Amount','Description','Ref#']
					row.filter(function(value,order){
						if(order != 2 && order != 1 && value != ''){
							obj[ keys[order]] = value.trim()
						}else if(value != '' && order == 2){
							// description
							obj[ keys[order]] = value.trim().toProperCase().replace(/"/g,"").replace(/'/g,"")
						}else if(order === 1){
							// amount
							obj[ keys[ order]] = parseFloat(value.replace(/"/g,"").replace(/'/g,""))
						}
					})
					resultObjects.push(obj)
				}
			})
			if(resultObjects.length > 0){
				commonTransactions = {}
				resultObjects.filter(function(row,i){
					if(typeof row.Description == 'undefined'){
						// some rows have account information / header text that is unusable
						return false
					}
					if(typeof commonTransactions[row.Description] == 'undefined' && typeof row.Amount != 'undefined' && typeof row.Date != 'undefined'){
						commonTransactions[row.Description] = [[row.Date  , row.Amount]]
					}else if(typeof commonTransactions[row.Description] != 'undefined' && row.Date != 'undefined' && row.Amount != 'undefined'){
						commonTransactions[row.Description].push([row.Date , row.Amount])
					}
				})
				var commonTotals = {}
				var commonCount = {}
				var duplicates = []
				for(var place in commonTransactions){
					if(commonTransactions[place].length > 1){
						duplicates.push([place,commonTransactions[place]])
					}
					if(typeof commonTotals[place] == 'undefined' && place != 'undefined'){
						commonTotals[place] = Math.abs(commonTransactions[place][1])
						commonCount[place] = 1
					}else if(place != 'undefined'){
						commonTotals[place] += Math.abs(commonTransactions[place][1])
						commonCount[place] += 1
					}
				}
				finalResult = {}
				for(var place in duplicates){
					var amounts = duplicates[place][1]
					var total = 0
					amounts.filter(function(o){
						total += o[1]
					})
					finalResult[duplicates[place][0]] = parseFloat(total).toFixed(2)
				}
				fs.writeFile('./'+process.argv[2]+'_parsed.json', JSON.stringify(cities, null, 2) , 'utf-8');
			}
		}
	}
}catch(err){
	console.log(err)
	console.log("Problem with file")
}
