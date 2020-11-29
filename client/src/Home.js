import React, { Component } from 'react';

import { Upload, message, Input as InputAntd } from 'antd';
import { UploadOutlined, FolderAddOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';

import {
	Button, TextField, Menu,
	MenuItem, ListItemIcon, Typography,
	FormControlLabel, Divider,
	InputAdornment, Checkbox
} from '@material-ui/core';
import FolderIcon from '@material-ui/icons/Folder';
import LockIcon from '@material-ui/icons/Lock';
import FolderSharedIcon from '@material-ui/icons/FolderShared';
import SearchIcon from '@material-ui/icons/Search';
import DraftsIcon from '@material-ui/icons/Drafts';
import Modal from 'react-bootstrap/Modal';
import { Row } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';
import "./Home.css"

var hide;

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			owner: "",
			token: "",
			path: window.location.href,
			name: "",
			password: "",
			sizeFile: 0,
			visible: false,
			showModal: false,
			showModalPassword: false,
			disableBottons: false,
			showPassword: false,
			folders: [],
			files: [],
			notes: [],
			search: "",
			viewLink: null,
			passwords: [],
			modifyFolder: false,
			isType: "",
			previewImg: [],
			url: null,
			downloading: false,
			viewFileClicked: false,
			downloadFileClicked: false,
			showModalFile: false,
			mouseX: null,
			mouseY: null,
			showFoldersMenu: false,
			showMainMenu: false,
			infos: null,
			edit: false,
			indexMouseOverNote: -1,
			showModalAccount: false,
			newToken: "",
			isMobile: window.matchMedia("only screen and (max-width: 760px)").matches,
		}

		this.getFoldersAndFiles = this.getFoldersAndFiles.bind(this)

	}

	componentWillMount = () => {
		if (window.localStorage.getItem("passwords") === null) {
			window.localStorage.setItem("passwords", JSON.stringify([]))
			this.setState({
				passwords: [],
			})
		} else {
			this.setState({
				passwords: JSON.parse(window.localStorage.getItem("passwords")),
			})
		}
		if (window.localStorage.getItem("owner") !== null && window.localStorage.getItem("token") !== null) {
			this.setState({
				owner: window.localStorage.getItem("owner"),
				token: window.localStorage.getItem("token")
			}, () => {
				this.getFoldersAndFiles()
			})
		} else {
			this.props.history.push('/');
		}

		if (window.localStorage.getItem("message1") === null) {
			if (this.getParent() === "/") {
				var msg = ""
				if (this.state.isMobile === false) {
					msg = "Right click on file/folder for more actions"
				} else {
					msg = "Long press on file/folder for more actions"
				}
				message.info(msg, 6)
			}

			window.localStorage.setItem("message1", "true")
		}

	}

	getFoldersAndFiles = () => {
		var viewLink
		if (this.state.path.includes("/file/")) {
			viewLink = this.state.path.split('/file/')
			viewLink = viewLink[viewLink.length - 1]

			this.setState({
				viewLink: viewLink,
			}, () => {
				this.getSharedFile()
			})

			return
		}
		var data = {
			parent: this.getParent(),
			owner: this.state.owner,
			token: this.state.token,
			passwords: this.state.passwords,
		}

		fetch("/api/folder/getFolders", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					if (data.passwordRequired === true) {
						this.openModalPassword()
					} else {
						this.setState({
							folders: data
						}, () => {
							this.getFiles()
						})
					}
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getFiles = () => {
		var data = {
			parent: this.getParent(),
			owner: this.state.owner,
			token: this.state.token,
			passwords: this.state.passwords,
		}

		fetch("/api/file/getFiles", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					let nulls = []
					for (let a = 0; a < data.length; ++a) {
						nulls.push(null)
					}
					this.setState({
						files: data,
						previewImg: nulls
					}, () => {
						this.getPreviewsImgs(data)
					})
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getParent = () => {

		var parent = this.state.path.split("/")
		parent = parent[parent.length - 1]
		if (parent.toString() === 'dashboard' || parent.length === 0) {
			parent = "/"
		}

		return parent
	}

	createFolder = () => {
		if (this.state.name.length === 0) {
			message.error(`Insert a name please\n`);
			return
		}

		var data = {
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent(),
			name: this.state.name,
			password: this.state.password,
			visibleToEveryone: this.state.visible,
		}
		fetch("/api/folder/createFolder", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.getFoldersAndFiles()
					message.success(`${this.state.name} folder uploaded successfully`);
				} else {
					message.error(`Folder upload failed.`)
				}

				this.setState({
					showModal: false,
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	accessFolder = () => {
		var data = {
			owner: this.state.owner,
			token: this.state.token,
			idFolder: this.getParent(),
			parent: this.getParent(),
			password: this.state.password,
		}
		fetch("/api/folder/getFolderWithPassword", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {

					var newPasswords = [...this.state.passwords, this.state.password]
					window.localStorage.setItem("passwords", JSON.stringify(newPasswords))

					this.setState({
						showModalPassword: false,
						disableBottons: false,
						folders: data,
						passwords: newPasswords,
					}, () => {
						this.getFiles()

					})
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getShareLink = (type) => {
		var path = this.state.path.split("/")
		path.pop()
		path = path.join("/") + "/"

		var text = ""
		if (type === "folder") {
			text = path + this.state.infos.idFolder
		} else if (type === "file") {
			text = path + "file/" + this.state.infos.linkView
		}

		if (!navigator.clipboard) {
			var textArea = document.createElement("textarea")
			textArea.value = text
			document.body.appendChild(textArea)
			textArea.focus()
			textArea.select()
			try {
				var successful = document.execCommand('copy');
				if (successful) {
					message.success("Link copied to clipboard!")
				} else {
					message.error("Failed to copy")
				}
			} catch (err) {
				message.error("Failed to copy")
			}
			document.body.removeChild(textArea)
			return
		}
		navigator.clipboard.writeText(text).then(function () {
			message.success("Link copied to clipboard!")
		}, function (err) {
			message.error("Failed to copy")
		})
	}

	modifyFolder = () => {
		if (this.state.name.length === 0) {
			message.error(`Insert a name please\n`);
			return
		}

		var data = {
			owner: this.state.owner,
			token: this.state.token,
			idFolder: this.state.infos.idFolder,
			name: this.state.name,
			password: this.state.password,
			visibleToEveryone: this.state.visible,
		}
		fetch("/api/folder/modifyFolder", {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.getFoldersAndFiles()

					message.success(`${this.state.name} folder updated successfully`);
				} else {
					message.error(`Folder update failed.`)
				}

				this.setState({
					showModal: false,
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	searchFilesAndFolders = (e) => {
		this.setState({
			search: e.target.value
		})
	}

	getSharedFile = () => {
		var data = {
			link: this.state.viewLink,
			owner: this.state.owner,
			token: this.state.token,
		}

		fetch("/api/file/getSharedFile", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.setState({
						files: [data],
						previewImg: [null]
					}, () => {
						if (data.type.startsWith('image')) {
							this.getSharedFileDownload(false, true)
						}
					})
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getSharedFileDownload = (showModel, showPreviewImg) => {
		var data = {
			link: this.state.viewLink,
			owner: this.state.owner,
			token: this.state.token,
		}

		this.setState({
			downloading: true
		})

		fetch("/api/file/getSharedFileDownload", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.blob())
			.then(data => {
				if (data.err === undefined) {
					this.setState({
						url: URL.createObjectURL(data),
						downloading: false
					}, () => {
						if (showPreviewImg === true) {
							this.setState(prevState => {
								let p = prevState.previewImg
								p[0] = this.state.url
								return {
									previewImg: p
								}
							})
							return
						}

						if (showModel === true) {
							var win = window.open(this.state.url, '_blank')
							win.focus()
						}

						if (this.state.viewFileClicked === true) {
							this.setState({
								viewFileClicked: false
							}, () => {
								this.viewFile()
							})
						}
						if (this.state.downloadFileClicked === true) {
							this.setState({
								downloadFileClicked: false
							}, () => {
								this.downloadFile()
							})
						}
					})
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	downloadFile = () => {
		if (this.state.downloading === false) {
			var link = document.createElement('a')
			link.href = this.state.url
			link.setAttribute('download', this.state.name)
			link.click()
		} else {
			this.setState({
				downloadFileClicked: true,
			})
		}
	}

	showMessageUploadFile = (info) => {
		if (info.file.status === 'done') {
			setTimeout(hide, 0)
			message.success(`${info.file.name} file uploaded successfully`);
			this.getFoldersAndFiles()
		} else if (info.file.status === 'error') {
			setTimeout(hide, 0)
			message.error(`${info.file.name} file upload failed.`);
		}
	}

	clickFolder = () => {
		window.location.href = "/dashboard/" + this.state.infos.idFolder
	}

	clickFile = (showModel = true) => {

		if (this.state.path.includes("/file/")) {
			return this.getSharedFileDownload(showModel, false)
		}

		var data = {
			idFile: this.state.infos.idFile,
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent(),
			passwords: this.state.passwords,
		}

		this.setState({
			name: this.state.infos.name,
			downloading: true,
		})

		fetch("/api/file/getFile", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.blob())
			.then(data => {
				this.setState({
					url: URL.createObjectURL(data),
					downloading: false
				}, () => {
					if (showModel === true) {
						var win = window.open(this.state.url, '_blank')
						win.focus()
					}

					if (this.state.viewFileClicked === true) {
						this.setState({
							viewFileClicked: false
						}, () => {
							this.viewFile()
						})
					}
					if (this.state.downloadFileClicked === true) {
						this.setState({
							downloadFileClicked: false
						}, () => {
							this.downloadFile()
						})
					}
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	viewFile = () => {
		if (this.state.downloading === false) {
			window.location.href = this.state.url
		} else {
			this.setState({
				viewFileClicked: true,
			})
		}
	}

	openModal = (modifyFolder = false) => {
		if (modifyFolder === true) {
			this.setState({
				showModal: true,
				modifyFolder: modifyFolder,
				name: this.state.infos.name,
				password: this.state.infos.password,
				visible: this.state.infos.visibleToEveryone,
				showPassword: this.state.infos.password.length > 0 ? true : false,
			}, () => { })
		} else {
			this.setState({
				showModal: true,
				modifyFolder: modifyFolder,
				name: "",
				visible: false,
				password: "",
				showPassword: false,
			}, () => { })
		}
	}

	openModalPassword = () => {
		this.setState({
			showModalPassword: true,
			password: "",
			disableBottons: true,
		}, () => { })
	}

	closeModal = () => {
		this.setState({
			showModal: false,
			modifyFolder: false,
			showModalPassword: false,
			showModalFile: false,
			showModalNote: false,
			showModalAccount: false,
		}, () => { })
	}

	closeMenu = () => {
		this.setState({
			mouseX: null,
			mouseY: null,
			showFoldersMenu: false,
			showMainMenu: false,
		})
	}

	remove = () => {
		var data = {}
		var url = ""

		if (this.state.isType === "file") {
			data = {
				idFile: this.state.infos.idFile,
				owner: this.state.owner,
				token: this.state.token,
			}
			url = "/api/file/deleteFile"
		} else if (this.state.isType === "folder") {
			data = {
				idFolder: this.state.infos.idFolder,
				owner: this.state.owner,
				token: this.state.token,
			}
			url = "/api/folder/deleteFolders"
		}

		fetch(url, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					message.success(`${this.state.isType} deleted`)
					this.getFoldersAndFiles()
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getMineType = (mime_type) => {
		let icon_classes = {
			// Media
			'image': 'far fa-file-image',
			'audio': 'far fa-file-audio',
			'video': 'far fa-file-video',
			// Documents
			'application/pdf': 'far fa-file-pdf',
			'application/msword': 'far fa-file-word',
			'application/vnd.ms-word': 'far fa-file-word',
			'application/vnd.oasis.opendocument.text': 'far fa-file-word',
			'application/vnd.openxmlformats-officedocument.wordprocessingml': 'far fa-file-word',
			'application/vnd.ms-excel': 'far fa-file-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml': 'far fa-file-excel',
			'application/vnd.oasis.opendocument.spreadsheet': 'far fa-file-excel',
			'application/vnd.ms-powerpoint': 'far fa-file-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml': 'far fa-file-powerpoint',
			'application/vnd.oasis.opendocument.presentation': 'far fa-file-powerpoint',
			'text/plain': 'far fa-file-text',
			'text/html': 'far fa-file-code',
			'application/json': 'far fa-file-code',
			// Archives
			'application/gzip': 'far fa-file-archive',
			'application/zip': 'far fa-file-archive',
		}

		for (let k in icon_classes) {
			if (mime_type.indexOf(k) === 0) {
				return icon_classes[k]
			}
		}
		return 'far fa-file'
	}

	editText = () => {
		this.setState({
			edit: true
		})
	}

	previewText = () => {
		this.setState({
			edit: false
		})
	}

	openFoldersMenu = () => {
		this.setState({
			showMainMenu: false,
			showFoldersMenu: true
		})
	}

	moveToFolder = (folder) => {
		var data = {}
		var url = ""

		if (this.state.isType === "file") {
			data = {
				idFile: this.state.infos.idFile,
				owner: this.state.owner,
				token: this.state.token,
				parent: folder.idFolder,
			}
			url = "/api/file/changeFolder"
		} else {
			data = {
				idNote: this.state.infos.idNote,
				owner: this.state.owner,
				token: this.state.token,
				parent: folder.idFolder,
			}
			url = "/api/note/changeFolder"
		}

		fetch(url, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					// message.success(`${this.state.isType} deleted`)
					this.getFoldersAndFiles()
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getPreviewsImgs = (data) => {
		console.log(data)
		for (let a = 0; a < data.length; ++a) {
			if (data[a].type.startsWith('image')) {
				this.getImagePreview(data[a], a)
			}
		}
	}

	getImagePreview = (item, idx) => {
		var data = {
			idFile: item.idFile,
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent(),
			passwords: this.state.passwords,
		}

		fetch("/api/file/getFile", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.blob())
			.then(data => {
				let url = URL.createObjectURL(data)
				this.setState(prevState => {
					let p = prevState.previewImg
					p[idx] = url
					return {
						previewImg: p
					}
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	render() {
		return (
			<div>
				<Menu
					keepMounted
					open={this.state.showFoldersMenu === true}
					onClose={this.closeMenu}
					anchorReference="anchorPosition"
					anchorPosition={
						this.state.mouseY !== null && this.state.mouseX !== null
							? { top: this.state.mouseY, left: this.state.mouseX }
							: undefined
					}
					PaperProps={{
						style: {
							maxHeight: 48 * 4.5,
							width: '250px',
						},
					}}
				>
					{this.state.folders.length > 0 && this.state.folders.filter((item) => {
						if (item.password.length !== 0) {
							return false
						}
						return true
					}).map((item, index) => (
						<MenuItem key={index} onClick={() => {
							this.moveToFolder(item)
							this.closeMenu()
						}}>
							<Typography variant="inherit" noWrap>
								{item.name}
							</Typography>
						</MenuItem>
					))}
				</Menu>


				<Menu
					keepMounted
					open={this.state.showMainMenu === true}
					onClose={this.closeMenu}
					anchorReference="anchorPosition"
					anchorPosition={
						this.state.mouseY !== null && this.state.mouseX !== null
							? { top: this.state.mouseY, left: this.state.mouseX }
							: undefined
					}
				>
					{this.state.isType === "file" &&
						<div style={{ width: "250px" }}>
							{this.state.infos !== null && this.state.owner === this.state.infos.owner && this.state.path.includes("/file/") === false &&
								<div>
									<MenuItem onClick={() => {
										this.remove()
										this.closeMenu()
									}}>
										<ListItemIcon>
											<DraftsIcon fontSize="small" />
										</ListItemIcon>
										<Typography variant="inherit" noWrap>
											Remove
									</Typography>
									</MenuItem>

									<MenuItem onClick={() => {
										this.openFoldersMenu()
									}}>
										<ListItemIcon>
											<DraftsIcon fontSize="small" />
										</ListItemIcon>
										<Typography variant="inherit" noWrap>
											Move to Folder
									</Typography>
									</MenuItem>
								</div>
							}

							<MenuItem onClick={() => {
								this.downloadFile()
								this.closeMenu()
							}}>
								<ListItemIcon>
									<DraftsIcon fontSize="small" />
								</ListItemIcon>
								<Typography variant="inherit" noWrap>
									Download
								</Typography>
							</MenuItem>

							<MenuItem onClick={() => {
								this.getShareLink("file")
								this.closeMenu()
							}}>
								<ListItemIcon>
									<DraftsIcon fontSize="small" />
								</ListItemIcon>
								<Typography variant="inherit" noWrap>
									Get shareable link
								</Typography>
							</MenuItem>
						</div>}

					{this.state.isType === "folder" &&
						<div style={{ width: "250px" }}>
							{this.state.infos !== null && this.state.owner === this.state.infos.owner &&
								<MenuItem onClick={() => {
									this.remove()
									this.closeMenu()
								}}>
									<ListItemIcon>
										<DraftsIcon fontSize="small" />
									</ListItemIcon>
									<Typography variant="inherit" noWrap>
										Remove
								</Typography>
								</MenuItem>}

							<MenuItem onClick={() => {
								this.getShareLink("folder")
								this.closeMenu()
							}}>
								<ListItemIcon>
									<DraftsIcon fontSize="small" />
								</ListItemIcon>
								<Typography variant="inherit" noWrap>
									Get shareable link
								</Typography>
							</MenuItem>

							{this.state.infos !== null && this.state.owner === this.state.infos.owner &&
								<MenuItem onClick={() => {
									this.openModal(true)
									this.closeMenu()
								}}>
									<ListItemIcon>
										<DraftsIcon fontSize="small" />
									</ListItemIcon>
									<Typography variant="inherit" noWrap>
										Modify
									</Typography>
								</MenuItem>}
						</div>}

					{this.state.isType === "note" &&
						<div style={{ width: "250px" }}>
							{this.state.infos !== null && this.state.owner === this.state.infos.owner &&
								<div>
									<MenuItem onClick={() => {
										this.remove()
										this.closeMenu()
									}}>
										<ListItemIcon>
											<DraftsIcon fontSize="small" />
										</ListItemIcon>
										<Typography variant="inherit" noWrap>
											Remove
									</Typography>
									</MenuItem>

									<MenuItem onClick={() => {
										this.openFoldersMenu()
									}}>
										<ListItemIcon>
											<DraftsIcon fontSize="small" />
										</ListItemIcon>
										<Typography variant="inherit" noWrap>
											Move to Folder
									</Typography>
									</MenuItem>
								</div>
							}

							<MenuItem onClick={() => {
								this.getShareLink("note")
								this.closeMenu()
							}}>
								<ListItemIcon>
									<DraftsIcon fontSize="small" />
								</ListItemIcon>
								<Typography variant="inherit" noWrap>
									Get shareable link
								</Typography>
							</MenuItem>
						</div>}

				</Menu>

				<Modal show={this.state.showModal} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							{this.state.modifyFolder === true ? "Modify Folder" : "New Folder"}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingLeft: "30px", paddingRight: "30px" }}>
							<div>
								<InputAntd defaultValue={this.state.name} placeholder="Folder name" onChange={(e) => this.setState({
									name: e.target.value
								})} />
							</div>
							<div>
								<FormControlLabel
									checked={this.state.showPassword}
									value="password"
									control={
										<Checkbox color="primary" onClick={() => this.setState({
											showPassword: !this.state.showPassword
										})}
										/>}
									label="Password"
								/>
								{this.state.showPassword === true ?
									<InputAntd defaultValue={this.state.password} placeholder="Password"
										type="password" onChange={(e) => this.setState({
											password: e.target.value
										})} />
									: null}
							</div>

							<div>
								<FormControlLabel
									value="Visible to everyone"
									checked={this.state.visible}
									control={
										<Checkbox color="primary" onClick={() => this.setState({
											visible: !this.state.visible
										})}
										/>}
									label="Visible to everyone"
								/>
							</div>


						</div>

					</Modal.Body>
					<Modal.Footer>
						<Button variant="contained" style={{ backgroundColor: "white" }} onClick={this.closeModal} >Cancel</Button>
						{this.state.modifyFolder === true ?
							<Button variant="contained" style={{
								backgroundColor: "#4caf50",
								marginLeft: "20px",
								marginRight: "20px"
							}}
								onClick={this.modifyFolder}>Save</Button>
							:
							<Button variant="contained" style={{
								backgroundColor: "#4caf50",
								marginLeft: "20px",
								marginRight: "20px"
							}}
								onClick={this.createFolder}>Create</Button>
						}

					</Modal.Footer>
				</Modal>


				<Modal show={this.state.showModalPassword} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							Password Folder
					</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingLeft: "30px", paddingRight: "30px" }}>
							<InputAntd placeholder="Password" type="password" onChange={(e) => this.setState({
								password: e.target.value
							})} />
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="contained" style={{ backgroundColor: "white" }} onClick={this.closeModal} >Cancel</Button>
						<Button variant="contained" style={{
							backgroundColor: "#4caf50",
							marginLeft: "20px",
							marginRight: "20px"
						}}
							onClick={this.accessFolder}>Access</Button>
					</Modal.Footer>
				</Modal>


				<Modal show={this.state.showModalFile} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							File {this.state.name.length > 15 ? (this.state.name.split("").splice(0, 15).join("") + "...") : this.state.name}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingLeft: "30px", paddingRight: "30px", textAlign: "center" }}>
							<Button variant="contained" style={{ backgroundColor: "#fbc02d" }} onClick={this.viewFile}>View</Button>
							<Button variant="contained" style={{
								backgroundColor: "#4caf50", marginLeft: "20px", marginRight: "20px"
							}}
								onClick={this.downloadFile}>Download</Button>
						</div>
					</Modal.Body>
				</Modal>

				<div className="container">
					<div>
						<TextField label="Search" type="search" variant="outlined"
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<SearchIcon />
									</InputAdornment>
								),
							}}
							style={{
								marginTop: "20px",
								maxWidth: "600px",
								width: "80%",
								paddingLeft: "0px",
								backgroundColor: "white",
							}} onChange={this.searchFilesAndFolders} />
					</div>

					<div style={{ margin: "20px" }}>
						<Row style={{ justifyContent: "center" }}>
							<div>
								<div style={{ margin: "10px" }} onClick={() => {
									if (this.getParent() === "/dashboard") {
										message.error("Select or create a folder before uploading files");
									}
								}}>
									<Upload {...{
										disabled: (this.getParent() === "/dashboard" || this.state.disableBottons === true) ? true : false,
										name: 'file',
										action: '/api/file/uploadFile',
										beforeUpload: (file, fileList) => {
											var files = fileList
											let size = 16000000
											for (var a = 0; a < files.length; a++) {
												if (files[a].size > size) {
													message.error(`${files[a].name} is too large, please pick a smaller file\n`);
													return false
												} else {
													this.setState({
														sizeFile: files[a].size
													})
												}
											}

											hide = message.loading('Uploading..', 0)

											return true
										},
										data: {
											owner: this.state.owner,
											token: this.state.token,
											parent: this.getParent(),
											password: "",
											visibleToEveryone: true,
											sizeFile: this.state.sizeFile,
										},
										showUploadList: false,
										onChange: this.showMessageUploadFile
									}}>

										<Button
											variant="contained"
											className="buttons-folders"
											disabled={this.state.disableBottons}
											style={{
												textAlign: "left",
												justifyContent: "left",
												backgroundColor: "#2196f3",
												borderRadius: "7px",
												width: "auto"
											}}
											startIcon={<UploadOutlined />}>
											Upload File
										</Button>
									</Upload>
								</div>
							</div>

							<div>
								<Button
									variant="contained"
									className="buttons-folders"
									disabled={this.state.disableBottons}
									style={{
										margin: "10px",
										textAlign: "left",
										justifyContent: "left",
										backgroundColor: "#ff9800",
										borderRadius: "7px",
										marginLeft: "20px",
										width: "auto"
									}}
									startIcon={<FolderAddOutlined />}
									onClick={this.openModal}>
									Create Folder
								</Button>
							</div>


						</Row>
					</div>

					<Row style={{ maxHeight: "230px", overflow: "auto", overflowY: "scroll", justifyContent: "center" }}>
						{this.state.folders.length > 0 && this.state.folders.filter(item => {
							if (this.state.search.length > 0) {
								let re = new RegExp(this.state.search.toLowerCase(), "i")
								return re.test(item.name.toLowerCase())
							} else {
								return true
							}
						}).map((item) => {
							return (
								<div className="folders" key={item._id}>
									<Button
										variant="contained"
										className="buttons-folders"
										style={{
											textTransform: 'none', backgroundColor: "white", textAlign: "left", justifyContent: "left",
											borderRadius: "7px", fontSize: "17px", paddingLeft: "20px"
										}}
										startIcon={(item.password.length !== 0 ? <LockIcon className="icons" style={{ marginRight: "10px" }} /> :
											(item.visibleToEveryone === true ? <FolderSharedIcon className="icons" style={{ marginRight: "10px" }} /> :
												<FolderIcon className="icons" style={{ marginRight: "10px" }} />))}
										onContextMenu={(e) => {
											e.preventDefault()
											this.setState({
												mouseX: e.clientX - 2,
												mouseY: e.clientY - 4,
												showMainMenu: true,
												isType: "folder",
												infos: item,
											})
										}}
										onClick={() => {
											this.setState({
												isType: "folder",
												infos: item,
											}, () => {
												this.clickFolder()
											})
										}}
									>
										<Typography variant="inherit" noWrap>
											{item.name}
										</Typography>
									</Button>
								</div>
							)
						})}
					</Row>

					<Divider />

					<Row style={{ overflow: "auto", overflowY: "scroll", justifyContent: "center", height: "auto" }}>

						{this.state.files.length > 0 && this.state.files.filter(item => {
							if (this.state.search.length > 0) {
								let re = new RegExp(this.state.search.toLowerCase(), "i")
								return re.test(item.name.toLowerCase())
							} else {
								return true
							}
						}).map((item, idx) => {
							return (
								<div className="files" key={item._id}>
									<Button
										props={item}
										variant="contained"
										className="buttons-files"
										style={{
											textTransform: 'none', backgroundColor: "white", textAlign: "left",
											justifyContent: "left", fontSize: "17px", paddingLeft: "20px"
										}}
										onContextMenu={(e) => {
											e.preventDefault()
											this.setState({
												mouseX: e.clientX - 2,
												mouseY: e.clientY - 4,
												showMainMenu: true,
												isType: "file",
												infos: item,
											}, () => this.clickFile(false))
										}}
										onClick={() => {
											this.setState({
												isType: "file",
												infos: item,
											}, () => {
												this.clickFile()
											})
										}}
									>
										{item.type.startsWith('image') ?
											<img width="210" alt='' height="210" src={(this.state.previewImg.length - 1 >= idx && this.state.previewImg[idx] !== null) ? this.state.previewImg[idx] : ""} />
											:
											<i className={this.getMineType(item.type)} style={{ fontSize: "50px", marginRight: "10px" }}></i>
										}
										{item.type.startsWith('image') === false &&
											<Typography variant="inherit" noWrap>
												{item.name}
											</Typography>}
									</Button>
								</div>
							)
						})}

					</Row>
				</div>
			</div>
		);
	}
}

export default Home;