/* Script for loading up the Egg locations */

/* mongo localhost/db loadEggs.js */
var locations = [
	[43.47865, 31.137751],
	[23.71985, 61.502224],
	[-105.918694, 35.50936],
	[86.9233 ,27.9856],
	[46.64,-19.39]
]
db.createCollection("posts", {capped:true, size: 5242880, max: 50 })
db.EggLoc.ensureIndex({loc: '2d'})

for (var i = 0; i < locations.length; i++){
	db.EggLoc.insert(
		{
			loc: {
				lon : locations[i][0],
				lat: locations[i][1]
			}
		})
}
