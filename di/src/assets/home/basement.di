{
  "version": "9",
  "scene": {
    "smart_objects": [
      {
        "id": "didc4131a9e6d366",
        "name": "basement",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 9626.6,
            "length": 9626.6,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 6826.249999999999,
            "length": 6826.249999999999,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 3207.7481243133543,
            "length": 3207.7481243133543,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false
      },
      {
        "id": "dic446a6ac236257",
        "name": "interior wall",
        "x": {
          "attributes": {
            "origin": 5054.6,
            "extent": {
              "formula": ".e"
            },
            "length": 4572,
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": -6737.349999999999,
            "length": {
              "formula": "stud width"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 0,
          "is_diagonal": false,
          "gap_min": 228.6
        },
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "dic84259b9649359",
        "name": "stud",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": -4533.9,
            "length": {
              "formula": "template width"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 3.552713678800501e-13,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dic446a6ac236257"
      },
      {
        "id": "di184d6393a54051",
        "name": "stairs",
        "x": {
          "attributes": {
            "origin": 1206.6390182495115,
            "extent": -5371.960981750488,
            "length": 3048.000000000001,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 1477.9970497608188,
            "extent": -4433.85295023918,
            "length": 914.4000000000001,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false,
        "repeater": {
          "gap_min": 177.79999999999998,
          "gap_max": 254,
          "is_repeating": true,
          "run_axis": 0,
          "rise_axis": 2,
          "is_diagonal": true,
          "_orig_run_length": 203.2
        },
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "did246599f0333ec",
        "name": "tread",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": -2780.6315789473692,
            "length": {
              "formula": "tread depth"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 211.30987495422363,
            "extent": -2958.3382493591307,
            "length": {
              "formula": "tread thickness"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di184d6393a54051"
      },
      {
        "id": "di0447e5812b5d13",
        "name": "front wall",
        "x": {
          "attributes": {
            "origin": 9537.7,
            "extent": {
              "formula": ".e"
            },
            "length": 88.89999999999964,
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": 1219.1999999999998,
            "extent": {
              "formula": "desk wall.s"
            },
            "length": 3778.249999999999,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "di4a4e0baeeae628",
        "name": "stud",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": -3740.149999999999,
            "length": {
              "formula": "template thickness"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di0447e5812b5d13"
      },
      {
        "id": "difc4dfd9a65045f",
        "name": "back wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": -9537.7,
            "length": 88.89999999999964,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "did740fd9e1b883d",
        "name": "desk wall",
        "x": {
          "attributes": {
            "origin": 5359.4,
            "extent": {
              "formula": ".l"
            },
            "length": 4267.200000000001,
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".l - 6'"
            },
            "extent": -1739.9000000000005,
            "length": {
              "formula": "stud width"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "di84410ea061b5fd",
        "name": "south beam",
        "x": {
          "attributes": {
            "origin": 82.31835079193115,
            "extent": {
              "formula": "center beam.s"
            },
            "length": 5092.93164920807,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": 1389.0970497608187,
            "extent": {
              "formula": "stairs.s"
            },
            "length": {
              "formula": "beam thickness"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": 2921.9981243133543,
            "extent": {
              "formula": ".l"
            },
            "length": {
              "formula": "beam depth"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "di944d0a87f8fb7c",
        "name": "north beam",
        "x": {
          "attributes": {
            "origin": 93.76544570922852,
            "extent": {
              "formula": "center beam.s"
            },
            "length": 5081.484554290772,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "stairs.e"
            },
            "extent": -4344.95295023918,
            "length": {
              "formula": "beam thickness"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 2921.9981243133543,
            "extent": {
              "formula": ".l"
            },
            "length": {
              "formula": "beam depth"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "di824b7894ad2203",
        "name": "center beam",
        "x": {
          "attributes": {
            "origin": 5175.250000000001,
            "extent": {
              "formula": "outer street wall.e"
            },
            "length": {
              "formula": "big beam thickness"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": "outer street wall.s"
            },
            "length": 6737.349999999999,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 2921.9981243133543,
            "extent": {
              "formula": ".l"
            },
            "length": {
              "formula": "beam depth"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "dia7424bb12046a4",
        "name": "outer street wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": "back wall.e"
            },
            "extent": {
              "formula": "jog wall.x",
              "value": 5359.400000000001,
              "attached": true
            },
            "length": 5270.500000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".e - stud width"
            },
            "extent": 0,
            "length": {
              "formula": "stud width"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 3207.7481243133543,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "di554bc1a8679e8f",
        "name": "jog wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": "outer street wall.e"
            },
            "extent": -4178.3,
            "length": {
              "formula": "stud width"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "desk wall.e"
            },
            "extent": {
              "formula": "outer street wall.e"
            },
            "length": 1739.9000000000005,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 3207.7481243133543,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "didc4131a9e6d366"
      }
    ],
    "givens": [
      {
        "name": "inset",
        "value_mm": 6.35,
        "locked": true
      },
      {
        "name": "dado",
        "value_mm": 6.35,
        "locked": true
      },
      {
        "name": "bottom Inset",
        "value_mm": 19.049999999999997,
        "locked": true
      },
      {
        "name": "beam depth",
        "value_mm": 285.75,
        "locked": true
      },
      {
        "name": "beam thickness",
        "value_mm": 88.89999999999999,
        "locked": true
      },
      {
        "name": "big beam thickness",
        "value_mm": 184.14999999999998,
        "locked": true
      },
      {
        "name": "middle height",
        "value_mm": 152.39999999999998,
        "locked": true
      },
      {
        "name": "bottom height",
        "value_mm": 215.89999999999998,
        "locked": true
      },
      {
        "name": "stud width",
        "value_mm": 88.89999999999999,
        "locked": true
      },
      {
        "name": "template width",
        "value_mm": 38.1,
        "locked": true
      },
      {
        "name": "tread depth",
        "value_mm": 203.2,
        "locked": true
      },
      {
        "name": "top height",
        "value_mm": 101.6,
        "locked": true
      },
      {
        "name": "tread thickness",
        "value_mm": 38.099999999999994,
        "locked": true
      },
      {
        "name": "side thickness",
        "value_mm": 12.7,
        "locked": true
      },
      {
        "name": "front thickness",
        "value_mm": 19.049999999999997,
        "locked": true
      },
      {
        "name": "bottom thickness",
        "value_mm": 6.35,
        "locked": true
      },
      {
        "name": "back thickness",
        "value_mm": 12.7,
        "locked": true
      },
      {
        "name": "template thickness",
        "value_mm": 38.1,
        "locked": true
      }
    ],
    "camera": {
      "eye": [
        0,
        0,
        2750
      ],
      "center": [
        0,
        0,
        0
      ],
      "up": [
        0,
        1,
        0
      ]
    },
    "root_id": "didc4131a9e6d366",
    "selected_id": "di944d0a87f8fb7c",
    "selected_face": 5
  }
}