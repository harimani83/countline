var arr = [1, 2, 3, 1, 5, 6, 5, 1, 5];
var nn = arr.length;
console.log(counts(arr, nn));
function counts(arr, n) {
    var count = 0;
    for (var i = 0; i < n; i++) {
        for (var j = i; j < n; j++) {
            if (arr[i] == arr[j]) {
                count++;
            }

        }
        return count;

        //console.log(row);
    }
}

// for (var i = 1; i <= 5; i++) {
//     var row = '';

//     for (var j = 1; j <= (5 - i); j++) {
//         row += ' ';
//     }

//     for (var k = 1; k <= i; k++) {
//         row += '*';
//     }

//     console.log(row);
// }




// // // function ads(){
// // //     u = setTimeout(function(){
// // //         console.log("hello world");
// // //     },1000)
// // //     calre();
// // // }
// // // function calre(){
// // //     calre();
// // // }

// // // ads();

// // class Product{

// //     constructor(price, name) {

// //       this.price = price;

// //       this.name = name;

// //     }



// //     toString() {

// //       return "(" + this.name + ", " + this.price + ")";

// //     }

// //   }

// //   class TV extends Product {

// //     constructor(x, y, inches, resolution) {

// //       super(x, y); 

// //       this.inches  = inches;

// //       this.resolution  = resolution;

// //     }



// //     toString() {

// //       return super.toString() + " TV res " + this.resolution + " Size: "+this.inches+"\""; 

// //     }

// //   }

// //   var tv = new TV("1000$", "LG", 65, "2000*2000");

// //   console.log(tv instanceof TV);

// //   console.log(tv instanceof Product);

// // //   console.log(tv instanceof Object);

// // for(var i =0;i<10;i++){
// //     setTimeout(function(){
// //         console.log(i);
// //     },0);
// // }
// // console.log("here");
// // setImmediate(function(){
// //     console.log("we");
// // });
// // console.log("are");

// // function foo(a=10,b=7,c){
// //     return a+b+c
// // }
// // console.log(foo(10));
// function Monitor(props) {


//     return 
//     <h1>Monitor is connected well!</h1>
//     ;


//  }

//  function NoMonitor(props) {


//     return 
//     <h1>Please connect a monitor.</h1>
//     ;


//  }

//  function HWManager(props) {

//    const isMonitorOn = props.isMonitorOn;

//    if (isMonitorOn) {


//     return 
//     <Monitor ></Monitor>
//     ;


//    }


//     return 
//     <NoMonitor ></NoMonitor>
//     ;


//  }

//  ReactDOM.render(  


//     <HWManager  ></HWManager>
//     ,


//    document.getElementById("root")

//  );

// function foo(somenn,...params){
//     return " "+(somenn)*params.length;
// }

// console.log(foo(100,"hello","world","Es6",true,7));

// var express = require('express');

// var app = express();

// app.set('view engine', 'ejs');

// app.get('/', function (req, res) {

//     res.format({

//         'text/plain': function () {

//             res.status(403).send('hey');

//         },

//         'text/html': function () {


//             res.status(404).send('hey');


//         },

//         'application/json': function () {

//             res.status(405).res.send({ message: 'hey' });

//         },

//         'default': function () {

//             // log the request and respond with 406

//             res.status(406).send('Not Acceptable');

//         }

//     });

// });
// app.listen(8080);