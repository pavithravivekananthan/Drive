const LoginController = require('./login.controller')


exports.routesConfig = function (app) {

  app.post('/api/login', [
    LoginController.login
  ]);
}


