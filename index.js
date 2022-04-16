var fs = require('fs');
var lzma = require('lzma-native');
const { toNamespacedPath } = require('path');
var GetMapPoints = require('./MapParser.js')

function count(actions = []){
    var total = 0
    var variance = 0
    for(var i = 0;i<actions.length;i++){
        total += actions[i]
    }
    var avg = total / actions.length
    for(var i = 0;i<actions.length;i++){
        variance += (actions[i] / avg) ** 2
    }
    variance = variance / actions.length
    variance = Math.sqrt(variance)
    console.log("Variance: ",variance * 10)
    return variance
}

const readuleb = (input, length) => {
    let result = 0;
    let shift = 0;
    const byte = length
    while (true) {
        // const byte = input.shift();
        result |= (byte & 0x7f) << shift;
        shift += 7;
        if ((0x80 & byte) === 0) {
            if (shift < 32 && (byte & 0x40) !== 0) {
                return result | (~0 << shift);
            }
            return result;
        }
    }
};
// var file = "./arsenii0 - Toto - Africa (MADD Frenchcore Bootleg) [Hurry boy, it's waiting there for you] (2022-02-22) Osu.osr"
var file = "./123.osr"

//Has three parts; a single byte which will be either 0x00, indicating that the next two parts are not present,
//or 0x0b (decimal 11), indicating that the next two parts are present.
//If it is 0x0b, there will then be a ULEB128, representing the byte length of the following string
//and then the string itself, encoded in UTF-8. See UTF-8


function readString(fileconst) {
    firstbyte = readByte(1, fileconst)
    if (firstbyte == 0x00) return
    else if (firstbyte == 0x0b) {
        uleblen = readByte(1, fileconst)
        ulebcontext = readByte(uleblen, fileconst, false)
        len = readuleb(ulebcontext, uleblen)
        retString = []
        for (var i = 0; i < len; i++) {
            retString.push(readByte(1, fileconst))
        }
        return Buffer.from(retString, 'utf-8').toString();

    }
}

pos = 0

function readByte(len, fileconst, movepointer = true, Rstring = false) {
    if (len == 1) {
        ret = fileconst[pos]
        movepointer == true ? pos = pos + len : ""
        // console.log('RB:', ret)
        return ret
    }

    else {
        ret = []
        for (var i = 0; i < len; i++) {
            ret.push(fileconst[pos + i])
        }
        movepointer == true ? pos = pos + len : ""
    }
    // console.log('RB:', ret)
    if (!Rstring){
        if(len <= 2){
            if(len == 0) return;
            return Buffer.from(ret).readUInt16LE();
        } else return Buffer.from(ret).readUInt32LE();
    }
}

fileconst = fs.readFileSync(file)
mode = readByte(1, fileconst)
version = readByte(4, fileconst)
md5map = readString(fileconst)
plrname = readString(fileconst)
md5replay = readString(fileconst)
R300 = readByte(2, fileconst)
R100 = readByte(2, fileconst) //100s in standard, 150s in Taiko, 100s in CTB, 100s in mania
R50 = readByte(2, fileconst) //small fruit in CTB, 50s in mania
RGeki = readByte(2, fileconst) //Max 300s in mania
RKatu = readByte(2, fileconst) //200s in mania
Miss = readByte(2, fileconst)
TotalScore = readByte(4, fileconst)
TotalCombo = readByte(2, fileconst)
PFFC = readByte(1, fileconst)
Mods = readByte(4, fileconst)
Lifebar = readString(fileconst)
TimeStamp = readByte(8, fileconst)
// console.log(pos)
CompressedSize = readByte(4, fileconst)
compressed_data = []
for (var i = 0; i < CompressedSize; i++) {
    // console.log(pos)
    compressed_data.push(readByte(1, fileconst,true,true))
}
OnlineScoreID = readByte(8, fileconst)

console.log("mode: ",mode)
console.log("version: ",version)
console.log("md5map: ", md5map)
console.log("Tanamoto: ", plrname)
console.log("кто сюда смотрит: ", md5replay)
console.log("R300: ", R300)
console.log("R100: ", R100)
console.log("R50: ", R50)
console.log("RGeNAn: ", RGeki)
console.log("RKan: ", RKatu)
console.log("Misis: ", Miss)
console.log("TotalScore: ", TotalScore)
console.log("TotalCombo: ", TotalCombo)
console.log("PF/FC: ", PFFC)
console.log("Mods: ", Mods)
console.log("Lifebar: ", Lifebar)
console.log("TimeStamp: ", TimeStamp)
console.log("CompressedSize: ", CompressedSize)

lzma.LZMA().decompress(compressed_data, (result) => {
        let str = '';
        for( let i = 0; i < result.length; i++)
        str += (String.fromCharCode(result[i]));
        fs.writeFileSync('govno.txt',str)
        // console.log(str.split(','));
        frames = str.split(',');
        absTime = 0;
        actionframes = []
        for(i = 0; i < frames.length; i++){
            value = frames[i].split('|');
            // absTime += Math.abs(parseInt(value[0]));
            if (value[0] < 0) continue;
            if (value[1] == 256 && value[2] == -500 && i < 2) continue;
            absTime += parseInt(value[0]);
            console.log(absTime)
            actionframes[i] = [parseInt(value[0]), absTime ,parseInt(value[1]),parseInt(value[2]),parseInt(value[3])]
        }
        // console.log(actionframes)

        for (i = 0; i < actionframes.length; i++){
            if(actionframes[i] == undefined) continue;
            if ((actionframes[i][4] == 5 || actionframes[i][4] == 10 || actionframes[i][4] == 1 || actionframes[i][4] == 8 || actionframes[i][4] == 15) && (actionframes[i-1][4]!=actionframes[i][4])) console.log(actionframes[i]);
        }
        str = "";
        goodframes = []
        b = 0;
        MapPoints = GetMapPoints(fs.readFileSync('./123.osu',"utf-8"));

        for(i = 0; i < frames.length; i++){
            if(actionframes[i] == undefined) continue;
            str += actionframes[i].toString() + "\n";
            if ((actionframes[i][4] == 5 || actionframes[i][4] == 10 || actionframes[i][4] == 1 || actionframes[i][4] == 8 || actionframes[i][4] == 15) && Math.abs(MapPoints[b] - actionframes[i][1])<109.5){
                console.log(actionframes[i][1],MapPoints[b],Math.abs(MapPoints[b] - actionframes[i][1]));
                goodframes.push(actionframes[i][1] - MapPoints[b])
                b++;
            }

            if(i == frames.length - 1) console.log(actionframes[i]);
        }
        count(goodframes)
})

console.log("OnlineScoreID: ", OnlineScoreID)



console.log(GetMapPoints(fs.readFileSync('123.osu',"utf-8")))