//Require the electron important things
const { app, BrowserWindow, globalShortcut, remote, electron } = require('electron');
const ipcMain = require('electron').ipcMain;
const logger = require("electron-log");
let screen;


//Libraries
let path;
let url;

//Controllers
let ipcWrapper;


// Keep a global reference of the window objects, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let loadingWindow;
let mainWindow;

let production = true;

//Loading window 
function loadProgram() {
	logger.info('[index.js] Starting program');
	//Require path to get the preload file, which requires a absolute path
	path = require('path');
	//Calculate size of width and height
	screen = require('electron').screen.getPrimaryDisplay();
	//This window is shown as the program does some work to setup and load
	//libraries, pictures and tries to connect to DB and google api
	loadingWindow = new BrowserWindow({
		width: (screen.bounds.width / 3),
		height: (screen.bounds.height / 3),
		frame: false,
		fullscreenable: false,
		resizable: false,
		show: true,
		backgroundColor: '#181818',
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			enableRemoteModule: false,
			preload: path.join(__dirname, '/Javascript/Libraries/preload.js')
		}
	});
	loadingWindow.loadFile(path.join(__dirname, '/Views/load.html'));
	loadingWindow.on('closed', () => { loadingWindow = null; });
	//When program is ready and loaded
	loadingWindow.webContents.once('dom-ready', () => {
		//Call the load program requirements
		loadProgramRequirements();
		//If is in development
		if(production) {
			//Show dev tools
			logger.info('[index.js] Starting chrome developer tools');
			loadingWindow.webContents.openDevTools({ mode: 'detach' });
		}
		setTimeout(() => {
			showMainScreen();
		}, 2000);
		
	});
}

//Require all the libraries here.
//Do it here because the browser window for the loading screen has been shown to the user now
//So the whole program loading part seems seemless instead of it taking a while to actually launch
function loadProgramRequirements() {
	//Setup IPC communication class
	ipcWrapper = require('./Javascript/Controllers/IpcWrapper.js');
	//Start actually loading libraries and what not
	//Require all libraries here
	url = require('url');
}

function showMainScreen() {
	//Create new window for the main screen
	mainWindow = new BrowserWindow({
		width: screen.bounds.width,
		height:screen.bounds.height,
		fullscreenable: true,
		autoHideMenuBar: true,
		resizable: true,
		show: false,
		icon: path.join(__dirname, '/Assets/Build/PL.ico'),
		backgroundColor: '#181818',
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			enableRemoteModule: false,
			preload: path.join(__dirname, '/Javascript/Libraries/preload.js')
		}
	});
	//Load html file for setup
	mainWindow.loadFile(path.join(__dirname, '/Views/main.html'));
	//If is in development
	if(production) {
		//Show dev tools
		mainWindow.webContents.openDevTools({ mode: 'detach' });
	}
	//In case the user closes the program before finishing setup
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	mainWindow.on('resize', () => {
		const appSize = mainWindow.getBounds();
		if(appSize.width < ((screen.bounds.width / 3) + 5)) {
			//is vertical layout (e.g. phones)
			mainWindow.webContents.send("vertical");
		}
		else if(appSize.width < ((screen.bounds.width / 1.5) + 5)) {
			//Only vertical layout of match container
			mainWindow.webContents.send("compact");
		}
		else {
			//normal layout
			mainWindow.webContents.send("normal");
		}
	});

	//When the DOM has loaded
	mainWindow.webContents.once('dom-ready', () => {
		if(loadingWindow) loadingWindow.close();
	});
	mainWindow.webContents.once('did-finish-load', () => {
		ipcWrapper.mainWindow = mainWindow;
		logger.info('[index.js] main window ready');
		mainWindow.show();
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', loadProgram)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		loadProgram()
	}
});