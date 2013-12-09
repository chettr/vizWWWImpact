function loadData(){
	loadMap();

}

function loadMap(){
	var svg = d3.selectAll("svg#mapMain");

	var width = svg.attr("width");
	var height = svg.attr("height");

	var countryID = '480';

	var projection = d3.geo.mercator()
    .scale(100)
    .translate([400,300])
    //.translate([width / 2, height / 2])
    .precision(0.1);

	var path = d3.geo.path()
		.projection(projection);	

	d3.json("data/map/world-50m.json", function(errorMap, world) {
		d3.csv("data/countryData.csv", function(errorCountryData, countryData){
			svg.selectAll("path")
			.data(topojson.feature(world, world.objects.countries).features).enter().append("path")
			.attr({
				d: path,
				id: function(d) {return d.properties.name;},
				stroke: '#000',
				'class': function(d){
					var thisData = _.find(countryData, function(fd){ return d.id == fd.mapID;});
					return thisData === undefined ? "invalidCountry" : "validCountry";
				}
			})
			.on('click', function(d){
				if (this.className.baseVal == 'validCountry') {
					reCenterMap(d.id);	
				}
			});
		});
	});
}

function reCenterMap(countryID){
	console.log(countryID);

}