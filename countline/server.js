var express = require('express');
var fs = require('fs');

var app = express();


app.get('/', function (req, res) {

    var countline = [];
    var path = __dirname + "/src";
    fs.readdir(path, function (err, items) {
        for (var i = 0; i < items.length; i++) {
            var file = path + '/' + items[i];
            var text = fs.readFileSync(file).toString();
            var lines = text.split('\n');
            var newlines_count = lines.length - 1;
            countline.push(newlines_count);
            console.log("Start: " + items[i] + " --->  Line : " + newlines_count);

            // fs.stat(file, function (err, stats) {
            //     console.log(file);
            //     console.log(stats["size"]);
            // });
        }

        var sum = countline.reduce((a, b) => a + b, 0);
        console.log("Line : " + sum);
    })
});
app.listen(8080);