const express = require("express");
const app = express();
const path = require("path");
const accountSid = 'ACf0daf552e49504a497ee2a053abbcd7c';
const authToken = '9824377228b205801e8ffd6c97e48135';
const client = require('twilio')(accountSid, authToken);
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cp = require("cookie-parser");
const cur_dir = path.resolve();
const static_dir = path.join(cur_dir, "/public");
const bodyParser = require("body-parser");
const scheduler = require("node-schedule");
const storage = require('node-sessionstorage')
const session = require('express-session');
var flash = require('connect-flash');
var moment = require('moment');
var cookiecookie = require('cookies');
moment().format();
const { default: mongoose } = require("mongoose");
const { from } = require("responselike");
const { async } = require("q");
const { object } = require("webidl-conversions");
const { BSONType } = require("mongodb");
require("./db/connection");
app.use(express.json());
app.use(cookieParser());
app.use(express.static(static_dir));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(session({
    secret: 'jeenemarnekikiskopadipyaarkarleghadidoghadi',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
const userFiles = path.join(__dirname, "../views/user");
const adminFiles = path.join(__dirname, "../views/admin");
app.set('view engine', 'hbs');

scheduler.scheduleJob('*/10 * * * *', async () => {
    const d = new Date();
    if(d.getDay() !== 0){
        const all_admins = await AdminLogin.find();
        for(var i = 0; i < all_admins.length; i++){
            if(all_admins[i].role == 'middleman' || all_admins[i].role == 'mnc'){
                if(all_admins[i].came_to_office !== 'yes'){
                    client.messages.create({
                        body: 'Its 11 a.m and ' + all_admins[i].username + ' has not logged in still. Please Check!!!',
                        from: '+16205165546',
                        to: '+916351487071'
                
                    }).then((mes) => {
                        console.log(mes);
                    }).catch((err) => {
                        console.log(err);
                    });
                }
            }
        }
    }
});

scheduler.scheduleJob('0 1 * * *', async () => {
    const admins = await AdminLogin.find({came_to_office: "yes"});
    for(var i = 0; i < admins.length; i++){
        const noty = await AdminLogin.findOneAndUpdate({username: admins[i].username}, {$set: {came_to_office: "no"}});
    }
    console.log('Done');
});


const formSchema = {
    date: String,
    userLatitude: String,
    userLongitude: String,
    phonenum: String,
    street_adress: String,
    area: String,
    parent: {
        type: String,
        default: ""
    },
    complaint_topic: String,
    complaint_desc: String,
    cam_proof: String,
    middleman: String,
    reason: {
        type: String,
        default: ""
    },
    responseFile: {
        type: String,
        default: ""
    },
    status: {
        type: Array,
        default: ["Pending"]
    },
    statusTrackDates: {
        type: Array,
        default: [Date.now()]
    }
    //1 - Pending - When request sent but not accepted or rejected by system
    //2 - Accepted - If request accepted by system
    //3 - Rejected - If request rejected by system (Mention Reason)
    //4 - Responded - When MNC sends some response about complain
    //5 - Completed - When request is completed by MNC
    //6 - Uncomplete - When response of MNC is not satisfactory for system
    //7 - Failed - When request remains uncomplete by MNC due to any reason (Mention Reason)
}

const otpSchema = {
    phone: String,
    otp: Number,
    createdAt: { type: Date, expires: '5m', default: Date.now }
}

const notificationSchema = {
    user: String,
    message: String,
    createdAt: { 
        type: Date,
        default: Date.now()
    }
}

const loginSchema = new mongoose.Schema({
    phone: String,
    createdAt: { type: Date, expires: '10080m', default: Date.now },
    tokens: [{
        token: String
    }]
});

const adminLoginSchema = new mongoose.Schema({
    username: String,
    password: String,
    came_to_office: String,
    role: String,
    createdAt: { type: Date, default: Date.now }
});


loginSchema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign({ phone: this.phone }, "jeenemarnekikiskopadipyaarkarleghadidoghadi");
        this.tokens = this.tokens.concat({ token: token });
        await this.save();
        return token;
    }
    catch (err) {
        console.log(err);
    }
}

const Form = mongoose.model("Form", formSchema);
const Otp = mongoose.model("Otp", otpSchema);
const Login = mongoose.model("Login", loginSchema);
const AdminLogin = mongoose.model("AdminLogin", adminLoginSchema);
const Notification = mongoose.model("Notification", notificationSchema);


//All Statistics Function Code....

var manjalpurStatArray = [];
var makarpuraStatArray = [];
var waghodiyaStatArray = [];
var akotaStatArray = [];
var kareilibaghStatArray = [];
var alkapuriStatArray = [];

function getStats(list, arr, pendingCount, acceptedCount, rejectedCount, respondedCount, completedCount, uncompletedCount, failedCount) {
    var i = 0;
    while (i < list.length) {
        if (list[i].status[list[i].status.length - 1] == 'Accepted') {
            acceptedCount++;
        }
        if (list[i].status[list[i].status.length - 1] == 'Rejected') {
            rejectedCount++;
        }
        if (list[i].status[list[i].status.length - 1] == 'Pending') {
            pendingCount++;
        }
        if (list[i].status[list[i].status.length - 1] == 'Failed') {
            failedCount++;
        }
        if (list[i].status[list[i].status.length - 1] == 'Completed') {
            completedCount++;
        }
        if (list[i].status[list[i].status.length - 1] == 'Responded') {
            respondedCount++;
        }
        if (list[i].status[list[i].status.length - 1] == 'Uncomplete') {
            uncompletedCount++;
        }
        i++;
    }

    arr[0] = pendingCount;
    arr[1] = acceptedCount;
    arr[2] = rejectedCount;
    arr[3] = respondedCount;
    arr[4] = completedCount;
    arr[5] = uncompletedCount;
    arr[6] = failedCount;
    return arr;
}

app.get("/", (req, res) => {
    app.set("views", userFiles);
    res.render('homepage');
});

//On localhost:3000/admin...
app.get("/admin", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const adminDetails = await AdminLogin.findOne({ username: req.cookies.admin });
        if (adminDetails.role == 'middleman') {
            res.render('adminPanel', { currentAdmin: req.cookies.admin, byDefault: true });
        }
        else if (adminDetails.role == 'super') {
            res.render('superadmin', { currentAdmin: req.cookies.admin, byDefault: true });
        }
        else {
            res.render("mncPanel", { currentAdmin: req.cookies.admin, byDefault: true });
        }
    }
    else {
        res.render('adlogin');
    }
});

