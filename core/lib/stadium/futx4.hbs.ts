export var stadiumText: string = `{

	"name" : "𝙵 𝚄 𝚃 𝚂 𝙰 𝙻 ⨯⁴ 🏆 𝗚𝗟𝗛",

	"width" : 765,

	"height" : 380,

	"spawnDistance" : 350,

	"redSpawnPoints" : [
		[ -305, 0
		],
		[ -305, 0
		],
		[ -305, 0
		],
		[ -305, 0
		],
		[ -305, 0
		],
		[ -305, 0
		],
		[ -305, 0
		],
		[ -305, 0
		],
		[ -305, 0
		],
		[ -305, 0
		],
		[ -305, 0
		],
		[ -229, 350
		]

	],

	"blueSpawnPoints" : [
		[ 305, 0
		],
		[ 305, 0
		],
		[ 305, 0
		],
		[ 305, 0
		],
		[ 305, 0
		],
		[ 305, 0
		],
		[ 305, 0
		],
		[ 305, 0
		],
		[ 305, 0
		],
		[ 305, 0
		],
		[ 305, 0
		],
		[ 229, 350
		]

	],

	"bg" : { "type" : "", "height" : 0, "width" : 0, "color" : "2a3a40" },

	"vertexes" : [
		/* 0 */ { "x" : 700.1148409130134, "y" : 319.8124743008296, "trait" : "ballArea" },
		/* 1 */ { "x" : 700.1148409130134, "y" : -319.8124743008296, "trait" : "ballArea" },
		
		/* 2 */ { "x" : 0, "y" : 380, "trait" : "kickOffBarrier" },
		/* 3 */ { "x" : 0, "y" : 106.60415810027654, "bCoef" : 0.15, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 180 },
		/* 4 */ { "x" : 0, "y" : -106.60415810027654, "bCoef" : 0.15, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 180 },
		/* 5 */ { "x" : 0, "y" : -380, "trait" : "kickOffBarrier" },
		
		/* 6 */ { "x" : -700.1148409130134, "y" : -90, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,-80 ] },
		/* 7 */ { "x" : -740, "y" : -90, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,-80 ] },
		/* 8 */ { "x" : -740, "y" : 90, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,80 ] },
		/* 9 */ { "x" : -700.1148409130134, "y" : 90, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [-700,80 ] },
		/* 10 */ { "x" : 700.1148409130134, "y" : -90, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [700,-80 ] },
		/* 11 */ { "x" : 740, "y" : -90, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [700,-80 ] },
		/* 12 */ { "x" : 740, "y" : 90, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [700,80 ] },
		/* 13 */ { "x" : 700.1148409130134, "y" : 90, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "F8F8F8", "pos" : [700,80 ] },
		
		/* 14 */ { "x" : -700.1148409130134, "y" : 90, "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "pos" : [-700,80 ] },
		/* 15 */ { "x" : -700.1148409130134, "y" : 319.8124743008296, "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 16 */ { "x" : -700.1148409130134, "y" : -90, "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "pos" : [-700,-80 ] },
		/* 17 */ { "x" : -700.1148409130134, "y" : -319.8124743008296, "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 18 */ { "x" : -700.1148409130134, "y" : 319.8124743008296, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 19 */ { "x" : 700.1148409130134, "y" : 319.8124743008296, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 20 */ { "x" : 700.1148409130134, "y" : 90, "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "pos" : [700,80 ], "color" : "b3b6b6" },
		/* 21 */ { "x" : 700.1148409130134, "y" : 319.8124743008296, "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 22 */ { "x" : 700.1148409130134, "y" : -319.8124743008296, "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6" },
		/* 23 */ { "x" : 700.1148409130134, "y" : -90, "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "b3b6b6", "pos" : [700,-80 ] },
		/* 24 */ { "x" : 700.1148409130134, "y" : -319.8124743008296, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 25 */ { "x" : 700.1148409130134, "y" : -319.8124743008296, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea" },
		/* 26 */ { "x" : -700.1148409130134, "y" : -319.8124743008296, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "color" : "b3b6b6" },
		/* 27 */ { "x" : 700.1148409130134, "y" : -319.8124743008296, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "color" : "b3b6b6" },
		
		/* 28 */ { "x" : 0, "y" : -319.8124743008296, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		/* 29 */ { "x" : 0, "y" : -106.60415810027654, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		/* 30 */ { "x" : 0, "y" : 106.60415810027654, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		/* 31 */ { "x" : 0, "y" : 319.8124743008296, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "b3b6b6" },
		/* 32 */ { "x" : 0, "y" : -106.60415810027654, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "b3b6b6" },
		/* 33 */ { "x" : 0, "y" : 106.60415810027654, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "b3b6b6" },
		/* 34 */ { "x" : 0, "y" : 106.60415810027654, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : -180 },
		/* 35 */ { "x" : 0, "y" : -106.60415810027654, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : -180 },
		/* 36 */ { "x" : 0, "y" : 106.60415810027654, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 0 },
		/* 37 */ { "x" : 0, "y" : -106.60415810027654, "trait" : "kickOffBarrier", "color" : "b3b6b6", "vis" : true, "curve" : 0 },
		
		/* 38 */ { "x" : -709.661861470918, "y" : 90, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false, "pos" : [-700,80 ] },
		/* 39 */ { "x" : -709.661861470918, "y" : 319.8124743008296, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
		/* 40 */ { "x" : -709.661861470918, "y" : -319.8124743008296, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
		/* 41 */ { "x" : -709.661861470918, "y" : -90, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0, "pos" : [-700,-80 ] },
		/* 42 */ { "x" : 709.661861470918, "y" : -319.8124743008296, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
		/* 43 */ { "x" : 709.661861470918, "y" : -90, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0, "pos" : [700,-80 ] },
		/* 44 */ { "x" : 709.661861470918, "y" : 90, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false, "pos" : [700,80 ] },
		/* 45 */ { "x" : 709.661861470918, "y" : 319.8124743008296, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
		
		/* 46 */ { "x" : 0, "y" : -106.60415810027654, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 47 */ { "x" : 0, "y" : 106.60415810027654, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 48 */ { "x" : -700.1148409130134, "y" : -90, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 49 */ { "x" : -700.1148409130134, "y" : 90, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 50 */ { "x" : 700.1148409130134, "y" : -90, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 51 */ { "x" : 700.1148409130134, "y" : 90, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 52 */ { "x" : -700.1148409130134, "y" : 266.5103952506913, "bCoef" : 0.1, "trait" : "line", "color" : "ff6363", "curve" : -90 },
		/* 53 */ { "x" : -496.4450690110458, "y" : 93.27863833774197, "bCoef" : 0.1, "trait" : "line", "color" : "ff6363", "curve" : 0 },
		/* 54 */ { "x" : -700.1148409130134, "y" : 301.1567466332812, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 55 */ { "x" : -682.2937358715913, "y" : 319.8124743008296, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 56 */ { "x" : -700.1148409130134, "y" : -266.5103952506913, "bCoef" : 0.1, "trait" : "line", "color" : "ff6363", "curve" : 90 },
		/* 57 */ { "x" : -496.4450690110458, "y" : -93.27863833774197, "bCoef" : 0.1, "trait" : "line", "color" : "ff6363", "curve" : 0 },
		/* 58 */ { "x" : -700.1148409130134, "y" : -301.1567466332812, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 59 */ { "x" : -682.2937358715913, "y" : -319.8124743008296, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 60 */ { "x" : -484.9886443415601, "y" : -319.8124743008296, "bCoef" : 0.1, "trait" : "line", "color" : "00ff00" },
		/* 61 */ { "x" : 700.1148409130134, "y" : -301.1567466332812, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 62 */ { "x" : 682.2937358715913, "y" : -319.8124743008296, "bCoef" : 0.1, "trait" : "line", "curve" : -90, "color" : "b3b6b6" },
		/* 63 */ { "x" : 700.1148409130134, "y" : 301.1567466332812, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 64 */ { "x" : 682.2937358715913, "y" : 319.8124743008296, "bCoef" : 0.1, "trait" : "line", "curve" : 90, "color" : "b3b6b6" },
		/* 65 */ { "x" : 700.1148409130134, "y" : 266.5103952506913, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : 90 },
		/* 66 */ { "x" : 496.4450690110458, "y" : 93.27863833774197, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : 90 },
		/* 67 */ { "x" : 700.1148409130134, "y" : -266.5103952506913, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : -90 },
		/* 68 */ { "x" : 496.4450690110458, "y" : -93.27863833774197, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : -90 },
		/* 69 */ { "x" : 496.4450690110458, "y" : 93.27863833774197, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : 0 },
		/* 70 */ { "x" : 496.4450690110458, "y" : -93.27863833774197, "bCoef" : 0.1, "trait" : "line", "color" : "0099ff", "curve" : 0 },
		/* 71 */ { "x" : -477.3510278952363, "y" : 1.3325519762534568, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 72 */ { "x" : -477.3510278952363, "y" : -1.3325519762534568, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 73 */ { "x" : -477.3510278952363, "y" : 3.99765592876037, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 74 */ { "x" : -477.3510278952363, "y" : -3.99765592876037, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 75 */ { "x" : -477.3510278952363, "y" : -2.6651039525069136, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 76 */ { "x" : -477.3510278952363, "y" : 2.6651039525069136, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 77 */ { "x" : -477.3510278952363, "y" : -4.663931916887098, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 78 */ { "x" : -477.3510278952363, "y" : 4.663931916887098, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 79 */ { "x" : 477.3510278952363, "y" : 1.3325519762534568, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 80 */ { "x" : 477.3510278952363, "y" : -1.3325519762534568, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 81 */ { "x" : 477.3510278952363, "y" : 3.99765592876037, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 82 */ { "x" : 477.3510278952363, "y" : -3.99765592876037, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 83 */ { "x" : 477.3510278952363, "y" : -2.6651039525069136, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 84 */ { "x" : 477.3510278952363, "y" : 2.6651039525069136, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 85 */ { "x" : 477.3510278952363, "y" : -4.663931916887098, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 86 */ { "x" : 477.3510278952363, "y" : 4.663931916887098, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 87 */ { "x" : -353.23976064247483, "y" : 1.3325519762534568, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 88 */ { "x" : -353.23976064247483, "y" : -1.3325519762534568, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 89 */ { "x" : -353.23976064247483, "y" : 3.99765592876037, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 90 */ { "x" : -353.23976064247483, "y" : -3.99765592876037, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 91 */ { "x" : -353.23976064247483, "y" : -2.6651039525069136, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 92 */ { "x" : -353.23976064247483, "y" : 2.6651039525069136, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 93 */ { "x" : -353.23976064247483, "y" : -4.663931916887098, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 94 */ { "x" : -353.23976064247483, "y" : 4.663931916887098, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 95 */ { "x" : 353.23976064247483, "y" : 1.3325519762534568, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 96 */ { "x" : 353.23976064247483, "y" : -1.3325519762534568, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 97 */ { "x" : 353.23976064247483, "y" : 3.99765592876037, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 98 */ { "x" : 353.23976064247483, "y" : -3.99765592876037, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 99 */ { "x" : 353.23976064247483, "y" : -2.6651039525069136, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 100 */ { "x" : 353.23976064247483, "y" : 2.6651039525069136, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 101 */ { "x" : 353.23976064247483, "y" : -4.663931916887098, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 102 */ { "x" : 353.23976064247483, "y" : 4.663931916887098, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "b3b6b6" },
		/* 103 */ { "x" : -305.5046578529513, "y" : 298.49164268077425, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 104 */ { "x" : -305.5046578529513, "y" : 341.13330592088494, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 105 */ { "x" : -152.75232892647566, "y" : 298.49164268077425, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 106 */ { "x" : -152.75232892647566, "y" : 341.13330592088494, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 107 */ { "x" : 305.5046578529513, "y" : 298.49164268077425, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 108 */ { "x" : 305.5046578529513, "y" : 341.13330592088494, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 109 */ { "x" : 152.75232892647566, "y" : 298.49164268077425, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 110 */ { "x" : 152.75232892647566, "y" : 341.13330592088494, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 111 */ { "x" : -484.9886443415601, "y" : 319.8124743008296, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 112 */ { "x" : -484.9886443415601, "y" : 341.13330592088494, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 113 */ { "x" : -707.7524573593371, "y" : 163.9038930791752, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 114 */ { "x" : -731.9382427726956, "y" : 163.9038930791752, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 115 */ { "x" : 707.7524573593371, "y" : 163.9038930791752, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 116 */ { "x" : 731.9382427726956, "y" : 163.9038930791752, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 117 */ { "x" : -707.7524573593371, "y" : -163.9038930791752, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 118 */ { "x" : -731.9382427726956, "y" : -163.9038930791752, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 119 */ { "x" : 707.7524573593371, "y" : -163.9038930791752, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 120 */ { "x" : 731.9382427726956, "y" : -163.9038930791752, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 121 */ { "x" : -484.9886443415601, "y" : -319.8124743008296, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 122 */ { "x" : -484.9886443415601, "y" : -341.13330592088494, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 123 */ { "x" : 484.9886443415601, "y" : 319.8124743008296, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 124 */ { "x" : 484.9886443415601, "y" : 341.13330592088494, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 125 */ { "x" : 484.9886443415601, "y" : -319.8124743008296, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		/* 126 */ { "x" : 484.9886443415601, "y" : -341.13330592088494, "bCoef" : 0.1, "trait" : "line", "color" : "b3b6b6" },
		
		/* 127 */ { "x" : 703.9336491361752, "y" : -319.8124743008296, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "F8F8F8", "vis" : false },
		/* 128 */ { "x" : 703.9336491361752, "y" : -90, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "F8F8F8", "pos" : [700,-80 ], "vis" : false },
		/* 129 */ { "x" : 703.9336491361752, "y" : 90, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "pos" : [700,80 ], "vis" : false },
		/* 130 */ { "x" : 703.9336491361752, "y" : 319.8124743008296, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false },
		/* 131 */ { "x" : -703.9336491361752, "y" : 90, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "F8F8F8", "pos" : [-700,80 ], "vis" : false },
		/* 132 */ { "x" : -703.9336491361752, "y" : 319.8124743008296, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "F8F8F8", "vis" : false },
		/* 133 */ { "x" : -703.9336491361752, "y" : -90, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "F8F8F8", "pos" : [-700,-80 ], "vis" : false },
		/* 134 */ { "x" : -703.9336491361752, "y" : -319.8124743008296, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "F8F8F8", "vis" : false }

	],

	"segments" : [
		{ "v0" : 6, "v1" : 7, "curve" : 0, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [-700,-80 ], "y" : -90 },
		{ "v0" : 7, "v1" : 8, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "x" : -740 },
		{ "v0" : 8, "v1" : 9, "curve" : 0, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [-700,80 ], "y" : 90 },
		{ "v0" : 10, "v1" : 11, "curve" : 0, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [700,-80 ], "y" : -90 },
		{ "v0" : 11, "v1" : 12, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "x" : 740 },
		{ "v0" : 12, "v1" : 13, "curve" : 0, "color" : "F8F8F8", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [700,80 ], "y" : 90 },
		
		{ "v0" : 2, "v1" : 3, "trait" : "kickOffBarrier" },
		{ "v0" : 3, "v1" : 4, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.15, "cGroup" : ["blueKO" ], "trait" : "kickOffBarrier" },
		{ "v0" : 3, "v1" : 4, "curve" : -180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.15, "cGroup" : ["redKO" ], "trait" : "kickOffBarrier" },
		{ "v0" : 4, "v1" : 5, "trait" : "kickOffBarrier" },
		
		{ "v0" : 14, "v1" : 15, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -550 },
		{ "v0" : 16, "v1" : 17, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -550 },
		{ "v0" : 18, "v1" : 19, "vis" : true, "color" : "b3b6b6", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "y" : 240 },
		{ "v0" : 20, "v1" : 21, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 550 },
		{ "v0" : 22, "v1" : 23, "vis" : true, "color" : "b3b6b6", "bCoef" : 1.15, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 550 },
		{ "v0" : 24, "v1" : 25, "vis" : true, "color" : "F8F8F8", "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 550, "y" : -240 },
		{ "v0" : 26, "v1" : 27, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "y" : -240 },
		
		{ "v0" : 28, "v1" : 29, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		{ "v0" : 30, "v1" : 31, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
		
		{ "v0" : 38, "v1" : 39, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -557.5 },
		{ "v0" : 40, "v1" : 41, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -557.5 },
		{ "v0" : 42, "v1" : 43, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 557.5 },
		{ "v0" : 44, "v1" : 45, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 557.5 },
		
		{ "v0" : 46, "v1" : 47, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 0 },
		{ "v0" : 48, "v1" : 49, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -550 },
		{ "v0" : 50, "v1" : 51, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 550 },
		{ "v0" : 52, "v1" : 53, "curve" : -93.12709821006908, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 55, "v1" : 54, "curve" : -87.37849984133219, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 56, "v1" : 57, "curve" : 93.12709821006924, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 53, "v1" : 57, "curve" : 0, "vis" : true, "color" : "ff6363", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 59, "v1" : 58, "curve" : 87.37849984134841, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 62, "v1" : 61, "curve" : -87.37849984133219, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 64, "v1" : 63, "curve" : 87.37849984134841, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 65, "v1" : 66, "curve" : 93.12709821006924, "vis" : true, "color" : "0099ff", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 67, "v1" : 68, "curve" : -93.12709821006919, "vis" : true, "color" : "0099ff", "bCoef" : 0.1, "trait" : "line" },
		{ "v0" : 69, "v1" : 70, "curve" : 0, "vis" : true, "color" : "0099ff", "bCoef" : 0.1, "trait" : "line", "x" : 390 },
		{ "v0" : 72, "v1" : 71, "curve" : 180.1633721223104, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 71, "v1" : 72, "curve" : 179.83708930112383, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 74, "v1" : 73, "curve" : 179.99999999999838, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 73, "v1" : 74, "curve" : 180.00000000000165, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 76, "v1" : 75, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 75, "v1" : 76, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 78, "v1" : 77, "curve" : 180.5779697461612, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 77, "v1" : 78, "curve" : 179.42750016761278, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -375 },
		{ "v0" : 80, "v1" : 79, "curve" : 179.83540351837757, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 79, "v1" : 80, "curve" : 180.1642154442635, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 82, "v1" : 81, "curve" : 180.00000000000165, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 81, "v1" : 82, "curve" : 179.99999999999835, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 84, "v1" : 83, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 83, "v1" : 84, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 86, "v1" : 85, "curve" : 179.4464958872327, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 85, "v1" : 86, "curve" : 180.55861544418315, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 375 },
		{ "v0" : 88, "v1" : 87, "curve" : 180.1633721223104, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 87, "v1" : 88, "curve" : 179.83708930112874, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 90, "v1" : 89, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 89, "v1" : 90, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 92, "v1" : 91, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 91, "v1" : 92, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 94, "v1" : 93, "curve" : 179.4244807844529, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 93, "v1" : 94, "curve" : 180.56082341999925, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -277.5 },
		{ "v0" : 96, "v1" : 95, "curve" : 179.83540351838244, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 95, "v1" : 96, "curve" : 180.16421544425376, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 98, "v1" : 97, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 97, "v1" : 98, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 100, "v1" : 99, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 99, "v1" : 100, "curve" : 180, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 102, "v1" : 101, "curve" : 180.5921396617552, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 101, "v1" : 102, "curve" : 179.42448078445292, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 277.5 },
		{ "v0" : 103, "v1" : 104, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240 },
		{ "v0" : 105, "v1" : 106, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -120 },
		{ "v0" : 107, "v1" : 108, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 240 },
		{ "v0" : 109, "v1" : 110, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 120 },
		{ "v0" : 111, "v1" : 112, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -381 },
		{ "v0" : 113, "v1" : 114, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : 123 },
		{ "v0" : 115, "v1" : 116, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : 123 },
		{ "v0" : 117, "v1" : 118, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : -123 },
		{ "v0" : 119, "v1" : 120, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -240, "y" : -123 },
		{ "v0" : 121, "v1" : 122, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : -381 },
		{ "v0" : 123, "v1" : 124, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 381 },
		{ "v0" : 125, "v1" : 126, "curve" : 0, "vis" : true, "color" : "b3b6b6", "bCoef" : 0.1, "trait" : "line", "x" : 381 },
		
		{ "v0" : 127, "v1" : 128, "vis" : false, "color" : "F8F8F8", "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 553 },
		{ "v0" : 129, "v1" : 130, "vis" : false, "color" : "F8F8F8", "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 553 },
		{ "v0" : 131, "v1" : 132, "vis" : false, "color" : "F8F8F8", "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -553 },
		{ "v0" : 133, "v1" : 134, "vis" : false, "color" : "F8F8F8", "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -553 }

	],

	"goals" : [
		{ "p0" : [-709.064840913,-90 ], "p1" : [-709.064840913,90 ], "team" : "red" },
		{ "p0" : [709.064840913,90 ], "p1" : [709.064840913,-90 ], "team" : "blue" }

	],

	"discs" : [
		{"radius":6.4,"color":"0","bCoef":0.4,"invMass":1.5,"damping":0.99,"cGroup":["ball","kick","score"]},
		{"pos":[-5,-1],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[5,-1],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[0,-5],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[-3,4],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"pos":[3,4],"radius":0.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{"radius":1.7,"invMass":1e+300,"color":"0","cMask":[],"cGroup":[]},
		{ "radius" : 5, "pos" : [-700.1148409130134,90 ], "color" : "FFFF00", "trait" : "goalPost", "y" : 90 },
		{ "radius" : 5, "pos" : [-700.1148409130134,-90 ], "color" : "FFFF00", "trait" : "goalPost", "y" : -90, "x" : -560 },
		{ "radius" : 5, "pos" : [700.1148409130134,90 ], "color" : "FFFF00", "trait" : "goalPost", "y" : 90 },
		{ "radius" : 5, "pos" : [700.1148409130134,-90 ], "color" : "FFFF00", "trait" : "goalPost", "y" : -90 },
		
		{ "radius" : 3, "invMass" : 0, "pos" : [-700.1148409130134,319.8124743008296 ], "color" : "ff6363", "bCoef" : 0.1, "trait" : "line" },
		{ "radius" : 3, "invMass" : 0, "pos" : [-700.1148409130134,-319.8124743008296 ], "color" : "ff6363", "bCoef" : 0.1, "trait" : "line" },
		{ "radius" : 3, "invMass" : 0, "pos" : [700.1148409130134,-319.8124743008296 ], "color" : "0099ff", "bCoef" : 0.1, "trait" : "line" },
		{ "radius" : 3, "invMass" : 0, "pos" : [700.1148409130134,319.8124743008296 ], "color" : "0099ff", "bCoef" : 0.1, "trait" : "line" }

	],

	"planes" : [
		{ "normal" : [0,1 ], "dist" : -319.8124743008296, "bCoef" : 1, "trait" : "ballArea", "vis" : false, "curve" : 0 },
		{ "normal" : [0,-1 ], "dist" : -319.8124743008296, "bCoef" : 1, "trait" : "ballArea" },
		
		{ "normal" : [0,1 ], "dist" : -380, "bCoef" : 0.1 },
		{ "normal" : [0,-1 ], "dist" : -380, "bCoef" : 0.1 },
		{ "normal" : [1,0 ], "dist" : -789.2203661201241, "bCoef" : 0.1 },
		{ "normal" : [-1,0 ], "dist" : -789.2203661201241, "bCoef" : 0.1 },
		
		{ "normal" : [1,0 ], "dist" : -789.2203661201241, "bCoef" : 0.1, "trait" : "ballArea", "vis" : false, "curve" : 0 },
		{ "normal" : [-1,0 ], "dist" : -789.2203661201241, "bCoef" : 0.1, "trait" : "ballArea", "vis" : false, "curve" : 0 }

	],

	"traits" : {
		"ballArea" : { "vis" : false, "bCoef" : 1, "cMask" : ["ball" ] },
		"goalPost" : { "radius" : 8, "invMass" : 0, "bCoef" : 0.5 },
		"goalNet" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["ball" ] },
		"line" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["" ] },
		"kickOffBarrier" : { "vis" : false, "bCoef" : 0.1, "cGroup" : ["redKO","blueKO" ], "cMask" : ["red","blue" ] }

	},

	"playerPhysics" : {
		"bCoef" : 0,
		"acceleration" : 0.11,
		"kickingAcceleration" : 0.083,
		"kickStrength" : 5

	},

"ballPhysics":"disc0",

"joints":[{"d0":0,"d1":1,"length":5.0990195135927845,"color":"transparent"},
{"d0":0,"d1":2,"length":5.0990195135927845,"color":"transparent"},
{"d0":0,"d1":3,"length":5,"color":"transparent"},
{"d0":0,"d1":4,"length":5,"color":"transparent"},
{"d0":0,"d1":5,"length":5,"color":"transparent"},
{"d0":0,"d1":6,"length":0,"color":"transparent"},
{"d0":1,"d1":2,"length":10,"color":"transparent"},
{"d0":1,"d1":3,"length":6.4031242374328485,"color":"transparent"},
{"d0":1,"d1":4,"length":5.385164807134504,"color":"transparent"},
{"d0":1,"d1":5,"length":9.433981132056603,"color":"transparent"},
{"d0":1,"d1":6,"length":5.0990195135927845,"color":"transparent"},
{"d0":2,"d1":3,"length":6.4031242374328485,"color":"transparent"},
{"d0":2,"d1":4,"length":9.433981132056603,"color":"transparent"},
{"d0":2,"d1":5,"length":5.385164807134504,"color":"transparent"},
{"d0":2,"d1":6,"length":5.0990195135927845,"color":"transparent"},
{"d0":3,"d1":4,"length":9.486832980505138,"color":"transparent"},
{"d0":3,"d1":5,"length":9.486832980505138,"color":"transparent"},
{"d0":3,"d1":6,"length":5,"color":"transparent"},
{"d0":4,"d1":5,"length":6,"color":"transparent"},
{"d0":4,"d1":6,"length":5,"color":"transparent"},
{"d0":5,"d1":6,"length":5,"color":"transparent"}]

}`;
