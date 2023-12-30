const fs = require('fs');

class Vec2 {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}


const HitObjectType = {
    HitCircle: 1 << 0,
    Slider: 1 << 1,
    NewCombo: 1 << 2,
    Spinner: 1 << 3,
    ComboColorSkip: 1 << 4,
    ManiaHoldNote: 1 << 7
};


class MapParser {
    constructor(mapPath) {
        this.mapPath = mapPath
        this.cs = null
        this.od = null
        this.ar = null
        this.sm = null
        this.StackLeniency = null
        this.TimingPoints = []
        this.HitObjects = []
        this.preempt = null
    }

    mapDifficultyRange(value, low, mid, high) {
        if (value > 5) {
            return mid + (high - mid) * (value - 5) / 5;
        }
        if (value < 5) {
            return mid - (mid - low) * (5 - value) / 5;
        }
        return mid;
    }

    updateStacking() {
        StackLenience = 3
        stack_threshold = this.preempt * this.StackLeniency
        stack_offset = 54.4 - 4.38 * this.cs;
        for (var i = this.HitObjects.length; i >= 0; --i) {
            var stack_base_index = i;
            for (var n = stack_base_index + 1; n < this.HitObjects.length; ++n) {
                baseObj = this.HitObjects[stack_base_index]
                if (!currObj.HitCircle && !currObj.Slider) break;
                Obj = this.HitObjects[n]
                if (!Obj.HitCircle && !Obj.Slider) continue;
                if (Obj.Start - baseObj.Start > stack_threshold) break;
                if (Math.pow(baseObj.X - Obj.X, 2) + Math.pow(baseObj.Y - Obj.Y, 2) <= StackLenience // NEED TO IMPLEMENT SLIDER PARSING
                ) {
                    stack_base_index = n;
                    Obj.StackIndex = 0;
                }
            }
        }
    }

    tryParse(mapPathF = null) {
        if (mapPathF != null) this.mapPath = mapPathF
        var mapfile = fs.readFileSync(this.mapPath, "utf-8")
        var str = 0
        const lines = mapfile.split(/\r?\n/);
        for (; str < lines.length; str++) {
            if (lines[str].includes("StackLeniency")) this.StackLeniency = parseInt(lines[str].split(":")[1])
            if (lines[str].includes("CircleSize")) this.cs = parseInt(lines[str].split(":")[1])
            if (lines[str].includes("ApproachRate")) this.ar = parseInt(lines[str].split(":")[1])
            if (lines[str].includes("OverallDifficulty")) this.od = parseInt(lines[str].split(":")[1])
            if (lines[str].includes("SliderMultiplier")) this.SM = parseInt(lines[str].split(":")[1])
            if (lines[str] == "[TimingPoints]") {
                str++
                break;
            }
        }
        var buf = ""
        var firstUninhPoint = false;
        var lastSV = null;
        for (; str < lines.length; str++) {
            buf = lines[str].split(",")
            //where SV is the slider velocity multiplier given by the effective inherited timing point, or 1 if there is none
            //0time,1beatLength,2meter,3sampleSet,4sampleIndex,5volume,6uninherited,effects
            var point = [];
            if (parseFloat(buf[1]) > 0) {
                var sv = firstUninhPoint ? 100 / parseFloat(buf[1]) : 1
                this.TimingPoints.push(new TimingPoint(
                    parseInt(buf[0]), parseFloat(buf[1]), parseInt(buf[2]), parseInt(buf[6]),)
                )
                lastSV = sv;
            }
            else {
                var mult = -100 / parseFloat(buf[1])
                var sv = mult * lastSV
                firstUninhPoint = true;
                this.TimingPoints.push(new TimingPoint(
                    parseInt(buf[0]), parseFloat(buf[1]), parseInt(buf[2]), parseInt(buf[6]), sv)
                )
            }
            if (lines[str] == "[HitObjects]") {
                str++
                break;
            }
        }
        var HitObjects = []
        var buf = ""

        for (; str < lines.length; str++) {
            buf = lines[str].split(",")
            if (parseInt(buf[3]) & HitObjectType.HitCircle) {
                HitObjects.push(new HitObject(
                    parseInt(buf[0]), parseInt(buf[1]),
                    parseInt(buf[2]), parseInt(buf[2]), parseInt(buf[3])))
            }
            //0,1,2,,,,3,,,,4,,,,,,,,5,,,,,,,,,,,,,,,,,,,,,6,,,,,,7
            //x,y,time,type,hitSound,curveType|curvePoints,slides,length,edgeSounds,edgeSets,hitSample
            //length / (SliderMultiplier * 100 * SV) * beatLength
            //where SV is the slider velocity multiplier given by the effective inherited timing point, or 1 if there is none
            //For uninherited timing points, the duration of a beat, in milliseconds.
            //For inherited timing points, a negative inverse slider velocity multiplier, as a percentage. For example, 
            //-50 would make all sliders in this timing section twice as fast as SliderMultiplier
            else if (parseInt(buf[3]) & HitObjectType.Slider) {
                var splitbuf = buf[5].split("|");
                var curvePoint = new CurvePoint()
                curvePoint.Type = splitbuf.shift(0)
                splitbuf.forEach(p => {
                    curvePoint.Points.push(new Vec2(parseInt(p.split(":")[0]),
                        parseInt(p.split(":")[1])))
                })
                var timeSum = 0;
                var timingCounter = parseInt(buf[2]);
                var lastTimingPoint = this.TimingPoints.filter((tp)=>tp.Time < timingCounter).pop()
                timeSum = Math.abs(parseInt(buf[7]) / (this.SM * 100 * lastTimingPoint.SV) * lastTimingPoint.BeatLength)

                // for (var i = 0; i < curvePoint.Points.length; i++) {
                //     var lastTimingPoint = this.TimingPoints.filter((tp)=>tp.Time < timingCounter).pop()
                //     timeSum = parseInt(Math.abs(parseInt(buf[7]) / (this.SM * 100 * lastTimingPoint.SV) * lastTimingPoint.BeatLength).toFixed(0))
                //         console.log(this.TimingPoints.filter((tp)=>tp.Time < parseInt(buf[2])).pop().Time,
                //         this.TimingPoints.filter((tp)=>tp.Time < parseInt(buf[2])).pop().SV,
                //         i,
                //         parseInt(buf[2]),
                //         timeSum)
                // }
            //length / (SliderMultiplier * 100 * SV) * beatLength
                // осталось доделать фильтр что бы находило тайминг поинт до начала слайдера 
                // брало его св и подставляло в формулу выше(116)
                // 
                // console.log('SV :>> ', SV);
                var endTime = buf[7] / (this.SM * 100)
                HitObjects.push(new HitObject(
                    parseInt(buf[0]),
                    parseInt(buf[1]),
                    parseInt(buf[2]),
                    parseInt(buf[2]) + timeSum, //подставить подсчитанный мс конца
                    parseInt(buf[3]),
                    curvePoint,
                    timeSum
                ))
            }
            console.log(lastTimingPoint);
            // console.log(HitObjects[HitObjects.length-1],lastTimingPoint);
        }
        this.preempt = this.mapDifficultyRange(this.ar, 1800, 1200, 450)
        this.HitObjects = HitObjects;
        updateStacking();
        return HitObjects;
    }
}


