var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var fs = require('fs');
var FileStreamRotator = require('file-stream-rotator');
var bodyParser = require('body-parser');
// var randomstring = require("randomstring");

var routes = require('./src/routes/index');
var home = require('./src/routes/home');
var login = require('./src/routes/users');
var checkpoints = require('./src/routes/checkpoint');
var contact = require('./src/routes/contact');
var report = require('./src/routes/report');
var projectList = require('./src/routes/projects');
var userList = require('./src/routes/users');
var validation = require('./src/routes/validation');
var recovery = require('./src/routes/recovery');
var createproject = require('./src/routes/projects');
var maptestcase = require('./src/routes/mapping');
var settings = require('./src/routes/settings');
var api = require('./src/routes/api');

var mypost = require('./src/routes/Post');
var mypostfile = require('./src/routes/PostFile');
var mypostimage = require('./src/routes/PostImage');
var logpage = require('./src/routes/logpage');
var automate = require('./src/routes/automation');
var schedulehistorypage = require('./src/routes/schedulehistorypage');
var schedulerStatuspage = require('./src/routes/scheduler_status')

var session = require('express-session');
var app = express();

var db = require('./db');
var CacheData = require('./src/models/CacheData');
var propertiesReader = require('properties-reader');

var eventproxy = require('eventproxy');
var expressWs = require('express-ws')(app);
app.expressWs = expressWs;

var scriptrunner = require('./src/routes/scriptrunner');

var PropertiesReader = require('properties-reader');
var configDirectory = './configs';
var properties = PropertiesReader(configDirectory + '/config.properties');
var sessionMaxAge;
var sessionExpires;


app.use(bodyParser.text({ limit: '101500mb' }));
app.use(bodyParser.urlencoded({ limit: "101500mb", extended: true, parameterLimit: 500000 }));

// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {
	pretty: true
});


app.errorlist = new Array();
app.wsList = {};
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

if (app.get('env').trim() === 'development') {
	console.log("Log with Dev");
	app.use(logger('dev'));
} else {
	console.log("Log with Pro");
	var logDirectory = __dirname + '/logs';
	// ensure log directory exists
	fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
	// create a rotating write stream
	var accessLogStream = FileStreamRotator.getStream({
		filename: logDirectory + '/log-%DATE%.log',
		frequency: 'daily',
		verbose: false
	});
	// setup the logger
	app.use(logger(':remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms \\r\\n', {
		stream: accessLogStream
	}));
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'Reporter')));

//connect to MongoDB
var ep_fortask = new eventproxy();
//myMongoDB.dbConnect(ep_fortask);
var once = async function (myDB, req) {
	if (once.done && (once.company == req.query.company)) return;
	console.log('Invoking only at first time. Doing this once!');

	//Reading property file	
	var companies = "";
	companies = req.query.company;
	if (companies === '' || companies == undefined) {
		companies = process.env.company;
	}
	if (companies === '' || companies == undefined) {
		companies = properties.get('app.daas.companytoconfigure');
	}

	companyList = companies.split(",");

	//To enable single companies at a time
	var result = await myCacheData.initial_app_setup(companyList[0]);
	if (result) {
		//Read Build Info file and store to DB
		var buildProperties = PropertiesReader(configDirectory + '/buildinfo.properties');
		var buildVersion = buildProperties.get('app.daas.buildversion');
		var bItems = buildProperties.get('app.daas.builditems');
		var buildItems = bItems.split(",");

		myCacheData.update_build_info(buildVersion, buildItems, companyList[0]);

		//Read cached data
		myCacheData.init(myDB, companyList[0]);

		once.done = true;
	}
};

module.exports.set = function (compName) {
	// req.session.company=compName
	// req.session.defaultCompany=compName	
	db.dbConnect(function (err) {
		if (err) {
			process.exit(1)
		}
		else {
			myDB = db.getDBConnection();
			app.myDB = myDB;
		}
	});
}

// Connect to Mongo on start
var myCacheData = new CacheData();
var myDB;
var cName;
var companyList;
db.dbConnect(function (err) {
	if (err) {
		process.exit(1)
	}
	else {
		myDB = db.getDBConnection();
		app.myDB = myDB;
	}
});

//Invoking only at first time to setup application data
//To read defaultcompany data from main.jsx(react) 
app.post('/', function (req, res) {
	req.session.defaultCompany = req.body.defaultCompany
});

var navbar, complexbucket;
app.myCacheData = myCacheData;

app.base = '/daas';
//app.use('/daas', express());

//Add session
//Read session properties
sessionMaxAge = properties.get('app.daas.session.maxAge'),
	sessionExpires = properties.get('app.daas.session.expires'),
	app.use(session({
		secret: 'Data as Service',
		name: "dasstoolid",
		saveUninitialized: true,
		resave: false,
		rolling: true,
		cookie: {
			maxAge: 72 * 30 * 60 * 1000, //1 * 30 * 60 * 1000,
			path: '/',
			expires: 72 * 30 * 60 * 1000,
			overwrite: false,
			activeDuration: 24 * 60 * 60 * 1000,
			ephemeral: true
		}
	}));

app.get('/daas/logout', function (req, res) {
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');   //not to read from cache
	req.session.destroy(function (err) {
		if (err) {
			console.log(err);
		} else {
			res.redirect('/daas/login');
		}
	});
});

