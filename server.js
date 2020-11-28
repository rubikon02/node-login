const express = require("express")
const app = express()
const PORT = 3000;
const path = require("path")
var bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('static'))


let users = [
    { id: 1, login: "aaa", password: "aa", age: 10, student: "yes", gender: "m" },
    { id: 2, login: "bbb", password: "bb", age: 20, student: "yes", gender: "w" },
    { id: 3, login: "ccc", password: "cc", age: 17, student: "no", gender: "m" },
    { id: 4, login: "ddd", password: "dd", age: 15, student: "yes", gender: "m" },
    { id: 5, login: "eee", password: "ee", age: 11, student: "yes", gender: "w" },
    { id: 6, login: "fff", password: "ff", age: 12, student: "no", gender: "w" },
]
let nextID = users.length + 1
let loggedIn = false
const gender = {
    w: "woman",
    m: "man",
}
const allColumns = ['id', 'login', 'password', 'age', 'student', 'gender']
let selectedColumns = ['id', 'login', 'password', 'age', 'student', 'gender']


app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/static/index.html"))
})

// login and register
app.get("/register", function (req, res) {
    res.sendFile(path.join(__dirname + "/static/pages/register.html"))
})

app.get("/login", function (req, res) {
    res.sendFile(path.join(__dirname + "/static/pages/login.html"))
})

app.post("/register", function (req, res) {
    console.log(req.body)
    if (req.body.gender === undefined || req.body.login == '' || req.body.password == '') {
        res.send("Fill all fields to register")
        return
    }
    if (req.body.student === undefined)
        req.body.student = "no"
    for (const user of users)
        if (user.login == req.body.login) {
            res.send("User " + req.body.login + " already exists")
            return
        }
    users.push({ id: nextID++, login: req.body.login, password: req.body.password, age: req.body.age, student: req.body.student, gender: req.body.gender })
    res.send("User " + req.body.login + " registered successfully")
})

app.post("/login", function (req, res) {
    for (const user of users)
        if (user.login == req.body.login && user.password == req.body.password) {
            loggedIn = true
            res.redirect("/admin")
            return
        }
    res.send("Wrong login or password")
})

// admin
app.get("/admin", function (req, res) {
    if (notLogged(res)) return
    res.sendFile(path.join(__dirname + "/static/pages/admin.html"))
})

app.get("/logout", function (req, res) {
    loggedIn = false
    res.redirect("/")
})

const links = '<ul>' +
    '<li id="goBack"><a href="/admin">go back</a></li>' +
    '</ul>' +
    '<ul>' +
    '<li><a href="/sort">sort</a></li>' +
    '<li><a href="/gender">gender</a></li>' +
    '<li><a href="/show">show</a></li>' +
    '</ul>'

// admin show
app.get("/show", (req, res) => {
    selectedColumns = allColumns
    showPage(req, res)
})
app.post("/show", showPage)
function showPage(req, res) {
    if (notLogged(res)) return
    lastAdminPage = "/show"
    res.send(links + generateColumnsSelection() + generateTable(users, selectedColumns))
}

// admin gender
app.get("/gender", (req, res) => {
    selectedColumns = ['id', 'gender']
    genderPage(req, res)
})
app.post("/gender", genderPage)
function genderPage(req, res) {
    if (notLogged(res)) return
    lastAdminPage = "/gender"
    let response = links + generateColumnsSelection()
    response += generateTable(users.filter(user => user.gender == 'w'), selectedColumns)
    response += generateTable(users.filter(user => user.gender == 'm'), selectedColumns)
    res.send(response)
}

//admin sort
let sortMethod = "ascending"
app.post("/sort", sortPage)
app.get("/sort", (req, res) => {
    selectedColumns = ['id', 'login', 'password', 'age']
    sortMethod = "ascending"
    sortPage(req, res)
})
function sortPage(req, res) {
    lastAdminPage = "/sort"
    if (notLogged(res)) return
    res.send(links + generateSortButtons() + generateColumnsSelection() + generateTable(sortedArray(users), selectedColumns))
}
function generateSortButtons() {
    let ascendingButton = 'checked'
    let descendingButton = ''
    if (sortMethod == "descending")
        [ascendingButton, descendingButton] = [descendingButton, ascendingButton]
    const sortButtons = '<form onchange="this.submit()" method="post" action="/changeSort">' +
        '<input type="radio" name="sort" value="ascending" id="ascending"' + ascendingButton + '><label for="ascending">ascending</label>' +
        '<input type="radio" name="sort" value="descending" id="descending"' + descendingButton + '><label for="descending">descending</label>' + '</form>'
    return sortButtons
}
function sortedArray(array) {
    let result = array.slice().sort((a, b) => a.age - b.age)
    if (sortMethod == "descending")
        result.sort((a, b) => b.age - a.age)
    return result
}
app.post("/changeSort", (req, res) => {
    sortMethod = req.body.sort
    res.redirect(307, "/sort")
})

let lastAdminPage

// admin tools

function notLogged(res) {
    if (loggedIn == false) {
        res.sendFile(path.join(__dirname + "/static/pages/accessDenied.html"))
        return true
    }
}

app.post("/changeColumns", (req, res) => {
    selectedColumns = []
    for (const key of allColumns)
        if (req.body[key])
            selectedColumns.push(key)
    res.redirect(307, lastAdminPage)
})

function generateColumnsSelection() {
    let selectColumns = '<form onchange="this.submit()" method="post" action="/changeColumns">'
    for (const key of Object.keys(users[0])) {
        const checked = selectedColumns.includes(key) ? " checked" : ''
        selectColumns += '<input type="checkbox" name=' + key + ' id=' + key + ' value=1' + checked + '><label for=' + key + '>' + key + '</label>'
    }
    selectColumns += '</form>'
    return selectColumns
}

// table generation

function generateTable(array, columns = allColumns) {
    let table = "<table>"
    const css = '<link rel="stylesheet" href="../css/table.css">'
    table += generateHeaderRow(array, columns)
    for (const object of array) {
        table += generateRow(object, columns)
    }
    table += "</table>"
    return css + table
}
function generateHeaderRow(array, columns) {
    let row = "<tr>"
    for (const key of Object.keys(array[0]))
        if (columns.includes(key))
            row += "<th>" + key + "</th>"
    row += "</tr>"
    return row
}

function generateRow(object, columns) {
    let row = "<tr>"
    for (const [key, value] of Object.entries(object))
        if (columns.includes(key))
            row += generateCell(key, value)
    row += "</tr>"
    return row
}


function generateCell(key, value) {
    if (key == "gender")
        value = gender[value]
    if (key == "student") {
        const checked = value == 'yes' ? ' checked' : ''
        value = '<input type="checkbox"' + checked + ' disabled>' + value + "</td>"
    }
    return "<td>" + value + "</td>"
}


app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})