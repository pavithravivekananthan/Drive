const fs = require('fs')
const express = require('express')
var cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const path = require("path")
const cookieParser = require('cookie-parser');

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(cookieParser());

const FileRouter = require('./backend/file/file.routes.js')
const FolderRouter = require('./backend/folder/folder.routes.js')
const LoginRouter = require('./backend/authorization/login.routes.js')
FolderRouter.routesConfig(app)
FileRouter.routesConfig(app)
LoginRouter.routesConfig(app)

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Credentials', 'true')
	res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
	res.header('Access-Control-Expose-Headers', 'Content-Length')
	res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range')
	if (req.method === 'OPTIONS') {
		return res.send(200)
	} else {
		return next()
	}
})

if (process.env.NODE_ENV === 'production') {
	app.use(express.static(__dirname + "/client/build"))
	app.get("*", (req, res, next) => {
		res.sendFile(path.join(__dirname + "/client/build/index.html"))
	})
}

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const mongoURI = config.mongoURI;
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false)
mongoose.connect(mongoURI, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false,
	useUnifiedTopology: true
})
let db = mongoose.connection
db.once('open', () => console.log('connected to the database'))
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.listen(process.env.PORT || config.port, () => {
	console.log("listening on", config.port)
})