var fs = require('fs');

module.exports = function GetMapPoints(mapfile){
    // var mapfile = fs.readFileSync("./positive MAD-crew - Mynarco Addiction (Astronic) [Fated Despair].osu","utf-8")
    var str = 0
    const lines = mapfile.split(/\r?\n/);

    for(str;str < lines.length;str++){
        if(lines[str] == "[HitObjects]"){
            break;
        }
    }
    var mappoints = []
    for(str;str < lines.length;str++){
        buf = lines[str].split(",")
            if (
            buf[3] == 1 || //one note
            buf[3] == 2 || //one slider
            buf[3] == 5 || //new combo note
            buf[3] == 6  //new combo slider
            ) {
            mappoints.push(buf[2])
        }
    }
    return mappoints;
}