//MNC PANEL
//On clicking unsolved complaints on MNC Panel
app.get("/unsolvedcomps", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const Complain = await Form.find({ area: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1, parent:1 });
        var i = 0;
        while (i < Complain.length) {
            if ((Complain[i].status[Complain[i].status.length - 1]) != 'Accepted' || Complain[i].parent == "") {
                Complain.splice(i, 1);
                i = i;
            }
            else {
                i++;
            }
        }
        console.log(Complain);
        res.render("mncPanel", { currentAdmin: req.cookies.admin, unsolvedComp: true, unsolvedcomplaint: Complain, message: req.flash('mes'), sms: req.flash('sms') });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking succesfull complaints on MNC Panel
app.get("/successcomps", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const Complain = await Form.find({ area: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var ComplainList = [];
        for (var i = 0; i < Complain.length; i++) {
            if (Complain[i].status[Complain[i].status.length - 1] == 'Completed') {
                ComplainList.push(Complain[i]);
            }
        }
        res.render("mncPanel", { currentAdmin: req.cookies.admin, successComp: true, completedcomplaint: ComplainList });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking failed complaints on MNC Panel
app.get("/failedcomps", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const Complain = await Form.find({ area: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var ComplainList = [];
        for (var i = 0; i < Complain.length; i++) {
            if (Complain[i].status[Complain[i].status.length - 1] == 'Uncomplete') {
                ComplainList.push(Complain[i]);
            }
        }
        res.render("mncPanel", { currentAdmin: req.cookies.admin, failComp: true, uncompletedcomplaint: ComplainList });
    }
    else {
        res.render('adlogin');
    }
});


//On clicking Middleman Info on Admin Panel
app.get("/midinfo", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        var ComplainList = [];
        var mids = ['mummy', 'ethan', 'yaksh'];
        for(var i = 0; i < mids.length; i++){
            const complaints = await Form.find({middleman: mids[i]}, {status: 1});
            var arr = getStats(complaints, [], 0, 0, 0, 0, 0, 0, 0);
            var obj = {
                name: mids[i],
                pc: arr[0],
                ac: arr[1] + arr[3] + arr[4] + arr[5] + arr[6],
                rc: arr[3],
                pr: arr[1],
                ar: arr[5],
                rr: arr[5] + arr[6],
                leaves: 0
            };
            ComplainList.push(obj);
        }
        res.render("superadmin", { currentAdmin: req.cookies.admin, midInfo: true, cDetails: ComplainList });
    }
    else {
        res.render('adlogin');
    }
});


//On clicking Middleman Info on Admin Panel
app.get("/mncinfo", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        var ComplainList = [];
        var mncs = ['alkapuri', 'akota', 'kareilibagh', 'manjalpur', 'makarpura', 'waghodiya'];
        for(var i = 0; i < mncs.length; i++){
            const complaints = await Form.find({area: mncs[i]}, {status: 1});
            var arr = getStats(complaints, [], 0, 0, 0, 0, 0, 0, 0);
            var obj = {
                name: mncs[i],
                pc: arr[1],
                cc: arr[4],
                uc: arr[5],
                fc: arr[6],
            };
            ComplainList.push(obj);
        }
        res.render("superadmin", { currentAdmin: req.cookies.admin, mncInfo: true, cDetails: ComplainList });
    }
    else {
        res.render('adlogin');
    }
});


