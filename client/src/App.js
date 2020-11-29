import React, { Component } from 'react';
import Home from "./Home"
import Login from "./Login";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

class App extends Component {
	render() {
		return (
			<div>
				<Router >
					<Switch>
						<Route exact path="/" render={() => (
							window.localStorage.getItem('token') ? (<Route component={Home} />)
								: (<Route component={Login} />)
						)} />
						<Route path="/dashboard" render={() => (
							window.localStorage.getItem('token') ? (<Route component={Home} />)
								: (<Route component={Login} />)
						)} />
						{/* <Route path="/dashboard" component={Home} /> */}
					</Switch>
				</Router>
			</div>
		)
	}
}

export default App;