app.all("*", function (req, res, next) {
	var userinfos = {};
	console.log(req);
	if ((req.url.indexOf('/selectcompany') >= 0) && req.query.company != undefined) {

		console.log(" initialize cache");
		req.session.company = req.query.company;
		req.session.defaultCompany = req.query.company;
		once(app.myDB, req);
		if (myCacheData.update_build_info[0]._cachedata != undefined) {
			console.log(1);
		}
	}
	if (req.url === '/menurefresh') {
		if (req.session.defaultCompany == undefined) {
			return res.render('/daas/login');
		}
		req.session.defaultCompany = req.body.defaultCompany
	}

	if (req.url === '/daas/login' && companyList != undefined) {
		req.session.defaultCompany = companyList[0]

	}
	if (
		(req.url === '/scriptrunner/.websocket')
		|| (req.url.indexOf('action=getcasedata') >= 0)
		|| (req.url.indexOf('action=updatereport') >= 0)
		|| (req.url.indexOf('action=productinfolist') >= 0)
		|| (req.url.indexOf('action=updateproductinfo') >= 0)
		|| (req.url.indexOf('action=addcasereport') >= 0)
		|| (req.url.indexOf('PostFile') >= 0)		//added to fix the display of report link in data valiation
		|| (req.url.indexOf('PostImage') >= 0)		//added to fix the reportimage upload and display
		|| (req.url.indexOf('/api/settings/exicution/validate') >= 0)
	) {
		console.log('Request received  from UFT/TestRunner/Dll, req.url = ' + req.url);
		req.companytorunscripts = companyList[0];
		req.session.company = companyList[0];
		//next()
	}
	else {
		console.log('Default company from session --->' + req.session.defaultCompany);
		if (req.session.defaultCompany == undefined && companyList != undefined) {
			req.session.defaultCompany = companyList[0]
			return res.redirect('/daas/login');
		}

		if (req.session.islogin) {
			console.log('User Logged-in Session details : \nLogin: ' +
				req.session.islogin + " Email: " +
				req.session.email + " User Name: " +
				req.session.username + " Picture: " +
				req.session.picture + " Projects: " +
				req.session.projects + " Company: " +
				req.session.company + " Roles: " +
				req.session.roles + "\n"
			);

			userinfos.islogin = true;
			userinfos.email = req.session.email;
			userinfos.displayname = req.session.username;
			userinfos.usertype = req.session.roles;
			userinfos.headico = req.session.picture;
			userinfos.projects = req.session.projects;
			userinfos.company = req.session.company;

		} else {
			userinfos.islogin = false;
			userinfos.email = "";
			req.session.company = req.session.defaultCompany;
			console.log('defaultCompany: ' + req.session.company);
			res.locals.islogin = false;
			res.locals.email = "";

			// if(!req.session.company){
			// 	console.log("Please use valid DaaS Tool URL to access the system.");
			// 	return;
			// }
		}

		//To refresh menu items when new project or delete project
		if (req.session && req.session.refresh && companyList != undefined) {

			var restulData = myCacheData.init(myDB, req.session.company);
			if (restulData) {
				app.myCacheData = myCacheData;
				req.session.refresh = false
			}
		}

		res.locals.userinfos = userinfos;
		if (req.url.toLowerCase().indexOf("/post?") < 0 && companyList != undefined) {
			if (myCacheData.Data.navbar != undefined && myCacheData.Data.buildInfo != undefined) {
				myCacheData.Data.navbar.forEach(menuObj => {
					if (menuObj.companyName == req.session.company) {
						res.locals.navbar = menuObj;
					}
				});

				myCacheData.Data.buildInfo.forEach(buildObj => {
					if (buildObj.companyName == req.session.company) {
						res.locals.buildinfos = buildObj;
					}
				});
			}
		}
	}
	res.locals.visiturl = decodeURI(req.originalUrl);
	next();
});


//set the json response formate
//app.set('json spaces', 40)
// catch 404 and forward to error handler


app.use('/', routes);
app.use('/', login);
app.use('/api/home', home);
app.use('/api/reports', report);
app.use('/api/checkpoints', checkpoints);
app.use('/api/contactus', contact);
app.use('/api/projects', projectList);
app.use('/api/users', userList);
app.use('/api/validation', validation);
app.use('/api/recovery', recovery);
app.use('/api/project', createproject);
app.use('/api/mapping', maptestcase);
app.use('/api/settings', settings);
app.use('/api/api', api);



app.use('/Post', mypost);
app.use('/PostFile', mypostfile);
app.use('/PostImage', mypostimage);
app.use('/api/log', logpage);
app.use('/api/schedulehistory', schedulehistorypage);
app.use('/schedulerStatus', schedulerStatuspage);
app.use('/scriptrunner', scriptrunner);

app.use(/^.(?!scriptrunner).*$/, routes);

app.use('/automate', automate);

//app.use(/\/.*/, routes);

app.use(function (req, res, next) {
	//req.root = req.protocol + '://' + req.get('host') + '/';
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

//Reading serverport properties
var serverPort = properties.get('app.server.port');

// error handlers

// development error handler
// will print stacktrace
//Reading property file
if (app.get('env').trim() === 'development') {
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		console.log(err.messag);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
} else {
	app.use(function (err, req, res, next) {
		app.set('trust proxy', 1) // trust first proxy 
		//req.session.cookie.secure = true; // serve secure cookies 
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: {}
		});
	});
}


app.listen(serverPort);

module.exports = app;