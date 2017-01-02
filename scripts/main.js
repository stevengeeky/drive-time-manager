// Core

(function(){
//
var manager, times, cc, add_time, results;
var parseTime, getTimes, compile;
var week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var writing = false;

window.addEventListener("load", function(){
    manager = document.getElementById("manager");
    times = document.getElementById("times");
    cc = document.getElementById("cc");
    add_time = document.getElementById("add_time");
    results = document.getElementById("results");
    
    add_time.onclick = function(){
        addTime();
    };
    
    read();
});

function createOp(html) {
    var op = document.createElement("option");
    op.innerHTML = html;
    return op;
}

function addTime(ov) {
    var el = document.createElement("p");
    
    var start = document.createElement("input");
    var end = document.createElement("input");
    var date = document.createElement("input");
    var remove = document.createElement("button");
    var daynight = document.createElement("select");
    
    start.placeholder = "Start Time";
    end.placeholder = "End Time";
    date.placeholder = "Date";
    
    remove.id = "remove_time";
    remove.innerHTML = "Remove Time";
    
    var d = new Date();
    start.value = "12:00 PM";
    end.value = "1:00 PM";
    date.value = (+d.getMonth() + 1) + "/" + d.getDate() + "/" + (1900 + +d.getYear());
    
    remove.onclick = function(){
        times.removeChild(el);
        setResults();
    }
    
    function temp() {
        setResults();
    }
    function tempTime() {
        temp();
        setTooltipTime(this);
    }
    
    start.onkeyup = tempTime;
    end.onkeyup = tempTime;
    date.onkeyup = function(){
        temp();
        setTooltipDate(this);
    };
    
    daynight.appendChild(createOp("Day"));
    daynight.appendChild(createOp("Night"));
    daynight.onchange = temp;
    
    el.appendChild(start);
    el.appendChild(end);
    el.appendChild(date);
    el.appendChild(daynight);
    el.appendChild(remove);
    
    times.appendChild(el);
    
    setTooltipDate(date);
    setTooltipTime(start);
    setTooltipTime(end);
    
    if (!ov)
        start.focus();
    start.selectionStart = 0;
    start.selectionEnd = start.value.length;
    
    setResults(ov);
    return el;
}

function setTooltipDate(date) {
    var p = date.value.split("/");
    if (p.length == 3) {
        var d = new Date(+p[2], +p[0] - 1, +p[1], 0, 0, 0, 0);
        var dow = week[d.getDay()];
        var mon = month[d.getMonth()];
        date.title = dow + ", " + mon + " " + (d.getDate()) + ", " + (d.getYear() + 1900);
    }
    else
        date.title = "";
}

function setTooltipTime(time) {
    var t = parseTime(time.value);
    time.title = _string(t, "minute") + " (" + _string(round(t * 60), "second") + ") into the day";
}

function _string(t, s) {
    return t + " " + (t == 1 ? s : s + "s")
}

function h_string(h) {
    return _string(h, "hour");
}

function setResults(ov) {
    var added = getResults();
    var h_day = round(added.day / 60);
    var h_night = round(added.night / 60);
    
    results.innerHTML = "Day: <b class='dayhours'>" + h_string(h_day) + "</b><br />Night: <b class='nighthours'>" + h_string(h_night) + "</b><br />Total: <b class='hours'>" + h_string(h_day + h_night) + "</b><br />";
    
    if (!ov)
        write();
}

function round(n) {
    var acc = Math.pow(10, 3);
    return Math.floor(n * acc) / acc;
}

function getResults() {
    var times = getTimes();
    var added = {
        day:0,
        night:0
    };
    
    for (var i in times) {
        var time = times[i];
        var len = Math.abs(time.end - time.start);
        
        if (time.daynight == "day")
            added.day += len;
        else
            added.night += len;
    }
    
    return added;
}

function write() {
    var c = compile();
    var xhr = new XMLHttpRequest();
    
    writing = true;
    xhr.open("GET", "write.php?data=" + encodeURIComponent(c));
    xhr.send();
    
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4) {
            writing = false;
        }
    }
}

function read() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "read.php");
    xhr.send();
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            loadTimes(xhr.responseText);
        }
    }
}

function loadTimes(json) {
    if (json.replace(/ |\n|\t/g, "") == "")
        return;
    var obj = JSON.parse(json);
    times.innerHTML = "";
    
    for (var i in obj) {
        var time = obj[i];
        var el = addTime(true);
        
        el.children[0].value = time["start"];
        el.children[1].value = time["end"];
        el.children[2].value = time["date"];
        el.children[3].value = time["daynight"];
        setTooltipDate(el.children[2]);
        
        setTooltipTime(el.children[0]);
        setTooltipTime(el.children[1]);
        
        setResults();
    }
}

getTimes = function() {
    var res = [];
    for (var i = 0; i < times.children.length; i++) {
        var p = times.children[i];
        
        if (typeof p != "undefined" && p.children && p.children.length > 0) {
            res.push({
                start: parseTime(p.children[0].value),
                end: parseTime(p.children[1].value),
                date: parseTime(p.children[2].value),
                daynight: p.children[3].value.toLowerCase()
            });
        }
        
    }
    return res;
}

parseTime = function(t) { // Returns value, in minutes, of time
    var res = 0;
    t = t.replace(/ |\t|\n/g, "");
    
    var dosub = t.substring(t.length - 2).toLowerCase() == "am";
    var doadd = t.substring(t.length - 2).toLowerCase() == "pm";
    
    t = t.toLowerCase().replace(/pm|am/g, "");
    
    var sp = t.split(":");
    if (sp.length != 2)
        return 0;
    
    var hour = +sp[0];
    var min = (+sp[1] % 60);
    
    if (doadd && hour != 12)
        hour += 12;
    else if (hour == 12 && dosub)
        hour -= 12;
    
    res += 60 * hour + min;
    return res;
}

compile = function(){
    var res = "{";
    
    for (var i = 0; i < times.children.length; i++) {
        var p = times.children[i];
        
        if (typeof p != "undefined" && p.children && p.children.length > 0) {
            res += (i > 0 ? "," : "") + "\"" + i + "\":{\"start\":\"" + p.children[0].value + "\",\"end\":\"" + p.children[1].value + "\",\"date\":\"" + p.children[2].value + "\",\"daynight\":\"" + p.children[3].value + "\"}";
        }
        
    }
    
    res += "}";
    return res;
}

//
}).call(window);