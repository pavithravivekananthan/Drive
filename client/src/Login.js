import React from 'react';

class Login extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            owner: "",
            token: "",
            input: {},
            errors: {}
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleChange(event) {
        let input = this.state.input;
        input[event.target.name] = event.target.value;
        this.setState({
            input
        });
    }
    handleSubmit(event) {
        event.preventDefault();
        if (this.validate()) {
            console.log(this.state);

            fetch('/api/login', {
                method: 'POST',
                body: JSON.stringify(this.state.input),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(res => {
                    if (res.status === 200) {

                        res.json().then(data => {
                            window.localStorage.setItem("owner", data.id);
                            window.localStorage.setItem("token", data.token);
                            console.log(window.localStorage.getItem("owner"));

                            this.props.history.push("/dashboard");

                        });

                    } else {
                        const error = new Error(res.error);
                        throw error;
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Error logging in please try again');
                });

        }

    }

    validate() {
        let input = this.state.input;
        let errors = {};
        let isValid = true;
        if (!input["email"]) {
            isValid = false;
            errors["email"] = "Please enter your email Address.";
        }
        if (typeof input["email"] !== "undefined") {
            var emailPattern = new RegExp(/^\w+([\.-]?\w+)*@\yahoo.com/);
            if (!emailPattern.test(input["email"])) {
                isValid = false;
                errors["email"] = "Please enter valid email address with domain yahoo.";
            }
        }
        if (!input["password"]) {
            isValid = false;
            errors["password"] = "Please enter your password.";
        }
        if (typeof input["password"] !== "undefined") {
            var passwordPattern = new RegExp(/^(?=.{15,}$)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?\W).*$/);
            if (!passwordPattern.test(input["password"])) {
                isValid = false;
                errors["password"] = "Please enter valid password.Password should be 15 chars length, should contain at least 1 - number, upper case char, lower case char, and symbol";
            }
        }
        this.setState({
            errors: errors
        });
        return isValid;
    }

    render() {
        return (

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="card col-12 col-lg-4 login-card  hv-center w-responsive text-center mx-auto p-3 mt-2" >

                    <h1>Drive</h1>
                    <form onSubmit={this.handleSubmit}>

                        <div class="form-group">

                            <input
                                type="text"
                                name="email"
                                value={this.state.input.email}
                                onChange={this.handleChange}
                                class="form-control"
                                placeholder="Enter email"
                                id="email" />

                            <div className="text-danger">{this.state.errors.email}</div>

                        </div>

                        <div class="form-group">

                            <input
                                name="password"
                                type="password"
                                value={this.state.input.password}
                                onChange={this.handleChange}
                                placeholder="Enter password"
                                class="form-control"
                                id="password" />

                            <div className="text-danger">{this.state.errors.password}</div>

                        </div>
                        <input type="submit" value="Submit" class="btn btn-info" />

                    </form>

                </div>
            </div>

        );
    }
}

export default Login;