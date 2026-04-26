{
  "version": "9",
  "scene": {
    "smart_objects": [
      {
        "id": "dia2480ebef32cfd",
        "name": "basement",
        "x": {
          "attributes": {
            "origin": {
              "value": 0,
              "is_locked": true
            },
            "extent": 8839.2,
            "length": {
              "value": 8839.2,
              "is_locked": true
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "value": 0,
              "is_locked": true
            },
            "extent": 11582.4,
            "length": {
              "value": 11582.4,
              "is_locked": true
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "value": 0,
              "is_locked": true
            },
            "extent": 2743.2000000000003,
            "length": {
              "value": 2743.2000000000003,
              "is_locked": true
            },
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
              "value": 4267.2,
              "is_locked": true
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
            "origin": 10058.4,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "value": 1524,
              "is_locked": true
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
              "formula": ".s"
            },
            "extent": {
              "formula": ".e - wall thickness"
            },
            "length": 4483.100000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": 5791.2,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "value": 4267.2,
              "is_locked": true
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
            "extent": {
              "formula": ".e"
            },
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "die948608c4b1219"
      },
      {
        "id": "di38476b85f5fb05",
        "name": "kitchen",
        "x": {
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
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
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
        "parent_id": "die948608c4b1219"
      },
      {
        "id": "di3c4177bc5fe205",
        "name": "art",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
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
            "origin": 7620,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "value": 3962.3999999999996,
              "is_locked": true
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
            "extent": {
              "formula": ".e"
            },
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "dic14ae1a524808c"
      },
      {
        "id": "die14491ad9c433a",
        "name": "well",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
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
            "origin": 6705.6,
            "extent": {
              "formula": "art.s"
            },
            "length": {
              "value": 914.3999999999996,
              "is_locked": true
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
            "extent": {
              "formula": ".e"
            },
            "length": 2743.2000000000003,
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
              "formula": "4'"
            },
            "extent": {
              "formula": ".e - 30\""
            },
            "length": 2286,
            "angle": 0
          },
          "invariant": 2
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
            "extent": {
              "formula": ".e"
            },
            "length": 2743.2000000000003,
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
            "extent": -2085.4736842105262,
            "length": 200.5263157894737,
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
            "origin": 180.34000000000006,
            "extent": -2524.7600000000007,
            "length": {
              "value": 38.09999999999954,
              "is_locked": true
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
            "length": 6705.6,
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
            "length": 2743.2000000000003,
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
              "value": 1828.8000000000002,
              "is_locked": true
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
            "origin": 6616.700000000001,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "value": 88.89999999999964,
              "is_locked": true
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
            "extent": {
              "formula": ".e"
            },
            "length": 2743.2000000000003,
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
            "origin": {
              "formula": ".s"
            },
            "extent": -2400.2999999999997,
            "length": {
              "value": 38.09999999999991,
              "is_locked": true
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
            "extent": 0,
            "length": {
              "value": 88.89999999999964,
              "is_locked": true
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
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "did348efbe38737f"
      },
      {
        "id": "di15416eb54d5d24",
        "name": "street wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
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
            "origin": 3873.5,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "wall thickness"
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
            "extent": {
              "formula": ".e"
            },
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": false,
          "run_axis": 0,
          "is_diagonal": false
        },
        "parent_id": "di3c4177bc5fe205"
      },
      {
        "id": "di784121a1e0dd82",
        "name": "wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": -4483.100000000001,
            "length": {
              "formula": "wall thickness"
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
            "extent": {
              "formula": ".e"
            },
            "length": 1524,
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
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": true,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": false,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "di4d46b58f96fcd0"
      },
      {
        "id": "di0e4bfda1591e53",
        "name": "glass wall",
        "x": {
          "attributes": {
            "origin": 4483.100000000001,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "wall thickness"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": {
              "value": 1219.2,
              "is_locked": true
            },
            "extent": {
              "formula": ".e - 4'"
            },
            "length": 7619.999999999999,
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
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": false,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "die948608c4b1219"
      },
      {
        "id": "did6490982286f3f",
        "name": "back wall",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": -8750.300000000001,
            "length": {
              "formula": "wall thickness"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": {
              "formula": ".e"
            },
            "length": 11582.4,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": {
              "formula": ".e"
            },
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": true,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": false,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "dia2480ebef32cfd"
      },
      {
        "id": "di1b4103a109725f",
        "name": "side wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 8839.2,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": -11493.5,
            "length": {
              "formula": "wall thickness"
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
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": false,
          "run_axis": 0,
          "is_diagonal": false
        },
        "parent_id": "dia2480ebef32cfd"
      },
      {
        "id": "di3e429f96ddfb7b",
        "name": "kitchen wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e - 3'"
            },
            "length": 3568.7000000000016,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": -4178.3,
            "length": {
              "formula": "wall thickness"
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
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "did948f886e40d95",
        "name": "chimney wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 4483.100000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": 4178.3,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "wall thickness"
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
            "extent": {
              "formula": ".e"
            },
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "di6e49f7949d45d3",
        "name": "bathroom",
        "x": {
          "attributes": {
            "origin": -4267.2,
            "extent": {
              "formula": ".e"
            },
            "length": 8839.2,
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": {
              "formula": ".e"
            },
            "length": 5791.2,
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 2743.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "di38476b85f5fb05"
      }
    ],
    "givens": [
      {
        "name": "wall thickness",
        "value_mm": 88.89999999999999,
        "locked": true
      },
      {
        "name": "stud thickness",
        "value_mm": 38.099999999999994,
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
    "root_id": "dia2480ebef32cfd",
    "selected_id": "dia2480ebef32cfd",
    "selected_face": 1
  }
}