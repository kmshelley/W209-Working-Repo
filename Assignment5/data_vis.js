//SVG Width and height
var w = 1000;
var h = 500;
var padding = 20;
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

var meals = ["Breakfast","Lunch","Dinner"];
var keys = ["carbCal","proteinCal","fatCal"];
var colors = {"carbCal":"#98abc5", "proteinCal":"#6b486b", "fatCal": "#ff8c00"};
var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];

var get_daily_data = function(data){
	//add fat calories, protein calories, carb calories per day per meal
	var daily_data = d3.nest().key(function(d) { return d.Weekday; }).entries(data); //make nested data set by date
	
	daily_data.forEach(function(date){	
		date.carbCal = 0;
		date.proteinCal = 0;
		date.fatCal = 0;
		
		date.values.forEach(function(d){
			d.Calories = Number(d.Calories);
			d.Fat = Number(d.Fat);
			d.Protein = Number(d.Protein);
			d.Carbs = Number(d.Carbs);
			
			//add variables for calories by fat, carbs, and protein
			if (d.Fat>0 || d.Protein>0 || d.Carbs>0){
				d.fatCal = d.Calories * (d.Fat/(d.Fat + d.Protein + d.Carbs));
				d.proteinCal = d.Calories * (d.Protein/(d.Fat + d.Protein + d.Carbs));
				d.carbCal = d.Calories * (d.Carbs/(d.Fat + d.Protein + d.Carbs));
			}else{
				d.fatCal=0;
				d.proteinCal=0;
				d.carbCal=0;
			};
					
			//add to cummulative calories
			date.carbCal+=d.carbCal;
			date.proteinCal+=d.proteinCal;
			date.fatCal+=d.fatCal;
			
		});
		//develop dictionary of subcategory-height pairs for stacked bar chart
		var y0 = 0;
		date.breakdown = keys.map(function(name){return {name: name, y0: y0, y1: y0 += date[name],weekday: date.key}});
		date.totalCal = Number(date.carbCal)+Number(date.fatCal)+Number(date.proteinCal);
	});

	return daily_data;
};

var get_meal_data = function(data,meal){	
	
	//add fat calories, protein calories, carb calories per meal
	//Data Cleaning: update date fields, add fat calories, protein calories, carb calories
	mealdata = data.filter(function(d){if(d.Meal.toLowerCase() == meal){return d;}});
	
	mealdata.forEach(function(d){
		d.Calories = Number(d.Calories);
		d.Fat = Number(d.Fat);
		d.Protein = Number(d.Protein);
		d.Carbs = Number(d.Carbs);
		
		//add variables for calories by fat, carbs, and protein
		d.fatCal = d.Calories * (d.Fat/(d.Fat + d.Protein + d.Carbs));
		d.proteinCal = d.Calories * (d.Protein/(d.Fat + d.Protein + d.Carbs));
		d.carbCal = d.Calories * (d.Carbs/(d.Fat + d.Protein + d.Carbs));
		
		//develop dictionary of subcategory-height pairs for stacked bar chart
		var y0 = 0;
		d.breakdown = keys.map(function(name){return {name: name, y0: y0, y1: y0 += d[name],weekday: d.Weekday}});
	});
		
	return mealdata;
};

