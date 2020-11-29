const fs = require("fs")
const mongoose = require('mongoose')
mongoose.set('useCreateIndex', true)

const FileModel = new mongoose.Schema({
	idFile: { type: String, trim: true, default: "", require: true },
	owner: { type: String, trim: true, default: "", require: true },
	name: { type: String, trim: true, default: "", require: true },
	parent: { type: String, trim: true, default: "", require: true },
	linkView: { type: String, trim: true, default: "" },
	visibleToEveryone: { type: Boolean, default: true },
	type: { type: String, trim: true, default: "" },
	createdAt: { type: Date, default: Date.now },
	sizeFile: { type: Number, default: 0 },
})

const File = mongoose.model('File', FileModel, 'File')

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'))
const Grid = require('gridfs-stream');

mongoose.createConnection(config.mongoURI, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false,
	useUnifiedTopology: true
});
var conn = mongoose.connection;
var gfs;
conn.once('open', () => {
	gfs = Grid(conn.db, mongoose.mongo);
	gfs.collection('uploads');
})

exports.uploadFile = (fileData) => {
	return new Promise((resolve, reject) => {
		const file = new File(fileData)
		file.save(function (err, newfile) {
			if (err) return reject(err)
			resolve(newfile)
		})
	})
}

exports.getFileById = (id) => {
	return new Promise((resolve, reject) => {
		File.findById(id, {}, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
	})
}

exports.getFile = (idFile) => {
	return new Promise((resolve, reject) => {
		File.findOne({ idFile: idFile }, {}, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
	})
}

exports.changeFile = (id, data) => {
	return new Promise((resolve, reject) => {
		File.findByIdAndUpdate(id, data, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
	})
}

exports.removeFile = (idFile) => {
	return new Promise((resolve, reject) => {
		gfs.remove({ idFile: idFile, root: 'uploads' }, (err, gridStore) => {
			if (err) return reject(err)
			File.findOneAndRemove({ idFile: idFile }, function (err, file) {
				if (err) return reject(err)
				resolve(file)
			})
		});
	})
}

exports.getFileFormGridfs = (req, res) => {
	gfs.files.findOne({ filename: req.body.idFile }, (err, file) => {
		if (!file || file.length === 0 || err !== null) {
			return res.status(404).send({ err: "File doesn't exist" });
		}

		const readstream = gfs.createReadStream(file.filename, { highWaterMark: Math.pow(2, 16) })
		res.header({ 'Content-type': file.contentType })
		readstream.on('error', (err) => {
			res.status(404).send({ err: "Error getting the file" })
		})
		readstream.pipe(res)
		readstream.on('end', function () {
			res.status(201).end()
		})
	});
}

exports.deleteFileGrid = (idFile) => {
	return new Promise((resolve, reject) => {
		gfs.files.remove({ filename: idFile }, (err, file) => {
			if (!file || file.length === 0 || err !== null) {
				return reject(err)
			}
			resolve(file)
		});
	})
}

exports.deleteFilesByParents = (parents) => {
	return new Promise((resolve, reject) => {

		File.find({ parent: { $in: parents } }, {}, function (err, files) {
			if (err) return reject(err)

			for (let a = 0; a < files.length; ++a) {
				gfs.files.remove({ filename: files[a]['idFile'] }, (err, file) => {
					if (!file || file.length === 0 || err !== null) {
						return
					}
				});
			}

			File.deleteMany({ parent: { $in: parents } }, {}, function (err, file) {
				if (err) return reject(err)
				resolve({})
			})
		})

	})
}

exports.getFiles = (owner, parent) => {
	return new Promise((resolve, reject) => {
		File.find({ parent: parent, $or: [{ owner: owner }, { visibleToEveryone: true }] }, {}, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
	})
}

exports.deleteFile = (owner, idFile) => {
	return new Promise((resolve, reject) => {
		File.findOneAndDelete({ owner: owner, idFile: idFile }, {}, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
	})
}

exports.isOwner = (owner, idFile) => {
	return new Promise((resolve, reject) => {
		File.findOne({ owner: owner, idFile: idFile }, {}, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
	})
}

exports.getSharedFile = (link) => {
	return new Promise((resolve, reject) => {
		File.findOne({ linkView: link }, {}, function (err, file) {
			if (err) return reject(err)
			resolve(file)
		})
	})
}

exports.changeFolder = (idFile, parent) => {
	return new Promise((resolve, reject) => {
		File.findOneAndUpdate({ idFile: idFile }, { $set: { parent: parent } }, { new: true }, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}