// console.log("Hello MERN");

// // variable
// const name = "Jonh";
// const role = "Developer";
// console.log(`Hello ${name}`);
// console.log(`I am a ${role}`);

// var oldWay = "This is the old way";
// let modernWay = "This is the modern way";
// const constantWay = "This is the constant way";

// console.log(oldWay);
// console.log(modernWay);
// console.log(constantWay);

// let age = 25;
// let price = 19.99;
// let calculation = 10 + 5;

// console.log(`Integer: ${age}`);
// console.log(`Decimal: ${price}`);
// console.log(`constantWay: ${calculation}`);

// const isActive = true;
// const isComplete = false;

// console.log(`isActive: ${isActive}`);
// console.log(`isComplete: ${isComplete}`);

// console.log("Type of 'price' variable: ", typeof price);

// // multi-line
// const multipleLine = `
// second line
// third line
// `;

// console.log(multipleLine);

// // function
// function greetStudent(name){
//     return `Hello, ${name}`;
// }

// console.log(greetStudent("John"));
// console.log(greetStudent("Doe"));

// const calculateAge = function(year) {
//     return 2025 - year;
// }

// console.log(calculateAge(1990), "years old");

// const isAdult = (age) => age >= 18;

// console.log(isAdult(calculateAge(2007)) ? "adult" : "not adult");

// const getGrade = (score) => {
//     if (score >= 90) {
//         return "A";
//     } else if (score >= 80) {
//         return "B";
//     } else if (score >= 70) {
//         return "C";
//     } else if (score >= 60) {
//         return "D";
//     } else {
//         return "F";
//     }
// }

// console.log(getGrade(50));

// const gender = (gender) => {
//     if (gender === "m") return 'Male';
//     else if (gender == "f") return "Female";
//     else return "Unknown";
// }

// console.log(gender("m"));
// console.log(gender("lgbtiq+"));

// const myObject = {
//     name: "Jonh",
//     age: 50,
//     isAlive: false,
//     summary: function() {
//         return `${this.name} is ${this.age} years old and is ${this.isAlive ? "alive" : "dead"}`;
//     }
// };

// console.log(myObject.summary());

// // array
// const fruits = ['apple', 'banana', 'cherry', 'dragon fruit']
// fruits.push("mango");
// fruits.unshift("orange");
// console.log(`${fruits.join(", ")}`);
// console.log(fruits[1]);
// console.log(`indexOf('banana')`);

// // loop
// for (let i = 0; i < fruits.length; i++) {
//     console.log(i+1, fruits[i]);
// }

// array-method
// const students = [
//     {name: 'Jonh', age: 1},
//     {name: 'Doe', age: 2},
//     {name: 'Jane', age: 3},
// ];
// console.log(`Students: ${JSON.stringify(students)}`);

// students.forEach((student, index) => {
//     console.log(`Student no ${index+1}. ${student.name}, ${student.age} years old.`);
// });