//On clicking responded complaints on MNC Panel
app.get("/rescomps", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const Complain = await Form.find({ area: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var ComplainList = [];
        for (var i = 0; i < Complain.length; i++) {
            if (Complain[i].status[Complain[i].status.length - 1] == 'Uncomplete' || Complain[i].status[Complain[i].status.length - 1] == 'Responded' || Complain[i].status[Complain[i].status.length - 1] == 'Completed') {
                Complain[i].status = Complain[i].status.pop();
                ComplainList.push(Complain[i]);
            }
        }
        res.render("mncPanel", { currentAdmin: req.cookies.admin, resComp: true, respondedcomplaint: ComplainList });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking Find My Compalints complaints on MNC Panel
app.get("/findmnccomps", (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        res.render("mncPanel", { currentAdmin: req.cookies.admin, findComp: true, findDate: '' });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking My Area Statistics complaints on MNC Panel
app.get("/mystats", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        var currentAreaList = await Form.find({ area: req.cookies.admin }, { status: 1 });
        var currentAreaArray = getStats(currentAreaList, [], 0, 0, 0, 0, 0, 0, 0);
        res.render("mncPanel", { currentAdmin: req.cookies.admin, myStats: true, curp: currentAreaArray[0], cura: currentAreaArray[1], curr: currentAreaArray[2], curres: currentAreaArray[3], curc: currentAreaArray[4], curuc: currentAreaArray[5], curf: currentAreaArray[6] });
    }
    else {
        res.render('adlogin');
    }
});

//Municipal Co-operation Response Sending
app.post("/mncResponse/:id", async (req, res) => {
    const Complain = await Form.findOneAndUpdate({ _id: req.params.id }, { $push: { status: "Responded", statusTrackDates: Date.now() }, $set: { responseFile: req.body.pdf_proof } });
    req.flash('mes', true);
    req.flash('sms', "Your Selected Response is sent Successfully...");
    res.redirect("/unsolvedcomps");
});

app.post("/deleteComplain/:id", async (req, res) => {
    const Complain = await Form.findOneAndUpdate({ _id: req.params.id }, { $push: { status: "Deleted", statusTrackDates: Date.now() }, $set: { reason: req.body.reason_to_delete } });
    req.flash('mes', true);
    req.flash('sms', "Selected Complain is Deleted Successfully...");
    res.redirect("/superfind");
});


//ADMIN PANEL
//On clicking Unchecked Complaint Button in Sidebar of Admin Panel
app.get("/uncheckedcomps", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const compList = await Form.find({ middleman: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var i = 0;
        while (i < compList.length) {
            if ((compList[i].status[compList[i].status.length - 1]) != 'Pending') {
                compList.splice(i, 1);
                i = i;
            }
            else {
                i++;
            }
        }
        res.render('adminPanel', { currentAdmin: req.cookies.admin, uncheckedc: true, uncheckedcomplaint: compList, message: req.flash('mes'), sms: req.flash('sms') });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking Accepted Complaint Button in Sidebar of Admin Panel
app.get("/acceptedcomps", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const compList = await Form.find({ middleman: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var i = 0;
        while (i < compList.length) {
            if (!(((compList[i].status[compList[i].status.length - 1]) == 'Accepted') || ((compList[i].status[compList[i].status.length - 1]) == 'Responded'))) {
                compList.splice(i, 1);
                i = i;
            }
            else {
                i++;
            }
        }
        res.render('adminPanel', { currentAdmin: req.cookies.admin, acceptedc: true, acceptedcomplaint: compList });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking Rejected Complaint Button in Sidebar of Admin Panel
app.get("/rejectedcomps", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const compList = await Form.find({ middleman: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var i = 0;
        while (i < compList.length) {
            if ((compList[i].status[compList[i].status.length - 1]) != 'Rejected') {
                compList.splice(i, 1);
                i = i;
            }
            else {
                i++;
            }
        }
        res.render('adminPanel', { currentAdmin: req.cookies.admin, rejectedc: true, rejectedcomplaint: compList });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking Find Complaint Button in Sidebar of Admin Panel
app.get("/findcomps", (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        res.render('adminPanel', { currentAdmin: req.cookies.admin, findc: true });
    }
    else {
        res.render('adlogin');
    }
});


//Super Admin Find
app.get("/superfind", (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        res.render('superadmin', { currentAdmin: req.cookies.admin, findComp: true, message: req.flash('mes'), sms: req.flash('sms')  });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking Complaint Response Button in Sidebar of Admin Panel
app.get("/compsres", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const compList = await Form.find({ middleman: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var i = 0;
        while (i < compList.length) {
            if ((compList[i].status[compList[i].status.length - 1]) != 'Responded') {
                compList.splice(i, 1);
                i = i;
            }
            else {
                i++;
            }
        }
        res.render('adminPanel', { currentAdmin: req.cookies.admin, uncheckedr: true, respondedcomplaint: compList, message: req.flash('mes'), sms: req.flash('sms') });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking Accepted Response Button in Sidebar of Admin Panel
app.get("/acceptedres", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const compList = await Form.find({ middleman: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var i = 0;
        while (i < compList.length) {
            if ((compList[i].status[compList[i].status.length - 1]) != 'Completed') {
                compList.splice(i, 1);
                i = i;
            }
            else {
                i++;
            }
        }
        res.render('adminPanel', { currentAdmin: req.cookies.admin, acceptedr: true, acceptedresponses: compList });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking Rejected Response Button in Sidebar of Admin Panel
app.get("/rejectedres", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const compList = await Form.find({ middleman: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var i = 0;
        while (i < compList.length) {
            if ((compList[i].status[compList[i].status.length - 1]) != 'Uncomplete') {
                compList.splice(i, 1);
                i = i;
            }
            else {
                i++;
            }
        }
        res.render('adminPanel', { currentAdmin: req.cookies.admin, rejectedr: true, rejectedresponses: compList });
    }
    else {
        res.render('adlogin');
    }
});

//On clicking Unresponded Complaints Button in Sidebar of Admin Panel
app.get("/unrespondedcomps", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const compList = await Form.find({ middleman: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var i = 0;
        while (i < compList.length) {
            if ((compList[i].status[compList[i].status.length - 1]) != 'Accepted') {
                compList.splice(i, 1);
                i = i;
            }
            else {
                i++;
            }
        }
        res.render('adminPanel', { currentAdmin: req.cookies.admin, unrespondedr: true, unrespondedcomplaints: compList });
    }
    else {
        res.render('adlogin');
    }
});

//On Super Admin Clicking Notifications
app.get('/notifications', async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        const notifications = await Notification.find().sort({'_id': -1 }).limit(20);
        var not_arr = [];
        for(var i = 0; i < notifications.length; i++){
            const d = new Date(notifications[i].createdAt);
            var string_date = d.toLocaleString();
            if(notifications[i].message == 'loggedout'){
                var obj ={
                    user: notifications[i].user,
                    message: "Logged Out",
                    date: string_date,
                    class: 'out'
                }
                not_arr.push(obj);
            }
            else{
                var obj ={
                    user: notifications[i].user,
                    message: "Logged In",
                    date: string_date,
                    class: ''
                }
                not_arr.push(obj);
            }
        }
        console.log(not_arr);
        res.render('superadmin', { currentAdmin: req.cookies.admin, notification: true, nDetails: not_arr });
    }
    else {
        res.render('adlogin');
    }
})

//On clicking Area Statistics Button in Sidebar of Admin Panel
app.get("/statistics", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin != null) {
        if (req.cookies.admin == 'mummy') {
            //Alkapuri Statistics Details
            const alkapuriList = await Form.find({ area: 'alkapuri' }, { status: 1 });
            alkapuriStatArray = getStats(alkapuriList, [], 0, 0, 0, 0, 0, 0, 0);

            //Kareilibagh Statistics Details
            const kareilibaghList = await Form.find({ area: 'kareilibagh' }, { status: 1 });
            kareilibaghStatArray = getStats(kareilibaghList, [], 0, 0, 0, 0, 0, 0, 0);

            //MiddleMan Statistics Details
            var middlemanTotal = alkapuriList.length + kareilibaghList.length;
            var middlemanPendingCount = alkapuriStatArray[0] + kareilibaghStatArray[0];
            var middlemanAcceptedCount = alkapuriStatArray[1] + kareilibaghStatArray[1];
            var middlemanRejectedCount = alkapuriStatArray[2] + kareilibaghStatArray[2];
            var middlemanRespondedCount = alkapuriStatArray[3] + kareilibaghStatArray[3];
            var middlemanCompletedCount = alkapuriStatArray[4] + kareilibaghStatArray[4];
            var middlemanUncompleteCount = alkapuriStatArray[5] + kareilibaghStatArray[5];
            var middlemanFailedCount = alkapuriStatArray[6] + kareilibaghStatArray[6];

            res.render('adminPanel', { currentAdmin: req.cookies.admin, stats: true, mt: middlemanTotal, mp: middlemanPendingCount, ma: middlemanAcceptedCount, mr: middlemanRejectedCount, mc: middlemanCompletedCount, muc: middlemanUncompleteCount, mf: middlemanFailedCount, mres: middlemanRespondedCount, a1t: alkapuriList.length, a1p: alkapuriStatArray[0], a1a: alkapuriStatArray[1], a1r: alkapuriStatArray[2], a1res: alkapuriStatArray[3], a1c: alkapuriStatArray[4], a1uc: alkapuriStatArray[5], a1f: alkapuriStatArray[6], a2t: kareilibaghList.length, a2p: kareilibaghStatArray[0], a2a: kareilibaghStatArray[1], a2r: kareilibaghStatArray[2], a2res: kareilibaghStatArray[3], a2c: kareilibaghStatArray[4], a2uc: kareilibaghStatArray[5], a2f: kareilibaghStatArray[6] });
        }
        else if (req.cookies.admin == 'yaksh') {
            //Manjalpur Statistics Details
            const manjalpurList = await Form.find({ area: 'manjalpur' }, { status: 1 });
            manjalpurStatArray = getStats(manjalpurList, [], 0, 0, 0, 0, 0, 0, 0);

            //Akota Statistics Details
            const akotaList = await Form.find({ area: 'akota' }, { status: 1 });
            akotaStatArray = getStats(akotaList, [], 0, 0, 0, 0, 0, 0, 0);

            //MiddleMan Statistics Details
            var middlemanTotal = manjalpurList.length + akotaList.length;
            var middlemanPendingCount = manjalpurStatArray[0] + akotaStatArray[0];
            var middlemanAcceptedCount = manjalpurStatArray[1] + akotaStatArray[1];
            var middlemanRejectedCount = manjalpurStatArray[2] + akotaStatArray[2];
            var middlemanRespondedCount = manjalpurStatArray[3] + akotaStatArray[3];
            var middlemanCompletedCount = manjalpurStatArray[4] + akotaStatArray[4];
            var middlemanUncompleteCount = manjalpurStatArray[5] + akotaStatArray[5];
            var middlemanFailedCount = manjalpurStatArray[6] + akotaStatArray[6];

            res.render('adminPanel', { currentAdmin: req.cookies.admin, stats: true, mt: middlemanTotal, mp: middlemanPendingCount, ma: middlemanAcceptedCount, mr: middlemanRejectedCount, mc: middlemanCompletedCount, muc: middlemanUncompleteCount, mf: middlemanFailedCount, mres: middlemanRespondedCount, a1t: manjalpurList.length, a1p: manjalpurStatArray[0], a1a: manjalpurStatArray[1], a1r: manjalpurStatArray[2], a1res: manjalpurStatArray[3], a1c: manjalpurStatArray[4], a1uc: manjalpurStatArray[5], a1f: manjalpurStatArray[6], a2t: akotaList.length, a2p: akotaStatArray[0], a2a: akotaStatArray[1], a2r: akotaStatArray[2], a2res: akotaStatArray[3], a2c: akotaStatArray[4], a2uc: akotaStatArray[5], a2f: akotaStatArray[6] });
        }
        else if (req.cookies.admin == 'ethan') {
            //Makarpura Statistics Details
            const makarpuraList = await Form.find({ area: 'makarpura' }, { status: 1 });
            makarpuraStatArray = getStats(makarpuraList, [], 0, 0, 0, 0, 0, 0, 0);

            //Akota Statistics Details
            const waghodiyaList = await Form.find({ area: 'waghodiya' }, { status: 1 });
            waghodiyaStatArray = getStats(waghodiyaList, [], 0, 0, 0, 0, 0, 0, 0);

            //MiddleMan Statistics Details
            var middlemanTotal = makarpuraList.length + waghodiyaList.length;
            var middlemanPendingCount = makarpuraStatArray[0] + waghodiyaStatArray[0];
            var middlemanAcceptedCount = makarpuraStatArray[1] + waghodiyaStatArray[1];
            var middlemanRejectedCount = makarpuraStatArray[2] + waghodiyaStatArray[2];
            var middlemanRespondedCount = makarpuraStatArray[3] + waghodiyaStatArray[3];
            var middlemanCompletedCount = makarpuraStatArray[4] + waghodiyaStatArray[4];
            var middlemanUncompleteCount = makarpuraStatArray[5] + waghodiyaStatArray[5];
            var middlemanFailedCount = makarpuraStatArray[6] + waghodiyaStatArray[6];

            res.render('adminPanel', { currentAdmin: req.cookies.admin, stats: true, mt: middlemanTotal, mp: middlemanPendingCount, ma: middlemanAcceptedCount, mr: middlemanRejectedCount, mc: middlemanCompletedCount, muc: middlemanUncompleteCount, mf: middlemanFailedCount, mres: middlemanRespondedCount, a1t: makarpuraList.length, a1p: makarpuraStatArray[0], a1a: makarpuraStatArray[1], a1r: makarpuraStatArray[2], a1res: makarpuraStatArray[3], a1c: makarpuraStatArray[4], a1uc: makarpuraStatArray[5], a1f: makarpuraStatArray[6], a2t: waghodiyaList.length, a2p: waghodiyaStatArray[0], a2a: waghodiyaStatArray[1], a2r: waghodiyaStatArray[2], a2res: waghodiyaStatArray[3], a2c: waghodiyaStatArray[4], a2uc: waghodiyaStatArray[5], a2f: waghodiyaStatArray[6] });
        }
    }
    else {
        res.render('adlogin');
    }
});

//On Opening any Complaint
app.get('/complaint/:compnum', async (req, res) => {
    app.set("views", adminFiles);
    try {
        if (req.cookies.admin != null) {
            const complaitDetails = await Form.find({ _id: req.params.compnum });
            console.log("ID -" + req.params.compnum);
            const Admin = await AdminLogin.findOne({ username: req.cookies.admin });
            if (Admin.role == 'middleman') {
                if (complaitDetails[0].status[complaitDetails[0].status.length - 1] == 'Pending') {
                    const allComplaints = await Form.find({ middleman: req.cookies.admin }, { userLatitude: 1, userLongitude: 1, complaint_topic: 1, complaint_desc: 1, status: 1, cam_proof: 1, parent: 1 });
                    var i = 0;
                    //Removing Pending Complains b'coz How can one complain be similar if it is already pending
                    while (i < allComplaints.length) {
                        if ((allComplaints[i].status[allComplaints[i].status.length - 1]) == 'Pending') {
                            allComplaints.splice(i, 1);
                            i = i;
                        }
                        else {
                            i++;
                        }
                    }

                    //Finding Difference in distance of Location
                    var similarityArr = [];
                    var similarComplain = [];
                    i = 0;
                    while (i < allComplaints.length) {
                        var lat1 = (3.14159265359 * complaitDetails[0].userLatitude) / 180;
                        var long1 = (3.14159265359 * complaitDetails[0].userLongitude) / 180;
                        var lat2 = (3.14159265359 * allComplaints[i].userLatitude) / 180;
                        var long2 = (3.14159265359 * allComplaints[i].userLongitude) / 180;

                        // Haversine Formula
                        var dlong = long2 - long1;
                        var dlat = lat2 - lat1;

                        var ans = Math.pow(Math.sin(dlat / 2), 2) +
                            Math.cos(lat1) * Math.cos(lat2) *
                            Math.pow(Math.sin(dlong / 2), 2);

                        ans = 2 * Math.asin(Math.sqrt(ans));

                        // Radius of Earth in
                        // Kilometers, R = 6371
                        // Use R = 3956 for miles
                        var R = 6371;

                        // Calculate the result
                        ans = ans * R;

                        similarityArr.push(ans * 1000);
                        i++;
                    }

                    for (var j = 0; j < similarityArr.length; j++) {
                        if (similarityArr[j] <= 11) {
                            if (allComplaints[j].parent == "") {
                                similarComplain.push(allComplaints[j]);
                            }
                        }
                    }
                }
                console.log(similarityArr);
                if (complaitDetails[0].status[complaitDetails[0].status.length - 1] == 'Responded') {
                    res.render('adminPanel', { currentAdmin: req.cookies.admin, responseFromMNC: true, complaintInfo: true, similarComp: false, complainFromUser: false, cDetails: complaitDetails[0] });
                }
                else if (complaitDetails[0].status[complaitDetails[0].status.length - 1] == 'Pending') {
                    res.render('adminPanel', { currentAdmin: req.cookies.admin, childComplaintID: complaitDetails[0]._id.toString(), complaintInfo: true, complainFromUser: true, cDetails: complaitDetails[0], similarComp: true, sComplaint: similarComplain });
                }
                else {
                    res.render('adminPanel', { currentAdmin: req.cookies.admin, responseFromMNC: false, complaintInfo: true, similarComp: false, complainFromUser: false, cDetails: complaitDetails[0] });
                }
            }
            else if(Admin.role == 'super'){
                complaitDetails[0].status = complaitDetails[0].status[complaitDetails[0].status.length - 1];
                if(complaitDetails[0].status[complaitDetails[0].status.length - 1] == 'Deleted'){
                    res.render('superadmin', {currentAdmin: req.cookies.admin, complaintInfo: true, deleteComplain: false, cDetails: complaitDetails[0]})
                }
                else{
                    res.render('superadmin', {currentAdmin: req.cookies.admin, complaintInfo: true, deleteComplain: true, cDetails: complaitDetails[0]})
                }
            }
            else {
                if (complaitDetails[0].status[complaitDetails[0].status.length - 1] == 'Accepted') {
                    res.render("mncPanel", { currentAdmin: req.cookies.admin, complaintInfo: true, complainToBeSolved: true, cDetails: complaitDetails[0] });
                }
                else {
                    res.render("mncPanel", { currentAdmin: req.cookies.admin, complaintInfo: true, complainToBeSolved: false, cDetails: complaitDetails[0] });
                }
            }
        }
        else {
            res.render('adlogin');
        }
    }
    catch (err) {
        console.log(err);
    }
});

//When any complain is found similar to another
app.post('/similar', async (req, res) => {
    console.log("Child: " + req.body.childID);
    console.log("Child: " + req.body.parentID);
    const complaint = await Form.findOneAndUpdate({ _id: req.body.childID }, { $set: { parent: req.body.parentID } });
    const parent = await Form.findOne({ _id: req.body.parentID });
    const child = await Form.findOneAndUpdate({ _id: req.body.childID }, { $set: { status: parent.status, reason: parent.reason, statusTrackDates: parent.statusTrackDates } });
    req.flash('mes', true);
    req.flash('sms', "ID = " + req.body.childID + " became child of " + "ID = " + req.body.parentID + " Successfully...");
    res.redirect("/uncheckedcomps");
});
//On accepting response from MNC by AdminPanel
app.post("/acceptedResponse/:id", async (req, res) => {
    app.set("views", adminFiles);
    const Complain = await Form.findOneAndUpdate({ _id: req.params.id }, { $push: { status: "Completed", statusTrackDates: Date.now() } });
    const list = await Form.updateMany({ parent: req.params.id }, { $push: { status: "Completed", statusTrackDates: Date.now() } });
    req.flash('mes', true);
    req.flash('sms', "Complaint has been Completed Successfully...");
    res.redirect("/compsres");
});

//On accepting the response but for failing the complain from MNC by AdminPanel
app.post("/failComplain/:id", async (req, res) => {
    app.set("views", adminFiles);
    const Complain = await Form.findOneAndUpdate({ _id: req.params.id }, { $push: { status: "Failed", statusTrackDates: Date.now() } });
    const list = await Form.updateMany({ parent: req.params.id }, { $push: { status: "Failed", statusTrackDates: Date.now() } });
    req.flash('mes', true);
    req.flash('sms', "Complaint has been Failed Successfully...");
    res.redirect("/compsres");
});

//On accepting the response but for failing the complain from MNC by AdminPanel
app.post("/rejectResponse/:id", async (req, res) => {
    app.set("views", adminFiles);
    const Complain = await Form.findOneAndUpdate({ _id: req.params.id }, { $push: { status: "Incomplete", statusTrackDates: Date.now() } });
    const list = await Form.updateMany({ parent: req.params.id }, { $push: { status: "Incomplete", statusTrackDates: Date.now() } });
    req.flash('mes', true);
    req.flash('sms', "Complaint Response stays Incomplete Successfully...");
    res.redirect("/compsres");
});

//On complaint getting Accepted By Middleman
app.post("/complaint/complainResultFail", async (req, res) => {
    app.set("views", adminFiles);
    const Complain = await Form.findOneAndUpdate({ _id: req.body.cID }, { $push: { status: "Rejected", statusTrackDates: Date.now() }, $set: { reason: req.body.rejectReason } });
    req.flash('mes', true);
    req.flash('sms', "Complaint has been Rejected Successfully...");
    res.redirect("/uncheckedcomps");
});

//On complaint getting Rejected By Middleman
app.post("/complaint/complainResultPass", async (req, res) => {
    app.set("views", adminFiles);
    const Complain = await Form.findOneAndUpdate({ _id: req.body.cID }, { $push: { status: "Accepted", statusTrackDates: Date.now() } });
    req.flash('mes', true);
    req.flash('sms', "Complaint has been Accepted Successfully...");
    res.redirect("/uncheckedcomps");
});

//Finding Complaint by Date
app.post("/findComplaint", async (req, res) => {
    app.set("views", adminFiles);
    if (req.cookies.admin == 'mummy' || req.cookies.admin == 'ethan' || req.cookies.admin == 'yaksh') {
        const compList = await Form.find({ date: req.body.dateToFind }, { area: 1, complaint_topic: 1, status: 1 });
        var i = 0;
        while (i < compList.length) {
            compList[i].status.reverse();
            i++;
        }
        res.render('adminPanel', { currentAdmin: req.cookies.admin, findc: true, brougthList: true, cDetails: compList, findDate: req.body.dateToFind });
    }
    else {
        const compList = await Form.find({ date: req.body.dateToFind, area: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1 });
        var i = 0;
        while (i < compList.length) {
            compList[i].status.reverse();
            i++;
        }
        console.log(compList);
        res.render('mncPanel', { currentAdmin: req.cookies.admin, findComp: true, findc: true, brougthList: true, cDetails: compList, findDate: req.body.dateToFind });
    }
});

//Finding Complaint by Date
app.post("/superfindComplaint", async (req, res) => {
    app.set("views", adminFiles);
    console.log(req.body.dateToFind);
    console.log(req.body.areaDropBox);
    console.log(req.body.midDropBox);
    var compList;
    if(req.body.dateToFind == ''){
        if(req.body.areaDropBox == 'empty'){
            if(req.body.midDropBox == 'empty'){
                 complist = [];
            }
            else{
                 compList = await Form.find({middleman: req.body.midDropBox}, { area: 1, complaint_topic: 1, status: 1 });
            }
        }
        else{
            if(req.body.midDropBox == 'empty'){
                 complist = await Form.find({area: req.body.areaDropBox}, { area: 1, complaint_topic: 1, status: 1 });;
            }
            else{
                 compList = await Form.find({middleman: req.body.midDropBox, area: req.body.areaDropBox}, { area: 1, complaint_topic: 1, status: 1 });
            }
        }
    }
    else{
        if(req.body.areaDropBox == 'empty'){
            if(req.body.midDropBox == 'empty'){
                 complist = await Form.find({date: req.body.dateToFind}, { area: 1, complaint_topic: 1, status: 1 });
            }
            else{
                 compList = await Form.find({middleman: req.body.midDropBox, date: req.body.dateToFind}, { area: 1, complaint_topic: 1, status: 1 });
            }
        }
        else{
            if(req.body.midDropBox == 'empty'){
                 complist = await Form.find({area: req.body.areaDropBox, date: req.body.dateToFind}, { area: 1, complaint_topic: 1, status: 1 });;
            }
            else{
                 compList = await Form.find({middleman: req.body.midDropBox, area: req.body.areaDropBox, date: req.body.dateToFind}, { area: 1, complaint_topic: 1, status: 1 });
            }
        }
    }
    var i = 0;
    if(await compList.length != 0){
        while (i < compList.length) {
            compList[i].status.reverse();
            i++;
        }
    }
    console.log(compList);
    res.render('superadmin', { currentAdmin: req.cookies.admin, findComp: true, findc: true, brougthList: true, cDetails: compList, findDate: req.body.dateToFind });
});

app.post("/superFindById", async(req, res) => {
    app.set("views", adminFiles);
    const compList = await Form.find({_id: req.body.complain_id}, { area: 1, complaint_topic: 1, status: 1 });
    console.log(compList);
    var i = 0;
    while (i < compList.length) {
        compList[i].status.reverse();
        i++;
    }
    res.render('superadmin', { currentAdmin: req.cookies.admin, findComp: true, findc: true, brougthList: true, cDetails: compList, findDate: req.body.complain_id});
});


app.post("/findThisWeekComplaint", async (req, res) => {
    app.set("views", adminFiles);
    var thisWeekComplainsList = [];
    var daysAgo = {};
    for (var i = 0; i < 7; i++) {
        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thrus', 'Fri', 'Sat'];
        daysAgo[i] = moment().subtract(i, 'days').format("YYYY-MM-DD");
        const date = moment(daysAgo[i]); // Thursday Feb 2015
        const dow = date.day();
        const list = await Form.find({ date: daysAgo[i] }, { area: 1, complaint_topic: 1, status: 1, date: 1 });
        var i = 0;
        while (i < list.length) {
            list[i].status.reverse();
            i++;
        }
        if (list.length != 0) {
            thisWeekComplainsList = thisWeekComplainsList.concat(list);
        }
        if (days[dow] == 'Sun') {
            break;
        }
    }

    res.render('adminPanel', { currentAdmin: req.cookies.admin, findc: true, thisWeekList: true, cDetails: thisWeekComplainsList });
});

app.post("/findMonthComplaint", async (req, res) => {
    const list = await Form.find({ middleman: req.cookies.admin });
    var monthList = [];
    for (var i = 0; i < list.length; i++) {
        var listMonth = list[i].date.split('-');
        if (listMonth[1] == req.body.monthDropBox) {
            list[i].status.reverse();
            monthList.push(list[i]);
        }
    }
    res.render('adminPanel', { currentAdmin: req.cookies.admin, findc: true, thisWeekList: true, cDetails: monthList });
});

app.post("/findAll", async (req, res) => {
    const list = await Form.find({ middleman: req.cookies.admin }, { area: 1, complaint_topic: 1, status: 1, date: 1 });
    var i = 0;
    while (i < list.length) {
        list[i].status.reverse();
        i++;
    }
    res.render('adminPanel', { currentAdmin: req.cookies.admin, findc: true, thisWeekList: true, cDetails: list });
});

app.post("/adminlogin", async (req, res) => {
    console.log(req.session.name);
    app.set("views", adminFiles);
    const adminData = await AdminLogin.find({ username: req.body.adminUsername });
    if (adminData.length > 0) {
        if (adminData[0].password == req.body.adminPassword) {
            let notify = new Notification({
                user: req.body.adminUsername,
                message: "loggedin"
            });
            const noty = await AdminLogin.findOneAndUpdate({username: req.body.adminUsername}, {$set: {came_to_office: "yes"}});
            notify.save();
            if (adminData[0].role == "middleman") {
                req.session.name = req.body.adminUsername;
                res.cookie("admin", req.body.adminUsername);
                res.cookie("working", 'yes');
                res.render("adminPanel", { currentAdmin: req.session.name, byDefault: true });
            }
            else if (adminData[0].role == "super") {
                req.session.name = req.body.adminUsername;
                res.cookie("admin", req.body.adminUsername);
                res.render("superadmin", { currentAdmin: req.session.name, byDefault: true });
            }
            else {
                req.session.name = req.body.adminUsername;
                res.cookie("admin", req.body.adminUsername);
                res.render("mncPanel", { currentAdmin: req.session.name, byDefault: true });
            }
        }
        else {
            res.render("adlogin", { wrongDetails: true });
        }
    }
    else {
        res.render("adlogin", { noUserExist: true });
    }
});

app.post("/homepage", async (req, res) => {
    app.set("views", userFiles);
    try {
        const cookieToken = req.cookies.login;
        if (cookieToken != null) {
            const verify = jwt.verify(cookieToken, "jeenemarnekikiskopadipyaarkarleghadidoghadi");
            if (verify != null) {
                res.render('complaint', { credential: verify.phone });
            }
            else {
                res.render('login');
            }
        }
        else {
            res.render('login');
        }
    }
    catch (err) {
        console.log(err);
    }
});

app.post("/login", (req, res) => {
    var pnumber = req.body.phone;
    var gotp = Math.floor(Math.random() * (9999 - 1000)) + 1000;
    let otpGenerate = new Otp({
        phone: pnumber,
        otp: gotp
    });
    otpGenerate.save();
    client.messages.create({
        body: 'Dear Customer, your OTP is ' + gotp + '. Remember this OTP is only valid for next 5 minutes, Your time starts now. Tik..Tik...Tikk',
        from: '+16205165546',
        to: '+91' + pnumber

    }).then((mes) => {
        console.log(mes);
    }).catch((err) => {
        console.log(err);
    });
    app.set("views", userFiles);
    res.render('verify', { number: pnumber });
});


app.post("/verify", async (req, res) => {
    app.set("views", userFiles);
    const otpData = await Otp.find({ phone: req.body.phone });
    if (otpData.length != 0) {
        if (req.body.otp == otpData[otpData.length - 1].otp) {

            let directLogin = new Login({
                phone: req.body.phone
            });
            const token = await directLogin.generateAuthToken();
            res.cookie("login", token, {
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
            });
            directLogin.save();
            res.render('complaint', { credential: req.body.phone });
        }
        else {
            res.render('verify', { number: req.body.phone, wrongotp: true });
        }
    }
    else {
        res.render('login', { expiredotp: true });
    }
});

app.get("/login", (req, res) => {
    app.set("views", userFiles);
    res.render('login');
});

app.get("/complaint", async (req, res) => {
    try {
        const cookieToken = req.cookies.login;
        if (cookieToken != null) {
            const verify = jwt.verify(cookieToken, "jeenemarnekikiskopadipyaarkarleghadidoghadi");
            res.render('complaint', { credential: verify.phone });
        }
        else {
            res.send("First Login Dear");
        }
    }
    catch (err) {
        console.log(err);
    }
});

app.post("/complaint", (req, res) => {
    let allotingMiddleman;
    if (req.body.area == 'manjalpur' || req.body.area == 'akota') {
        allotingMiddleman = 'yaksh';
    }
    else if (req.body.area == 'makarpura' || req.body.area == 'waghodiya') {
        allotingMiddleman = 'ethan';
    }
    else {
        allotingMiddleman = 'mummy';
    }

    app.set("views", userFiles);
    let newComplaint = new Form({
        date: req.body.date,
        phonenum: req.body.phone_number,
        street_adress: req.body.street_add,
        area: req.body.area,
        userLatitude: req.body.lat,
        userLongitude: req.body.long,
        complaint_topic: req.body.complaint_abt,
        complaint_desc: req.body.complaint_details,
        cam_proof: req.body.cam_proof,
        middleman: allotingMiddleman
    });
    newComplaint.save();
    res.render('confitti');
})

app.get("/track", async (req, res) => {
    app.set("views", userFiles);
    console.log(req.cookies.login);
    if (req.cookies.login != null) {
        const verify = jwt.verify(req.cookies.login, "jeenemarnekikiskopadipyaarkarleghadidoghadi");
        const compList = await Form.find({ phonenum: verify.phone }, { date: 1, complaint_topic: 1, complaint_desc: 1, reason: 1, status: 1, statusTrackDates: 1, responseFile: 1, street_adress: 1, area: 1, cam_proof: 1, middleman: 1 });
        compList.reverse();
        var status_arr = [];
        for (var i = 0; i < compList.length; i++) {
            if (compList[i].status[compList[i].status.length - 1] == 'Pending') {
                status_arr.push(1);
            }
            else if (compList[i].status[compList[i].status.length - 1] == 'Accepted') {
                status_arr.push(2);
            }
            else if (compList[i].status[compList[i].status.length - 1] == 'Rejected') {
                status_arr.push(3);
            }
            else if (compList[i].status[compList[i].status.length - 1] == 'Responded') {
                status_arr.push(4);
            }
            else if (compList[i].status[compList[i].status.length - 1] == 'Completed') {
                status_arr.push(5);
            }
            else if (compList[i].status[compList[i].status.length - 1] == 'Uncomplete') {
                status_arr.push(6);
            }
            else if (compList[i].status[compList[i].status.length - 1] == 'Failed') {
                status_arr.push(7);
            }
        }
        var final_arr = status_arr.join("");
        res.render('track', { cDetails: compList, status_arr: final_arr });
    }
    else {
        res.render('login');
    }
});

app.post("/formPost", (req, res) => {
    console.log(req.body);
});
app.post("/click", async (req, res) => {
    console.log(req.body.cam_img);
});
app.post("/logout", async (req, res) => {
    app.set("views", userFiles);
    try {
        res.clearCookie('login');
        res.render('homepage');
    }
    catch (err) {
        console.log(err);
    }
});

app.post("/adminLogout", (req, res) => {
    app.set("views", adminFiles);
    try {
        let notify = new Notification({
            user: req.body.adminUsername,
            message: "loggedout"
        });
        notify.save();
        res.clearCookie('admin');
        res.redirect('/admin');
    }
    catch (err) {
        console.log(err);
    }
});

app.post("/complaint/adminLogout", (req, res) => {
    app.set("views", adminFiles);
    try {
        res.clearCookie('admin');
        res.redirect('/admin');
    }
    catch (err) {
        console.log(err);
    }
});

app.get("/admin", (req, res) => {
    app.set("views", adminFiles);
    res.render('midman');
});

app.post("/gone", (req,res) => {
    console.log('gone');
    res.end();
})

app.listen(3000, () => {
    console.log("Listening");
});

//https://www.geeksforgeeks.org/program-distance-two-points-earth/