//function to display the data visualization
var displayChart = function(data){
	//meal names, colors, etc.
	
	
	var daily_data = get_daily_data(data);
	
	
	
	//define SVG for bar chart
	var svg = d3.select("body")
				.append("svg")
				.attr({
					width: w,
					height: h
					})
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				
	//bar chart scales
	var yScale = d3.scale.linear()
						.domain([
								d3.min([0,d3.min(daily_data,function(d){return Number(d.totalCal);})]),
								d3.max([0,d3.max(daily_data,function(d){return Number(d.totalCal);})])
								])
						.range([height,0]);
	
	var xScale = d3.scale.ordinal()
						.domain(d3.map(daily_data, function(d) { return d.key; }).keys())
						.rangeBands([0, width],.5);	
	//chart axes
	var xAxis = d3.svg.axis()
					.scale(xScale)
					.orient("bottom");
					
	var yAxis = d3.svg.axis()
					.scale(yScale)
					.orient("left");
					
	
	//tool tip
	var tip = d3.tip()
			  .attr('class', 'd3-tip')
			  .offset([-10, 0])
			  .html(function(d) {
				if (d.name == 'fatCal'){
					type = 'Fat Calories';
					
				}else if (d.name == 'carbCal'){
					type = 'Carb Calories';
				}else{
					type = 'Protein Calories';
				};
				value = (d.y1-d.y0).toFixed(0);
				return "<strong>" + type + ":</strong> <span style='color:white'>" + value + "</span>";
			  })
			  
	//add the chart elements
	svg.append("g")
			.attr("class", "axis") //Assign "axis" css class
			.attr("transform", "translate(" + margin.left + "," + height + ")")
			.call(xAxis);
		
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(" + margin.left + ",0)")
		.call(yAxis);
	
	svg.call(tip);
	
	//bar group (will consist of group of rects)
	var bar = svg.selectAll(".bar")
					.data(daily_data)
					.enter()
					.append("g")
					.attr("class", "bar");
	
	
  
	
	
	bar.selectAll("rect")
				.data(function(d) { return d.breakdown; })
				.enter()
				.append("rect")
				.attr({
					x: function(d) { return xScale(d.weekday) + margin.left; },
					y: function(d) { return yScale(d.y1); },
					width: xScale.rangeBand(),
					height: function(d) { return yScale(d.y0) - yScale(d.y1); },
					fill: function (d) {return colors[d.name];}
					})
				.on('mouseover', tip.show)
				.on('mouseout', tip.hide);
	
	
	
	
	
	d3.selectAll("input")
    .on("change", function() {
		d3.selectAll("rect > *").remove();
		
        //define sub datasets for charts
		if (this.value == "all"){
			var subdata = get_daily_data(data);
			//iterate through the weekdays and add empty data element for any missing data
			days.forEach(function(day){
				subdays = d3.map(subdata, function(d) { return d.key; }).keys()
				if (subdays.indexOf(day) === -1){
					newval = {key:day};
					newval.breakdown = keys.map(function(name){return {name: name, y0: 0, y1: 0, weekday:day}});
					subdata.push(newval);
				}
			});
		}else{
			meal = this.value;
			var subdata = get_meal_data(data,meal);
			//iterate through the weekdays and add empty data element for any missing data
			days.forEach(function(day){
				subdays = d3.map(subdata, function(d) { return d.Weekday; }).keys()
				if (subdays.indexOf(day) === -1){
					newval = {Meal:meal, Weekday:day};
					newval.breakdown = keys.map(function(name){return {name: name, y0: 0, y1: 0, weekday:day}});
					subdata.push(newval);
				}
			});
		};
		//bind new data to svg
		var bar = svg.selectAll(".bar")
					.data(subdata);
		
		
		bar.selectAll("rect")
				.data(function(d) { return d.breakdown; })
				.transition()
				.duration(1000)
				.attr({
					x: function(d) { return xScale(d.weekday) + margin.left; },
					y: function(d) { return yScale(d.y1); },
					width: xScale.rangeBand(),
					height: function(d) { return yScale(d.y0) - yScale(d.y1); },
					fill: function (d) {return colors[d.name];}
					});
		//bar.exit().remove().transition();
    });

};
	



//loads page text
var load_text = function(){
	//Page title and subtitle
	d3.select("body")
		.append("h1")
		.text("W209 Assignment 5")
		.style("font","cambria")
		.style("font-size","24px")
		.style("text-align","center")
		.style("color","rgb(150,150,150)");
		
	d3.select("body")
		.append("h2")
		.text("Katherine Shelley");
		
	//Short description of data visualization
	
	d3.select("body")
		.append("p")
		.text("This chart displays my calorie intake over seven days.")
	
	d3.select("body")
		.append("p")
		.text("The data is broken down by meal; breakfast, lunch, and dinner; and calories from carbohydrates, protein, and fat. ")
	
	d3.select("body")
		.append("p")
		.text("Change the meal by selecting the appropriate button. Hover over the bars for more detail.")
		
};

//loads radio buttons
var load_buttons = function(){
	meals = d3.entries({"all":"All Meals","breakfast":"Breakfast","lunch":"Lunch","dinner":"Dinner"});
	j=0;
	// Create the shape selectors
	var form = d3.select("body")
		.append("form");

	var labelEnter = form.selectAll("span")
		.data(meals)
		.enter()
		.append("span");

	labelEnter.append("input")
		.attr({
			type: "radio",
			class: "meal",
			name: "mode",
			value: function(d) {return d.key;}
		})
		.property("checked", function(d, i) { 
			return (i===j); 
		});

	labelEnter.append("label").text(function(d) {return d.value;});
		
};

var load_legend = function(){
	//chart legend
	//define SVG
	var legend = d3.select("body")
				.append("svg")
				.attr({
					width: w/3,
					height: h/10,
					})
				.attr("transform", "translate(" + margin.left + ",0)");
					
	legend.selectAll("rect")
			.data(keys)
			.enter()
			.append("rect")
			.attr({
				x: function(d,i){return 75*i + 75 ;},
				y: 0,
				height: 20,
				width: 20,
				fill: function(d){return colors[d];}
			});
			
	legend.selectAll("text")
			.data(keys)
			.enter()
			.append("text")
			.attr({
				x: function(d,i){return 75*i + 85;},
				y: 35,
			})
			.attr("text-anchor","middle")
			.text(function(d) {
				if(d == "carbCal"){
					return "Carbs";
				}else if (d == "proteinCal"){
					return "Protein";
				}else if (d == "fatCal"){
					return "Fat";
				}
			});
			
};
		
//loads the data and displays the chart
var load_data = function(){
	d3.csv("calories.csv",function(data){
		try{
			dataset = data;
			displayChart(dataset);
		}
		catch (err){
			console.log(err);
		}
	});
};

var dataset;
load_text();
load_buttons();
load_data();
load_legend();
