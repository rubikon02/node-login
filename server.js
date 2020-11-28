var express = require("express")
var app = express()
var PORT = process.env.PORT || 3000; // bardzo istotna linijka - port zostaje przydzielony przez Heroku

app.get("/", function (req, res) {
    res.send("<h1>first app on heroku!</h1>")
})

app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})