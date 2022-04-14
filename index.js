var fs = require('fs');
var lzma = require('lzma-native')
const readuleb = (input, length) => {
    let result = 0;
    let shift = 0;
    while (true) {
        // const byte = input.shift();
        const byte = length
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

var file = "./arsenii0 - Station Earth - Cold Green Eyes ft. Roos Denayer [apple's Insane] (2018-10-23) Osu.osr"

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
        console.log('RB:', ret)
        return ret
    }

    else {
        ret = []
        for (var i = 0; i < len; i++) {
            ret.push(fileconst[pos + i])
        }
        movepointer == true ? pos = pos + len : ""
    }
    console.log('RB:', ret)
    if (!Rstring){
        switch (len) {
            case 2:
                return Buffer.from(ret).readUInt16LE();
                break;
            case 4:
                return Buffer.from(ret).readUInt32LE();
                break;
            default:
                return
                break;
        }
    }
    else {
        return Buffer.from(ret).toString('utf-8')
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
CompressedSize = readByte(4, fileconst)

console.log(mode)
console.log(version)
console.log(md5map)
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
compressed_data = []
for (var i = 0; i < CompressedSize; i++) {
    compressed_data.push(readByte(1, fileconst,true,true))
}
lzma.LZMA().decompress(compressed_data, (result) => {
        let str = 0
        for( let i = 0; i <100; i++)
        str += (String.fromCharCode(result[i]));
        console.log(str.split(','))
})
