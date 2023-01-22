var fs = require('fs');
var lzma = require('lzma-native');
var GetMapPoints = require('./MapParser.js')

const readuleb = (input, length) => {
    let result = 0;
    let shift = 0;
    const byte = length
    while (true) {
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
var file = "[DJG] Kazinak_XXL - Dream Theater - Moment of Betrayal [Awakened Noise Machine] (2021-10-23) Osu.osr"
//var file = "./Tanamoto - Morimori Atsushi - Time Machine [1] (2022-04-16) Osu-1.osr"

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
    if (!Rstring) {
        if (len <= 2) {
            if (len == 0) return;
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
    compressed_data.push(readByte(1, fileconst, true, true))
}
OnlineScoreID = readByte(8, fileconst)

console.log("mode: ", mode)
console.log("version: ", version)
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

lzma.LZMA().decompress(compressed_data, async (result) => {
    let str = '';
    for (let i = 0; i < result.length; i++) str += (String.fromCharCode(result[i]));

    frames = str.split(',');
    absTime = 0;
    actionframes = []
    for (i = 1; i < frames.length; i++) {
        value = frames[i].split('|');
        prevval = value;
        absTime += parseInt(value[0]);
        actionframes[i] = [parseInt(value[0]), parseInt(absTime), parseInt(value[1]), parseInt(value[2]), parseInt(value[3])]
    }
    goodframes = []

    MapPoints = GetMapPoints(fs.readFileSync('Dream Theater - Moment of Betrayal (Zetera) [Awakened Noise Machine].osu', "utf-8"));


    od = 7.5;
    MaxHitError = 200 - 20 * od;

    Point = 0;
    avghiterror = 0;
    hiterrors = [];

    for (let i = 1; i < actionframes.length; i++) {
        frame = actionframes[i];
        if (Point == MapPoints.length) break;
        // if (i > 1) if (frame[4] == actionframes[i-1][4]) continue; 
        if (frame[1] > MapPoints[Point][2] - MaxHitError && frame[1] < MapPoints[Point][2] + MaxHitError && frame[4] != 0) {
            goodframes.push(frame);
            avghiterror += (frame[1] - MapPoints[Point][2])
            hiterrors.push(frame[1] - MapPoints[Point][2]);
            Point++;
        }
    }

    // console.log(goodframes)

    sum = 0;    // ВОТ ОН САМ УР (СЧИТАЮ КАК МУДАК)
    avghiterror /= hiterrors.length;

    hiterrors.forEach(hiterror => {
        sum += (hiterror - avghiterror) * (hiterror - avghiterror);
    });
    
    UR = Math.sqrt(sum * (1 / (hiterrors.length - 1))) * 10;

    countp = 0; // сюда можно не смотреть, это чисто я считаю хитеррор
    countm = 0;
    divp = 0;
    divm = 0;

    for (i = 0; i < hiterrors.length; i++) {
        if (hiterrors[i] < 0) {
            divm += hiterrors[i]; countm++;
        }
        if (hiterrors[i] > 0) {
            divp += hiterrors[i]; countp++;
        }
    }

    divp /= countp;
    divm /= countm;

    console.log(`Error: ${divm} - ${divp}`)

})

console.log("OnlineScoreID: ", OnlineScoreID)
