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
            "extent": 2895.6000000000004,
            "length": {
              "value": 2895.6000000000004,
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
            "extent": 4572,
            "length": {
              "value": 4572,
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
            "extent": 11582.4,
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
            "extent": 2895.6000000000004,
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
            "length": 4267.200000000001,
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
            "extent": {
              "formula": ".e"
            },
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
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
            "length": 4267.200000000001,
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
            "extent": 2895.6000000000004,
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
              "formula": ".e"
            },
            "length": 4267.200000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": 4571.999999999999,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "value": 5486.400000000001,
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
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
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
            "length": 4572,
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
            "length": 2895.6000000000004,
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
            "length": 4572,
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
            "length": 2895.6000000000004,
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
              "value": 1219.2,
              "is_locked": true
            },
            "extent": {
              "formula": ".e - 2' 6\""
            },
            "length": 2590.8,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 914.3999999999996,
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
            "length": 2895.6000000000004,
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
            "origin": {
              "formula": ".s"
            },
            "extent": 212.36065573770492,
            "length": 212.36065573770492,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 914.3999999999996,
            "length": 914.3999999999996,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 178.59375000000003,
            "extent": 216.69375000000002,
            "length": {
              "formula": "stud th"
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
            "length": 4572,
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
            "length": 2895.6000000000004,
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
              "value": 914.4000000000001,
              "is_locked": true
            },
            "extent": {
              "formula": ".e"
            },
            "length": 3657.6,
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
              "formula": "wall th"
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
              "formula": "stair beam.s"
            },
            "length": 2609.8500000000004,
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
            "extent": 38.10000000000002,
            "length": {
              "formula": "stud th"
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
            "length": 88.89999999999964,
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
            "length": 2609.8500000000004,
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
            "length": 4572,
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
              "formula": "wall th"
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
            "length": 2895.6000000000004,
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
        "id": "did64123ba34e4ba",
        "name": "art post",
        "x": {
          "attributes": {
            "origin": {
              "formula": "zen beam.s"
            },
            "extent": 2470.15,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "back.well.e"
            },
            "extent": 184.14999999999964,
            "length": {
              "formula": "post th"
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
              "formula": ".e - 11\""
            },
            "length": 2616.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
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
            "extent": 88.89999999999964,
            "length": {
              "formula": "wall th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s - 18\""
            },
            "extent": {
              "formula": ".e"
            },
            "length": 1981.2000000000007,
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
              "formula": ".e - beam th"
            },
            "length": 2609.8500000000004,
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
        "id": "di5d4068af039b53",
        "name": "bath side wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 88.89999999999964,
            "length": {
              "formula": "wall th"
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
            "length": 914.4000000000005,
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
              "formula": ".e - beam th"
            },
            "length": 2609.8500000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": true,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "di6e49f7949d45d3"
      },
      {
        "id": "di6a49ca9d8297b8",
        "name": "stud",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 88.89999999999964,
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
            "extent": 38.100000000000364,
            "length": {
              "formula": "stud th"
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
            "extent": 2609.8500000000004,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di5d4068af039b53"
      },
      {
        "id": "did948f886e40d95",
        "name": "street wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 4267.200000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": 5397.500000000001,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "wall th"
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
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "di334398930cb9ea",
        "name": "moose wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 88.89999999999964,
            "length": {
              "formula": "wall th"
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
              "formula": "overhang beam.s"
            },
            "length": 3352.8,
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
              "formula": ".e - beam th"
            },
            "length": 2609.8500000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
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
              "formula": "bathroom.c"
            },
            "length": 3155.9500000000007,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 88.89999999999964,
            "length": {
              "formula": "wall th"
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
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "di1449918b4c7d64",
        "name": "overhang post",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".e - post th"
            },
            "extent": 4267.200000000001,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "overhang beam.s"
            },
            "extent": 3536.95,
            "length": {
              "formula": "post th"
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
              "formula": ".e - 11\""
            },
            "length": 2616.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "di0646c8951cb17e",
        "name": "well post",
        "x": {
          "attributes": {
            "origin": -101.60000000000036,
            "extent": 82.54999999999927,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "overhang beam.s"
            },
            "extent": 3536.95,
            "length": {
              "formula": "post th"
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
              "formula": ".e - 11\""
            },
            "length": 2616.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "di1e4196aac255dc",
        "name": "outer beam",
        "x": {
          "attributes": {
            "origin": {
              "formula": "front.e - post th"
            },
            "extent": 4267.200000000001,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "overhang beam.e"
            },
            "extent": {
              "formula": "front.e"
            },
            "length": 1949.4500000000007,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "di484f8bab1e0e2b",
        "name": "overhang beam",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s + post th / 2"
            },
            "extent": {
              "formula": "front.e + overhang"
            },
            "length": 5394.325000000002,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".e - 7'"
            },
            "extent": 3536.95,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
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
            "origin": {
              "formula": "front.c - wall th"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 2222.5,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 914.4000000000005,
            "length": {
              "value": 914.4000000000005,
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
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "di424b3ea70d6b7d",
        "name": "stud",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 88.89999999999964,
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
            "extent": 38.100000000000364,
            "length": {
              "formula": "stud th"
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
            "extent": 2895.6000000000004,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dia04a54814864bd"
      },
      {
        "id": "dibb46a3aa5f0c4c",
        "name": "main",
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
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "dia2480ebef32cfd"
      },
      {
        "id": "di8248e39cefbdca",
        "name": "stair beam",
        "x": {
          "attributes": {
            "origin": -2.536155313537236e-12,
            "extent": {
              "formula": "kitchen main beam.s"
            },
            "length": 4470.400000000002,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "zen beam.e"
            },
            "extent": 3.175000000000182,
            "length": {
              "formula": "post th / 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "die14491ad9c433a"
      },
      {
        "id": "di6c4e8c8e6c9c07",
        "name": "well beam",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": {
              "formula": "kitchen main beam.s"
            },
            "length": 4470.4,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "back.well.e"
            },
            "extent": 1006.4749999999995,
            "length": {
              "formula": "post th / 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "die14491ad9c433a"
      },
      {
        "id": "di6d4012887bb295",
        "name": "well block",
        "x": {
          "attributes": {
            "origin": {
              "formula": "stairs.s"
            },
            "extent": 1308.1000000000001,
            "length": {
              "formula": "wall th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "stair beam.e"
            },
            "extent": {
              "formula": "well beam.s"
            },
            "length": 911.2249999999995,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "die14491ad9c433a"
      },
      {
        "id": "di924c72b6770461",
        "name": "stair top block",
        "x": {
          "attributes": {
            "origin": {
              "formula": "stairs.e"
            },
            "extent": 3898.9,
            "length": {
              "formula": "wall th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "stair beam.e"
            },
            "extent": {
              "formula": "well beam.s"
            },
            "length": 911.2249999999995,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "die14491ad9c433a"
      },
      {
        "id": "di294d3d8f2800fb",
        "name": "art beam",
        "x": {
          "attributes": {
            "origin": {
              "formula": "back.l / 2"
            },
            "extent": 2470.15,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "art post.c"
            },
            "extent": {
              "formula": ".e + overhang"
            },
            "length": 5089.525000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di3c4177bc5fe205"
      },
      {
        "id": "dicd44d09951ec46",
        "name": "zen post",
        "x": {
          "attributes": {
            "origin": {
              "formula": "zen beam.s"
            },
            "extent": 2470.15,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "back.well.s - post th"
            },
            "extent": 6705.6,
            "length": {
              "formula": "post th"
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
              "formula": ".e - 11\""
            },
            "length": 2616.2000000000003,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "did04260a3a40843"
      },
      {
        "id": "di28470382743179",
        "name": "zen beam",
        "x": {
          "attributes": {
            "origin": {
              "formula": "back.l / 2"
            },
            "extent": 2470.15,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s - overhang"
            },
            "extent": {
              "formula": ".e - wall th"
            },
            "length": 7835.900000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "did04260a3a40843"
      },
      {
        "id": "did6490982286f3f",
        "name": "back wall",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 88.89999999999999,
            "length": {
              "formula": "wall th"
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
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": true,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": false,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "dibb46a3aa5f0c4c"
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
            "extent": 88.89999999999999,
            "length": {
              "formula": "wall th"
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
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": false,
          "run_axis": 0,
          "is_diagonal": false
        },
        "parent_id": "dibb46a3aa5f0c4c"
      },
      {
        "id": "di194aa0bcec9ee6",
        "name": "post",
        "x": {
          "attributes": {
            "origin": {
              "formula": "kitchen main beam.s"
            },
            "extent": 4654.549999999999,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "value": 5486.400000000001,
              "is_locked": true
            },
            "extent": 5670.55,
            "length": {
              "formula": "post th"
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
              "formula": ".e - beam th"
            },
            "length": 2609.8500000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dibb46a3aa5f0c4c"
      },
      {
        "id": "di82442893cdd1d4",
        "name": "outer post",
        "x": {
          "attributes": {
            "origin": 8655.050000000001,
            "extent": 8839.2,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "post.s"
            },
            "extent": 5670.55,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": -10.376585960388184,
            "extent": 2599.473414039612,
            "length": 2609.8500000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dibb46a3aa5f0c4c"
      },
      {
        "id": "di8c448f846398a2",
        "name": "kitchen post",
        "x": {
          "attributes": {
            "origin": {
              "formula": "kitchen beam.s"
            },
            "extent": 6800.85,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "post.s"
            },
            "extent": 5670.55,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 2609.8500000000004,
            "length": 2609.8500000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dibb46a3aa5f0c4c"
      },
      {
        "id": "di46448b947f83a6",
        "name": "kitchen main beam",
        "x": {
          "attributes": {
            "origin": {
              "formula": "front.s - 4\""
            },
            "extent": 4654.549999999999,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": -1219.2,
            "extent": {
              "formula": "post.c"
            },
            "length": 6797.675,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dibb46a3aa5f0c4c"
      },
      {
        "id": "di4344b1a72875b7",
        "name": "moose main beam",
        "x": {
          "attributes": {
            "origin": {
              "formula": "front.s - 4\""
            },
            "extent": 4654.549999999999,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "post.c"
            },
            "extent": {
              "formula": ".e + 4'"
            },
            "length": 7223.125,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dibb46a3aa5f0c4c"
      },
      {
        "id": "dia14196bea368a4",
        "name": "overhang beam",
        "x": {
          "attributes": {
            "origin": {
              "formula": "post.e"
            },
            "extent": {
              "formula": "front.e - beam th / 2"
            },
            "length": 4041.7750000000015,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "post.s"
            },
            "extent": 5670.55,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dibb46a3aa5f0c4c"
      },
      {
        "id": "di6e4111a884deec",
        "name": "kitchen beam",
        "x": {
          "attributes": {
            "origin": {
              "formula": "front.c - wall th"
            },
            "extent": 6800.85,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": " - overhang"
            },
            "extent": {
              "formula": "overhang beam.s"
            },
            "length": 6705.6,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": 2895.6000000000004,
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dibb46a3aa5f0c4c"
      },
      {
        "id": "did74e849945d8cf",
        "name": "front beam",
        "x": {
          "attributes": {
            "origin": {
              "formula": "front.e - post th"
            },
            "extent": 8839.2,
            "length": {
              "formula": "post th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s - overhang"
            },
            "extent": {
              "formula": "front.moose.overhang beam.s"
            },
            "length": 9144,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": 2609.8500000000004,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "beam th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dibb46a3aa5f0c4c"
      },
      {
        "id": "di5c4dd68247b856",
        "name": "dirt",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 4267.200000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "value": 1219.2000000000091,
              "is_locked": true
            },
            "extent": {
              "formula": ".e"
            },
            "length": 8839.19999999999,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 609.6,
            "length": {
              "value": 609.6,
              "is_locked": true
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
        "id": "di0e4bfda1591e53",
        "name": "door wall",
        "x": {
          "attributes": {
            "origin": 4178.300000000001,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "wall th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": {
              "value": 0,
              "is_locked": true
            },
            "extent": {
              "value": 914.4000000000001,
              "is_locked": true
            },
            "length": 914.4000000000001,
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
              "formula": ".e - beam th"
            },
            "length": 2609.8500000000004,
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
        "id": "di0b4587b5e56f1b",
        "name": "stub wall",
        "x": {
          "attributes": {
            "origin": 4178.300000000001,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "wall th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "main.outer post.e + door w"
            },
            "extent": {
              "formula": "front.moose.overhang post.s"
            },
            "length": 1339.8499999999985,
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
              "formula": ".e - beam th"
            },
            "length": 2609.8500000000004,
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
        "id": "di2a41cc84c2800d",
        "name": "glass wall",
        "x": {
          "attributes": {
            "origin": 4178.300000000001,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "wall th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": {
              "value": 1828.799755859346,
              "is_locked": true
            },
            "extent": {
              "formula": "main.outer post.s"
            },
            "length": 3657.6002441406545,
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
              "formula": ".e - beam th"
            },
            "length": 2609.8500000000004,
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
        "id": "dia04a54814864bd",
        "name": "shower wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s + .l / 2"
            },
            "extent": 1200.1499999999996,
            "length": {
              "formula": "wall th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".e - door w"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 914.3999999999996,
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
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": true,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "di6e49f7949d45d3"
      },
      {
        "id": "di4a401ba20be130",
        "name": "moose wall",
        "x": {
          "attributes": {
            "origin": 4178.300000000001,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "formula": "wall th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "front.moose.overhang post.e"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 1949.4500000000007,
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
              "formula": ".e - beam th"
            },
            "length": 2609.8500000000004,
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
        "id": "di454461a607546b",
        "name": "storage",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": {
              "formula": ".e"
            },
            "length": 4267.200000000001,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": 4876.8,
            "extent": {
              "formula": ".e"
            },
            "length": 609.6000000000004,
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": {
              "formula": ".e"
            },
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "dib74e24b841661d",
        "name": "desk",
        "x": {
          "attributes": {
            "origin": 2600.6698242187504,
            "extent": 4124.66982421875,
            "length": {
              "value": 1524,
              "is_locked": true
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 2057.04248046875,
            "extent": 2971.4424804687505,
            "length": {
              "value": 914.4000000000005,
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
            "extent": 762,
            "length": {
              "value": 762,
              "is_locked": true
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "di4f47c5b00ca8ff",
        "name": "bed",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 1524,
            "length": {
              "value": 1524,
              "is_locked": true
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 1308.8075160980225,
            "extent": 3340.8075160980234,
            "length": {
              "value": 2032.000000000001,
              "is_locked": true
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 457.2,
            "length": 457.2,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "di464145a0f0448f",
        "name": "bed wall",
        "x": {
          "attributes": {
            "origin": {
              "value": 0,
              "is_locked": true
            },
            "extent": 1524,
            "length": {
              "value": 1524,
              "is_locked": true
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 3448.05,
            "extent": {
              "formula": "overhang beam.e"
            },
            "length": 88.89999999999964,
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": {
              "value": 0,
              "is_locked": true
            },
            "extent": 2438.4,
            "length": 2438.4,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": true,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 0,
          "is_diagonal": false
        },
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "did0478f942f1b7c",
        "name": "stud",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 38.100000000000364,
            "length": {
              "formula": "stud thickness"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 88.89999999999964,
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
            "extent": 2438.4,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di464145a0f0448f"
      }
    ],
    "givens": [
      {
        "name": "wall th",
        "value_mm": 88.89999999999999,
        "locked": true
      },
      {
        "name": "stud th",
        "value_mm": 38.099999999999994,
        "locked": true
      },
      {
        "name": "post th",
        "value_mm": 184.14999999999998,
        "locked": true
      },
      {
        "name": "beam th",
        "value_mm": 285.75,
        "locked": true
      },
      {
        "name": "overhang",
        "value_mm": 1219.2,
        "locked": true
      },
      {
        "name": "door w",
        "value_mm": 914.4000000000001,
        "locked": true
      },
      {
        "name": "wall thickness",
        "value_mm": 88.9,
        "locked": true
      },
      {
        "name": "stud thickness",
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
    "root_id": "dia2480ebef32cfd",
    "selected_id": "di924c72b6770461",
    "selected_face": 5
  }
}