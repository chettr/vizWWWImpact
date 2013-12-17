function loadData(){
	var loadCountryDataPromise = loadCountryData();

	loadCountryDataPromise.done(function(){
		sortAndDisplayCountries('alpha');
		loadMap();
	});
}

/*
width : 800px;
	height : 430px;*/

var projection = d3.geo.mercator()
    .scale(100)
   // .translate([400,300])
    .translate([400, 300])
    .precision(0.1);

var path = d3.geo.path()
		.projection(projection);	

var countryData;
var worldMapData; //TODO Is this too large?

function loadCountryData(){
	var def = $.Deferred();
	d3.csv("data/countryByRankScore.csv", function(errorCountryData, inCountryData){
		countryData = inCountryData;
		def.resolve();
	});
	return def.promise();
}

function sortAndDisplayCountries(searchOpt){
	var select = d3.select("#countrySelect");
	select.selectAll("optgroup").remove();
	select.selectAll("option").remove();

	if (searchOpt == 'alpha'){ //non nested sort
		countryData.sort(function (a, b) {
			if (a.CountryName > b.CountryName)
				return 1;
			if (a.CountryName < b.CountryName)
				return -1;
			return 0;
		});

		select.selectAll("option").data(countryData).enter()
		.append("option")
		.attr("value", function(d){ return d.mapID;})
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
			.attr("value", function(d){ return d.mapID;})
			.text(function(d){return d.CountryName;});
		}
	}
}

/*function selectLocationByID(id){
	var countryName = _.find(countryData, function(d){ return d.mapID == id;}).CountryName;
	selectLocationScope(countryName);
}*/

function selectLocationScope(id){
	var thisCountryData = _.find(countryData, function(d){ return d.mapID == id;});

	d3.selectAll("#mapMain > path").classed("selectedCountry", false);
	d3.select("#m_" + id).classed("selectedCountry", true).moveToFront();

	d3.select("h2#countryNameDisp").text(thisCountryData.CountryName);
}

function loadMap(){
	var svg = d3.selectAll("svg#mapMain");

	var g = svg.append("g");

	var width = svg.attr("width", 800);
	var height = svg.attr("height", 430);

	d3.json("data/map/world-50m.json", function(errorMap, world) {
		worldMapData = world;
		var features = topojson.feature(world, world.objects.countries).features.filter(function(d){if (d.id != 10){return d;} });

		g.selectAll("path")
		.data(features).enter().append("path")
		.attr({
			d: path,
			id: function(d) {return "m_" + d.id;},
			stroke: '#000',
			'stroke-opacity': 0.5,
			'stroke-width': 1,
			'class': function(d){
				var thisData = _.find(countryData, function(fd){ return d.id == fd.mapID;});
				return thisData === undefined ? "invalidCountry" : "validCountry";
			}
		})
		.on('click', mapClick/*function(d){
			if (this.className.baseVal == 'validCountry') {
				//selectLocationScope(d.id);	
				mapClick
			}
		}*/);
	});
}

var active;

function mapClick(d) {
  if (active === d) return resetMap();
  var svg = d3.selectAll("svg#mapMain");
  var g = svg.select("g");

  var width = svg.attr("width");
  var height = svg.attr("height");

  g.selectAll(".selectedCountry").classed("selectedCountry", false);
  d3.select(this).classed("selectedCountry", active = d);

  var b = path.bounds(d);
  var scaleModifier = 0.95 / Math.max((b[1][0] - b[0][0]) / width, ((b[1][1] - b[0][1]) / height));

  console.log("Coord 1 (" + b[0][0] + "," + b[0][1] + ")" );
  console.log("Coord 2 (" + b[1][0] + "," + b[1][1] + ")" );
  console.log("offset x " + (-(b[1][0] + b[0][0]) / 2) );
  console.log("offset y " + (-(b[1][1] + b[0][1]) / 2 ) );
  console.log("scale " + scaleModifier);
  //b[0][1] += 15
  //b[1][1] += 15

  g.transition().duration(500).attr("transform",
		"translate(" + projection.translate() + ")" +
		"scale(" + scaleModifier + ")" + 
		"translate(" + 
		-(b[1][0] + b[0][0]) / 2 + 
		"," + 
		((-(b[1][1] + b[0][1]) / 2 ) - ((165 / scaleModifier)/2))+ 
		")");

  g.selectAll("path").transition().duration(500).attr({
		"stroke-width": 1/scaleModifier
  });
}

function resetMap() {
	var g = d3.select("svg#mapMain > g");
	g.selectAll("path").transition().duration(500).attr({
		"stroke-width": 1
  });

  g.selectAll(".selectedCountry").classed("selectedCountry", false);
  g.transition().duration(500).attr("transform", "");
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};