const User = require('./user.model');
const jwt = require('jsonwebtoken');
const fs = require('fs')
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

exports.login = (req, res) => {

    const { email, password } = req.body;
    User.findOne({ email }, function (err, user) {
        if (err) {
            console.error(err);
            res.status(500)
                .json({
                    error: 'Internal error please try again'
                });
        } else if (!user) {
            res.status(401)
                .json({
                    error: 'Incorrect email or password'
                });
        } else {

            user.isCorrectPassword(password, function (err, same) {
                if (err) {
                    res.status(500)
                        .json({
                            error: 'Internal error please try again'
                        });
                } else if (!same) {
                    res.status(401)
                        .json({
                            error: 'Incorrect email or password'
                        });
                } else {
                    // Issue token
                    const payload = { email };
                    const data = {
                        token: jwt.sign(payload, config.secret),
                        id: user._id
                    }
                    res.send(data).status(200);
                }
            });
        }
    });
}
