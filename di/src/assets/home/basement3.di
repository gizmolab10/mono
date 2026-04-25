{
  "version": "9",
  "scene": {
    "smart_objects": [
      {
        "id": "dia2480ebef32cfd",
        "name": "basement3",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 8839.2,
            "length": 8839.2,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 12496.8,
            "length": 12496.8,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 3048,
            "length": 3048,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false
      },
      {
        "id": "dic14ae1a524808c",
        "name": "back",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": -4572.000000000001,
            "length": {
              "formula": "14'"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": -914.3999999999996,
            "length": {
              "formula": "38'"
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
        "parent_id": "dia2480ebef32cfd"
      },
      {
        "id": "die948608c4b1219",
        "name": "front",
        "x": {
          "attributes": {
            "origin": {
              "formula": "back.e"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 4572.000000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": "jog.s"
            },
            "length": 10058.4,
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
        "parent_id": "dia2480ebef32cfd"
      },
      {
        "id": "di4d46b58f96fcd0",
        "name": "jog",
        "x": {
          "attributes": {
            "origin": {
              "formula": "back.e"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 4572.000000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": 10972.8,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "5'"
            },
            "angle": 0
          },
          "invariant": 0
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
        "parent_id": "dia2480ebef32cfd"
      },
      {
        "id": "di814622bfde093a",
        "name": "moose",
        "x": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
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
            "origin": 5791.2,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "14'"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 3048,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "die948608c4b1219"
      },
      {
        "id": "di38476b85f5fb05",
        "name": "laundry",
        "x": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
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
            "origin": {
              "formula": "0"
            },
            "extent": {
              "formula": "moose.s"
            },
            "length": 5791.2,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "0"
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
        "parent_id": "die948608c4b1219"
      },
      {
        "id": "di3c4177bc5fe205",
        "name": "art",
        "x": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 4267.2,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": 6705.599999999999,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "16'"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 3048,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dic14ae1a524808c"
      },
      {
        "id": "die14491ad9c433a",
        "name": "well",
        "x": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 4267.2,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": 5791.199999999999,
            "extent": {
              "formula": "art.s"
            },
            "length": {
              "formula": "3'"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 3048,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "dic14ae1a524808c"
      },
      {
        "id": "di8e47c4bd8c9235",
        "name": "stairs",
        "x": {
          "attributes": {
            "origin": {
              "formula": "5'"
            },
            "extent": {
              "formula": ".e - 30\""
            },
            "length": 1981.1999999999998,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
            "extent": -9.094947017729282e-13,
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
              "formula": "0"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 3048,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "repeater": {
          "run_axis": 0,
          "rise_axis": 2,
          "spacing": 406.4,
          "gap_min": 152.39999999999998,
          "gap_max": 209.54999999999998,
          "is_diagonal": true,
          "is_repeating": true,
          "_orig_run_length": 1981.1999999999998
        },
        "parent_id": "die14491ad9c433a"
      },
      {
        "id": "diac4073921066b4",
        "name": "tread",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": -1828.7999999999997,
            "length": 152.39999999999998,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 0,
            "length": 914.3999999999996,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 177.0529411764706,
            "extent": -2832.8470588235296,
            "length": {
              "formula": "1.5\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di8e47c4bd8c9235"
      },
      {
        "id": "did04260a3a40843",
        "name": "zen",
        "x": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 4267.2,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
            "extent": {
              "formula": "well.s"
            },
            "length": 5791.199999999999,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 3048,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "dic14ae1a524808c"
      },
      {
        "id": "did348efbe38737f",
        "name": "wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": "6'"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 2438.3999999999996,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": 5702.299999999999,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "3.5\""
            },
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "0"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 3048,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": true,
        "repeater": {
          "run_axis": 0,
          "rise_axis": 1,
          "spacing": 406.4,
          "gap_min": 101.6,
          "gap_max": 304.79999999999995,
          "is_diagonal": false,
          "is_repeating": true,
          "firewall": true
        },
        "parent_id": "did04260a3a40843"
      },
      {
        "id": "di0249d1ad970e02",
        "name": "stud",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": -2400.2999999999997,
            "length": 38.09999999999991,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 0,
            "length": 88.89999999999964,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 0,
            "length": 3048,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "did348efbe38737f"
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
    "root_id": "dia2480ebef32cfd",
    "selected_id": "die948608c4b1219",
    "selected_face": 1
  }
}