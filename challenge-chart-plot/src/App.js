import React, { Component } from 'react';
import { TimeSeries, TimeRange} from "pondjs";
import { Button } from 'react-bootstrap';
import {
    Charts,
    ChartContainer,
    ChartRow,
    YAxis,
    LineChart
} from "react-timeseries-charts";

const style = {
    value: {
        stroke: "#000000",
        opacity: 0.9
    }
};

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
      /*
{'type': 'start', 'timestamp': 1519780251000, 'select': ['min_response_time', 'max_response_time'], 'group': ['os', 'browser']}
{'type': 'data', 'timestamp': 1519780251000, 'os': 'linux', 'browser': 'chrome', 'min_response_time': 0.1, 'max_response_time': 1.3}
{'type': 'data', 'timestamp': 1519780351000, 'os': 'linux', 'browser': 'chrome', 'min_response_time': 0.2, 'max_response_time': 1.6}
{'type': 'data', 'timestamp': 1519780451000, 'os': 'linux', 'browser': 'chrome', 'min_response_time': 0.3, 'max_response_time': 1.9}
{'type': 'data', 'timestamp': 1519780551000, 'os': 'linux', 'browser': 'chrome', 'min_response_time': 0.3, 'max_response_time': 1.5}
{'type': 'data', 'timestamp': 1519780651000, 'os': 'linux', 'browser': 'chrome', 'min_response_time': 0.2, 'max_response_time': 1.3}
{'type': 'data', 'timestamp': 1519780751000, 'os': 'linux', 'browser': 'chrome', 'min_response_time': 0.1, 'max_response_time': 1.2}
{'type': 'data', 'timestamp': 1519780851000, 'os': 'linux', 'browser': 'chrome', 'min_response_time': 0.1, 'max_response_time': 1.6}
{'type': 'stop', 'timestamp': 1519781251000}

*/
    
    };
	
	this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
	//this.parseInput = this.parseInput.bind(this);
    
	
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleTimeRangeChange(range) {
    this.setState({ range });
  }
  
  handleSubmit(event) {
	var chart_data = [];
	const data = {
					name: "Challenge",
					columns: ["time", "value"],
					points: []
				};
	var begin, span_begin,end, span_end
	var chart_max_value = 0, chart_min_value = 0;
	var group_arr, select_arr = [];
	var series = [];	
	var started = false, stopped = true;
    var line_arr = this.state.value.replace(/'/g, '"').match(/[^\r\n]+/g);
	if (line_arr && line_arr.length > 0) {
		for (var line_index = 0; line_index < line_arr.length; line_index++){
			try{
				var lineJSON = JSON.parse(line_arr[line_index]);
				
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
								//var start_obj = {name: new Date(lineJSON.timestamp * 1000).getHours() + ":" + new Date(lineJSON.timestamp * 1000).getMinutes()};
								//data.points.push([lineJSON.timestamp]);
								//chart_data.push(start_obj);
								/*data.push({name: new Date(lineJSON.timestamp * 1000).getHours() + ":" + new Date(lineJSON.timestamp * 1000).getMinutes()},{name: 'Page C'},
									  {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
									  {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
									  {name: 'Page G', uv: 3490, pv: 4300, amt: 2100});*/
							}
						}
						break;
					case 'span':
						if (started && !stopped) {
							//take out of this.state.data all timestamps that are out of begin and end interval
							if (lineJSON.hasOwnProperty("begin") && !(typeof lineJSON.begin !== "number")) throw new Error("Expected \"begin\" to be a number. line " + line_index + 1);
							else if (lineJSON.hasOwnProperty("end") && !(typeof lineJSON.end !== "number")) throw new Error("Expected \"end\" to be a number. line " + line_index + 1);
							else { 
								if (lineJSON.begin > lineJSON.end) throw new Error("Expected \"begin\" to be greater than \"end\". line " + line_index + 1);
								/*chart_data.forEach( function (item, index) {
									if (item.name < lineJSON.begin || item.name > lineJSON.end) chart_data.splice(index, 1);//remove item from data
								});*/
								span_begin = lineJSON.begin;
								span_end = lineJSON.end;
							}
						} else if (!started) throw new Error("Expected event with type = 'start'. line " + line_index + 1);
						break;
					case 'data':
						if (started && !stopped) {
							
							var series_name = '';
							for (var i = 0; i < group_arr.length; i++){
								var group = group_arr[i]
								if (lineJSON.hasOwnProperty(group) && typeof lineJSON[group] === 'string') { //get all groups names
									series_name += lineJSON[group] + " ";
								}
							};
							for (var j = 0; j < select_arr.length; j++) {
								var select = select_arr[j]; //create serie name: group_name + select_name = serie_name
								if (lineJSON.hasOwnProperty(select) && typeof lineJSON[select] === 'number') {
									var found = false;
									for (var k = 0; k < chart_data.length; k++) {
										if (chart_data[k].name === (series_name + select)) {
											var found = true;
											chart_data[k].points.push([lineJSON.timestamp, lineJSON[select]]);
										}
									}
									if (!found) {
										chart_data.push({
											name: (series_name + select),
											columns: ["time", "value"],
											points: [[lineJSON.timestamp, lineJSON[select]]]
										});
									}
								} else throw new Error("Expected number value in"+ select + ". line " + line_index + 1);
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
								series.push(new TimeSeries(chart_data[l])); //insert timeseries in array
								max = series[series.length - 1].max("value"); //check chart min max values
								min = series[series.length - 1].min("value");
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
	
	this.setState({ data: chart_data, series: series, done: true, range: new TimeRange([begin,end]), chart_value_bound: {max: chart_max_value, min: chart_min_value} });
    event.preventDefault();
  }
  
  render() {
	function renderSeries(done, serie_arr) {
		if (done){
			var comp_arr = [];
			for (var timeserie = 0; timeserie < serie_arr.length; timeserie++) {
				comp_arr.push(<LineChart key={timeserie} axis="y" series={serie_arr[timeserie]} column={"time", "value"} style={style} />);
			}
			return comp_arr;
		}
	}
    return (

		<div>
			<textarea value={this.state.value} onChange={this.handleChange}/> 
			<div className="chart-div">
				<ChartContainer timeRange={this.state.range} width={800} className="chart">
					<ChartRow height="200">
						<YAxis id="y" min={this.state.chart_value_bound.min} max={this.state.chart_value_bound.max} width="60" type="linear"/>
						<Charts>
						{renderSeries(this.state.done, this.state.series)}
						</Charts>
					</ChartRow>
				</ChartContainer>
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