function hasAnyNewInput(currInputs, prevInputs) {
    return (currInputs & ~prevInputs) !== 0;
}

function isNewKeyPressed(currFrame, prevFrame) {
    return hasAnyNewInput(currFrame.Keys, prevFrame.Keys) && currFrame.Keys !== 0;
}

function isOnCircle(hitObj, frame, r) {
    return Math.pow(hitObj.X - frame.X, 2) +
        Math.pow(hitObj.Y - frame.Y, 2) <= Math.pow(r, 2);
}

function isInHitWindow(hitObj, frame, border) {
    return (hitObj.Start - border) <= frame.Start &&
        frame.Start <= (hitObj.Start + border);
}

class CurvePoint {
    constructor(Type, Points = []) {
        this.Type = Type
        this.Points = Points
    }
}

class TimingPoint {
    constructor(Time, BeatLength, Meter, Inherit, SV = 1) {
        this.Time = Time
        this.BeatLength = BeatLength
        this.Meter = Meter
        this.Inherit = Inherit
        this.SV = SV
    }
}

class HitObject {
    constructor(X, Y, Start, End, Type, CurvePoints = null, Length = 0) {
        this.X = X
        this.Y = Y
        this.Type = Type
        this.Start = Start
        this.End = End
        this.Length = Length
        this.CurvePoints = []
        this.StackIndex = 0
    }

    parseHitObjectType() {
        return {
            hitCircle: (this.Type & HitObjectType.HitCircle) !== 0,
            slider: (this.Type & HitObjectType.Slider) !== 0,
            newCombo: (this.Type & HitObjectType.NewCombo) !== 0,
            spinner: (this.Type & HitObjectType.Spinner) !== 0,
            comboColorSkip: (this.Type & HitObjectType.ComboColorSkip) !== 0,
            maniaHoldNote: (this.Type & HitObjectType.ManiaHoldNote) !== 0
        };
    }
}

class Frame {
    constructor(X, Y, Start, Delta, Keys) {
        this.X = X
        this.Y = Y
        this.Start = Start
        this.Delta = Delta
        this.Keys = Keys
    }
}

exports.HitObject = HitObject
exports.Frame = Frame
exports.isNewKeyPressed = isNewKeyPressed
exports.isOnCircle = isOnCircle
exports.isInHitWindow = isInHitWindow
exports.MapParser = MapParser