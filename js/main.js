function loadData(){
	var loadCountryDataPromise = loadCountryData();

	loadCountryDataPromise.done(function(){
		sortAndDisplayCountries('alpha');
//		fillCountrySelect();
		loadMap();
	});
}

var projection = d3.geo.mercator()
    .scale(100)
    .translate([400,300])
    //.translate([width / 2, height / 2])
    .precision(0.1);

var countryData;

function loadCountryData(){
	var def = $.Deferred();
	d3.csv("data/countryData.csv", function(errorCountryData, inCountryData){
		countryData = inCountryData;
		def.resolve();
	});
	return def.promise();
}

function sortAndDisplayCountries(searchOpt){
	var select = d3.select("#countrySelect");
	select.selectAll("optgroup").remove();
	select.selectAll("option").remove();

	if (searchOpt == 'alpha'){ //non nested sorts
		countryData.sort(function (a, b) {
			if (a.CountryName > b.CountryName)
				return 1;
			if (a.CountryName < b.CountryName)
				return -1;
			return 0;
		});

		select.selectAll("option").data(countryData).enter()
		.append("option")
		.text(function(d){return d.CountryName;});
	}
	else { //nested sorts
		var nest = [];
		var keySortOrder = [];

		if (searchOpt == 'region') {
			nest = d3.nest().key(function(d){ return d.Region;}).entries(countryData);
			keySortOrder = ["North America", "Latin America & Caribbean", "Europe & Central Asia", "Middle East & North Africa", "Sub-Saharan Africa", "South Asia", "East Asia & Pacific"];
		}
		else if (searchOpt == 'income'){
			nest = d3.nest().key(function(d){ return d.IncomeGroup;}).entries(countryData);
			keySortOrder = ["Low income", "Lower middle income", "Upper middle income", "High income: OECD", "High income: nonOECD"];
		}

		//sort categories
		nest.sort(function(a,b){
			var aIdx = keySortOrder.indexOf(a.key);
			var bIdx = keySortOrder.indexOf(b.key);
			if (aIdx > bIdx)
				return 1;
			if (aIdx < bIdx)
				return -1;
			return 0;
		});

		for (var i = 0; i < nest.length; i++) {
			var optGroup = select.append("optgroup").attr({
				value : nest[i].key,
				label : nest[i].key + " (" + nest[i].values.length + ")"
			});

			optGroup.selectAll("option").data(nest[i].values).enter()
			.append("option")
			.text(function(d){return d.CountryName;});
		}

		console.log(nest);
	}
}

function loadMap(){
	var svg = d3.selectAll("svg#mapMain");

	var width = svg.attr("width");
	var height = svg.attr("height");

	var path = d3.geo.path()
		.projection(projection);	

	d3.json("data/map/world-50m.json", function(errorMap, world) {
		svg.selectAll("path")
		.data(topojson.feature(world, world.objects.countries).features).enter().append("path")
		.attr({
			d: path,
			id: function(d) {return d.properties.name;},
			stroke: '#000',
			'stroke-opacity': 0.5,
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
}

function reCenterMap(countryID){
	console.log(countryID);

}