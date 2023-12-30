var fs = require('fs');
var lzma = require('lzma-native');
var GetMapPoints = require('./MapParser.js')
// const simplestatistics = require('simple-statistics');
const URparser = require('./exports.js')

const readuleb = () => {
    let result = 0;
    let shift = 0;
    while (true) {
        const byte = readByte(1, fileconst)
        result |= (byte & 0x7f) << shift;
        if ((0x80 & byte) === 0) {
            break;
        }
        shift += 7;
    }
    return result;
};
// const readuleb = (input, length) => {
//     let result = 0;
//     let shift = 0;
//     const byte = length
//     while (true) {
//         result |= (byte & 0x7f) << shift;
//         shift += 7;
//         if ((0x80 & byte) === 0) {
//             if (shift < 32 && (byte & 0x40) !== 0) {
//                 return result | (~0 << shift);
//             }
//             return result;
//         }
//     }
// };
//var file = "./Tanamoto - Morimori Atsushi - Time Machine [1] (2022-04-16) Osu-1.osr"

//Has three parts; a single byte which will be either 0x00, indicating that the next two parts are not present,
//or 0x0b (decimal 11), indicating that the next two parts are present.
//If it is 0x0b, there will then be a ULEB128, representing the byte length of the following string
//and then the string itself, encoded in UTF-8. See UTF-8


function readString(fileconst) {
    firstbyte = readByte(1, fileconst)
    if (firstbyte == 0x00) return
    else if (firstbyte == 0x0b) {
        strlen = readuleb()
        retString = []
        for (var i = 0; i < strlen; i++) {
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

// var file = "arsenii0 - pudge - idi nahuj [IDI NAHYI] (2023-08-14) Osu.osr"
// var file = "menR2.osr"
// var file = "mendesrepl.osr"
// var file = "replay-mania_3469849_531873801.osr"
// var file = "arsenii0 - utsuP - MiKUSABBATH [Collab] (2023-08-21) Osu.osr"
// var file = "arsenii0 - utsuP - MiKUSABBATH [Collab] (2023-08-21) Osu-1.osr"
// var file = "arsenii0 - utsuP - MiKUSABBATH [Collab] (2023-08-21) Osu-2.osr"
// var file = "sq.osr"
// var file = "replay-osu_726336_3331176568.osr"
var file = "dt.osr"
// var file = "asd.osr"
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
console.log("Total hits: ", R300 + R100 + R50)
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
    //delta,abs,x,y,keys?
    for (i = 0; i < frames.length; i++) {
        value = frames[i].split('|');
        if (parseInt(value[0]) == 0 || parseInt(value[0]) == -12345) continue;
        absTime += parseInt(value[0]); 
        actionframes.push(new URparser.Frame(parseInt(value[1]), parseInt(value[2]),parseInt(absTime),parseInt(value[0]), parseInt(value[3])))
    }

    var Map = new URparser.MapParser('./dtm.osu');
    var MapData = Map.tryParse();
    var prevFrame = 0;

    var negHitError = [];
    var posHitError = [];
    var allHitError = [];

    var cssize = 54.4 - 4.48 * Map.cs;
    var hit50window = 200 - 10 * Map.od;

    for (var objIndex = 0, frameIndex = 0; objIndex < MapData.length && frameIndex < actionframes.length;) {
        var currObj = MapData[objIndex]
        var currFrame = actionframes[frameIndex]
        if (currFrame.Tick > currObj.Tick + hit50window) {
            prevFrame = currFrame;
            objIndex++;
            continue;
        }
        // console.log(isOnCircle(currObj, currFrame, cssize));
        if (URparser.isNewKeyPressed(currFrame, prevFrame) &&
            URparser.isOnCircle(currObj, currFrame, cssize) &&
            URparser.isInHitWindow(currObj, currFrame, hit50window)
        ) {
            hiterror = 0
            var hiterror = currFrame.Tick - currObj.Tick;
            if (hiterror < 0) negHitError.push(hiterror);
            else posHitError.push(hiterror);
            allHitError.push(hiterror);
            // if(objIndex<200)
            // console.log(hiterror);
            objIndex++;
        }
        prevFrame = currFrame;
        frameIndex++;
        // console.log('frameIndex,objIndex :>> ', frameIndex,objIndex);
    }

    let negSum = 0, posSum = 0, allSum = 0;

    for (const err of negHitError) {
        negSum += err;
    }
    
    for (const err of posHitError) {
        posSum += err;
    }
    
    for (const err of allHitError) {
        allSum += err;
    }
    
    const negHitErrorAvg = negSum / negHitError.length;
    const posHitErrorAvg = posSum / posHitError.length;
    const allHitErrorAvg = allSum / allHitError.length;
    
    let variance = 0;
    
    for (const err of allHitError) {
        variance += Math.pow(err - allHitErrorAvg, 2);
    }
    
    variance /= allHitError.length;
    
    const unstableRate = Math.sqrt(variance) * 10;

    console.log("negHitErrorAvg:", negHitErrorAvg);
    console.log("posHitErrorAvg:", posHitErrorAvg);
    console.log("unstableRate:", unstableRate);
})

