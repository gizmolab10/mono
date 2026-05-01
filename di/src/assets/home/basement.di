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
        "visible": true,
        "hide_children": false,
        "parent_id": "die948608c4b1219"
      },
      {
        "id": "di0e4bfda1591e53",
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
              "value": 1219.200244140625,
              "is_locked": true
            },
            "extent": {
              "formula": ".e - 4'"
            },
            "length": 7619.999755859374,
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
            "origin": 6096,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "value": 3962.4,
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
        "id": "di38476b85f5fb05",
        "name": "kitchen",
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
              "formula": ".s"
            },
            "extent": {
              "formula": "moose.s"
            },
            "length": 6096,
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
          "firewall": false
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
        "id": "di3e429f96ddfb7b",
        "name": "kitchen wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": "main post.e"
            },
            "extent": {
              "formula": "kitchen beam.s"
            },
            "length": 1962.1500000000015,
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
            "length": 4267.200000000001,
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
        "parent_id": "di814622bfde093a"
      },
      {
        "id": "di6e49f7949d45d3",
        "name": "bathroom",
        "x": {
          "attributes": {
            "origin": 2438.4000000000015,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "value": 1828.7999999999997,
              "is_locked": true
            },
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": 5181.6,
            "extent": {
              "formula": ".e"
            },
            "length": {
              "value": 914.4000000000001,
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
        "parent_id": "di38476b85f5fb05"
      },
      {
        "id": "di8c404384d31f08",
        "name": "bath back wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 1828.7999999999993,
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
        "hide_children": true,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 0,
          "is_diagonal": false
        },
        "parent_id": "di6e49f7949d45d3"
      },
      {
        "id": "di5244f08f7d9fff",
        "name": "stud",
        "x": {
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
            "length": 2895.6000000000004,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di8c404384d31f08"
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
          "firewall": false,
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
        "parent_id": "di5d4068af039b53"
      },
      {
        "id": "di334398930cb9ea",
        "name": "stair wall",
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
              "formula": "back.well.e"
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
        "id": "dia04a54814864bd",
        "name": "shower wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s + .l / 2"
            },
            "extent": 1003.2999999999993,
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
          "firewall": false,
          "is_repeating": true,
          "run_axis": 1,
          "is_diagonal": false
        },
        "parent_id": "di6e49f7949d45d3"
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
        "name": "structure",
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
              "formula": "main beam.s"
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
            "extent": 0,
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
              "formula": "main beam.s"
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
              "formula": "well beam.s"
            },
            "extent": {
              "formula": "stair beam.e"
            },
            "length": -914.3999999999996,
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
              "formula": "well beam.s"
            },
            "extent": {
              "formula": "stair beam.e"
            },
            "length": -914.3999999999996,
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
              "formula": ".e + 4'"
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
              "formula": ".s - 4'"
            },
            "extent": {
              "formula": "zen post.c"
            },
            "length": 7832.725,
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
        "id": "di194aa0bcec9ee6",
        "name": "main post",
        "x": {
          "attributes": {
            "origin": {
              "formula": "front.kitchen.s - 4\""
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
              "formula": "front.kitchen.e - 4\""
            },
            "extent": 6178.549999999999,
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
        "parent_id": "dibb46a3aa5f0c4c"
      },
      {
        "id": "di46448b947f83a6",
        "name": "main beam",
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
              "formula": ".s - 4'"
            },
            "extent": {
              "formula": ".e + 4'"
            },
            "length": 14020.800000000001,
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
        "id": "di6e4111a884deec",
        "name": "kitchen beam",
        "x": {
          "attributes": {
            "origin": {
              "formula": "front.s + front.l / 2 - wall th"
            },
            "extent": 2228.8500000000004,
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
              "formula": ".s - 4'"
            },
            "extent": {
              "formula": "front.e"
            },
            "length": 11277.6,
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
        "parent_id": "di38476b85f5fb05"
      },
      {
        "id": "di8c448f846398a2",
        "name": "kitchen post",
        "x": {
          "attributes": {
            "origin": {
              "formula": "kitchen beam.s"
            },
            "extent": 2228.8500000000004,
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
              "formula": "front.moose.s - wall th"
            },
            "extent": 6191.25,
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
        "parent_id": "di38476b85f5fb05"
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
              "formula": ".s - 4'"
            },
            "extent": {
              "formula": "front.e"
            },
            "length": 11277.6,
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
    "selected_id": "di334398930cb9ea",
    "selected_face": 1
  }
}