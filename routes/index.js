'use strict';
var express = require('express');
var user;
var html;
var login = 0;
const bodyParser = require('body-parser')
var firebase = require('firebase');
var router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));

// Set the configuration for your app
// TODO: Replace with your project's config object
var config = {
  //paste your firebase config..
};

firebase.initializeApp(config);
var db = firebase.database();
// Get a reference to the database service

function writeUserData(from, to, msg) {
    var id;
    if (from > to)
        id = to + from;
    else
        id = from + to;
    db.ref().child('chats').child(id).push().set({
        from : from,
        msg : msg
    });
}

function addFriend(frnd) {
    var f = 0;
    db.ref().child('users/' + user + '/friends').once("value").then(function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            var childData = childSnapshot.val();
            console.log(childData + ' - ' + frnd);
            if (frnd.indexOf(childData) != -1) {
                f = 1;
            }
        });
        if (f == 0 ) {
            db.ref().child('users/' + user + '/friends').push().set(frnd);
            db.ref().child('users/' + frnd + '/friends').push().set(user);
        }
    });
    
}
router.get('/add', function (req, res) {
    addFriend(req.query.name);
    db.ref().child('users/' + user).child('friends').once("value").then(function (snapshot) {
            html = '<div align="center"><form action="/search" method="post">'+
                   '<input name = "search" style = "width:70vw;margin-left:15%;margin-top:2%;margin-right:15%;text-align:center;" class="form-control" placeholder = "Enter friend`s id.." required /> <br>'+
                   '<input type="submit" value="Search" style="width:20%;padding-left:10%;padding-right:10%" class="btn btn-primary" /></form></div>';
            snapshot.forEach(function (childSnapshot) {
                var childData = childSnapshot.val();
                html = html + '<a href="/chat?name=' + childData + '"><div align="center" class="container p-2 my-2 bg-primary text-white" style="float:left; margin-left:5%;border-radius:8px;margin-right:5%;width:60%; text - align: center; ">' + childData + '</div></a>';
            });
            res.render('index', {
                content: html,
                time: 5000000
            });
        });
});

router.post('/search', function (req, res) {
    html = '';
    if (req.body.search) {
        db.ref().child('users').once("value").then(function (snapshot) {
            html = '';
            snapshot.forEach(function (childSnapshot) {
                var childData = childSnapshot.val().name.toString();
                console.log(childData);
                var name = req.body.search.toLowerCase();
                if (childData.indexOf(name) != -1) {
                    html = html + '<br><div style="margin-top:2%;"><div align="center" class="container p-2 bg-white text-primary" style="width:65%;border:1px solid blue;margin-left:3%;border-radius:10px;float:left;text-align: center;"><h5>' + childData + '</h5></div>' +
                        '<a href="/add?name=' + childData + '"><div style="border-radius:8px;margin-right:7%;width:10%;float:right;text-align:center;" class="container p-2 bg-primary text-white" ><h5>ADD <h5></div></a></div>';
                }
            });
            res.render('search', {
                id: '',
                result : html
            });
        });
    }
    else {
        res.render('search', {
            id: '',
            result: ''
        });
    }
});

router.get('/', function (req, res) {
    res.render('sign', {
        output: ''
    });
});

router.post('/login', function (req, res) {
    var user1 = req.body.user;
    var pass = req.body.pass;
    console.log(user1, pass);
    firebase.auth().signInWithEmailAndPassword(user1, pass).then(function () {
        html = '';
        var x=user1.indexOf('@');
    	var y=user1.indexOf('.');
    	if(x>y)
    		x=y;
        user = user1.substring(0, x);
        db.ref().child('users/' + user).child('friends').once("value").then(function (snapshot) {
            html = '<div align="center"><form action="/search" method="post">'+
                   '<input name = "search" style = "width:70vw;margin-left:15%;margin-top:2%;margin-right:15%;text-align:center;" class="form-control" placeholder = "Enter friend`s id.." required /> <br>'+
                   '<input type="submit" value="Search" style="width:20%;padding-left:10%;padding-right:10%" class="btn btn-primary" /></form></div> <br><h5>FRIENDS<h5><br>';
            snapshot.forEach(function (childSnapshot) {
                var childData = childSnapshot.val();
                html = html + '<a href="/chat?name=' + childData + '"><div align="center" class="container p-2 my-2 bg-primary text-white" style="float:left; margin-left:5%;border-radius:8px;margin-right:5%;width:60%; text - align: center; ">' + childData + '</div></a>';
            });
            res.render('index', {
                content: html,
                time: 5000000
            });
        });
    }).catch(function (err) {
        console.log(err.code, err.message);
        res.render('sign', { output: 'Invalid Credentials' })
    });
});

router.post('/signup', function (req, res) {
    var user1 = req.body.user1;
    var pass1 = req.body.pass1;
    console.log(user1, pass1);
    firebase.auth().createUserWithEmailAndPassword(user1, pass1).then(function () {
    	var x=user1.indexOf('@');
    	var y=user1.indexOf('.');
    	if(x>y)
    		x=y;
        var uname = user1.substring(0, x);
        db.ref().child('users/' + uname).child('name').set(uname);
        res.render('sign', { output: "Account created successfully" });
    }).catch(function (err) {
        res.render('sign', { output: err.message });
    });
});


router.get('/chat', function (req, res) {
    try {
    var newmsg = req.query.msg;
    var id;
    var to = req.query.name;
    var from = user;
    html = '';
    if (newmsg) {
        writeUserData(from, to, newmsg);
    }    
        if (from > to)
            id = to + from;
        else
           id = from + to;
        db.ref().child('chats').child(id).once("value").then(function (snapshot) {
            html = '<a href="/chat?name='+to+'">'+Refresh+"</a>";
            snapshot.forEach(function (childSnapshot) {
                var sender = childSnapshot.val().from;
                var msg = childSnapshot.val().msg;
                    if (sender == user) 
                        html = html + '<div class="container p-2 my-1 bg-primary text-white" style="width:auto;min-width:35%;text-align:center;border-radius:8px;float:right;margin-right:2%"  >' + msg + '</div><br><br>';
                else
                    html = html + '<div class="container p-2 my-1 bg-dark text-white" style="width:auto;min-width:35%;text-align:center;border-radius:8px;float:left;margin-left:2%;">' + msg + '</div> <br><br>';
            });
            html = html + '<form action="/chat" method="get">'+
                '<div class="input-group" style="position:static;float:bottom;">'+
                ' <input type="text" class="form-control" name="msg" placeholder="Enter text message.." style="color:blue;border-radius:10px;margin:2%" name="search"><input type="text" name="name" value="' + to + '" hidden /><button class="btn btn-warning" style="margin-right:15xp;height:40%;margin-top:2%" type="submit">SEND</button></div></form>';
            res.render('index', {
                content: html,
                time:50000
            });
        });
    }
    catch (err) { }
    //writeUserData(user, to, msg);
});

module.exports = router;
