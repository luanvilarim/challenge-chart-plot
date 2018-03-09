import React from 'react';
import { TimeSeries, TimeRange} from "pondjs";
import { Button } from 'react-bootstrap';
import {
    Charts,
    ChartContainer,
    ChartRow,
    YAxis,
    LineChart, styler, Legend
} from "react-timeseries-charts";

const color = ["Aqua","Aquamarine","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood",
	"CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen",
	"DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey",
	"DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","ForestGreen","Fuchsia","Gainsboro"
	,"Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HotPink","IndianRed","Indigo","Khaki","LawnGreen",
	"LemonChiffon","LightBlue","LightCoral","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue",
	"LightSlateGray","LightSlateGrey","LightSteelBlue","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple",
	"MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MistyRose","Moccasin","Navy",
	"Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue",
	"Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey",
	"SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Yellow","YellowGreen"];

class App extends React.Component {
  constructor(props) {
    super(props);
	
    this.state = {
      value: '',
	  data: undefined,
	  series: [],
	  range: new TimeRange([1326309060000, 1329941520000]),
	  done: false,
	  chart_value_bound: {max: 0, min: 0}
    };
	
	this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
	
  }
  
  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleTimeRangeChange(range) {
    this.setState({ range });
  }
  
  handleSubmit(event) {
	var chart_data = [];
	var begin, span_begin, end, span_end;
	var chart_max_value = 0, chart_min_value = 0;
	var group_arr, select_arr = [];
	var series = [];	
	var started = false, stopped = true;
    var line_arr = this.state.value.replace(/'/g, '"').match(/[^\r\n]+/g);
	if (line_arr && line_arr.length > 0) {
		for (var line_index = 0; line_index < line_arr.length; line_index++){
			try{
				var lineJSON = JSON.parse(line_arr[line_index]);
				
				//check mandatory fields
				if (!lineJSON.hasOwnProperty("type")) throw new Error("Missing type. line " + line_index + 1);
				else if (typeof lineJSON.type !== 'string') throw new Error("Expected \"type\" to be a string. line " + line_index + 1);
				
				if (!lineJSON.hasOwnProperty("timestamp")) throw new Error("Missing type. line " + line_index + 1);
				else if (!lineJSON.timestamp instanceof Date) throw new Error("Expected \"timestamp\" to be a Date. line " + line_index + 1);
				
				switch (lineJSON.type){
					case 'start':
						if (started) throw new Error("Expected event with type = 'stop'. line " + line_index + 1);
						else {
							
							started = true;
							stopped = !started;
							begin = lineJSON.timestamp;
							
							if (lineJSON.hasOwnProperty("select") && !lineJSON.select_arr instanceof Array) throw new Error("Expected \"select\" fields to be inside brackets i.e. ['field']. line " + line_index + 1);
							else if (lineJSON.hasOwnProperty("group") && !lineJSON.group instanceof Array) throw new Error("Expected \"group\" fields to be inside brackets i.e. ['field']. line " + line_index + 1);
							else {
								select_arr = lineJSON.select;
								group_arr = lineJSON.group;
							}
						}
						break;
					case 'span':
						if (started && !stopped) {
							if (lineJSON.hasOwnProperty("begin") && !(typeof lineJSON.begin === "number")) throw new Error("Expected \"begin\" to be a Date. line " + line_index + 1);
							else if (lineJSON.hasOwnProperty("end") && !(typeof lineJSON.end === "number")) throw new Error("Expected \"end\" to be a Date. line " + line_index + 1);
							else if (!lineJSON.hasOwnProperty("begin") && !lineJSON.hasOwnProperty("end")) throw new Error("Expected at least an \"begin\" or \"end\" type. line " + line_index + 1);
							else { 
								if (lineJSON.begin >= lineJSON.end) throw new Error("Expected \"end\" to be greater than \"begin\". line " + line_index + 1);
								span_begin = lineJSON.begin;
								span_end = lineJSON.end;
							}
						} else if (!started) throw new Error("Expected event with type = 'start'. line " + line_index + 1);
						break;
					case 'data':
						if (started && !stopped) {
							var series_name = '';
							var missing_field = false;
							for (var i = 0; i < group_arr.length; i++){
								var group = group_arr[i]
								if (lineJSON.hasOwnProperty(group) && typeof lineJSON[group] === 'string') { //get all groups names
									series_name += lineJSON[group] + " ";
								} else {
									missing_field = true;
								}
							};
							if (missing_field) break; //ignore this event if there's a missing field
							for (var j = 0; j < select_arr.length; j++) {
								var select = select_arr[j]; //create serie name: group_name + select_name = serie_name
								if (lineJSON.hasOwnProperty(select) && typeof lineJSON[select] === 'number') {
									var found = false;
									for (var k = 0; k < chart_data.length; k++) { //try to find if serie_name already exists
										if (chart_data[k].name === (series_name + select)) {
											found = true;
											chart_data[k].points.push([lineJSON.timestamp, lineJSON[select]]); //if it does just add an event
										}
									}
									if (!found) { //if it doesn't create a new serie called series_name
										chart_data.push({
											name: (series_name + select),
											columns: ["time", "value"],
											points: [[lineJSON.timestamp, lineJSON[select]]]
										});
									}
								}// else throw new Error("Expected number value in"+ select + ". line " + line_index + 1);
							}
						} else if (!started) throw new Error("Expected event with type = 'start'. line " + line_index + 1);
						break;
					case 'stop':
						if (stopped) throw new Error("Expected event with type = 'start'. line " + line_index + 1);
						else {
							stopped = true;
							started = !stopped;
							end = lineJSON.timestamp;
							
							var min, max = 0;
							for (var l = 0; l < chart_data.length; l++) {
								series.push({serie: new TimeSeries(chart_data[l]), color: color[Math.floor(Math.random() * Math.floor(color.length))]}); //insert timeseries in array
								max = series[series.length - 1].serie.max("value"); //check chart min max values
								min = series[series.length - 1].serie.min("value");
								if (max > chart_max_value){
									chart_max_value = max;
								}
								if (min < chart_min_value){
									chart_min_value = min;
								}
							}
						}
						break;
					default:
						throw new Error("Unknown type: \"" + lineJSON.type + "\". line " + line_index + 1);
				}
				//this.parseInput(lineJSON);
				if (line_index === line_arr.length - 1 && !stopped && started) throw new Error ("Expected event with type = 'stop'. line " + line_index + 1);
			}catch (e){
				alert(e);
				break;
			}
		}
	} else {
		alert("Please insert events before submitting");
	}
	
	this.setState({ 
		data: chart_data, 
		series: series, 
		done: true, 
		range: new TimeRange([(span_begin === undefined)? begin:span_begin,(span_end === undefined)? end:span_end]), //if i don'have a span action, use start/stop boundaries
		chart_value_bound: {max: chart_max_value, min: chart_min_value} 
	});
    event.preventDefault();
  }
  
  render() {
	function renderComponents(done, serie_arr, comp) {
		if (done) {
			var comp_arr = [];
			for (var timeserie = 0; timeserie < serie_arr.length; timeserie++) {
				const style = styler([
					{ key: "value", color: serie_arr[timeserie].color, width: 2}
				]);
				if (comp === "Legend") {
					comp_arr.push(<Legend key={"leg" + timeserie}
						type="dot"
						align="left"
						style={style}
						categories={[{key: "value", label: serie_arr[timeserie].serie.name()}]}
					/>);
				} else if (comp === "LineChart"){
					comp_arr.push(<LineChart 
						key={timeserie} 
						axis="y" 
						series={serie_arr[timeserie].serie} 
						column={["time", "value"]} 
						style={style} />);
				}
			}
			return comp_arr;
		}
	}
    return (
		<div>
			<div className="header"><p>Luan's Challenge</p></div>
			<div>
				<div><textarea value={this.state.value} onChange={this.handleChange}/> </div>
				<div className="chart-div">
					<div className="legend-div">
						{renderComponents(this.state.done, this.state.series, "Legend")}
					</div>
					<ChartContainer timeRange={this.state.range} width={800} className="chart">
						<ChartRow height="200">
							<YAxis id="y" min={this.state.chart_value_bound.min} max={this.state.chart_value_bound.max} width="60" type="linear"/>
							<Charts>
							{renderComponents(this.state.done, this.state.series, "LineChart")}
							</Charts>
						</ChartRow>
					</ChartContainer>
				</div>
			</div>
			<div className="button-div">
				<Button bsStyle="primary" className="button" onClick={this.handleSubmit}>Generate Chart</Button>
			</div>
		</div>
    );
	
  }
  
  
}

export default App;


/*<LineChart width={400} height={400} data={this.state.data} >
				<XAxis dataKey="name" />
				<YAxis />
				<Tooltip />
				<Legend />
					
				{
					renderSeries(this.state.series)
				 
				}
				
			</LineChart>	*/
//{'type': 'start', 'timestamp': 1519780251293, 'select': ['min_response_time', 'max_response_time'], 'group': ['os', 'browser']}