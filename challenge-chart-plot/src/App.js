import React, { Component } from 'react';
import { LineChart, Line } from 'recharts';

class App extends React.Component {
  constructor(props) {
    super(props);
	
	
    this.state = {
      value: '',
	  data: [
      //{type: 'start', timestamp: 1519780251293, select: ['min_response_time', 'max_response_time'], group: ['os', 'browser']}
	  //{type: 'data', timestamp: 1519780251000, os: 'linux', browser: 'chrome', min_response_time: 0.1, max_response_time: 1.3}
      //{name: timestamp.getDate(), group1 x select1: 3000, group1 x select2: 1398, group2 x select1: 2210, group2 x select2: 2210},
      {name: 'Page C'},
      {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
      {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
      {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
      {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
	  ]
    };
	
	this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
	//this.parseInput = this.parseInput.bind(this);
    
	
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
	var event_arr = []
	var group = [];
	var select = []
	var started = false, stopped = true;
    var line_arr = this.state.value.replace(/'/g, '"').match(/[^\r\n]+/g);
	if (line_arr && line_arr.length > 0) {
		line_arr.forEach(function (line, index) {
			try{
				var lineJSON = JSON.parse(line);
				
				if (!lineJSON.hasOwnProperty("type")) throw new Error("Missing type. line " + index + 1);
				else if (typeof lineJSON.type !== 'string') throw new Error("Expected \"type\" to be a string. line " + index + 1);
				
				if (!lineJSON.hasOwnProperty("timestamp")) throw new Error("Missing type. line " + index + 1);
				else if (!lineJSON.timestamp instanceof Date) throw new Error("Expected \"timestamp\" to be a Date. line " + index + 1);
				
				switch (lineJSON.type){
					case 'start':
						if (started) throw new Error("Expected event with type = 'stop'. line " + index + 1);
						else {
							started = true;
							stopped = !started;
							if (lineJSON.hasOwnProperty("select") && !lineJSON.select instanceof Array) throw new Error("Expected \"select\" fields to be inside brackets i.e. ['field']. line " + index + 1);
							else if (lineJSON.hasOwnProperty("group") && !lineJSON.group instanceof Array) throw new Error("Expected \"group\" fields to be inside brackets i.e. ['field']. line " + index + 1);
							else {
								select = lineJSON.select;
								group = lineJSON.group;
								this.setState((prevState, props) => ({
								  data: prevState.data.push({name: lineJSON.timestamp.toString()})
								}));
							}
						}
						break;
					case 'span':
						if (started && !stopped) {
							event_arr.push(lineJSON);
							//take out of this.state.data all timestamps that are out of begin and end
						} else if (!started) throw new Error("Expected event with type = 'start'. line " + index + 1);
						break;
					case 'data':
						if (started && !stopped) {
							event_arr.push(lineJSON);
							//do whatever goes here
						} else if (!started) throw new Error("Expected event with type = 'start'. line " + index + 1);
						break;
					case 'stop':
						if (stopped) throw new Error("Expected event with type = 'start'. line " + index + 1);
						else {
							event_arr.push(lineJSON);
							stopped = true;
							started = !stopped;
						}
						break;
					default:
						throw new Error("Unknown type: \"" + lineJSON.type + "\". line " + index + 1);
				}
				//this.parseInput(lineJSON);
				
			}catch (e){
				alert(e);
			}
			
		});
	} else {
		alert("Please insert events before submitting");
	}
    event.preventDefault();
  }
	
  /*parseInput(input) {
	  
  }*/
  
  render() {
    return (
		<form onSubmit={this.handleSubmit}>
			<textarea value={this.state.value} onChange={this.handleChange} /> 
			<LineChart width={400} height={400} data={this.state.data}>
				<Line type="monotone" dataKey="uv" stroke="#8884d8" />
				<Line type="monotone" dataKey="pv" stroke="#098ad8" />
				<Line type="monotone" dataKey="amt" stroke="#098ad8" />
			</LineChart>	
			<input type="submit" value="Submit" />
		</form>
    );
  }
}

export default App;

//{'type': 'start', 'timestamp': 1519780251293, 'select': ['min_response_time', 'max_response_time'], 'group': ['os', 'browser']}
